import { describe, expect, it } from 'vitest';
import { createPaymentSchema } from './payment.validation.js';

const makePayload = (depositPercent) => ({
  body: {
    bookingCode: 'LUNE-20260821-1234',
    method: 'vietQr',
    paymentPurpose: 'deposit',
    depositPercent,
  },
  params: {},
  query: {},
});

describe('createPaymentSchema deposit limit', () => {
  it('rejects a deposit percentage below 30%', () => {
    expect(createPaymentSchema.safeParse(makePayload(29)).success).toBe(false);
  });

  it('accepts a deposit percentage of 30%', () => {
    expect(createPaymentSchema.safeParse(makePayload(30)).success).toBe(true);
  });
});
