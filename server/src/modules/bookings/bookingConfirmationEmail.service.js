import nodemailer from 'nodemailer';
import { resolve4 } from 'node:dns/promises';
import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { getAllSettings } from '../settings/setting.service.js';

const CLAIM_TIMEOUT_MS = 10 * 60 * 1000;
const RETRY_BATCH_SIZE = 10;

let transporter;
let transporterPromise;
let missingConfigWasLogged = false;

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const formatMoney = (value, currency = 'VND') => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency,
  maximumFractionDigits: currency === 'VND' ? 0 : 2,
}).format(Number(value || 0));

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

function paymentLabel(status) {
  return {
    PAID: 'Paid / ÄÃ£ thanh toÃ¡n',
    PAY_AT_PROPERTY: 'Pay at property / Thanh toÃ¡n táº¡i khÃ¡ch sáº¡n',
    PENDING: 'Pending / Äang chá» thanh toÃ¡n',
    REFUNDED: 'Refunded / ÄÃ£ hoÃ n tiá»n',
  }[status] || String(status || 'Pending');
}

function safeSettings(settings = {}) {
  const branding = settings.branding || {};
  const contact = settings.contact || {};
  const policies = settings.policies || {};
  return {
    hotelName: branding.hotelName || 'Lune Boutique Hotel & Apartment Da Nang',
    address: branding.address || '92-94 Tháº¡ch Lam, PhÆ°á»ng An Háº£i, Quáº­n SÆ¡n TrÃ , ÄÃ  Náºµng, Viá»‡t Nam',
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
  const roomText = rooms.map((room) => `${room.name} Ã— ${room.quantity}`).join(', ');
  const subject = `Booking confirmed | XÃ¡c nháº­n Ä‘áº·t phÃ²ng â€“ ${booking.bookingCode}`;
  const total = formatMoney(booking.totalPrice, booking.currency || 'VND');
  const checkIn = formatDate(booking.checkIn);
  const checkOut = formatDate(booking.checkOut);
  const guests = `${Number(booking.adults || booking.guests || 1)} adult(s), ${Number(booking.children || 0)} child(ren)`;
  const status = paymentLabel(booking.paymentStatus);
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
<tr><td width="50%" valign="top" style="padding:12px 12px 0 0;border-top:1px solid #e6dfd3"><div style="font-size:11px;color:#82796d">ROOM</div><div style="margin-top:5px;font-size:15px;font-weight:700;line-height:1.4">${escapeHtml(roomText)}</div></td><td width="50%" valign="top" style="padding:12px 0 0 12px;border-top:1px solid #e6dfd3"><div style="font-size:11px;color:#82796d">GUESTS / STAY</div><div style="margin-top:5px;font-size:15px;font-weight:700">${escapeHtml(guests)} Â· ${Number(booking.nights || 0)} night(s)</div></td></tr></table>
</td></tr></table></td></tr>
<tr><td style="padding:4px 38px 22px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:12px 0;font-size:14px;color:#6c665e;border-bottom:1px solid #ece7df">Total</td><td align="right" style="padding:12px 0;font-size:17px;font-weight:700;color:#20312c;border-bottom:1px solid #ece7df">${escapeHtml(total)}</td></tr><tr><td style="padding:12px 0;font-size:14px;color:#6c665e">Payment status</td><td align="right" style="padding:12px 0;font-size:14px;font-weight:700;color:#2f6b45">${escapeHtml(status)}</td></tr></table></td></tr>
<tr><td style="padding:0 38px 34px"><div style="padding:18px 20px;background:#fbf8f3;border-left:4px solid #b89a6a;border-radius:8px;font-size:14px;line-height:1.65;color:#625b51">Please keep your booking code for check-in. To request airport pickup, early check-in, or a booking change, contact Lune directly.</div><h2 style="margin:28px 0 9px;font-family:Georgia,serif;font-size:21px;color:#20312c">XÃ¡c nháº­n Ä‘áº·t phÃ²ng</h2><p style="margin:0;font-size:14px;line-height:1.7;color:#5f5a52">Äáº·t phÃ²ng cá»§a báº¡n táº¡i Lune Boutique Ä‘Ã£ Ä‘Æ°á»£c xÃ¡c nháº­n. Vui lÃ²ng lÆ°u mÃ£ <strong>${escapeHtml(booking.bookingCode)}</strong> Ä‘á»ƒ lÃ m thá»§ tá»¥c nháº­n phÃ²ng. ${escapeHtml(site.checkIn)} vÃ  ${escapeHtml(site.checkOut)}.</p></td></tr>
<tr><td style="background:#20312c;padding:26px 38px;text-align:center;color:#eee8de"><div style="font-size:13px;line-height:1.7">${escapeHtml(site.address)}</div><div style="font-size:13px;line-height:1.7">${escapeHtml(site.phone)} Â· ${escapeHtml(site.email)}</div><div style="margin-top:12px;font-size:11px;color:#bfb8ad">This is an automated confirmation for your direct website booking.</div></td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    'BOOKING CONFIRMED / XÃC NHáº¬N Äáº¶T PHÃ’NG',
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
    `Total: ${total}`,
    `Payment: ${status}`,
    '',
    `Äáº·t phÃ²ng cá»§a báº¡n táº¡i Lune Boutique Ä‘Ã£ Ä‘Æ°á»£c xÃ¡c nháº­n. Vui lÃ²ng lÆ°u mÃ£ ${booking.bookingCode} Ä‘á»ƒ lÃ m thá»§ tá»¥c nháº­n phÃ²ng.`,
    '',
    site.address,
    `${site.phone} Â· ${site.email}`,
  ].join('\n');

  return { subject, html, text };
}

function emailIsConfigured() {
  return Boolean(
    env.BOOKING_CONFIRMATION_EMAIL_ENABLED
    && env.SMTP_USER
    && env.SMTP_APP_PASSWORD,
  );
}

async function getTransporter() {
  if (transporter) return transporter;
  if (!transporterPromise) {
    transporterPromise = (async () => {
      const [smtpIpv4] = await resolve4(env.SMTP_HOST);
      if (!smtpIpv4) throw new Error(`Could not resolve an IPv4 address for ${env.SMTP_HOST}`);
      return nodemailer.createTransport({
        host: smtpIpv4,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: { user: env.SMTP_USER, pass: env.SMTP_APP_PASSWORD.replace(/\s/g, '') },
        tls: { servername: env.SMTP_HOST },
        connectionTimeout: 15_000,
        greetingTimeout: 15_000,
        socketTimeout: 30_000,
      });
    })();
  }
  try {
    transporter = await transporterPromise;
    return transporter;
  } catch (error) {
    transporterPromise = null;
    throw error;
  }
}

export async function verifyBookingConfirmationEmailTransport() {
  if (!emailIsConfigured()) {
    console.warn('Booking confirmation email is disabled or Gmail SMTP credentials are missing.');
    return { configured: false, ready: false };
  }

  try {
    await (await getTransporter()).verify();
    console.log('Gmail SMTP is ready for booking confirmation emails.');
    return { configured: true, ready: true };
  } catch (error) {
    console.warn('Gmail SMTP verification failed:', String(error?.message || error).slice(0, 500));
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
      console.warn('Booking confirmation email is disabled or Gmail SMTP credentials are missing.');
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
    const result = await (await getTransporter()).sendMail({
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
      messageId: result.messageId,
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
