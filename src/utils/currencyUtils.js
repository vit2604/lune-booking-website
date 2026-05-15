import { currencyConfig } from '../config/currencyConfig.js';

const localeMap = {
  VND: 'en-US',
  USD: 'en-US',
  CNY: 'zh-CN',
  TWD: 'zh-TW',
  KRW: 'ko-KR',
  JPY: 'ja-JP',
  THB: 'th-TH',
  RUB: 'ru-RU',
  EUR: 'de-DE',
  GBP: 'en-GB',
  AUD: 'en-AU',
  SGD: 'en-SG',
  MYR: 'ms-MY',
  IDR: 'id-ID',
  INR: 'hi-IN',
};

export function convertFromVND(amount, targetCurrency = 'VND') {
  const rate = currencyConfig.mockRates[targetCurrency] || 1;
  return Math.round((Number(amount) || 0) / rate);
}

export function formatCurrency(amount, currency = 'VND') {
  const value = Math.max(0, Number(amount) || 0);
  if (currency === 'VND') {
    return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)} VND`;
  }

  return new Intl.NumberFormat(localeMap[currency] || 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function getApproxPriceText(amountVND, targetCurrency = 'VND', language = 'en') {
  if (targetCurrency === 'VND') return '';

  const converted = convertFromVND(amountVND, targetCurrency);
  const labels = {
    en: 'Approx.',
    vi: 'Ước tính',
    zh: '约',
    'zh-TW': '約',
    ko: '약',
    ja: '概算',
    th: 'ประมาณ',
    ru: 'Примерно',
    fr: 'Env.',
    de: 'Ca.',
    es: 'Aprox.',
    it: 'Circa',
    id: 'Perkiraan',
    ms: 'Anggaran',
    ar: 'تقريباً',
    hi: 'लगभग',
  };

  return `${labels[language] || labels.en} ${formatCurrency(converted, targetCurrency)}`;
}
