import { Prisma } from '@prisma/client';
import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import {
  confirmBluejayBooking,
  createBluejayBooking,
  getBluejayStayAvailability,
  isBluejayBookingCreateEnabled,
} from '../bluejay/bluejay.service.js';
import { assertRoomCanBeBooked } from '../../utils/availabilityUtils.js';
import {
  aggregateBookingRoomPrices,
  normalizeBookingRoomSelections,
  scaleRoomPrice,
} from '../../utils/bookingRoomUtils.js';
import { createUniqueBookingCode } from '../../utils/bookingCodeUtils.js';
import { toHotelDate } from '../../utils/dateUtils.js';
import { calculateTotalPrice } from '../../utils/priceUtils.js';
import { createHttpError } from '../../utils/responseUtils.js';
import { cleanText } from '../../utils/sanitizeUtils.js';
import { assertPhoneVerification, consumePhoneVerification } from '../phone-verifications/phoneVerification.service.js';

const bookingInclude = {
  room: { include: { images: true, ratePeriods: true } },
  roomItems: {
    include: { room: { include: { images: true, ratePeriods: true } } },
    orderBy: { createdAt: 'asc' },
  },
  guest: true,
  payments: true,
};

function bookingRoomItems(booking) {
  if (booking.roomItems?.length) return booking.roomItems;
  return [{
    roomId: booking.roomId,
    room: booking.room,
    quantity: 1,
    guests: booking.guests,
    adults: booking.adults,
    children: booking.children,
    pricePerNight: booking.pricePerNight,
    subtotal: booking.subtotal,
    discountAmount: booking.discountAmount,
    serviceFee: booking.serviceFee,
    taxAmount: booking.taxAmount,
    totalPrice: booking.totalPrice,
    currency: booking.currency,
  }];
}

function publicRoomItem(item) {
  const room = item.room || {};
  return {
    roomId: item.roomId,
    roomName: room.name || '',
    roomImage: room.images?.find((image) => image.isMain)?.url || room.images?.[0]?.url || '',
    quantity: Number(item.quantity || 1),
    guests: Number(item.guests || 1),
    adults: Number(item.adults || item.guests || 1),
    children: Number(item.children || 0),
    pricePerNight: Number(item.pricePerNight || 0),
    subtotal: Number(item.subtotal || 0),
    discountAmount: Number(item.discountAmount || 0),
    serviceFee: Number(item.serviceFee || 0),
    taxAmount: Number(item.taxAmount || 0),
    totalPrice: Number(item.totalPrice || 0),
    currency: item.currency || 'VND',
  };
}

function publicRooms(booking) {
  return bookingRoomItems(booking).map(publicRoomItem);
}

function publicBookingSummary(booking) {
  const rooms = publicRooms(booking);
  return {
    bookingCode: booking.bookingCode,
    roomId: booking.roomId,
    roomName: booking.room?.name,
    roomImage: booking.room?.images?.find((image) => image.isMain)?.url || booking.room?.images?.[0]?.url || '',
    rooms,
    totalRooms: rooms.reduce((sum, item) => sum + item.quantity, 0),
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    nights: booking.nights,
    guests: booking.guests,
    adults: booking.adults,
    children: booking.children,
    pricePerNight: booking.pricePerNight,
    subtotal: booking.subtotal,
    discountAmount: booking.discountAmount,
    serviceFee: booking.serviceFee,
    taxAmount: booking.taxAmount,
    totalPrice: booking.totalPrice,
    total: booking.totalPrice,
    currency: booking.currency,
    bookingStatus: booking.bookingStatus,
    paymentStatus: booking.paymentStatus,
    paymentMethod: booking.paymentMethod,
    idempotencyKey: booking.idempotencyKey || undefined,
    bluejaySyncStatus: booking.bluejaySyncStatus,
    bluejayBookingCode: booking.bluejayBookingCode || undefined,
    guest: {
      fullName: booking.guest?.fullName,
      email: booking.guest?.email,
      phoneCode: booking.guest?.phoneCode,
      phoneNumber: booking.guest?.phoneNumber,
      country: booking.guest?.country,
    },
    createdAt: booking.createdAt,
  };
}

// Public lookup projection: booking codes are unguessable capability tokens,
// but this endpoint is unauthenticated, so it must never echo guest PII
// (name/email/phone/country). Callers only need status + stay/price details.
function publicBookingLookup(booking) {
  const rooms = publicRooms(booking);
  return {
    bookingCode: booking.bookingCode,
    roomId: booking.roomId,
    roomName: booking.room?.name,
    roomImage: booking.room?.images?.find((image) => image.isMain)?.url || booking.room?.images?.[0]?.url || '',
    rooms,
    totalRooms: rooms.reduce((sum, item) => sum + item.quantity, 0),
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    nights: booking.nights,
    guests: booking.guests,
    adults: booking.adults,
    children: booking.children,
    pricePerNight: booking.pricePerNight,
    subtotal: booking.subtotal,
    discountAmount: booking.discountAmount,
    serviceFee: booking.serviceFee,
    taxAmount: booking.taxAmount,
    totalPrice: booking.totalPrice,
    total: booking.totalPrice,
    currency: booking.currency,
    bookingStatus: booking.bookingStatus,
    paymentStatus: booking.paymentStatus,
    paymentMethod: booking.paymentMethod,
    createdAt: booking.createdAt,
  };
}

function normalizeSyncError(error) {
  return String(error?.message || 'Bluejay booking sync failed').slice(0, 1000);
}

function canSyncBookingToBluejay(booking) {
  if (!booking || booking.bookingStatus === 'CANCELLED') return false;
  if (booking.paymentStatus === 'PAID') return true;
  return (
    booking.paymentStatus === 'PAY_AT_PROPERTY' &&
    ['payAtProperty', 'cashAtProperty', 'creditCard'].includes(booking.paymentMethod)
  );
}

function normalizeGuestBreakdown(input) {
  const childGuests = Math.max(0, Number(input.children || 0));
  const totalGuests = Math.max(1, Number(input.guests || 1));
  const adultGuests = Math.max(1, Number(input.adults || totalGuests - childGuests || 1));
  return {
    adults: adultGuests,
    children: childGuests,
    guests: adultGuests + childGuests,
  };
}

export async function syncBookingToBluejay(booking, { forceConfirm = false } = {}) {
  if (!isBluejayBookingCreateEnabled()) return booking;
  if (booking?.bookingStatus === 'CANCELLED') return booking;
  if (!forceConfirm && !canSyncBookingToBluejay(booking)) return booking;
  if (booking.bluejaySyncStatus === 'SYNCED' && booking.bookingStatus === 'CONFIRMED' && !forceConfirm) {
    return booking;
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      bluejaySyncStatus: 'PENDING',
      bluejaySyncError: null,
    },
  });

  try {
    let currentBooking = booking;
    let createdBluejayBooking = null;
    if (!currentBooking.bluejayBookingCode) {
      const result = await createBluejayBooking({ booking: currentBooking });
      if (result.skipped) {
        return prisma.booking.findUnique({ where: { id: booking.id }, include: bookingInclude });
      }
      if (!result.payload.code) {
        throw createHttpError(502, 'Bluejay created the booking without returning a booking code');
      }
      currentBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          bluejayBookingId: result.payload.id,
          bluejayBookingCode: result.payload.code,
          bluejaySyncStatus: 'PENDING',
        },
        include: bookingInclude,
      });
      createdBluejayBooking = result.payload;
    }

    if (String(createdBluejayBooking?.status || '').toLowerCase() !== 'confirm') {
      await confirmBluejayBooking({ booking: currentBooking });
    }
    return prisma.booking.update({
      where: { id: booking.id },
      data: {
        bookingStatus: 'CONFIRMED',
        bluejaySyncStatus: 'SYNCED',
        bluejaySyncError: null,
        bluejaySyncedAt: new Date(),
      },
      include: bookingInclude,
    });
  } catch (error) {
    const message = normalizeSyncError(error);
    await prisma.booking
      .update({
        where: { id: booking.id },
        data: {
          bluejaySyncStatus: 'FAILED',
          bluejaySyncError: message,
        },
      })
      .catch(() => null);

    if (env.BLUEJAY_FAIL_CLOSED) {
      const statusCode = error?.statusCode && error.statusCode >= 400 && error.statusCode < 500 ? error.statusCode : 502;
      throw createHttpError(statusCode, `Could not sync booking to Bluejay PMS: ${message}`);
    }

    return prisma.booking.findUnique({ where: { id: booking.id }, include: bookingInclude });
  }
}

export async function createBooking(input) {
  const roomSelections = normalizeBookingRoomSelections(input);
  const uniqueRoomIds = [...new Set(roomSelections.map((item) => item.roomId))];
  const requestedQuantityByRoomId = roomSelections.reduce((quantities, item) => {
    quantities.set(item.roomId, (quantities.get(item.roomId) || 0) + item.quantity);
    return quantities;
  }, new Map());
  if (!roomSelections.length || roomSelections.some((item) => !item.roomId)) {
    throw createHttpError(400, 'At least one room is required');
  }
  input = {
    ...input,
    roomId: roomSelections[0].roomId,
    rooms: roomSelections,
  };

  if (input.idempotencyKey) {
    const existing = await prisma.booking.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: bookingInclude,
    });
    if (existing) return publicBookingSummary(existing);
  }

  const phoneVerification = await assertPhoneVerification({
    phoneCode: input.guest?.phoneCode,
    phoneNumber: input.guest?.phoneNumber,
    phoneVerificationToken: input.phoneVerificationToken,
  });

  const rooms = await prisma.room.findMany({
    where: { id: { in: uniqueRoomIds } },
    include: { ratePeriods: true },
  });
  if (rooms.length !== uniqueRoomIds.length) throw createHttpError(404, 'One or more rooms were not found');
  const roomById = new Map(rooms.map((room) => [room.id, room]));
  const externalAvailability = new Map();

  await Promise.all(roomSelections.map(async (selection) => {
    const room = roomById.get(selection.roomId);
    const externalStay = await getBluejayStayAvailability({
      roomIds: [room.id],
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      guests: selection.guests,
      adults: selection.adults,
      children: selection.children,
    });
    const externalRoom = externalStay.rooms?.[room.id] || null;
    if (externalRoom?.checked && !externalRoom.available) {
      throw createHttpError(409, externalRoom.reason || `${room.name} is not available`);
    }
    const availability = await assertRoomCanBeBooked(
      room,
      input.checkIn,
      input.checkOut,
      selection.guests,
      {
        checkExternal: false,
        adults: selection.adults,
        children: selection.children,
        requestedQuantity: requestedQuantityByRoomId.get(selection.roomId),
        localInventoryLimit: externalRoom?.checked ? externalRoom.inventory : undefined,
      },
    );
    if (!availability.ok) throw createHttpError(availability.statusCode, availability.message);
    externalAvailability.set(selection, externalRoom);
  }));

  const bookingCode = await createUniqueBookingCode(prisma);
  const paymentStatus =
    input.paymentMethod === 'payAtProperty' || input.paymentMethod === 'cashAtProperty'
      ? 'PAY_AT_PROPERTY'
      : 'PENDING';

  const booking = await prisma.$transaction(async (tx) => {
    const sortedRoomIds = [...uniqueRoomIds].sort();
    await tx.$queryRaw(
      Prisma.sql`SELECT id FROM "Room" WHERE id IN (${Prisma.join(sortedRoomIds)}) ORDER BY id FOR UPDATE`,
    );
    const lockedRooms = await tx.room.findMany({
      where: { id: { in: sortedRoomIds } },
      include: { ratePeriods: true },
    });
    const lockedRoomById = new Map(lockedRooms.map((room) => [room.id, room]));

    const existingIdempotentBooking = input.idempotencyKey
      ? await tx.booking.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
          include: bookingInclude,
        })
      : null;
    if (existingIdempotentBooking) return existingIdempotentBooking;

    const pricedRoomItems = [];
    for (const selection of roomSelections) {
      const lockedRoom = lockedRoomById.get(selection.roomId);
      const externalRoom = externalAvailability.get(selection);
      const lockedAvailability = await assertRoomCanBeBooked(
        lockedRoom,
        input.checkIn,
        input.checkOut,
        selection.guests,
        {
          db: tx,
          checkExternal: false,
          adults: selection.adults,
          children: selection.children,
          requestedQuantity: requestedQuantityByRoomId.get(selection.roomId),
          localInventoryLimit: externalRoom?.checked ? externalRoom.inventory : undefined,
        },
      );
      if (!lockedAvailability.ok) {
        throw createHttpError(lockedAvailability.statusCode, lockedAvailability.message);
      }

      const unitPrice = externalRoom?.priceSummary || calculateTotalPrice({
        room: lockedRoom,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
      });
      pricedRoomItems.push({
        ...selection,
        ...scaleRoomPrice(unitPrice, selection.quantity),
        nights: unitPrice.nights,
        currency: unitPrice.currency || 'VND',
      });
    }
    const price = aggregateBookingRoomPrices(pricedRoomItems);

    const guest = await tx.guest.create({
      data: {
        fullName: cleanText(input.guest.fullName, 120),
        email: cleanText(input.guest.email, 160) || null,
        phoneCode: cleanText(input.guest.phoneCode, 12),
        phoneNumber: cleanText(input.guest.phoneNumber, 40),
        country: cleanText(input.guest.country, 80),
        nationality: cleanText(input.guest.nationality, 80) || null,
      },
    });

    const created = await tx.booking.create({
      data: {
        bookingCode,
        idempotencyKey: input.idempotencyKey || null,
        roomId: roomSelections[0].roomId,
        guestId: guest.id,
        checkIn: toHotelDate(input.checkIn),
        checkOut: toHotelDate(input.checkOut),
        nights: price.nights,
        guests: price.guests,
        adults: price.adults,
        children: price.children,
        pricePerNight: price.pricePerNight,
        subtotal: price.subtotal,
        discountAmount: price.discountAmount,
        serviceFee: price.serviceFee,
        taxAmount: price.taxAmount,
        totalPrice: price.totalPrice,
        currency: 'VND',
        specialRequest: cleanText(input.specialRequest, 1000) || null,
        arrivalTime: cleanText(input.arrivalTime, 40) || null,
        bookingStatus: 'RECEIVED',
        paymentStatus,
        paymentMethod: input.paymentMethod || null,
      },
      include: bookingInclude,
    });

    await tx.bookingRoom.createMany({
      data: pricedRoomItems.map((item) => ({
        bookingId: created.id,
        roomId: item.roomId,
        quantity: item.quantity,
        guests: item.guests,
        adults: item.adults,
        children: item.children,
        pricePerNight: item.pricePerNight,
        subtotal: item.subtotal,
        discountAmount: item.discountAmount,
        serviceFee: item.serviceFee,
        taxAmount: item.taxAmount,
        totalPrice: item.totalPrice,
        currency: item.currency,
      })),
    });

    if (input.paymentMethod) {
      await tx.payment.create({
        data: {
          bookingId: created.id,
          method: input.paymentMethod,
          amount: price.totalPrice,
          currency: 'VND',
          status: paymentStatus,
        },
      });
    }

    return tx.booking.findUnique({ where: { id: created.id }, include: bookingInclude });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  await consumePhoneVerification(phoneVerification);

  return publicBookingSummary(booking);
}

export async function getPublicBooking(bookingCode) {
  const booking = await prisma.booking.findUnique({ where: { bookingCode }, include: bookingInclude });
  if (!booking) throw createHttpError(404, 'Booking not found');
  return publicBookingLookup(booking);
}

export async function listAdminBookings(query) {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  const where = {
    bookingStatus: query.status || undefined,
    paymentStatus: query.paymentStatus || undefined,
    checkIn:
      query.checkInFrom || query.checkInTo
        ? {
            gte: query.checkInFrom ? toHotelDate(query.checkInFrom) : undefined,
            lte: query.checkInTo ? toHotelDate(query.checkInTo) : undefined,
          }
        : undefined,
    OR: query.search
      ? [
          { bookingCode: { contains: query.search, mode: 'insensitive' } },
          { guest: { fullName: { contains: query.search, mode: 'insensitive' } } },
          { guest: { phoneNumber: { contains: query.search, mode: 'insensitive' } } },
          { guest: { email: { contains: query.search, mode: 'insensitive' } } },
        ]
      : undefined,
  };

  const [items, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function getAdminBooking(bookingCode) {
  const booking = await prisma.booking.findUnique({ where: { bookingCode }, include: bookingInclude });
  if (!booking) throw createHttpError(404, 'Booking not found');
  return booking;
}

export async function updateBookingStatus(bookingCode, bookingStatus) {
  if (bookingStatus === 'CONFIRMED' && isBluejayBookingCreateEnabled()) {
    const booking = await prisma.booking.findUnique({ where: { bookingCode }, include: bookingInclude });
    if (!booking) throw createHttpError(404, 'Booking not found');
    return syncBookingToBluejay(booking, { forceConfirm: true });
  }
  return prisma.booking.update({ where: { bookingCode }, data: { bookingStatus }, include: bookingInclude });
}

export async function updatePaymentStatus(bookingCode, paymentStatus) {
  const booking = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.update({ where: { bookingCode }, data: { paymentStatus }, include: bookingInclude });
    await tx.payment.updateMany({
      where: { bookingId: booking.id },
      data: {
        status: paymentStatus,
        paidAt: paymentStatus === 'PAID' ? new Date() : null,
      },
    });
    return tx.booking.findUnique({ where: { bookingCode }, include: bookingInclude });
  });
  return syncBookingToBluejay(booking);
}

export async function updateInternalNote(bookingCode, internalNote) {
  return prisma.booking.update({ where: { bookingCode }, data: { internalNote }, include: bookingInclude });
}

export async function deleteBooking(bookingCode) {
  const booking = await prisma.booking.findUnique({ where: { bookingCode }, include: bookingInclude });
  if (!booking) throw createHttpError(404, 'Booking not found');
  if (
    booking.bluejaySyncStatus === 'SYNCED' &&
    booking.bluejayBookingCode &&
    booking.bookingStatus !== 'CANCELLED'
  ) {
    throw createHttpError(
      409,
      `Cancel Bluejay booking ${booking.bluejayBookingCode} in Bluejay PMS first. The connected Bluejay API does not provide a cancellation endpoint.`,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.delete({ where: { bookingCode } });
    const remainingGuestBookings = await tx.booking.count({ where: { guestId: booking.guestId } });
    if (remainingGuestBookings === 0) {
      await tx.guest.delete({ where: { id: booking.guestId } });
    }
  });

  return { bookingCode, deleted: true };
}
