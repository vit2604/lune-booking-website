import { describe, expect, it } from 'vitest';
import { buildBookingDraft } from './booking.js';

const apiPricedRoom = {
  id: 'one-bedroom-condo',
  name: 'One Bedroom Condo',
  image: '/room.jpg',
  maxGuests: 2,
  type: 'Apartment',
  price: 715000,
  priceSummary: {
    checkIn: '2026-12-01',
    checkOut: '2026-12-03',
    guests: 2,
    nights: 2,
    pricePerNight: 852500,
    subtotal: 1705000,
    serviceFee: 0,
    totalPrice: 1705000,
    nightlyRates: [
      { date: '2026-12-01', price: 715000 },
      { date: '2026-12-02', price: 990000 },
    ],
    source: 'bluejay',
  },
};

describe('booking draft pricing', () => {
  it('uses the API subtotal instead of multiplying the first night across the stay', () => {
    const draft = buildBookingDraft({
      room: apiPricedRoom,
      checkIn: '2026-12-01',
      checkOut: '2026-12-03',
      guests: 2,
    });

    expect(draft.nights).toBe(2);
    expect(draft.pricePerNight).toBe(852500);
    expect(draft.roomSubtotal).toBe(1705000);
    expect(draft.totalPrice).toBe(1705000);
    expect(draft.nightlyRates).toHaveLength(2);
  });

  it('ignores stale API pricing when the stay dates no longer match', () => {
    const draft = buildBookingDraft({
      room: apiPricedRoom,
      checkIn: '2026-12-03',
      checkOut: '2026-12-05',
      guests: 2,
    });

    expect(draft.priceSummary).toBeNull();
    expect(draft.roomSubtotal).toBe(1430000);
  });
});
