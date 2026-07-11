import { PayOS } from '@payos/node';
import QRCode from 'qrcode';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { isAllowedPaymentMethod } from '../../constants/paymentMethods.js';
import { createHttpError } from '../../utils/responseUtils.js';

const defaultPaymentMethods = {
  payAtProperty: {
    enabled: true,
    visibleForGuests: true,
    displayName: 'Pay at property',
    description: 'Pay directly when you arrive at Lune Boutique Hotel & Apartment.',
    sortOrder: 1,
    statusAfterConfirm: 'PAY_AT_PROPERTY',
  },
  cashAtProperty: {
    enabled: true,
    visibleForGuests: true,
    displayName: 'Cash at property',
    description: 'Pay by cash at the property.',
    sortOrder: 2,
    statusAfterConfirm: 'PAY_AT_PROPERTY',
  },
  bankTransfer: {
    enabled: true,
    visibleForGuests: true,
    displayName: 'Bank transfer Vietnam',
    description: 'Transfer to the official Lune bank account.',
    sortOrder: 3,
    statusAfterConfirm: 'PENDING',
    bankName: 'PLACEHOLDER_BANK_NAME',
    accountNumber: 'PLACEHOLDER_ACCOUNT_NUMBER',
    accountHolder: 'LUNE BOUTIQUE HOTEL',
    transferContentTemplate: 'LUNE-{bookingCode}-{guestName}',
    qrImageUrl: '',
  },
  vietQr: {
    enabled: true,
    visibleForGuests: true,
    displayName: 'PayOS QR',
    description: 'Scan QR code or open PayOS checkout to pay securely.',
    sortOrder: 4,
    statusAfterConfirm: 'PENDING',
    provider: 'payOS',
  },
  creditCard: {
    enabled: true,
    visibleForGuests: true,
    displayName: 'Credit/Debit Card',
    description: 'International card at property. A 5% card fee applies.',
    sortOrder: 5,
    statusAfterConfirm: 'PENDING',
  },
  stripe: {
    enabled: false,
    visibleForGuests: true,
    displayName: 'Stripe',
    description: 'Stripe backend integration placeholder.',
    sortOrder: 6,
    statusAfterConfirm: 'PENDING',
    backendEndpoint: '/api/payments/stripe/create',
  },
  paypal: {
    enabled: false,
    visibleForGuests: true,
    displayName: 'PayPal',
    description: 'PayPal backend integration placeholder.',
    sortOrder: 7,
    statusAfterConfirm: 'PENDING',
    backendEndpoint: '/api/payments/paypal/create',
  },
  vnpay: {
    enabled: false,
    visibleForGuests: true,
    displayName: 'VNPay',
    description: 'VNPay backend integration placeholder.',
    sortOrder: 8,
    statusAfterConfirm: 'PENDING',
    backendEndpoint: '/api/payments/vnpay/create',
  },
  momo: {
    enabled: false,
    visibleForGuests: true,
    displayName: 'MoMo',
    description: 'MoMo backend integration placeholder.',
    sortOrder: 9,
    statusAfterConfirm: 'PENDING',
    backendEndpoint: '/api/payments/momo/create',
  },
  zaloPay: {
    enabled: false,
    visibleForGuests: true,
    displayName: 'ZaloPay',
    description: 'ZaloPay backend integration placeholder.',
    sortOrder: 10,
    statusAfterConfirm: 'PENDING',
    backendEndpoint: '/api/payments/zalopay/create',
  },
  internationalTransfer: {
    enabled: false,
    visibleForGuests: true,
    displayName: 'International transfer',
    description: 'SWIFT/Wise transfer placeholder for international guests.',
    sortOrder: 11,
    statusAfterConfirm: 'PENDING',
  },
};

let payosClient;

export function getDefaultPaymentMethods() {
  return defaultPaymentMethods;
}

function normalizeSetting(setting) {
  const config = stripSensitiveFields(setting.configJson || {}) || {};
  const shouldExposePayos = setting.key === 'vietQr' && payosIsConfigured();
  const shouldExposeCreditCard = setting.key === 'creditCard';
  const enabled = setting.key === 'vietQr' ? shouldExposePayos : shouldExposeCreditCard ? true : setting.enabled;
  const visibleForGuests =
    setting.key === 'vietQr' ? shouldExposePayos && setting.visibleForGuests : shouldExposeCreditCard ? true : setting.visibleForGuests;
  return {
    key: setting.key,
    ...config,
    displayName: shouldExposePayos ? 'PayOS QR' : shouldExposeCreditCard ? 'International card' : setting.displayName,
    description: shouldExposePayos
      ? 'Scan QR code or open PayOS checkout to pay securely.'
      : shouldExposeCreditCard
        ? 'International card at property. A 5% card fee applies.'
        : setting.description,
    enabled,
    visibleForGuests,
    sortOrder: setting.sortOrder,
    payosConfigured: setting.key === 'vietQr' ? payosIsConfigured() : undefined,
  };
}

const sensitiveFieldPattern = /(secret|password|token|privatekey|private_key|apikey|api_key|clientsecret|client_secret|webhooksecret|webhook_secret)/i;
const urlFieldPattern = /(url|endpoint)$/i;

function cleanString(value, maxLength = 1000) {
  return String(value || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

function sanitizeUrl(value, key) {
  const url = cleanString(value, key === 'qrImageUrl' ? 250000 : 500);
  if (!url) return '';
  if (key === 'qrImageUrl' && (url.startsWith('/images/') || url.startsWith('data:image/'))) return url;
  if (url.startsWith('/api/')) return url;

  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:') return parsed.toString();
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') return parsed.toString();
  } catch {
    return '';
  }

  return '';
}

function stripSensitiveFields(value, key = '') {
  if (sensitiveFieldPattern.test(key)) return undefined;
  if (Array.isArray(value)) return value.map((item) => stripSensitiveFields(item)).filter((item) => item !== undefined);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .map(([itemKey, itemValue]) => [itemKey, stripSensitiveFields(itemValue, itemKey)])
        .filter(([, itemValue]) => itemValue !== undefined),
    );
  }
  if (typeof value === 'string') return urlFieldPattern.test(key) ? sanitizeUrl(value, key) : cleanString(value);
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'boolean') return value;
  return value ?? null;
}

function normalizePaymentStatus(status) {
  const value = String(status || 'PENDING').toUpperCase();
  if (value === 'PAY_AT_PROPERTY' || value === 'PAYATPROPERTY') return 'PAY_AT_PROPERTY';
  if (['PENDING', 'PAID', 'FAILED', 'REFUNDED'].includes(value)) return value;
  return 'PENDING';
}

function payosIsConfigured() {
  return Boolean(env.PAYOS_ENABLED && env.PAYOS_CLIENT_ID && env.PAYOS_API_KEY && env.PAYOS_CHECKSUM_KEY);
}

function getPayosClient() {
  if (!payosIsConfigured()) return null;
  if (!payosClient) {
    payosClient = new PayOS({
      clientId: env.PAYOS_CLIENT_ID,
      apiKey: env.PAYOS_API_KEY,
      checksumKey: env.PAYOS_CHECKSUM_KEY,
      timeout: env.PAYOS_TIMEOUT_MS,
      logLevel: env.NODE_ENV === 'production' ? 'off' : 'warn',
    });
  }
  return payosClient;
}

function buildPayosOrderCode(bookingCode) {
  const digits = String(bookingCode || '').replace(/\D/g, '');
  const value = Number(digits.slice(-12));
  if (Number.isSafeInteger(value) && value > 0) return value;
  return Date.now();
}

function buildPayosDescription(booking) {
  return `LUNE ${String(booking.bookingCode || '').replace(/\D/g, '').slice(-10)}`.slice(0, 25);
}

function getFrontendUrl(path = '/') {
  const firstOrigin = String(env.CORS_ORIGIN || '')
    .split(',')
    .map((item) => item.trim())
    .find(Boolean);
  return `${firstOrigin || 'http://localhost:5173'}${path}`;
}

async function createPayosPaymentLink(booking) {
  const payos = getPayosClient();
  if (!payos) {
    return {
      provider: 'payOS',
      configured: false,
      message: 'PayOS is not configured. Please set PAYOS_CLIENT_ID, PAYOS_API_KEY, and PAYOS_CHECKSUM_KEY in backend environment variables.',
    };
  }

  const orderCode = buildPayosOrderCode(booking.bookingCode);
  const returnUrl = env.PAYOS_RETURN_URL || getFrontendUrl(`/success?bookingCode=${encodeURIComponent(booking.bookingCode)}`);
  const cancelUrl = env.PAYOS_CANCEL_URL || getFrontendUrl('/payment');

  let paymentLink;
  try {
    paymentLink = await payos.paymentRequests.create({
      orderCode,
      amount: booking.totalPrice,
      description: buildPayosDescription(booking),
      returnUrl,
      cancelUrl,
      buyerName: booking.guest?.fullName || undefined,
      buyerEmail: booking.guest?.email || undefined,
      buyerPhone: booking.guest?.phoneNumber ? `${booking.guest.phoneCode || ''}${booking.guest.phoneNumber}` : undefined,
      items: [
        {
          name: String(booking.room?.name || booking.bookingCode).slice(0, 80),
          quantity: 1,
          price: booking.totalPrice,
        },
      ],
    });
  } catch (error) {
    throw createHttpError(502, 'Could not create PayOS payment QR. Please try bank transfer or contact Lune support.', {
      provider: 'payOS',
      code: error.code,
      desc: error.desc,
    });
  }

  return {
    provider: 'payOS',
    configured: true,
    orderCode,
    paymentLinkId: paymentLink.paymentLinkId,
    checkoutUrl: paymentLink.checkoutUrl,
    qrCode: paymentLink.qrCode,
    qrImage: paymentLink.qrCode
      ? await QRCode.toDataURL(paymentLink.qrCode, { width: 320, margin: 1, errorCorrectionLevel: 'M' })
      : '',
    accountNumber: paymentLink.accountNumber,
    accountName: paymentLink.accountName,
    bin: paymentLink.bin,
    status: paymentLink.status,
  };
}

function sanitizePaymentMethodConfig(key, rawConfig = {}) {
  const defaults = defaultPaymentMethods[key] || {};
  const config = stripSensitiveFields(rawConfig) || {};
  const sortOrder = Math.max(1, Math.min(99, Number(config.sortOrder || defaults.sortOrder || 99)));

  return {
    ...config,
    displayName: cleanString(config.displayName || defaults.displayName || key, 80),
    description: cleanString(config.description || defaults.description || '', 240),
    paymentNote: cleanString(config.paymentNote || defaults.paymentNote || '', 300),
    enabled: Boolean(config.enabled),
    visibleForGuests: config.visibleForGuests !== false,
    sortOrder,
    statusAfterConfirm: normalizePaymentStatus(config.statusAfterConfirm || defaults.statusAfterConfirm),
  };
}

export async function ensurePaymentMethodSettings() {
  await Promise.all(
    Object.entries(defaultPaymentMethods).map(([key, config]) =>
      prisma.paymentMethodSetting.upsert({
        where: { key },
        update: {},
        create: {
          key,
          displayName: config.displayName,
          description: config.description || null,
          enabled: config.enabled,
          visibleForGuests: config.visibleForGuests,
          sortOrder: config.sortOrder,
          configJson: config,
        },
      }),
    ),
  );
}

export async function getPaymentSettings() {
  await ensurePaymentMethodSettings();
  const settings = await prisma.paymentMethodSetting.findMany({ orderBy: { sortOrder: 'asc' } });
  return settings.map(normalizeSetting);
}

export async function getEnabledPaymentMethods() {
  const settings = await getPaymentSettings();
  return settings.filter((method) => method.enabled && method.visibleForGuests);
}

export async function savePaymentSettings(input) {
  const updates = input.paymentMethods || {};
  await Promise.all(
    Object.entries(updates)
      .filter(([key]) => isAllowedPaymentMethod(key))
      .map(([key, rawConfig]) => {
        const config = sanitizePaymentMethodConfig(key, rawConfig);
        return prisma.paymentMethodSetting.upsert({
          where: { key },
          update: {
            displayName: config.displayName,
            description: config.description || null,
            enabled: config.enabled,
            visibleForGuests: config.visibleForGuests,
            sortOrder: config.sortOrder,
            // Production secret keys must live in backend .env, never in DB settings returned to clients.
            configJson: config,
          },
          create: {
            key,
            displayName: config.displayName,
            description: config.description || null,
            enabled: config.enabled,
            visibleForGuests: config.visibleForGuests,
            sortOrder: config.sortOrder,
            configJson: config,
          },
        });
      }),
  );
  return getPaymentSettings();
}

export function generateTransferContent(booking, template) {
  return (template || 'LUNE-{bookingCode}-{guestName}')
    .replace('{bookingCode}', booking.bookingCode)
    .replace('{guestName}', booking.guest?.fullName || 'GUEST')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^A-Za-z0-9_.{}-]/g, '')
    .toUpperCase()
    .slice(0, 120);
}

export async function createPaymentRequest({ bookingCode, method }) {
  const booking = await prisma.booking.findUnique({
    where: { bookingCode },
    include: { guest: true, payments: true, room: true },
  });
  if (!booking) throw createHttpError(404, 'Booking not found');
  if (booking.bookingStatus === 'CANCELLED') throw createHttpError(409, 'Cancelled bookings cannot be paid');
  if (!isAllowedPaymentMethod(method)) throw createHttpError(400, 'Payment method is not supported');
  if (!booking.totalPrice || booking.totalPrice <= 0) throw createHttpError(400, 'Invalid booking amount');

  const settings = await getPaymentSettings();
  const selected = settings.find((item) => item.key === method);
  if (!selected || !selected.enabled || !selected.visibleForGuests) {
    throw createHttpError(400, 'Payment method is not available');
  }

  const statusAfterConfirm = normalizePaymentStatus(selected.statusAfterConfirm);
  const transferContent =
    method === 'bankTransfer' || method === 'vietQr' ? generateTransferContent(booking, selected.transferContentTemplate) : null;

  const reusablePayment = await prisma.payment.findFirst({
    where: {
      bookingId: booking.id,
      method,
      status: { not: 'PAID' },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (method === 'vietQr' && reusablePayment?.rawPayloadJson?.configured) {
    const providerPayload = reusablePayment.rawPayloadJson;
    return {
      bookingCode,
      method,
      paymentStatus: reusablePayment.status,
      payment: {
        id: reusablePayment.id,
        method: reusablePayment.method,
        amount: reusablePayment.amount,
        currency: reusablePayment.currency,
        status: reusablePayment.status,
        transferContent: reusablePayment.transferContent,
        provider: reusablePayment.provider,
        transactionRef: reusablePayment.transactionRef,
        checkoutUrl: providerPayload.checkoutUrl,
        qrCode: providerPayload.qrCode,
        payos: providerPayload,
        createdAt: reusablePayment.createdAt,
        updatedAt: reusablePayment.updatedAt,
      },
      bankInfo: null,
      message: 'Existing PayOS QR payment link returned.',
    };
  }

  const providerPayload = method === 'vietQr' ? await createPayosPaymentLink(booking) : null;

  const payment = await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { bookingCode },
      data: {
        paymentMethod: method,
        paymentStatus: statusAfterConfirm,
      },
    });

    const paymentData = {
      provider: cleanString(selected.provider || selected.providerName || '', 80) || null,
      amount: booking.totalPrice,
      currency: booking.currency,
      status: statusAfterConfirm,
      transferContent,
      transactionRef: providerPayload?.paymentLinkId || null,
      rawPayloadJson: providerPayload || { note: 'Mock payment request. Production must call backend provider integration.' },
    };

    const existingPayment = await tx.payment.findFirst({
      where: {
        bookingId: booking.id,
        method,
        status: { not: 'PAID' },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingPayment) {
      return tx.payment.update({ where: { id: existingPayment.id }, data: paymentData });
    }

    return tx.payment.create({
      data: {
        bookingId: booking.id,
        method,
        ...paymentData,
      },
    });
  });

  return {
    bookingCode,
    method,
    paymentStatus: statusAfterConfirm,
    payment: {
      id: payment.id,
      method: payment.method,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      transferContent: payment.transferContent,
      provider: payment.provider,
      transactionRef: payment.transactionRef,
      checkoutUrl: providerPayload?.checkoutUrl,
      qrCode: providerPayload?.qrCode,
      payos: providerPayload,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    },
    bankInfo:
      method === 'bankTransfer'
        ? {
            bankName: selected.bankName || 'PLACEHOLDER_BANK_NAME',
            accountNumber: selected.accountNumber || 'PLACEHOLDER_ACCOUNT_NUMBER',
            accountHolder: selected.accountHolder || 'LUNE BOUTIQUE HOTEL',
            transferContent,
            qrImageUrl: selected.qrImageUrl || '',
        }
        : null,
    message:
      method === 'payAtProperty' || method === 'cashAtProperty'
        ? 'You can pay directly at the property.'
        : method === 'vietQr' && providerPayload?.configured
          ? 'PayOS QR payment link created.'
          : method === 'vietQr'
            ? providerPayload?.message || 'PayOS is not configured.'
        : 'Payment request created as a placeholder.',
  };
}

export async function verifyPaymentMock(bookingCode) {
  const booking = await prisma.booking.findUnique({ where: { bookingCode } });
  if (!booking) throw createHttpError(404, 'Booking not found');
  return {
    bookingCode,
    paymentStatus: booking.paymentStatus,
    message: 'Payment verification is pending. Production should rely on bank/provider webhooks.',
  };
}

function mapPayosStatus(status) {
  const value = String(status || '').toUpperCase();
  if (value === 'PAID') return 'PAID';
  if (value === 'CANCELLED' || value === 'FAILED' || value === 'EXPIRED') return 'FAILED';
  return 'PENDING';
}

export async function handlePayosWebhook(payload) {
  const payos = getPayosClient();
  if (!payos) throw createHttpError(503, 'PayOS is not configured');

  const verified = await payos.webhooks.verify(payload);
  const paymentLinkId = verified.paymentLinkId || verified.data?.paymentLinkId;
  const orderCode = verified.orderCode || verified.data?.orderCode;
  const status = mapPayosStatus(verified.status || (verified.data?.code === '00' ? 'PAID' : 'PENDING'));

  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        paymentLinkId ? { transactionRef: paymentLinkId } : undefined,
        orderCode ? { rawPayloadJson: { path: ['orderCode'], equals: Number(orderCode) } } : undefined,
      ].filter(Boolean),
    },
    include: { booking: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!payment) {
    return { received: true, matched: false, orderCode, paymentLinkId };
  }

  const nextStatus = payment.status === 'PAID' && status !== 'PAID' ? 'PAID' : status;
  const paidAt = nextStatus === 'PAID' ? payment.paidAt || new Date() : payment.paidAt;

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: nextStatus,
        paidAt,
        rawPayloadJson: { ...(payment.rawPayloadJson || {}), lastWebhook: verified },
      },
    }),
    prisma.booking.update({
      where: { id: payment.bookingId },
      data: { paymentStatus: nextStatus },
    }),
  ]);

  return { received: true, matched: true, bookingCode: payment.booking.bookingCode, paymentStatus: nextStatus };
}
