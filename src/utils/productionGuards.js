const fakeValuePattern = /placeholder|mock|example|todo|dummy|test[_ -]?only/i;

export function isConfiguredValue(value) {
  const text = String(value || '').trim();
  return Boolean(text && text !== '#' && !fakeValuePattern.test(text));
}

export function isConfiguredUrl(value) {
  if (!isConfiguredValue(value)) return false;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

export function hasRealBankTransferConfig(method = {}) {
  return isConfiguredValue(method.bankName) && isConfiguredValue(method.accountNumber);
}

export function isGuestSafePaymentMethod(method = {}) {
  const key = method.key || method.id;
  if (!method.enabled || method.visibleForGuests === false) return false;
  if (key === 'bankTransfer') return hasRealBankTransferConfig(method);
  if (key === 'vietQr') return method.payosConfigured !== false;
  return !fakeValuePattern.test(`${method.displayName || ''} ${method.description || ''} ${method.paymentNote || ''}`);
}
