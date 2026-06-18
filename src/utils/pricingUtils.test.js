import { describe, expect, it } from 'vitest';
import {
  calculateBaseRoomPrice,
  calculateLongStayDiscount,
  calculateServiceFee,
  calculateTax,
  calculateTotalPrice,
  formatVND,
} from './pricingUtils.js';

const room = {
  price: 1000000,
  pricingRules: {
    basePrice: 1000000,
    longStayDiscount: {
      enabled: true,
      minNights: 7,
      discountPercent: 5,
    },
    serviceFeePercent: 2,
    taxPercent: 8,
  },
};

describe('pricing utilities', () => {
  it('formats VND values consistently for guest-facing UI', () => {
    expect(formatVND(990000)).toBe('990,000 VND');
    expect(formatVND(-100)).toBe('0 VND');
  });

  it('calculates base price from nightly rate and nights', () => {
    expect(calculateBaseRoomPrice(room, 3)).toBe(3000000);
  });

  it('applies long-stay discount only after the configured threshold', () => {
    expect(calculateLongStayDiscount(room, 6)).toBe(0);
    expect(calculateLongStayDiscount(room, 7)).toBe(350000);
  });

  it('calculates service fee and tax from discounted subtotal', () => {
    expect(calculateServiceFee(6650000, room)).toBe(133000);
    expect(calculateTax(6650000, room)).toBe(532000);
  });

  it('returns a complete price summary for booking summary and backend parity', () => {
    expect(
      calculateTotalPrice({
        room,
        checkIn: '2026-05-01',
        checkOut: '2026-05-08',
      }),
    ).toEqual({
      nights: 7,
      pricePerNight: 1000000,
      roomSubtotal: 7000000,
      longStayDiscount: 350000,
      serviceFee: 133000,
      tax: 532000,
      total: 7315000,
    });
  });
});
