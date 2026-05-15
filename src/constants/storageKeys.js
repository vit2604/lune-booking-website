export const storageKeys = {
  rooms: 'lune_rooms',
  bookings: 'lune_bookings',
  bookingDraft: 'lune_booking_draft',
  bookingConfirmed: 'lune_booking_confirmed',
  branding: 'lune_branding',
  paymentSettings: 'lune_payment_settings',
  policies: 'lune_policy_settings',
  websiteSettings: 'lune_website_settings',
  languageSettings: 'lune_language_settings',
  language: 'lune_language',
  currency: 'lune_currency',
  currencyRates: 'lune_currency_rates',
  currencyLastUpdated: 'lune_currency_last_updated',
  chatSessions: 'lune_chat_sessions',
  chatMessages: 'lune_chat_messages',
  chatSessionCode: 'lune_chat_session_code',
  adminLoggedIn: 'lune_admin_logged_in',
  adminToken: 'lune_admin_token',
  adminUser: 'lune_admin_user',
};

export const legacyStorageKeys = {
  rooms: ['lune_admin_rooms'],
  branding: ['lune_branding_settings'],
  language: ['lune_guest_language'],
  currency: ['lune_guest_currency'],
};

export function readJsonStorage(key, fallback, legacyKeys = []) {
  const keys = [key, ...legacyKeys];
  for (const itemKey of keys) {
    try {
      const raw = localStorage.getItem(itemKey);
      if (raw !== null) return JSON.parse(raw);
    } catch {
      // Ignore malformed local demo data and continue to fallback.
    }
  }
  return fallback;
}

export function writeJsonStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
