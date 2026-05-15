import { convertFromVND as fallbackConvert } from '../utils/currencyUtils.js';
import { apiRequest } from './apiClient.js';

export async function convertCurrencyWithFallback(amount, to = 'USD') {
  try {
    return { source: 'api', result: await apiRequest(`/currency/convert?amount=${amount}&from=VND&to=${to}`) };
  } catch (_error) {
    return {
      source: 'local',
      result: {
        originalAmount: amount,
        from: 'VND',
        to,
        convertedAmount: fallbackConvert(amount, to),
        isFallback: true,
      },
    };
  }
}
