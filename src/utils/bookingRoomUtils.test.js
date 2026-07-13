import { describe, expect, it } from 'vitest';
import {
  aggregateBookingRoomPrices,
  getTotalRoomQuantity,
  normalizeBookingRoomSelections,
  scaleRoomPrice,
} from '../../server/src/utils/bookingRoomUtils.js';
import { createBookingSchema } from '../../server/src/modules/bookings/booking.validation.js';

describe('server multi-room booking helpers', () => {
  it('normalizes mixed room types and counts their quantities', () => {
    const rooms = normalizeBookingRoomSelections({
      rooms: [
        { roomId: 'room-a', quantity: 2, adults: 2, children: 0 },
        { roomId: 'room-b', quantity: 1, adults: 1, children: 1 },
      ],
    });

    expect(rooms).toEqual([
      { roomId: 'room-a', quantity: 2, adults: 2, children: 0, guests: 2 },
      { roomId: 'room-b', quantity: 1, adults: 1, children: 1, guests: 2 },
    ]);
    expect(getTotalRoomQuantity(rooms)).toBe(3);
  });

  it('preserves separate occupancy for repeated room types', () => {
    const rooms = normalizeBookingRoomSelections({
      rooms: [
        { roomId: 'room-a', quantity: 1, adults: 2, children: 1 },
        { roomId: 'room-a', quantity: 1, adults: 1, children: 0 },
      ],
    });

    expect(rooms).toEqual([
      { roomId: 'room-a', quantity: 1, adults: 2, children: 1, guests: 3 },
      { roomId: 'room-a', quantity: 1, adults: 1, children: 0, guests: 1 },
    ]);
    expect(getTotalRoomQuantity(rooms)).toBe(2);
  });

  it('accepts repeated room types with independent occupancy', () => {
    const result = createBookingSchema.safeParse({
      body: {
        rooms: [
          { roomId: 'room-a', quantity: 1, guests: 3, adults: 2, children: 1 },
          { roomId: 'room-a', quantity: 1, guests: 1, adults: 1, children: 0 },
        ],
        checkIn: '2026-12-01',
        checkOut: '2026-12-03',
        guests: 4,
        adults: 3,
        children: 1,
        guest: {
          fullName: 'Test Guest',
          email: 'test@example.com',
          phoneCode: '+84',
          phoneNumber: '0900000000',
          country: 'Vietnam',
        },
      },
      query: {},
      params: {},
    });

    expect(result.success).toBe(true);
  });

  it('scales each room line and aggregates booking totals', () => {
    const first = {
      ...scaleRoomPrice({
        nights: 2,
        pricePerNight: 750000,
        subtotal: 1500000,
        serviceFee: 0,
        taxAmount: 0,
        totalPrice: 1500000,
      }, 2),
      adults: 2,
      children: 0,
      guests: 2,
    };
    const second = {
      ...scaleRoomPrice({
        nights: 2,
        pricePerNight: 500000,
        subtotal: 1000000,
        serviceFee: 0,
        taxAmount: 0,
        totalPrice: 1000000,
      }, 1),
      adults: 1,
      children: 1,
      guests: 2,
    };

    expect(aggregateBookingRoomPrices([first, second])).toMatchObject({
      nights: 2,
      guests: 6,
      adults: 5,
      children: 1,
      pricePerNight: 2000000,
      subtotal: 4000000,
      totalPrice: 4000000,
    });
  });
});
