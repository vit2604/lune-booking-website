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

const secondApiPricedRoom = {
  id: 'studio-balcony',
  name: 'Studio with Balcony',
  image: '/studio.jpg',
  maxGuests: 3,
  type: 'Studio',
  price: 500000,
  priceSummary: {
    checkIn: '2026-12-01',
    checkOut: '2026-12-03',
    guests: 2,
    adults: 1,
    children: 1,
    nights: 2,
    pricePerNight: 500000,
    subtotal: 1000000,
    serviceFee: 0,
    totalPrice: 1000000,
    nightlyRates: [
      { date: '2026-12-01', price: 500000 },
      { date: '2026-12-02', price: 500000 },
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

  it('combines quantities and pricing across different room types', () => {
    const draft = buildBookingDraft({
      roomItems: [
        { room: apiPricedRoom, quantity: 2, adults: 2, children: 0 },
        { room: secondApiPricedRoom, quantity: 1, adults: 1, children: 1 },
      ],
      checkIn: '2026-12-01',
      checkOut: '2026-12-03',
    });

    expect(draft.rooms).toHaveLength(2);
    expect(draft.totalRooms).toBe(3);
    expect(draft.adults).toBe(5);
    expect(draft.children).toBe(1);
    expect(draft.guests).toBe(6);
    expect(draft.pricePerNight).toBe(2205000);
    expect(draft.roomSubtotal).toBe(4410000);
    expect(draft.totalPrice).toBe(4410000);
    expect(draft.rooms[0].quantity).toBe(2);
    expect(draft.rooms[0].totalPrice).toBe(3410000);
    expect(draft.rooms[1].quantity).toBe(1);
    expect(draft.rooms[1].totalPrice).toBe(1000000);
  });

  it('keeps occupancy independent for two rooms of the same type', () => {
    const roomWithoutApiPrice = { ...apiPricedRoom, priceSummary: null };
    const draft = buildBookingDraft({
      roomItems: [
        { room: roomWithoutApiPrice, adults: 2, children: 1 },
        { room: roomWithoutApiPrice, adults: 1, children: 0 },
      ],
      checkIn: '2026-12-01',
      checkOut: '2026-12-03',
    });

    expect(draft.rooms).toHaveLength(2);
    expect(draft.rooms.map(({ adults, children }) => ({ adults, children }))).toEqual([
      { adults: 2, children: 1 },
      { adults: 1, children: 0 },
    ]);
    expect(draft.adults).toBe(3);
    expect(draft.children).toBe(1);
    expect(draft.guests).toBe(4);
  });
});
