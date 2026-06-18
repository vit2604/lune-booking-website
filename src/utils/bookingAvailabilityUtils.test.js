import { describe, expect, it } from 'vitest';
import {
  getAvailableRooms,
  getRoomAvailabilityStatus,
  isRoomAvailable,
  validateBookingDates,
} from './bookingAvailabilityUtils.js';

const availableRoom = {
  id: 'room-a',
  status: 'active',
  maxGuests: 2,
  availabilityRules: {
    minNights: 1,
    maxNights: 30,
    allowSameDayBooking: true,
    advanceBookingDays: 365,
  },
  blockedDates: [],
};

describe('booking availability utilities', () => {
  it('blocks received and confirmed bookings but ignores cancelled bookings', () => {
    const bookings = [
      { roomId: 'room-a', checkIn: '2026-05-15', checkOut: '2026-05-17', bookingStatus: 'received' },
      { roomId: 'room-a', checkIn: '2026-06-01', checkOut: '2026-06-03', bookingStatus: 'cancelled' },
    ];

    expect(isRoomAvailable('room-a', '2026-05-16', '2026-05-18', bookings, availableRoom)).toBe(false);
    expect(isRoomAvailable('room-a', '2026-05-17', '2026-05-18', bookings, availableRoom)).toBe(true);
    expect(isRoomAvailable('room-a', '2026-06-01', '2026-06-02', bookings, availableRoom)).toBe(true);
  });

  it('blocks manual room maintenance periods', () => {
    const room = {
      ...availableRoom,
      blockedDates: [{ startDate: '2026-07-10', endDate: '2026-07-12', reason: 'Maintenance' }],
    };

    expect(isRoomAvailable(room.id, '2026-07-09', '2026-07-10', [], room)).toBe(true);
    expect(isRoomAvailable(room.id, '2026-07-10', '2026-07-11', [], room)).toBe(false);
  });

  it('filters available rooms by visibility, capacity, and date availability', () => {
    const rooms = [
      availableRoom,
      { ...availableRoom, id: 'room-b', maxGuests: 4 },
      { ...availableRoom, id: 'room-c', status: 'hidden', maxGuests: 4 },
    ];
    const bookings = [{ roomId: 'room-a', checkIn: '2026-08-01', checkOut: '2026-08-03', bookingStatus: 'confirmed' }];

    expect(getAvailableRooms(rooms, '2026-08-01', '2026-08-02', 3, bookings).map((room) => room.id)).toEqual([
      'room-b',
    ]);
  });

  it('returns actionable validation errors for invalid stay rules', () => {
    const result = validateBookingDates({
      checkIn: '2026-09-01',
      checkOut: '2026-09-01',
      room: availableRoom,
      existingBookings: [],
    });

    expect(result.ok).toBe(false);
    expect(result.errors.checkOut).toBe('Check-out date must be after check-in date');
  });

  it('returns status objects that the UI can render defensively', () => {
    expect(getRoomAvailabilityStatus(availableRoom, '', '', [])).toEqual({
      available: false,
      status: 'dates_required',
    });
  });
});
