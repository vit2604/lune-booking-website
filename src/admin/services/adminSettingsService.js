import { defaultPaymentConfig } from '../../config/paymentConfig.js';
import { brand } from '../../data/brand.js';

const BRANDING_KEY = 'lune_branding_settings';
const PAYMENT_KEY = 'lune_payment_settings';
const POLICIES_KEY = 'lune_policy_settings';
const WEBSITE_KEY = 'lune_website_settings';
const LANGUAGE_SETTINGS_KEY = 'lune_language_settings';
const BRANDING_ASSETS_VERSION_KEY = 'lune_branding_assets_version';
const BRANDING_ASSETS_VERSION = '2026-05-25-thach-lam-real-assets';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const defaultBrandingSettings = {
  hotelName: brand.name,
  shortName: brand.shortName,
  shortSlogan: 'Your peaceful stay near My Khe Beach',
  address: brand.address,
  phone: '+84 236 000 0000',
  email: 'hello@luneboutique.vn',
  zalo: '',
  whatsapp: '',
  facebook: '#',
  instagram: '#',
  googleMapsLink: '#',
  logoUrl: brand.logoUrl,
  primaryColor: '#171412',
  accentColor: '#b08a4b',
  backgroundColor: '#fbfaf7',
  buttonColor: '#b08a4b',
  heroTitle: 'Feel at home, away from home',
  heroSubtitle: 'Warm boutique apartments near My Khe Beach with thoughtful details, clean rooms, and direct Lune support.',
  heroButtonText: 'Check Availability',
  heroImage: brand.heroImage,
  introImage: brand.introImage,
  bookDirectTitle: 'Why choose Lune',
  footerDescription:
    'New, clean boutique apartment stays near My Khe Beach for couples, families, business travelers, and long-stay guests in Da Nang.',
  whyBookDirect: [
    'Official Lune direct booking',
    'Secure payment placeholder',
    'No account required',
    'Direct support from our team',
  ],
  featuredAmenities: [
    'Free Wi-Fi',
    'Air conditioning',
    'Private bathroom',
    'Elevator',
    'Near beach',
    '24/7 support',
  ],
};

export const defaultPaymentSettings = {
  ...defaultPaymentConfig,
  enableBankTransfer: true,
  bankName: 'PLACEHOLDER_BANK_NAME',
  bankAccountNumber: 'PLACEHOLDER_ACCOUNT_NUMBER',
  bankAccountName: 'LUNE BOUTIQUE HOTEL',
  transferContentTemplate: 'LUNE-[BOOKING_CODE]-[GUEST_NAME]',
  qrImageUrl: '',
  enablePayAtProperty: true,
  payAtPropertyNote: 'Pay directly when you arrive at Lune Boutique Hotel & Apartment.',
  enableQrPayment: true,
  qrProviderPlaceholder: '',
  paymentGatewayProvider: '',
  paymentGatewayBaseUrl: '',
  paymentGatewayPublicKey: '',
  webhookUrl: '',
};

export const defaultPolicies = {
  checkInTime: '14:00',
  checkOutTime: '12:00',
  earlyCheckInNote: 'Early check-in is subject to availability',
  cancellationPolicy: 'Contact our team for cancellation requests.',
  paymentConfirmationPolicy: 'Payment confirmation may be required for selected payment methods',
  smokingPolicy: 'No smoking inside the room',
  petPolicy: 'Pets are not allowed',
  luggageStoragePolicy: 'Luggage storage is subject to front desk availability.',
  cleaningPolicy: 'Cleaning service is available during eligible stays.',
  longStayPolicy: 'Long stay requests are reviewed by our team.',
  contactAfterBooking: 'Our team will contact you shortly after receiving your booking',
};

export const defaultWebsiteSettings = {
  websiteStatus: 'online',
  defaultCurrency: 'VND',
  defaultLanguage: 'English',
  contactEmail: 'hello@luneboutique.vn',
  notificationEmail: '',
  directBookingEnabled: true,
  availabilityMockEnabled: true,
  maintenanceMessage:
    'Lune Boutique Hotel & Apartment Da Nang is updating the booking website. Please contact us directly for reservations.',
};

export const defaultLanguageSettings = {
  schemaVersion: 2,
  defaultLanguage: 'en',
  enabledLanguages: [
    'en',
    'vi',
    'zh',
    'zh-TW',
    'ko',
    'ja',
    'th',
    'ru',
    'fr',
    'de',
    'es',
    'it',
    'id',
    'ms',
    'ar',
    'hi',
  ],
  content: {},
  roomTranslations: {},
};

function readSettings(key, defaults) {
  try {
    return { ...defaults, ...(JSON.parse(localStorage.getItem(key)) || {}) };
  } catch {
    return defaults;
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function mergeDeep(defaults, stored) {
  const result = { ...(defaults || {}) };
  Object.entries(stored || {}).forEach(([key, value]) => {
    result[key] = isPlainObject(value) ? mergeDeep(result[key], value) : value;
  });
  return result;
}

function writeSettings(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event('lune:settings-updated'));
}

export function getBrandingSettings() {
  const settings = readSettings(BRANDING_KEY, defaultBrandingSettings);
  const needsAssetRefresh = localStorage.getItem(BRANDING_ASSETS_VERSION_KEY) !== BRANDING_ASSETS_VERSION;
  if (!needsAssetRefresh) return settings;

  const nextSettings = {
    ...settings,
    address: settings.address?.includes('Tháº') ? defaultBrandingSettings.address : settings.address,
    logoUrl: settings.logoUrl || defaultBrandingSettings.logoUrl,
    heroImage:
      !settings.heroImage || settings.heroImage.includes('images.unsplash.com')
        ? defaultBrandingSettings.heroImage
        : settings.heroImage,
    introImage:
      !settings.introImage || settings.introImage.includes('images.unsplash.com')
        ? defaultBrandingSettings.introImage
        : settings.introImage,
    shortSlogan:
      !settings.shortSlogan || settings.shortSlogan === 'A boutique apartment experience near the beach'
        ? defaultBrandingSettings.shortSlogan
        : settings.shortSlogan,
    footerDescription:
      !settings.footerDescription || settings.footerDescription.includes('Boutique apartment stays near the beach')
        ? defaultBrandingSettings.footerDescription
        : settings.footerDescription,
  };
  localStorage.setItem(BRANDING_KEY, JSON.stringify(nextSettings));
  localStorage.setItem(BRANDING_ASSETS_VERSION_KEY, BRANDING_ASSETS_VERSION);
  return nextSettings;
}

export function saveBrandingSettings(settings) {
  if (!settings.hotelName?.trim()) return { ok: false, message: 'Hotel name is required.' };
  if (settings.email && !emailPattern.test(settings.email)) {
    return { ok: false, message: 'Please enter a valid email.' };
  }
  writeSettings(BRANDING_KEY, { ...getBrandingSettings(), ...settings });
  return { ok: true };
}

export function getPaymentSettings() {
  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(PAYMENT_KEY)) || {};
  } catch {
    stored = {};
  }
  const merged = mergeDeep(defaultPaymentSettings, stored);

  merged.paymentMethods = {
    ...defaultPaymentConfig.paymentMethods,
    ...merged.paymentMethods,
    payAtProperty: {
      ...defaultPaymentConfig.paymentMethods.payAtProperty,
      ...(merged.paymentMethods?.payAtProperty || {}),
      enabled: merged.paymentMethods?.payAtProperty?.enabled ?? merged.enablePayAtProperty ?? true,
      paymentNote: merged.payAtPropertyNote || merged.paymentMethods?.payAtProperty?.paymentNote,
    },
    bankTransfer: {
      ...defaultPaymentConfig.paymentMethods.bankTransfer,
      ...(merged.paymentMethods?.bankTransfer || {}),
      enabled: merged.paymentMethods?.bankTransfer?.enabled ?? merged.enableBankTransfer ?? true,
      bankName: merged.bankName || merged.paymentMethods?.bankTransfer?.bankName,
      accountNumber: merged.bankAccountNumber || merged.paymentMethods?.bankTransfer?.accountNumber,
      accountHolder: merged.bankAccountName || merged.paymentMethods?.bankTransfer?.accountHolder,
      transferContentTemplate:
        merged.transferContentTemplate || merged.paymentMethods?.bankTransfer?.transferContentTemplate,
      qrImageUrl: merged.qrImageUrl || merged.paymentMethods?.bankTransfer?.qrImageUrl,
      webhookUrl: merged.webhookUrl || merged.paymentMethods?.bankTransfer?.webhookUrl,
    },
    vietQr: {
      ...defaultPaymentConfig.paymentMethods.vietQr,
      ...(merged.paymentMethods?.vietQr || {}),
      enabled: merged.paymentMethods?.vietQr?.enabled ?? merged.enableQrPayment ?? true,
      qrImageUrl: merged.qrImageUrl || merged.paymentMethods?.vietQr?.qrImageUrl,
    },
  };

  return merged;
}

export function savePaymentSettings(settings) {
  writeSettings(PAYMENT_KEY, { ...getPaymentSettings(), ...settings });
  return { ok: true };
}

export function getPolicies() {
  return readSettings(POLICIES_KEY, defaultPolicies);
}

export function savePolicies(policies) {
  writeSettings(POLICIES_KEY, { ...getPolicies(), ...policies });
  return { ok: true };
}

export function getWebsiteSettings() {
  return readSettings(WEBSITE_KEY, defaultWebsiteSettings);
}

export function saveWebsiteSettings(settings) {
  writeSettings(WEBSITE_KEY, { ...getWebsiteSettings(), ...settings });
  return { ok: true };
}

export function getLanguageSettings() {
  const settings = readSettings(LANGUAGE_SETTINGS_KEY, defaultLanguageSettings);
  if ((settings.schemaVersion || 1) < defaultLanguageSettings.schemaVersion) {
    return {
      ...settings,
      schemaVersion: defaultLanguageSettings.schemaVersion,
      defaultLanguage: settings.defaultLanguage || defaultLanguageSettings.defaultLanguage,
      enabledLanguages: defaultLanguageSettings.enabledLanguages,
    };
  }
  return settings;
}

export function saveLanguageSettings(settings) {
  const nextSettings = {
    ...getLanguageSettings(),
    ...settings,
    enabledLanguages: settings.enabledLanguages?.length ? settings.enabledLanguages : ['en'],
  };
  localStorage.setItem(LANGUAGE_SETTINGS_KEY, JSON.stringify(nextSettings));
  window.dispatchEvent(new Event('lune:language-settings-updated'));
  return { ok: true };
}

export function resetDemoData() {
  localStorage.removeItem(BRANDING_KEY);
  localStorage.removeItem(PAYMENT_KEY);
  localStorage.removeItem(POLICIES_KEY);
  localStorage.removeItem(WEBSITE_KEY);
  localStorage.removeItem(LANGUAGE_SETTINGS_KEY);
  localStorage.removeItem(BRANDING_ASSETS_VERSION_KEY);
  window.dispatchEvent(new Event('lune:settings-updated'));
  window.dispatchEvent(new Event('lune:language-settings-updated'));
}
