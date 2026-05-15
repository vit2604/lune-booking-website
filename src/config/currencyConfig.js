export const currencyConfig = {
  baseCurrency: 'VND',
  supportedCurrencies: [
    'VND',
    'USD',
    'CNY',
    'TWD',
    'KRW',
    'JPY',
    'THB',
    'RUB',
    'EUR',
    'GBP',
    'AUD',
    'SGD',
    'MYR',
    'IDR',
    'INR',
  ],
  mockRates: {
    VND: 1,
    USD: 25000,
    CNY: 3450,
    TWD: 780,
    KRW: 18,
    JPY: 170,
    THB: 700,
    RUB: 280,
    EUR: 27000,
    GBP: 31500,
    AUD: 16500,
    SGD: 18500,
    MYR: 5300,
    IDR: 1.6,
    INR: 300,
  },
};

// Production note:
// Real exchange rates should come from a trusted backend endpoint or exchange-rate API.
// VND remains the official payment currency for this MVP.
