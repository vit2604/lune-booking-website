import { describe, expect, it } from 'vitest';
import { canGuestUsePaymentMethod, isVietnameseGuest } from './paymentEligibility.js';

describe('payment eligibility', () => {
  it('recognizes Vietnamese guests by country or calling code', () => {
    expect(isVietnameseGuest({ country: 'Việt Nam' })).toBe(true);
    expect(isVietnameseGuest({ country: 'France', phoneCode: '+84' })).toBe(true);
  });

  it('blocks pay-at-property, cash, and card methods for Vietnamese guests', () => {
    const guest = { country: 'Vietnam', phoneCode: '+84' };
    expect(canGuestUsePaymentMethod('payAtProperty', guest)).toBe(false);
    expect(canGuestUsePaymentMethod('cashAtProperty', guest)).toBe(false);
    expect(canGuestUsePaymentMethod('creditCard', guest)).toBe(false);
    expect(canGuestUsePaymentMethod('vietQr', guest)).toBe(true);
  });

  it('keeps cash and card methods available to foreign guests', () => {
    const guest = { country: 'United States', phoneCode: '+1' };
    expect(canGuestUsePaymentMethod('cashAtProperty', guest)).toBe(true);
    expect(canGuestUsePaymentMethod('creditCard', guest)).toBe(true);
  });
});
