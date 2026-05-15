export const fallbackRates = {
  VND: 1,
  USD: 25000,
  EUR: 27000,
  GBP: 31500,
  CNY: 3450,
  TWD: 780,
  KRW: 18,
  JPY: 170,
  THB: 690,
  RUB: 270,
  AUD: 16500,
  SGD: 18500,
  MYR: 5300,
  IDR: 1.55,
  INR: 300,
};

export function normalizeCurrencyList(currencies = []) {
  return [...new Set(currencies.map((currency) => String(currency).trim().toUpperCase()).filter(Boolean))];
}
