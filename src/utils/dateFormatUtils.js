const localeMap = {
  en: 'en-US',
  vi: 'vi-VN',
  zh: 'zh-CN',
  'zh-TW': 'zh-TW',
  ko: 'ko-KR',
  ja: 'ja-JP',
  th: 'th-TH',
  ru: 'ru-RU',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES',
  it: 'it-IT',
  id: 'id-ID',
  ms: 'ms-MY',
  ar: 'ar',
  hi: 'hi-IN',
};

function parseDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 12);
}

export function formatDisplayDate(date, language = 'en') {
  const parsed = typeof date === 'string' ? parseDate(date) : date;
  if (!parsed) return date || '';

  const locale = localeMap[language] || 'en-US';
  const options =
    language === 'vi'
      ? { day: '2-digit', month: '2-digit', year: 'numeric' }
      : { month: 'long', day: 'numeric', year: 'numeric' };

  return new Intl.DateTimeFormat(locale, options).format(parsed);
}

export function formatDateRange(checkIn, checkOut, language = 'en') {
  return `${formatDisplayDate(checkIn, language)} - ${formatDisplayDate(checkOut, language)}`;
}
