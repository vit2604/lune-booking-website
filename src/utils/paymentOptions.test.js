import { describe, expect, it } from 'vitest';
import {
  clampDepositPercent,
  computePaymentBreakdown,
  filterPaymentChoicesForGuest,
  isVietnameseGuest,
  paymentChoices,
} from './paymentOptions.js';

describe('computePaymentBreakdown', () => {
  it('leaves the total unchanged for cash and settles everything at the property', () => {
    const b = computePaymentBreakdown({ total: 1_000_000, choice: 'cash' });
    expect(b.method).toBe('cashAtProperty');
    expect(b.surcharge).toBe(0);
    expect(b.grandTotal).toBe(1_000_000);
    expect(b.dueNow).toBe(0);
    expect(b.balanceAtProperty).toBe(1_000_000);
  });

  it('adds a 5% surcharge for card payments', () => {
    const b = computePaymentBreakdown({ total: 1_000_000, choice: 'card' });
    expect(b.method).toBe('creditCard');
    expect(b.surcharge).toBe(50_000);
    expect(b.grandTotal).toBe(1_050_000);
  });

  it('splits a deposit and the remaining balance', () => {
    const b = computePaymentBreakdown({ total: 2_000_000, choice: 'deposit', depositPercent: 25 });
    expect(b.method).toBe('bankTransfer');
    expect(b.depositPercent).toBe(25);
    expect(b.depositAmount).toBe(500_000);
    expect(b.dueNow).toBe(500_000);
    expect(b.balanceAtProperty).toBe(1_500_000);
    expect(b.grandTotal).toBe(2_000_000);
  });

  it('charges the full amount through PayOS without changing the total', () => {
    const b = computePaymentBreakdown({ total: 2_000_000, choice: 'payos' });
    expect(b.method).toBe('vietQr');
    expect(b.surcharge).toBe(0);
    expect(b.grandTotal).toBe(2_000_000);
    expect(b.dueNow).toBe(2_000_000);
    expect(b.balanceAtProperty).toBe(0);
  });

  it('enforces the 10% minimum deposit', () => {
    expect(clampDepositPercent(0)).toBe(10);
    expect(clampDepositPercent(5)).toBe(10);
    expect(clampDepositPercent(150)).toBe(100);
    const b = computePaymentBreakdown({ total: 1_000_000, choice: 'deposit', depositPercent: 3 });
    expect(b.depositPercent).toBe(10);
    expect(b.depositAmount).toBe(100_000);
  });

  it('rounds money to whole VND', () => {
    const b = computePaymentBreakdown({ total: 1_679_752, choice: 'card' });
    expect(Number.isInteger(b.surcharge)).toBe(true);
    expect(b.surcharge).toBe(83_988);
  });
});

describe('guest payment choices', () => {
  it('detects Vietnamese guests by country or phone code', () => {
    expect(isVietnameseGuest({ country: 'Vietnam' })).toBe(true);
    expect(isVietnameseGuest({ country: 'France', phoneCode: '+84 Vietnam' })).toBe(true);
    expect(isVietnameseGuest({ country: 'France', phoneCode: '+33 France' })).toBe(false);
  });

  it('hides cash and card-at-property choices for Vietnamese guests', () => {
    const choices = filterPaymentChoicesForGuest(paymentChoices, { country: 'Vietnam' }).map((choice) => choice.id);
    expect(choices).toEqual(['deposit', 'payos']);
  });

  it('shows cash, Vietnam bank transfer, and international card for foreign guests', () => {
    const choices = filterPaymentChoicesForGuest(paymentChoices, { country: 'United States' }).map((choice) => choice.id);
    expect(choices).toEqual(['cash', 'deposit', 'card']);
  });
});
