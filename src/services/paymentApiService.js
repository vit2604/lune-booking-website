import { getPaymentSettings } from '../admin/services/adminSettingsService.js';
import { canUseMockFallback } from '../config/apiConfig.js';
import { apiRequest } from './apiClient.js';

export async function getPaymentMethodsWithFallback() {
  try {
    const methods = await apiRequest('/payment-methods');
    return {
      source: 'api',
      methods: methods.map((method) => ({
        id: method.id || method.key,
        ...method,
        statusAfterConfirm: String(method.statusAfterConfirm || 'pending').toLowerCase(),
      })),
    };
  } catch (_error) {
    if (!canUseMockFallback()) throw _error;
    const settings = getPaymentSettings();
    const methods = Object.entries(settings.paymentMethods || {})
      .map(([key, config]) => ({ id: key, key, ...config }))
      .filter((method) => method.enabled !== false && method.visibleForGuests !== false)
      .sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));
    return { source: 'local', methods };
  }
}

export async function createPaymentWithFallback(bookingCode, method, details = {}) {
  try {
    return {
      source: 'api',
      payment: await apiRequest('/payments/create', {
        method: 'POST',
        body: { bookingCode, method, ...details },
      }),
    };
  } catch (_error) {
    if (!canUseMockFallback()) throw _error;
    const payAtPropertyMethods = new Set(['payAtProperty', 'cashAtProperty']);
    return {
      source: 'local',
      payment: {
        bookingCode,
        method,
        amountDueNow: details.amount,
        paymentPurpose: details.paymentPurpose,
        paymentStatus: payAtPropertyMethods.has(method) ? 'pay_at_property' : 'pending',
      },
    };
  }
}

export async function verifyPaymentWithProvider(bookingCode) {
  return apiRequest('/payments/verify', {
    method: 'POST',
    body: { bookingCode },
    timeoutMs: 15000,
  });
}
