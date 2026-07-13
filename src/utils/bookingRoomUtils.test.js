import { describe, expect, it } from 'vitest';
import {
  aggregateBookingRoomPrices,
  getTotalRoomQuantity,
  normalizeBookingRoomSelections,
  scaleRoomPrice,
} from '../../server/src/utils/bookingRoomUtils.js';

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
