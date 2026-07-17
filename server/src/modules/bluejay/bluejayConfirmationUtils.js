import { getBluejayPaymentSummary } from './bluejayPaymentUtils.js';

function money(value) {
  return Math.max(0, Math.round(Number(value || 0)));
}

function formatBluejayDateTime(value) {
  const date = value ? new Date(value) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  return safeDate.toISOString().slice(0, 19).replace('T', ' ');
}

export function getBluejayPaymentMethod(method) {
  if (['vietQr', 'payos', 'vnpay'].includes(method)) return 8;
  if (['creditCard', 'stripe', 'paypal'].includes(method)) return 5;
  return 2;
}

export function getLatestPaidPayment(payments = []) {
  return [...payments]
    .filter((payment) => payment.status === 'PAID')
    .sort((a, b) => (
      new Date(b.paidAt || b.updatedAt || b.createdAt || 0) -
      new Date(a.paidAt || a.updatedAt || a.createdAt || 0)
    ))[0];
}

export function buildBluejayPaymentPayload({ booking, amount, payment }) {
  return {
    amount,
    pay_time: formatBluejayDateTime(payment?.paidAt || payment?.updatedAt || payment?.createdAt),
    payment_method: getBluejayPaymentMethod(payment?.method || booking.paymentMethod),
    payment_for: '1',
    pay_currency: booking.currency || 'VND',
    pay_note: `Website payment for ${booking.bookingCode}`,
  };
}

export function buildBluejayConfirmationPath(booking) {
  return `/api/v1/confirm-booking?Id=${encodeURIComponent(booking.propertyId || '')}`;
}

export function buildBluejayConfirmationPayload(booking, { propertyId, channelCode, redirectUrl }) {
  const { paidAmount } = getBluejayPaymentSummary(booking.payments, booking.totalPrice);
  const paidPayment = getLatestPaidPayment(booking.payments);
  const payload = {
    property_id: Number(propertyId),
    channel: channelCode,
    BookingCode: booking.bluejayBookingCode,
    PaymentValue: paidAmount,
    PaymentMethod: getBluejayPaymentMethod(paidPayment?.method || booking.paymentMethod),
    book_code: booking.bluejayBookingCode,
    reference_code: booking.bookingCode,
    url_redirect: redirectUrl,
    grand_total: money(booking.totalPrice),
    total_pay: paidAmount,
    currency: booking.currency || 'VND',
  };
  if (paidAmount > 0) {
    payload.payment = buildBluejayPaymentPayload({ booking, amount: paidAmount, payment: paidPayment });
  }
  return payload;
}

export function normalizeCreatedBooking(payload) {
  const attributes = payload?.data?.attributes || payload?.attributes || payload?.data?.booking || payload?.booking;
  const booking = attributes?.booking || attributes?.reservation || attributes || {};
  return {
    id: booking.id ? String(booking.id) : null,
    code: booking.code || booking.book_code || booking.bookingCode || null,
    status: booking.status || null,
    message: payload?.meta?.message || payload?.data?.meta?.message || '',
  };
}

export function assertBluejayBookingConfirmed(payload, fallbackCode = null) {
  const message = payload?.Message || payload?.message || '';
  if (/fail|cancel|error/i.test(message)) {
    const error = new Error(message);
    error.statusCode = 502;
    throw error;
  }

  const booking = normalizeCreatedBooking(payload);
  if (!booking.status && (payload?.StatusCode === 1 || payload?.statusCode === 1)) {
    return { ...booking, code: booking.code || fallbackCode, status: 'confirm', message };
  }
  if (String(booking.status || '').toLowerCase() !== 'confirm') {
    const error = new Error(`Bluejay returned booking status ${booking.status || 'missing'} instead of confirm`);
    error.statusCode = 502;
    throw error;
  }
  return booking;
}
