import {
  addDaysToDateString,
  calculateNights,
  getDatesBetween,
  getTodayDateString,
  hasDateOverlap,
  isPastDate,
  isValidDateRange,
  normalizeDate,
} from './dateUtils.js';
import { getRoomCapacity } from './occupancy.js';

const holdingStatuses = ['received', 'confirmed'];

function message(messages, key, fallback, params = {}) {
  const template = messages?.[key] || fallback;
  return Object.entries(params).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), template);
}

export function isBlockingBooking(booking) {
  return holdingStatuses.includes(String(booking?.bookingStatus || 'received').toLowerCase());
}

export function isBlockingRoomPeriod(period) {
  return Boolean(period?.startDate && period?.endDate);
}

export function isRoomAvailable(roomId, checkIn, checkOut, bookings = [], room) {
  if (!isValidDateRange(checkIn, checkOut)) return false;
  if (room?.temporarilyUnavailable) return false;

  const requested = { checkIn, checkOut };
  const bookingConflict = bookings.some(
    (booking) =>
      booking.roomId === roomId &&
      isBlockingBooking(booking) &&
      hasDateOverlap(requested, { checkIn: booking.checkIn, checkOut: booking.checkOut }),
  );
  if (bookingConflict) return false;

  return !(room?.blockedDates || []).some(
    (period) =>
      isBlockingRoomPeriod(period) &&
      hasDateOverlap(requested, { checkIn: period.startDate, checkOut: period.endDate }),
  );
}

export function getUnavailableDatesForRoom(roomId, bookings = [], room) {
  const bookingDates = bookings
    .filter((booking) => booking.roomId === roomId && isBlockingBooking(booking))
    .flatMap((booking) => getDatesBetween(booking.checkIn, booking.checkOut));
  const blockedDates = (room?.blockedDates || []).flatMap((period) =>
    getDatesBetween(period.startDate, period.endDate),
  );
  return [...new Set([...bookingDates, ...blockedDates])].sort();
}

export function getAvailableRooms(rooms, checkIn, checkOut, guests = 1, bookings = []) {
  return rooms.filter(
    (room) =>
      room.status !== 'hidden' &&
      getRoomCapacity(room.maxGuests).maxTotal >= Number(guests || 1) &&
      isRoomAvailable(room.id, checkIn, checkOut, bookings, room),
  );
}

export function getRoomAvailabilityStatus(room, checkIn, checkOut, bookings = []) {
  if (!checkIn || !checkOut) return { available: false, status: 'dates_required' };
  if (!isValidDateRange(checkIn, checkOut)) return { available: false, status: 'invalid_dates' };
  if (room?.temporarilyUnavailable) return { available: false, status: 'temporarily_unavailable' };
  const available = isRoomAvailable(room.id, checkIn, checkOut, bookings, room);
  return { available, status: available ? 'available' : 'not_available' };
}

export function suggestAlternativeRooms(selectedRoom, rooms, checkIn, checkOut, guests = 1, bookings = []) {
  return getAvailableRooms(rooms, checkIn, checkOut, guests, bookings)
    .filter((room) => room.id !== selectedRoom?.id)
    .slice(0, 3);
}

export function validateBookingDates({ checkIn, checkOut, room, existingBookings = [], messages = {} }) {
  const errors = {};
  const today = getTodayDateString();
  const normalizedCheckIn = normalizeDate(checkIn);
  const normalizedCheckOut = normalizeDate(checkOut);
  const rules = {
    minNights: 1,
    maxNights: 30,
    allowSameDayBooking: true,
    advanceBookingDays: 365,
    ...(room?.availabilityRules || {}),
  };

  if (!normalizedCheckIn) {
    errors.checkIn = message(messages, 'checkInRequired', 'Please select your check-in date');
  } else if (isPastDate(normalizedCheckIn)) {
    errors.checkIn = message(messages, 'checkInPast', 'Check-in date cannot be in the past');
  } else if (!rules.allowSameDayBooking && normalizedCheckIn === today) {
    errors.checkIn = message(messages, 'checkInPast', 'Check-in date cannot be in the past');
  } else if (rules.advanceBookingDays) {
    const maxAdvance = addDaysToDateString(today, Number(rules.advanceBookingDays));
    if (normalizedCheckIn > maxAdvance) {
      errors.checkIn = message(
        messages,
        'advanceBooking',
        'Bookings are only available up to {n} day(s) in advance',
        { n: rules.advanceBookingDays },
      );
    }
  }

  if (!normalizedCheckOut) {
    errors.checkOut = message(messages, 'checkOutRequired', 'Please select your check-out date');
  } else if (normalizedCheckIn && !isValidDateRange(normalizedCheckIn, normalizedCheckOut)) {
    errors.checkOut = message(messages, 'checkoutAfterCheckin', 'Check-out date must be after check-in date');
  }

  const nights = calculateNights(normalizedCheckIn, normalizedCheckOut);
  if (!errors.checkOut && nights < Number(rules.minNights || 1)) {
    errors.checkOut = message(messages, 'minNights', 'Minimum stay is {n} night(s)', { n: rules.minNights });
  }
  if (!errors.checkOut && nights > Number(rules.maxNights || 30)) {
    errors.checkOut = message(messages, 'maxNights', 'Maximum stay is {n} night(s)', { n: rules.maxNights });
  }
  if (
    !errors.checkIn &&
    !errors.checkOut &&
    room &&
    !isRoomAvailable(room.id, normalizedCheckIn, normalizedCheckOut, existingBookings, room)
  ) {
    errors.availability = message(
      messages,
      'notAvailable',
      'This room is not available for selected dates',
    );
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    nights,
  };
}
