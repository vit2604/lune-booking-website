import { bookingStatusesHoldingRoom } from '../constants/bookingStatus.js';
import { prisma } from '../config/prisma.js';
import { checkBluejayRoomAvailability } from '../modules/bluejay/bluejay.service.js';
import { calculateNights, hasDateOverlap, toHotelDate, validateDateRange } from './dateUtils.js';

export { calculateNights, hasDateOverlap, validateDateRange };

export async function checkExistingBookings(roomId, checkIn, checkOut) {
  const bookings = await prisma.booking.findMany({
    where: {
      roomId,
      bookingStatus: { in: bookingStatusesHoldingRoom },
    },
    select: { bookingCode: true, checkIn: true, checkOut: true },
  });
  return bookings.find((booking) => hasDateOverlap({ checkIn, checkOut }, booking)) || null;
}

export async function checkBlockedDates(roomId, checkIn, checkOut) {
  const blockedDates = await prisma.roomBlockedDate.findMany({
    where: { roomId },
  });
  return blockedDates.find((period) => hasDateOverlap({ checkIn, checkOut }, period)) || null;
}

export async function isRoomAvailable(roomId, checkIn, checkOut, guests = 1) {
  const bookingConflict = await checkExistingBookings(roomId, checkIn, checkOut);
  if (bookingConflict) return { available: false, reason: 'Room already has a booking for selected dates' };
  const blockedPeriod = await checkBlockedDates(roomId, checkIn, checkOut);
  if (blockedPeriod) return { available: false, reason: blockedPeriod.reason || 'Room is blocked for selected dates' };
  const bluejayAvailability = await checkBluejayRoomAvailability({ roomId, checkIn, checkOut, guests });
  if (bluejayAvailability.checked && !bluejayAvailability.available) {
    return {
      available: false,
      reason: bluejayAvailability.reason || 'Bluejay reports this room is not available',
      externalSource: 'bluejay',
    };
  }
  return {
    available: true,
    reason: '',
    externalSource: bluejayAvailability.checked ? 'bluejay' : 'local',
  };
}

export async function getAvailableRooms({ checkIn, checkOut, guests }) {
  const rooms = await prisma.room.findMany({
    where: {
      status: 'ACTIVE',
      maxGuests: guests ? { gte: Number(guests) } : undefined,
    },
    include: { bookings: true, blockedDates: true },
  });

  const locallyAvailableRooms = rooms.filter((room) => {
    const bookingConflict = room.bookings.some(
      (booking) =>
        bookingStatusesHoldingRoom.includes(booking.bookingStatus) &&
        hasDateOverlap({ checkIn, checkOut }, booking),
    );
    const blockedConflict = room.blockedDates.some((period) => hasDateOverlap({ checkIn, checkOut }, period));
    return !bookingConflict && !blockedConflict;
  });

  const externalChecks = await Promise.all(
    locallyAvailableRooms.map(async (room) => ({
      room,
      check: await checkBluejayRoomAvailability({ roomId: room.id, checkIn, checkOut, guests }),
    })),
  );

  return externalChecks.filter(({ check }) => !check.checked || check.available).map(({ room }) => room);
}

export async function assertRoomCanBeBooked(room, checkIn, checkOut, guests) {
  if (!room || room.status !== 'ACTIVE') {
    return { ok: false, statusCode: 404, message: 'Room is not available for booking' };
  }
  const range = validateDateRange(checkIn, checkOut);
  if (!range.ok) return { ok: false, statusCode: 400, message: range.message };
  if (Number(guests || 1) > Number(room.maxGuests || 1)) {
    return { ok: false, statusCode: 400, message: `This room allows up to ${room.maxGuests} guests` };
  }
  if (range.nights < room.minNights) {
    return { ok: false, statusCode: 400, message: `Minimum stay is ${room.minNights} night(s)` };
  }
  if (range.nights > room.maxNights) {
    return { ok: false, statusCode: 400, message: `Maximum stay is ${room.maxNights} night(s)` };
  }
  const availability = await isRoomAvailable(room.id, toHotelDate(checkIn), toHotelDate(checkOut), guests);
  if (!availability.available) {
    return { ok: false, statusCode: 409, message: availability.reason || 'This room is not available' };
  }
  return { ok: true, nights: range.nights };
}
