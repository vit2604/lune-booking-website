import { getPaymentSettings } from '../admin/services/adminSettingsService.js';
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
    const settings = getPaymentSettings();
    const methods = Object.entries(settings.paymentMethods || {})
      .map(([key, config]) => ({ key, ...config }))
      .filter((method) => method.enabled !== false && method.visibleForGuests !== false)
      .sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));
    return { source: 'local', methods };
  }
}

export async function createPaymentWithFallback(bookingCode, method) {
  try {
    return { source: 'api', payment: await apiRequest('/payments/create', { method: 'POST', body: { bookingCode, method } }) };
  } catch (_error) {
    return { source: 'local', payment: { bookingCode, method, paymentStatus: method === 'payAtProperty' ? 'pay_at_property' : 'pending' } };
  }
}
