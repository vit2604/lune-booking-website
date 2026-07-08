import { saveBooking } from '../admin/services/adminBookingService.js';
import { canUseMockFallback } from '../config/apiConfig.js';
import { apiRequest } from './apiClient.js';

function splitPhoneCode(value = '+84 Vietnam') {
  const first = String(value).split(' ')[0];
  return first === 'Other' ? '' : first;
}

function createIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) return `web-${globalThis.crypto.randomUUID()}`;
  return `web-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function normalizeBookingForApi(booking) {
  const guestInfo = booking.guestInfo || booking.guest || {};
  return {
    roomId: booking.roomId,
    idempotencyKey: booking.idempotencyKey,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guests: Number(booking.guests || 1),
    guest: {
      fullName: guestInfo.fullName || guestInfo.name || '',
      email: guestInfo.email || '',
      phoneCode: splitPhoneCode(guestInfo.phoneCode),
      phoneNumber: guestInfo.phone || guestInfo.phoneNumber || '',
      country: guestInfo.country || 'Vietnam',
      nationality: guestInfo.nationality || '',
    },
    specialRequest: guestInfo.specialRequest || booking.specialRequest || '',
    arrivalTime: guestInfo.arrivalTime || booking.arrivalTime || '',
    paymentMethod: booking.paymentMethod || 'payAtProperty',
    phoneVerificationToken: booking.phoneVerificationToken || undefined,
  };
}

export async function createBookingWithFallback(booking) {
  const bookingWithKey = {
    ...booking,
    idempotencyKey: booking.idempotencyKey || createIdempotencyKey(),
  };
  const payload = normalizeBookingForApi(bookingWithKey);
  try {
    const data = await apiRequest('/bookings', {
      method: 'POST',
      headers: { 'Idempotency-Key': bookingWithKey.idempotencyKey },
      body: payload,
    });
    const { phoneVerificationToken: _phoneVerificationToken, ...safeBooking } = bookingWithKey;
    const normalized = {
      ...safeBooking,
      ...data,
      guestInfo: booking.guestInfo,
      apiBacked: true,
    };
    saveBooking(normalized);
    return { source: 'api', booking: normalized };
  } catch (_error) {
    if (!canUseMockFallback() || _error?.status) throw _error;
    const { phoneVerificationToken: _phoneVerificationToken, ...safeBooking } = bookingWithKey;
    const saved = saveBooking(safeBooking);
    return { source: 'local', booking: saved };
  }
}

export async function fetchBookingWithFallback(bookingCode) {
  try {
    return { source: 'api', booking: await apiRequest(`/bookings/${bookingCode}`) };
  } catch (_error) {
    if (!canUseMockFallback()) throw _error;
    return { source: 'local', booking: null };
  }
}
