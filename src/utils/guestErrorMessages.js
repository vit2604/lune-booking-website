const DEFAULT_GUEST_SUPPORT_MESSAGE = 'Something went wrong. Please contact Lune for more details.';

const TECHNICAL_ERROR_PATTERN =
  /api|bluejay|database|endpoint|exception|failed|forbidden|http|network|payos|provider|request|server|timed?\s*out|timeout|token|unauthori[sz]ed|unexpected/i;

export function getGuestSupportErrorMessage(t) {
  if (typeof t !== 'function') return DEFAULT_GUEST_SUPPORT_MESSAGE;
  const translated = t('errors.contactLuneSupport');
  return translated && translated !== 'errors.contactLuneSupport'
    ? translated
    : DEFAULT_GUEST_SUPPORT_MESSAGE;
}

export function getGuestSafeErrorMessage(t, errorOrMessage, fallbackMessage) {
  const rawMessage = typeof errorOrMessage === 'string'
    ? errorOrMessage
    : errorOrMessage?.message;
  const message = String(rawMessage || '').trim();
  if (!message) return fallbackMessage || getGuestSupportErrorMessage(t);
  return TECHNICAL_ERROR_PATTERN.test(message)
    ? getGuestSupportErrorMessage(t)
    : message;
}
