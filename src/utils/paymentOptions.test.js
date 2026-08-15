import { describe, expect, it } from 'vitest';
import {
  clampDepositPercent,
  computePaymentBreakdown,
  filterPaymentChoicesForGuest,
  getVisiblePaymentChoices,
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
    const b = computePaymentBreakdown({ total: 2_000_000, choice: 'deposit', depositPercent: 35 });
    expect(b.method).toBe('bankTransfer');
    expect(b.depositPercent).toBe(35);
    expect(b.depositAmount).toBe(700_000);
    expect(b.dueNow).toBe(700_000);
    expect(b.balanceAtProperty).toBe(1_300_000);
    expect(b.grandTotal).toBe(2_000_000);
  });

  it('charges the full amount through QR payment without changing the total', () => {
    const b = computePaymentBreakdown({ total: 2_000_000, choice: 'payos' });
    expect(b.method).toBe('vietQr');
    expect(b.surcharge).toBe(0);
    expect(b.grandTotal).toBe(2_000_000);
    expect(b.dueNow).toBe(2_000_000);
    expect(b.balanceAtProperty).toBe(0);
  });

  it('enforces the 30% minimum deposit', () => {
    expect(clampDepositPercent(0)).toBe(30);
    expect(clampDepositPercent(29)).toBe(30);
    expect(clampDepositPercent(150)).toBe(100);
    const b = computePaymentBreakdown({ total: 1_000_000, choice: 'deposit', depositPercent: 3 });
    expect(b.depositPercent).toBe(30);
    expect(b.depositAmount).toBe(300_000);
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
    expect(isVietnameseGuest({ country: 'Việt Nam' })).toBe(true);
    expect(isVietnameseGuest({ country: 'France', phoneCode: '+84 Vietnam' })).toBe(true);
    expect(isVietnameseGuest({ country: 'France', phoneCode: '+33 France' })).toBe(false);
  });

  it('hides cash and card payments for Vietnamese guests', () => {
    const choices = filterPaymentChoicesForGuest(paymentChoices, { country: 'Vietnam' }).map((choice) => choice.id);
    expect(choices).toEqual(['payos', 'deposit']);
  });

  it('shows QR payment, cash, and international card for foreign guests', () => {
    const choices = filterPaymentChoicesForGuest(paymentChoices, { country: 'United States' }).map((choice) => choice.id);
    expect(choices).toEqual(['payos', 'cash', 'card']);
  });

  it('shows a PayOS-backed deposit for Vietnamese guests when manual bank transfer is disabled', () => {
    const methods = [
      { key: 'cashAtProperty', enabled: true, visibleForGuests: true },
      { key: 'bankTransfer', enabled: false, visibleForGuests: false },
      { key: 'vietQr', enabled: true, visibleForGuests: true },
      { key: 'creditCard', enabled: true, visibleForGuests: true },
    ];

    const choices = getVisiblePaymentChoices(paymentChoices, methods, { country: 'Vietnam' }).map((choice) => choice.id);
    expect(choices).toEqual(['payos', 'deposit']);
  });

  it('keeps cash on arrival for foreign guests without exposing the deposit option', () => {
    const methods = [
      { key: 'cashAtProperty', enabled: true, visibleForGuests: true },
      { key: 'bankTransfer', enabled: false, visibleForGuests: false },
      { key: 'vietQr', enabled: true, visibleForGuests: true },
      { key: 'creditCard', enabled: true, visibleForGuests: true },
    ];

    const choices = getVisiblePaymentChoices(paymentChoices, methods, {
      country: 'United States',
      phoneCode: '+1 United States/Canada',
    }).map((choice) => choice.id);
    expect(choices).toEqual(['payos', 'cash', 'card']);
  });
});
