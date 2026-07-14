import { parsePhoneNumberFromString } from 'libphonenumber-js/max';

const countryAliases = new Map([
  ['vietnam', 'VN'], ['south korea', 'KR'], ['china', 'CN'], ['taiwan', 'TW'],
  ['japan', 'JP'], ['thailand', 'TH'], ['russia', 'RU'], ['france', 'FR'],
  ['germany', 'DE'], ['spain', 'ES'], ['italy', 'IT'], ['indonesia', 'ID'],
  ['malaysia', 'MY'], ['singapore', 'SG'], ['australia', 'AU'],
  ['united kingdom', 'GB'], ['united states/canada', 'US'], ['united states', 'US'],
  ['canada', 'CA'], ['uae', 'AE'], ['united arab emirates', 'AE'], ['india', 'IN'],
]);

const callingCodeCountries = new Map([
  ['+84', 'VN'], ['+82', 'KR'], ['+86', 'CN'], ['+886', 'TW'], ['+81', 'JP'],
  ['+66', 'TH'], ['+7', 'RU'], ['+33', 'FR'], ['+49', 'DE'], ['+34', 'ES'],
  ['+39', 'IT'], ['+62', 'ID'], ['+60', 'MY'], ['+65', 'SG'], ['+61', 'AU'],
  ['+44', 'GB'], ['+1', 'US'], ['+971', 'AE'], ['+91', 'IN'],
]);

function resolveCountry(phoneCode, country) {
  const codeValue = String(phoneCode || '');
  const label = codeValue.replace(/^\+\d+\s*/, '').trim().toLowerCase();
  const callingCode = codeValue.match(/^\+\d+/)?.[0];
  return countryAliases.get(label)
    || callingCodeCountries.get(callingCode)
    || countryAliases.get(String(country || '').trim().toLowerCase());
}

export function parseValidPhoneNumber({ phoneCode, phoneNumber, country } = {}) {
  const rawNumber = String(phoneNumber || '').trim();
  if (!rawNumber || !/^[0-9+\-().\s]+$/.test(rawNumber)) return null;

  const selectedCallingCode = String(phoneCode || '').match(/^\+\d+/)?.[0];
  const countryCode = resolveCountry(phoneCode, country);
  if (!selectedCallingCode && !rawNumber.startsWith('+')) return null;

  const parsed = rawNumber.startsWith('+')
    ? parsePhoneNumberFromString(rawNumber)
    : parsePhoneNumberFromString(rawNumber, countryCode);

  if (!parsed?.isValid()) return null;
  if (selectedCallingCode && `+${parsed.countryCallingCode}` !== selectedCallingCode) return null;
  return parsed;
}

export function isValidPhoneNumber(input) {
  return Boolean(parseValidPhoneNumber(input));
}
