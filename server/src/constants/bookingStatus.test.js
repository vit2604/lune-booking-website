import { describe, expect, it } from 'vitest';
import { bookingHoldWhere, isBookingHoldingRoom } from './bookingStatus.js';

describe('booking room hold rules', () => {
  it('does not hold rooms for unpaid received bookings', () => {
    expect(isBookingHoldingRoom({ bookingStatus: 'RECEIVED', paymentStatus: 'PENDING' })).toBe(false);
    expect(isBookingHoldingRoom({ bookingStatus: 'RECEIVED', paymentStatus: 'FAILED' })).toBe(false);
  });

  it('holds rooms only after payment or property-payment confirmation', () => {
    expect(isBookingHoldingRoom({ bookingStatus: 'RECEIVED', paymentStatus: 'PAID' })).toBe(true);
    expect(isBookingHoldingRoom({ bookingStatus: 'RECEIVED', paymentStatus: 'PAY_AT_PROPERTY' })).toBe(true);
    expect(isBookingHoldingRoom({ bookingStatus: 'CONFIRMED', paymentStatus: 'PENDING' })).toBe(true);
    expect(isBookingHoldingRoom({ bookingStatus: 'CANCELLED', paymentStatus: 'PAID' })).toBe(false);
  });

  it('builds a Prisma filter that excludes pending received bookings', () => {
    expect(bookingHoldWhere()).toEqual({
      OR: [
        { bookingStatus: 'CONFIRMED' },
        {
          bookingStatus: 'RECEIVED',
          paymentStatus: { in: ['PAID', 'PAY_AT_PROPERTY'] },
        },
      ],
    });
  });
});
