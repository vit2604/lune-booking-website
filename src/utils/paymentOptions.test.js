import { describe, expect, it } from 'vitest';
import { clampDepositPercent, computePaymentBreakdown } from './paymentOptions.js';

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
