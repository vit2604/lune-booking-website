export const languageNames = {
  vi: 'Tiếng Việt',
  en: 'English',
  ko: 'Korean',
  zh: 'Chinese',
  'zh-TW': 'Traditional Chinese',
  ja: 'Japanese',
  th: 'Thai',
  ru: 'Russian',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
  it: 'Italian',
  id: 'Indonesian',
  ms: 'Malay',
  ar: 'Arabic',
  hi: 'Hindi',
};

export function normalizeLanguage(language) {
  return language || 'en';
}

export function getLanguageLabel(language) {
  const code = normalizeLanguage(language);
  return `${languageNames[code] || code.toUpperCase()} (${code})`;
}

export function isStaffLanguage(language) {
  return normalizeLanguage(language) === 'vi';
}
