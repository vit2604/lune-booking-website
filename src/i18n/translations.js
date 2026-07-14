import enTranslations from './locales/en.js';

// Danh sach ngon ngu (giu nguyen gia tri runtime cua he thong cu sau khi ap extensions).
export const languageOptions = [
  { code: 'en', label: 'English', shortLabel: 'EN' },
  { code: 'vi', label: 'Tiếng Việt', shortLabel: 'VI' },
  { code: 'zh', label: '简体中文', shortLabel: '简体' },
  { code: 'zh-TW', label: '繁體中文', shortLabel: '繁體' },
  { code: 'ko', label: '한국어', shortLabel: 'KO' },
  { code: 'ja', label: '日本語', shortLabel: 'JA' },
  { code: 'th', label: 'ไทย', shortLabel: 'TH' },
  { code: 'ru', label: 'Русский', shortLabel: 'RU' },
  { code: 'fr', label: 'Français', shortLabel: 'FR' },
  { code: 'de', label: 'Deutsch', shortLabel: 'DE' },
  { code: 'es', label: 'Español', shortLabel: 'ES' },
  { code: 'it', label: 'Italiano', shortLabel: 'IT' },
  { code: 'id', label: 'Bahasa Indonesia', shortLabel: 'ID' },
  { code: 'ms', label: 'Bahasa Melayu', shortLabel: 'MS' },
  { code: 'ar', label: 'العربية', shortLabel: 'AR' },
  { code: 'hi', label: 'हिन्दी', shortLabel: 'HI' },
];

export const futureLanguageOptions = [];

// Tieng Anh (fallback) bundle san; cac ngon ngu khac load dong khi khach chon.
export { enTranslations };

export const localeLoaders = {
  en: () => import('./locales/en.js'),
  vi: () => import('./locales/vi.js'),
  zh: () => import('./locales/zh.js'),
  'zh-TW': () => import('./locales/zh-TW.js'),
  ko: () => import('./locales/ko.js'),
  ja: () => import('./locales/ja.js'),
  th: () => import('./locales/th.js'),
  ru: () => import('./locales/ru.js'),
  fr: () => import('./locales/fr.js'),
  de: () => import('./locales/de.js'),
  es: () => import('./locales/es.js'),
  it: () => import('./locales/it.js'),
  id: () => import('./locales/id.js'),
  ms: () => import('./locales/ms.js'),
  ar: () => import('./locales/ar.js'),
  hi: () => import('./locales/hi.js'),
};
