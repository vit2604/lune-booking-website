import { describe, expect, it } from 'vitest';
import { bookingStatusAfterPayment } from './paymentStatusUtils.js';

describe('bookingStatusAfterPayment', () => {
  it('releases a received booking when PayOS reports a failed or cancelled payment', () => {
    expect(bookingStatusAfterPayment('RECEIVED', 'FAILED')).toBe('CANCELLED');
  });

  it('releases confirmed bookings when PayOS fails before payment is captured', () => {
    expect(bookingStatusAfterPayment('CONFIRMED', 'FAILED')).toBe('CANCELLED');
  });

  it('does not change received bookings before payment is captured', () => {
    expect(bookingStatusAfterPayment('RECEIVED', 'PAID')).toBe('RECEIVED');
  });
});
