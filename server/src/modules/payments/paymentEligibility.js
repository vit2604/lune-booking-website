const vietnamCountryNames = new Set(['vietnam', 'viet nam', 'vn']);
const vietnamRestrictedMethods = new Set(['payAtProperty', 'cashAtProperty', 'creditCard']);

function normalizeCountryName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function isVietnameseGuest(guest = {}) {
  const country = normalizeCountryName(guest.country);
  const phoneCode = String(guest.phoneCode || '').trim();
  return vietnamCountryNames.has(country) || phoneCode.startsWith('+84');
}

export function canGuestUsePaymentMethod(method, guest = {}) {
  return !(isVietnameseGuest(guest) && vietnamRestrictedMethods.has(method));
}
