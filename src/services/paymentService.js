import {
  getPaymentSettings as readAdminPaymentSettings,
  savePaymentSettings as writeAdminPaymentSettings,
} from '../admin/services/adminSettingsService.js';
import { updatePaymentStatus as updateStoredBookingPaymentStatus } from '../admin/services/adminBookingService.js';
import { loadConfirmedBooking, saveConfirmedBooking } from '../utils/storage.js';

const methodAliases = {
  'pay-at-property': 'payAtProperty',
  pay_at_property: 'payAtProperty',
  'cash-at-property': 'cashAtProperty',
  cash_at_property: 'cashAtProperty',
  'bank-transfer': 'bankTransfer',
  bank_transfer: 'bankTransfer',
  'qr-payment': 'vietQr',
  qr_payment: 'vietQr',
  qrPayment: 'vietQr',
};

export function normalizePaymentMethodId(method) {
  if (!method) return 'payAtProperty';
  const id = typeof method === 'string' ? method : method.id;
  return methodAliases[id] || id || 'payAtProperty';
}

export function getPaymentSettings() {
  return readAdminPaymentSettings();
}

export function savePaymentSettings(settings) {
  return writeAdminPaymentSettings(settings);
}

export function getEnabledPaymentMethods() {
  const settings = getPaymentSettings();
  return Object.entries(settings.paymentMethods || {})
    .map(([id, method]) => ({ id, ...method }))
    .filter((method) => method.enabled && method.visibleForGuests !== false)
    .sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
}

export function generateTransferContent(booking, template = 'LUNE-{bookingCode}-{guestName}') {
  const guestName = booking?.guestInfo?.fullName || booking?.guestName || 'GUEST';
  return template
    .replaceAll('{bookingCode}', booking?.bookingCode || 'BOOKING')
    .replaceAll('{guestName}', guestName)
    .replaceAll('[BOOKING_CODE]', booking?.bookingCode || 'BOOKING')
    .replaceAll('[GUEST_NAME]', guestName);
}

export async function createPaymentRequest(booking, method) {
  const methodId = normalizePaymentMethodId(method || booking?.paymentMethod);
  const settings = getPaymentSettings();
  const config = settings.paymentMethods?.[methodId] || settings.paymentMethods?.payAtProperty || {};

  // Mock function only.
  // Production version must call a backend endpoint such as POST /api/payments/create.
  // Never process card data directly in frontend and never store secret keys here.
  return {
    ok: true,
    bookingCode: booking?.bookingCode,
    methodId,
    provider: config.providerName || config.provider || '',
    paymentStatus: config.statusAfterConfirm || 'pending',
    backendEndpoint: config.backendEndpoint || '',
  };
}

export async function verifyBankTransfer(bookingCode) {
  // Mock function only. Production verification must be handled by backend/webhook.
  return {
    ok: true,
    bookingCode,
    paymentStatus: 'pending',
  };
}

export async function generateQrPayment(booking) {
  return generateVietQrMock(booking);
}

export async function generateVietQrMock(booking) {
  const settings = getPaymentSettings();
  const method = settings.paymentMethods?.vietQr || settings.paymentMethods?.bankTransfer || {};

  // Production version should call a backend endpoint to generate a signed VietQR payload.
  return {
    ok: true,
    bookingCode: booking?.bookingCode,
    qrImageUrl: method.qrImageUrl || settings.qrImageUrl || '',
    provider: method.provider || 'VietQR',
  };
}

export async function createCardPaymentMock(booking) {
  // Card data must never be collected or stored directly in this frontend.
  return createPaymentRequest(booking, 'creditCard');
}

export async function createWalletPaymentMock(booking, provider = 'wallet') {
  return createPaymentRequest(booking, provider);
}

export async function verifyPaymentMock(bookingCode) {
  // Production payment verification must be handled by backend/webhooks.
  return {
    ok: true,
    bookingCode,
    paymentStatus: 'pending',
  };
}

export async function confirmPayment(bookingCode) {
  return verifyPaymentMock(bookingCode);
}

export function updatePaymentStatus(bookingCode, status) {
  updateStoredBookingPaymentStatus(bookingCode, status);
  const confirmed = loadConfirmedBooking();
  if (confirmed?.bookingCode === bookingCode) {
    saveConfirmedBooking({ ...confirmed, paymentStatus: status, updatedAt: new Date().toISOString() });
  }
  return { ok: true, bookingCode, paymentStatus: status };
}
