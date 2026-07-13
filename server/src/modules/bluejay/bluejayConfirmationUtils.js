import { getBluejayPaymentSummary } from './bluejayPaymentUtils.js';

function money(value) {
  return Math.max(0, Math.round(Number(value || 0)));
}

function formatBluejayDateTime(value) {
  const date = value ? new Date(value) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  return safeDate.toISOString().slice(0, 19).replace('T', ' ');
}

function getBluejayPaymentMethod(method) {
  if (method === 'vnpay') return 8;
  if (['creditCard', 'stripe', 'paypal'].includes(method)) return 5;
  return 2;
}

export function buildBluejayConfirmationPayload(booking, { propertyId, channelCode, redirectUrl }) {
  const { paidAmount } = getBluejayPaymentSummary(booking.payments, booking.totalPrice);
  const paidPayment = [...(booking.payments || [])]
    .filter((payment) => payment.status === 'PAID')
    .sort((a, b) => (
      new Date(b.paidAt || b.updatedAt || b.createdAt || 0) -
      new Date(a.paidAt || a.updatedAt || a.createdAt || 0)
    ))[0];
  const reservation = {
    property_id: Number(propertyId),
    channel: channelCode,
    book_code: booking.bluejayBookingCode,
    reference_code: booking.bookingCode,
    url_redirect: redirectUrl,
    grand_total: money(booking.totalPrice),
    total_pay: paidAmount,
    currency: booking.currency || 'VND',
  };
  if (paidAmount > 0) {
    reservation.payment = {
      amount: paidAmount,
      pay_time: formatBluejayDateTime(paidPayment?.paidAt || paidPayment?.updatedAt || paidPayment?.createdAt),
      payment_method: getBluejayPaymentMethod(paidPayment?.method || booking.paymentMethod),
      payment_for: '1',
      pay_currency: booking.currency || 'VND',
      pay_note: `Website payment for ${booking.bookingCode}`,
    };
  }
  return { reservation };
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

export function assertBluejayBookingConfirmed(payload) {
  const booking = normalizeCreatedBooking(payload);
  if (String(booking.status || '').toLowerCase() !== 'confirm') {
    const error = new Error(`Bluejay returned booking status ${booking.status || 'missing'} instead of confirm`);
    error.statusCode = 502;
    throw error;
  }
  return booking;
}
