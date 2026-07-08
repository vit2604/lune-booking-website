import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { createHttpError } from '../../utils/responseUtils.js';

const OTP_DIGITS = 6;

function hashValue(value) {
  return crypto.createHmac('sha256', env.JWT_SECRET).update(value).digest('hex');
}

function safeCompare(left, right) {
  const leftBuffer = Buffer.from(left || '', 'hex');
  const rightBuffer = Buffer.from(right || '', 'hex');
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function normalizePhone({ phoneCode = '', phoneNumber = '' } = {}) {
  const codeMatch = String(phoneCode).match(/\+\d+/);
  const code = codeMatch?.[0] || '';
  const cleanNumber = String(phoneNumber).replace(/[^\d+]/g, '');
  const phone = cleanNumber.startsWith('+') ? cleanNumber : `${code}${cleanNumber.replace(/^0+/, '')}`;

  if (!/^\+\d{8,16}$/.test(phone)) {
    throw createHttpError(400, 'Please enter a valid phone number before requesting OTP.');
  }

  return phone;
}

export function getPhoneVerificationConfig() {
  return {
    enabled: env.PHONE_OTP_ENABLED,
    required: env.PHONE_OTP_REQUIRED,
    ttlMinutes: env.PHONE_OTP_TTL_MINUTES,
    resendSeconds: env.PHONE_OTP_RESEND_SECONDS,
    codeLength: OTP_DIGITS,
  };
}

function createOtp() {
  const max = 10 ** OTP_DIGITS;
  return String(crypto.randomInt(0, max)).padStart(OTP_DIGITS, '0');
}

function buildOtpMessage(code) {
  return `Your Lune Boutique booking verification code is ${code}. It expires in ${env.PHONE_OTP_TTL_MINUTES} minutes.`;
}

async function sendWebhookSms({ to, message }) {
  if (!env.SMS_WEBHOOK_URL) throw createHttpError(503, 'SMS webhook is not configured.');
  const headers = { 'Content-Type': 'application/json' };
  if (env.SMS_WEBHOOK_AUTH_HEADER && env.SMS_WEBHOOK_AUTH_VALUE) {
    headers[env.SMS_WEBHOOK_AUTH_HEADER] = env.SMS_WEBHOOK_AUTH_VALUE;
  }

  const response = await fetch(env.SMS_WEBHOOK_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ to, message }),
  });

  if (!response.ok) throw createHttpError(502, 'SMS provider rejected the OTP request.');
}

async function sendTwilioSms({ to, message }) {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || (!env.TWILIO_FROM_NUMBER && !env.TWILIO_MESSAGING_SERVICE_SID)) {
    throw createHttpError(503, 'Twilio SMS is not configured.');
  }

  const params = new URLSearchParams({ To: to, Body: message });
  if (env.TWILIO_MESSAGING_SERVICE_SID) {
    params.set('MessagingServiceSid', env.TWILIO_MESSAGING_SERVICE_SID);
  } else {
    params.set('From', env.TWILIO_FROM_NUMBER);
  }

  const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!response.ok) throw createHttpError(502, 'Twilio rejected the OTP request.');
}

async function sendSms({ to, code }) {
  const message = buildOtpMessage(code);
  if (env.SMS_PROVIDER === 'webhook') return sendWebhookSms({ to, message });
  if (env.SMS_PROVIDER === 'twilio') return sendTwilioSms({ to, message });
  if (env.SMS_PROVIDER === 'log' && env.NODE_ENV !== 'production') {
    console.info(`[phone-otp] ${to}: ${message}`);
    return null;
  }
  throw createHttpError(503, 'SMS provider is not configured.');
}

async function assertOtpRateLimit(phone) {
  const windowStart = new Date(Date.now() - env.PHONE_OTP_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
  const [recentCount, lastChallenge] = await Promise.all([
    prisma.phoneOtpChallenge.count({
      where: {
        phone,
        createdAt: { gte: windowStart },
      },
    }),
    prisma.phoneOtpChallenge.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  if (recentCount >= env.PHONE_OTP_RATE_LIMIT_MAX) {
    throw createHttpError(429, 'Too many OTP requests for this phone number. Please try again later.');
  }

  if (lastChallenge?.lastSentAt) {
    const elapsedSeconds = Math.floor((Date.now() - lastChallenge.lastSentAt.getTime()) / 1000);
    if (elapsedSeconds < env.PHONE_OTP_RESEND_SECONDS) {
      throw createHttpError(429, `Please wait ${env.PHONE_OTP_RESEND_SECONDS - elapsedSeconds}s before requesting another OTP.`);
    }
  }
}

export async function requestPhoneOtp(input) {
  if (!env.PHONE_OTP_ENABLED) {
    return { ...getPhoneVerificationConfig(), sent: false };
  }

  const phone = normalizePhone(input);
  await assertOtpRateLimit(phone);

  const code = createOtp();
  await sendSms({ to: phone, code });

  const expiresAt = new Date(Date.now() + env.PHONE_OTP_TTL_MINUTES * 60 * 1000);
  const challenge = await prisma.phoneOtpChallenge.create({
    data: {
      phone,
      codeHash: hashValue(`${phone}:${code}`),
      expiresAt,
      lastSentAt: new Date(),
    },
  });

  return {
    sent: true,
    challengeId: challenge.id,
    phone,
    expiresAt,
    resendAfterSeconds: env.PHONE_OTP_RESEND_SECONDS,
    debugCode: env.PHONE_OTP_DEBUG_RESPONSE && env.NODE_ENV !== 'production' ? code : undefined,
  };
}

export async function verifyPhoneOtp(input) {
  if (!env.PHONE_OTP_ENABLED) {
    return { verified: false, ...getPhoneVerificationConfig() };
  }

  const phone = normalizePhone(input);
  const code = String(input.code || '').replace(/\D/g, '');
  if (!new RegExp(`^\\d{${OTP_DIGITS}}$`).test(code)) {
    throw createHttpError(400, 'Please enter the 6-digit OTP code.');
  }

  const challenge = await prisma.phoneOtpChallenge.findFirst({
    where: {
      id: input.challengeId || undefined,
      phone,
      verifiedAt: null,
      consumedAt: null,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!challenge) throw createHttpError(400, 'OTP request was not found. Please request a new code.');
  if (challenge.expiresAt < new Date()) throw createHttpError(410, 'OTP code has expired. Please request a new code.');
  if (challenge.attempts >= env.PHONE_OTP_MAX_ATTEMPTS) {
    throw createHttpError(429, 'Too many incorrect OTP attempts. Please request a new code.');
  }

  if (!safeCompare(challenge.codeHash, hashValue(`${phone}:${code}`))) {
    await prisma.phoneOtpChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    throw createHttpError(400, 'OTP code is incorrect.');
  }

  const verificationToken = crypto.randomBytes(32).toString('base64url');
  await prisma.phoneOtpChallenge.update({
    where: { id: challenge.id },
    data: {
      verifiedAt: new Date(),
      tokenHash: hashValue(`${phone}:${verificationToken}`),
    },
  });

  return {
    verified: true,
    phone,
    verificationToken,
    expiresAt: challenge.expiresAt,
  };
}

export async function assertPhoneVerification({ phoneCode, phoneNumber, phoneVerificationToken }) {
  if (!env.PHONE_OTP_REQUIRED) return null;
  const phone = normalizePhone({ phoneCode, phoneNumber });
  if (!phoneVerificationToken) throw createHttpError(400, 'Please verify your phone number before booking.');

  const tokenHash = hashValue(`${phone}:${phoneVerificationToken}`);
  const challenge = await prisma.phoneOtpChallenge.findFirst({
    where: {
      phone,
      tokenHash,
      verifiedAt: { not: null },
      consumedAt: null,
      expiresAt: { gte: new Date() },
    },
    orderBy: { verifiedAt: 'desc' },
  });

  if (!challenge) throw createHttpError(400, 'Phone verification has expired or is invalid. Please verify again.');
  return challenge;
}

export async function consumePhoneVerification(challenge) {
  if (!challenge) return;
  await prisma.phoneOtpChallenge.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() },
  });
}
