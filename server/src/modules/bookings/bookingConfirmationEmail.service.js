import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { getAllSettings } from '../settings/setting.service.js';

const CLAIM_TIMEOUT_MS = 10 * 60 * 1000;
const RETRY_BATCH_SIZE = 10;

const mimeTransporter = nodemailer.createTransport({
  streamTransport: true,
  buffer: true,
  newline: 'unix',
});
let gmailAccessToken;
let gmailAccessTokenExpiresAt = 0;
let missingConfigWasLogged = false;

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const formatMoney = (value, currency = 'VND') => {
  const normalizedCurrency = String(currency || 'VND').toUpperCase();
  if (normalizedCurrency === 'VND') {
    return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(value || 0))} VND`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: normalizedCurrency,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};

const formatDate = (value) => new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Ho_Chi_Minh',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
}).format(new Date(value));

function bookingRooms(booking) {
  if (booking.roomItems?.length) {
    return booking.roomItems.map((item) => ({
      name: item.room?.name || booking.room?.name || 'Room',
      quantity: Number(item.quantity || 1),
    }));
  }
  return [{ name: booking.room?.name || 'Room', quantity: 1 }];
}

function paymentSummary(booking) {
  const total = Math.max(0, Number(booking.totalPrice || 0));
  const paidPayments = (booking.payments || []).filter(
    (payment) => payment.status === 'PAID' && Number(payment.amount || 0) > 0,
  );
  const paidAmount = paidPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const remainingAmount = Math.max(0, total - paidAmount);
  const isDeposit = paidAmount > 0 && paidAmount < total;
  const depositPayment = [...paidPayments]
    .reverse()
    .find((payment) => payment.rawPayloadJson?.paymentPurpose === 'deposit');
  const storedPercent = Number(depositPayment?.rawPayloadJson?.depositPercent);
  const calculatedPercent = total > 0 ? Math.round((paidAmount / total) * 100) : 0;
  const depositPercent = isDeposit
    ? (Number.isFinite(storedPercent) && storedPercent > 0 ? storedPercent : calculatedPercent)
    : null;

  let status = {
    PAY_AT_PROPERTY: 'Pay at property / Thanh toán tại khách sạn',
    PENDING: 'Pending / Đang chờ thanh toán',
    REFUNDED: 'Refunded / Đã hoàn tiền',
    FAILED: 'Failed / Thanh toán thất bại',
  }[booking.paymentStatus] || String(booking.paymentStatus || 'Pending');
  if (paidAmount >= total && total > 0) status = 'Fully paid / Đã thanh toán toàn bộ';
  if (isDeposit) status = `Deposit paid ${depositPercent}% / Đã thanh toán tiền cọc ${depositPercent}%`;

  return { paidAmount, remainingAmount, isDeposit, depositPercent, status };
}

function safeSettings(settings = {}) {
  const branding = settings.branding || {};
  const contact = settings.contact || {};
  const policies = settings.policies || {};
  return {
    hotelName: branding.hotelName || 'Lune Boutique Hotel & Apartment Da Nang',
    address: branding.address || '92-94 Thạch Lam, Phường An Hải, Quận Sơn Trà, Đà Nẵng, Việt Nam',
    phone: contact.phone || branding.phone || '+84 867 802 229',
    email: contact.email || branding.email || env.SMTP_USER || '',
    checkIn: policies.checkIn || 'Check-in from 14:00',
    checkOut: policies.checkOut || 'Check-out before 12:00',
  };
}

export function buildBookingConfirmationEmail(booking, settings = {}) {
  const site = safeSettings(settings);
  const guestName = booking.guest?.fullName || 'Guest';
  const rooms = bookingRooms(booking);
  const roomText = rooms.map((room) => `${room.name} × ${room.quantity}`).join(', ');
  const subject = `Booking confirmed | Xác nhận đặt phòng – ${booking.bookingCode}`;
  const total = formatMoney(booking.totalPrice, booking.currency || 'VND');
  const payment = paymentSummary(booking);
  const amountPaid = formatMoney(payment.paidAmount, booking.currency || 'VND');
  const remaining = formatMoney(payment.remainingAmount, booking.currency || 'VND');
  const checkIn = formatDate(booking.checkIn);
  const checkOut = formatDate(booking.checkOut);
  const guests = `${Number(booking.adults || booking.guests || 1)} adult(s), ${Number(booking.children || 0)} child(ren)`;
  const status = payment.status;
  const preheader = `Your stay at Lune Boutique has been confirmed. Booking ${booking.bookingCode}.`;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f4f1eb;font-family:Arial,Helvetica,sans-serif;color:#292722">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f1eb;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 28px rgba(41,39,34,.08)">
<tr><td style="background:#1f312c;padding:34px 38px;text-align:center;color:#fff"><div style="font-family:Georgia,serif;font-size:30px;letter-spacing:3px">LUNE</div><div style="margin-top:6px;font-size:11px;letter-spacing:2px;color:#d9cbb4">BOUTIQUE HOTEL &amp; APARTMENT DA NANG</div></td></tr>
<tr><td style="padding:40px 38px 18px"><div style="display:inline-block;padding:7px 12px;border-radius:999px;background:#e9f4ed;color:#2f6b45;font-size:12px;font-weight:700;letter-spacing:.5px">BOOKING CONFIRMED</div><h1 style="margin:18px 0 12px;font-family:Georgia,serif;font-size:30px;line-height:1.25;font-weight:500;color:#20312c">Your stay is confirmed</h1><p style="margin:0;font-size:16px;line-height:1.7;color:#5f5a52">Dear ${escapeHtml(guestName)},</p><p style="margin:8px 0 0;font-size:16px;line-height:1.7;color:#5f5a52">Thank you for choosing Lune Boutique. We are pleased to confirm your reservation and look forward to welcoming you to Da Nang.</p></td></tr>
<tr><td style="padding:18px 38px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f4ee;border:1px solid #e6dfd3;border-radius:12px"><tr><td style="padding:22px 24px;border-bottom:1px solid #e6dfd3"><div style="font-size:11px;letter-spacing:1.2px;color:#82796d">BOOKING CODE</div><div style="margin-top:6px;font-size:23px;font-weight:700;color:#20312c;letter-spacing:1px">${escapeHtml(booking.bookingCode)}</div></td></tr><tr><td style="padding:20px 24px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td width="50%" valign="top" style="padding:0 12px 16px 0"><div style="font-size:11px;color:#82796d">CHECK-IN</div><div style="margin-top:5px;font-size:15px;font-weight:700">${escapeHtml(checkIn)}</div><div style="margin-top:4px;font-size:13px;color:#6c665e">${escapeHtml(site.checkIn)}</div></td><td width="50%" valign="top" style="padding:0 0 16px 12px"><div style="font-size:11px;color:#82796d">CHECK-OUT</div><div style="margin-top:5px;font-size:15px;font-weight:700">${escapeHtml(checkOut)}</div><div style="margin-top:4px;font-size:13px;color:#6c665e">${escapeHtml(site.checkOut)}</div></td></tr>
<tr><td width="50%" valign="top" style="padding:12px 12px 0 0;border-top:1px solid #e6dfd3"><div style="font-size:11px;color:#82796d">ROOM</div><div style="margin-top:5px;font-size:15px;font-weight:700;line-height:1.4">${escapeHtml(roomText)}</div></td><td width="50%" valign="top" style="padding:12px 0 0 12px;border-top:1px solid #e6dfd3"><div style="font-size:11px;color:#82796d">GUESTS / STAY</div><div style="margin-top:5px;font-size:15px;font-weight:700">${escapeHtml(guests)} · ${Number(booking.nights || 0)} night(s)</div></td></tr></table>
</td></tr></table></td></tr>
<tr><td style="padding:4px 38px 22px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:12px 0;font-size:14px;color:#6c665e;border-bottom:1px solid #ece7df">Booking total / Tổng tiền phòng</td><td align="right" style="padding:12px 0;font-size:17px;font-weight:700;color:#20312c;border-bottom:1px solid #ece7df">${escapeHtml(total)}</td></tr><tr><td style="padding:12px 0;font-size:14px;color:#6c665e;border-bottom:1px solid #ece7df">${payment.isDeposit ? `Deposit paid (${payment.depositPercent}%) / Tiền cọc đã thanh toán` : 'Amount paid / Số tiền đã thanh toán'}</td><td align="right" style="padding:12px 0;font-size:16px;font-weight:700;color:#2f6b45;border-bottom:1px solid #ece7df">${escapeHtml(amountPaid)}</td></tr>${payment.isDeposit ? `<tr><td style="padding:12px 0;font-size:14px;color:#6c665e;border-bottom:1px solid #ece7df">Balance due at property / Còn lại thanh toán tại khách sạn</td><td align="right" style="padding:12px 0;font-size:16px;font-weight:700;color:#8a5b24;border-bottom:1px solid #ece7df">${escapeHtml(remaining)}</td></tr>` : ''}<tr><td style="padding:12px 0;font-size:14px;color:#6c665e">Payment status / Trạng thái thanh toán</td><td align="right" style="padding:12px 0;font-size:14px;font-weight:700;color:#2f6b45">${escapeHtml(status)}</td></tr></table></td></tr>
<tr><td style="padding:0 38px 34px"><div style="padding:18px 20px;background:#fbf8f3;border-left:4px solid #b89a6a;border-radius:8px;font-size:14px;line-height:1.65;color:#625b51">Please keep your booking code for check-in. To request airport pickup, early check-in, or a booking change, contact Lune directly.</div><h2 style="margin:28px 0 9px;font-family:Georgia,serif;font-size:21px;color:#20312c">Xác nhận đặt phòng</h2><p style="margin:0;font-size:14px;line-height:1.7;color:#5f5a52">Đặt phòng của bạn tại Lune Boutique đã được xác nhận. Vui lòng lưu mã <strong>${escapeHtml(booking.bookingCode)}</strong> để làm thủ tục nhận phòng. ${escapeHtml(site.checkIn)} và ${escapeHtml(site.checkOut)}.</p></td></tr>
<tr><td style="background:#20312c;padding:26px 38px;text-align:center;color:#eee8de"><div style="font-size:13px;line-height:1.7">${escapeHtml(site.address)}</div><div style="font-size:13px;line-height:1.7">${escapeHtml(site.phone)} · ${escapeHtml(site.email)}</div><div style="margin-top:12px;font-size:11px;color:#bfb8ad">This is an automated confirmation for your direct website booking.</div></td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    'BOOKING CONFIRMED / XÁC NHẬN ĐẶT PHÒNG',
    '',
    `Dear ${guestName},`,
    'Your stay at Lune Boutique has been confirmed.',
    '',
    `Booking code: ${booking.bookingCode}`,
    `Check-in: ${checkIn} (${site.checkIn})`,
    `Check-out: ${checkOut} (${site.checkOut})`,
    `Room: ${roomText}`,
    `Guests: ${guests}`,
    `Stay: ${Number(booking.nights || 0)} night(s)`,
    `Booking total / Tổng tiền phòng: ${total}`,
    `${payment.isDeposit ? `Deposit paid (${payment.depositPercent}%) / Tiền cọc đã thanh toán` : 'Amount paid / Số tiền đã thanh toán'}: ${amountPaid}`,
    ...(payment.isDeposit ? [`Balance due at property / Còn lại thanh toán tại khách sạn: ${remaining}`] : []),
    `Payment status / Trạng thái thanh toán: ${status}`,
    '',
    `Đặt phòng của bạn tại Lune Boutique đã được xác nhận. Vui lòng lưu mã ${booking.bookingCode} để làm thủ tục nhận phòng.`,
    '',
    site.address,
    `${site.phone} · ${site.email}`,
  ].join('\n');

  return { subject, html, text };
}

function emailIsConfigured() {
  return Boolean(
    env.BOOKING_CONFIRMATION_EMAIL_ENABLED
    && env.SMTP_USER
    && env.GMAIL_OAUTH_CLIENT_ID
    && env.GMAIL_OAUTH_CLIENT_SECRET
    && env.GMAIL_OAUTH_REFRESH_TOKEN,
  );
}

function base64Url(value) {
  return Buffer.from(value).toString('base64url');
}

async function getGmailAccessToken() {
  if (gmailAccessToken && Date.now() < gmailAccessTokenExpiresAt - 60_000) return gmailAccessToken;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GMAIL_OAUTH_CLIENT_ID,
      client_secret: env.GMAIL_OAUTH_CLIENT_SECRET,
      refresh_token: env.GMAIL_OAUTH_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await response.json();
  if (!response.ok || !payload.access_token) {
    throw new Error(`Gmail OAuth token request failed (${response.status}): ${payload.error_description || payload.error || 'unknown error'}`);
  }
  gmailAccessToken = payload.access_token;
  gmailAccessTokenExpiresAt = Date.now() + Number(payload.expires_in || 3600) * 1000;
  return gmailAccessToken;
}

async function gmailApiRequest(path, options = {}) {
  const accessToken = await getGmailAccessToken();
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
      ...options.headers,
    },
    signal: AbortSignal.timeout(20_000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Gmail API request failed (${response.status}): ${payload.error?.message || 'unknown error'}`);
  }
  return payload;
}

async function verifyGmailOAuthScope() {
  const accessToken = await getGmailAccessToken();
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`, {
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await response.json().catch(() => ({}));
  const scopes = String(payload.scope || '').split(/\s+/);
  if (!response.ok || !scopes.includes('https://www.googleapis.com/auth/gmail.send')) {
    throw new Error(`Gmail OAuth verification failed (${response.status}): gmail.send scope is missing`);
  }
  return payload;
}

export async function verifyBookingConfirmationEmailTransport() {
  if (!emailIsConfigured()) {
    console.warn('Booking confirmation email is disabled or Gmail API OAuth credentials are missing.');
    return { configured: false, ready: false };
  }

  try {
    await verifyGmailOAuthScope();
    console.log('Gmail API is ready for booking confirmation emails.', { email: env.SMTP_USER });
    return { configured: true, ready: true };
  } catch (error) {
    console.warn('Gmail API verification failed:', String(error?.message || error).slice(0, 500));
    return { configured: true, ready: false };
  }
}

async function loadEmailSettings() {
  const settings = await getAllSettings();
  return {
    branding: settings.branding,
    contact: settings.contact,
    policies: settings.policies,
  };
}

function retryDate(attempts) {
  const delayMinutes = Math.min(60, 2 ** Math.max(0, attempts - 1));
  return new Date(Date.now() + delayMinutes * 60 * 1000);
}

export async function sendBookingConfirmationEmailIfNeeded(booking) {
  if (!booking || booking.bookingStatus !== 'CONFIRMED' || !booking.guest?.email) return false;
  if (!emailIsConfigured()) {
    if (!missingConfigWasLogged) {
      console.warn('Booking confirmation email is disabled or Gmail API OAuth credentials are missing.');
      missingConfigWasLogged = true;
    }
    return false;
  }

  const now = new Date();
  const staleClaim = new Date(now.getTime() - CLAIM_TIMEOUT_MS);
  const claim = await prisma.booking.updateMany({
    where: {
      id: booking.id,
      bookingStatus: 'CONFIRMED',
      confirmationEmailSentAt: null,
      AND: [
        { OR: [{ confirmationEmailNextAttemptAt: null }, { confirmationEmailNextAttemptAt: { lte: now } }] },
        { OR: [{ confirmationEmailClaimedAt: null }, { confirmationEmailClaimedAt: { lt: staleClaim } }] },
      ],
    },
    data: {
      confirmationEmailClaimedAt: now,
      confirmationEmailNextAttemptAt: null,
      confirmationEmailError: null,
      confirmationEmailAttempts: { increment: 1 },
    },
  });
  if (!claim.count) return false;

  const claimedBooking = await prisma.booking.findUnique({
    where: { id: booking.id },
    include: {
      room: { include: { images: true, ratePeriods: true } },
      roomItems: { include: { room: { include: { images: true, ratePeriods: true } } } },
      guest: true,
      payments: true,
    },
  });

  try {
    const settings = await loadEmailSettings();
    const message = buildBookingConfirmationEmail(claimedBooking, settings);
    const result = await mimeTransporter.sendMail({
      from: { name: env.SMTP_FROM_NAME, address: env.SMTP_USER },
      replyTo: env.SMTP_USER,
      to: claimedBooking.guest.email,
      subject: message.subject,
      html: message.html,
      text: message.text,
      messageId: `<booking-confirmed-${claimedBooking.bookingCode}@luneboutiquedanang.com>`,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    const gmailMessage = await gmailApiRequest('messages/send', {
      method: 'POST',
      body: JSON.stringify({ raw: base64Url(result.message) }),
    });

    await prisma.booking.update({
      where: { id: claimedBooking.id },
      data: {
        confirmationEmailSentAt: new Date(),
        confirmationEmailClaimedAt: null,
        confirmationEmailNextAttemptAt: null,
        confirmationEmailError: null,
      },
    });
    console.log('Booking confirmation email sent', {
      bookingCode: claimedBooking.bookingCode,
      messageId: gmailMessage.id,
    });
    return true;
  } catch (error) {
    const message = String(error?.message || 'Could not send booking confirmation email').slice(0, 1000);
    await prisma.booking.update({
      where: { id: claimedBooking.id },
      data: {
        confirmationEmailClaimedAt: null,
        confirmationEmailNextAttemptAt: retryDate(claimedBooking.confirmationEmailAttempts),
        confirmationEmailError: message,
      },
    }).catch(() => null);
    console.warn('Could not send booking confirmation email', {
      bookingCode: claimedBooking.bookingCode,
      attempt: claimedBooking.confirmationEmailAttempts,
      error: message,
    });
    return false;
  }
}

export async function retryPendingBookingConfirmationEmails() {
  if (!emailIsConfigured()) return { attempted: 0 };
  const now = new Date();
  const staleClaim = new Date(now.getTime() - CLAIM_TIMEOUT_MS);
  const bookings = await prisma.booking.findMany({
    where: {
      bookingStatus: 'CONFIRMED',
      confirmationEmailSentAt: null,
      guest: { email: { not: null } },
      AND: [
        { OR: [{ confirmationEmailNextAttemptAt: null }, { confirmationEmailNextAttemptAt: { lte: now } }] },
        { OR: [{ confirmationEmailClaimedAt: null }, { confirmationEmailClaimedAt: { lt: staleClaim } }] },
      ],
    },
    include: {
      room: { include: { images: true, ratePeriods: true } },
      roomItems: { include: { room: { include: { images: true, ratePeriods: true } } } },
      guest: true,
      payments: true,
    },
    orderBy: { updatedAt: 'asc' },
    take: RETRY_BATCH_SIZE,
  });
  const results = await Promise.all(bookings.map(sendBookingConfirmationEmailIfNeeded));
  return { attempted: bookings.length, sent: results.filter(Boolean).length };
}
