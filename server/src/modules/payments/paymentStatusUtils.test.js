import { describe, expect, it } from 'vitest';
import { bookingStatusAfterPayment } from './paymentStatusUtils.js';

describe('bookingStatusAfterPayment', () => {
  it('releases a received booking when PayOS reports a failed or cancelled payment', () => {
    expect(bookingStatusAfterPayment('RECEIVED', 'FAILED')).toBe('CANCELLED');
  });

  it('does not cancel confirmed or paid bookings', () => {
    expect(bookingStatusAfterPayment('CONFIRMED', 'FAILED')).toBe('CONFIRMED');
    expect(bookingStatusAfterPayment('RECEIVED', 'PAID')).toBe('RECEIVED');
  });
});
