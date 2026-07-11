export const CARD_FEE_PERCENT = 5;
export const MIN_DEPOSIT_PERCENT = 10;

// Guest-facing choices map to a backend-accepted paymentMethod enum value.
export const paymentChoices = [
  { id: 'cash', method: 'cashAtProperty', labelKey: 'payment.optCashTitle', descKey: 'payment.optCashDesc', icon: 'banknote' },
  { id: 'deposit', method: 'bankTransfer', labelKey: 'payment.optDepositTitle', descKey: 'payment.optDepositDesc', icon: 'transfer' },
  { id: 'card', method: 'creditCard', labelKey: 'payment.optCardTitle', descKey: 'payment.optCardDesc', icon: 'card' },
  { id: 'payos', method: 'vietQr', labelKey: 'payment.vietQr', descKey: 'payment.vietQrDesc', icon: 'qr' },
];

const vietnamCountryNames = new Set(['vietnam', 'viet nam', 'việt nam', 'vn']);

export function isVietnameseGuest(guestInfo = {}) {
  const country = String(guestInfo.country || '')
    .trim()
    .toLowerCase();
  const phoneCode = String(guestInfo.phoneCode || guestInfo.phoneCountryCode || '').toLowerCase();
  return vietnamCountryNames.has(country) || phoneCode.includes('+84');
}

export function filterPaymentChoicesForGuest(choices, guestInfo = {}) {
  const allowedIds = isVietnameseGuest(guestInfo)
    ? new Set(['deposit', 'payos'])
    : new Set(['cash', 'deposit', 'card']);
  return choices.filter((choice) => allowedIds.has(choice.id));
}

const roundVnd = (value) => Math.max(0, Math.round(Number(value) || 0));

export function clampDepositPercent(percent) {
  const value = Number(percent);
  if (!Number.isFinite(value)) return MIN_DEPOSIT_PERCENT;
  return Math.min(100, Math.max(MIN_DEPOSIT_PERCENT, Math.round(value)));
}

// Returns the amounts to show the guest for a given choice.
// `dueNow` is what they pay before arrival; `balanceAtProperty` is settled on check-in.
export function computePaymentBreakdown({ total, choice, depositPercent }) {
  const base = roundVnd(total);

  if (choice === 'card') {
    const surcharge = roundVnd((base * CARD_FEE_PERCENT) / 100);
    return {
      choice,
      method: 'creditCard',
      surcharge,
      grandTotal: base + surcharge,
      dueNow: 0,
      depositPercent: 0,
      depositAmount: 0,
      balanceAtProperty: base + surcharge,
    };
  }

  if (choice === 'deposit') {
    const percent = clampDepositPercent(depositPercent);
    const depositAmount = roundVnd((base * percent) / 100);
    return {
      choice,
      method: 'bankTransfer',
      surcharge: 0,
      grandTotal: base,
      dueNow: depositAmount,
      depositPercent: percent,
      depositAmount,
      balanceAtProperty: base - depositAmount,
    };
  }

  if (choice === 'payos') {
    return {
      choice,
      method: 'vietQr',
      surcharge: 0,
      grandTotal: base,
      dueNow: base,
      depositPercent: 0,
      depositAmount: 0,
      balanceAtProperty: 0,
    };
  }

  return {
    choice: 'cash',
    method: 'cashAtProperty',
    surcharge: 0,
    grandTotal: base,
    dueNow: 0,
    depositPercent: 0,
    depositAmount: 0,
    balanceAtProperty: base,
  };
}
