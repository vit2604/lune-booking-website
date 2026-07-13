import { describe, expect, it } from 'vitest';
import { getBluejayPaymentSummary } from '../../server/src/modules/bluejay/bluejayPaymentUtils.js';

describe('Bluejay payment summary', () => {
  it('separates a paid 10 percent deposit from the total room charge', () => {
    const summary = getBluejayPaymentSummary(
      [
        { status: 'PAY_AT_PROPERTY', amount: 1500000 },
        { status: 'PAID', amount: 150000 },
      ],
      1500000,
    );

    expect(summary).toEqual({ paidAmount: 150000, remainingAmount: 1350000 });
  });
});
