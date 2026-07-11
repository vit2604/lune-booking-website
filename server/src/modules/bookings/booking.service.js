import { Prisma } from '@prisma/client';
import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { createBluejayBooking, getBluejayStayAvailability, isBluejayBookingCreateEnabled } from '../bluejay/bluejay.service.js';
import { assertRoomCanBeBooked } from '../../utils/availabilityUtils.js';
import { createUniqueBookingCode } from '../../utils/bookingCodeUtils.js';
import { toHotelDate } from '../../utils/dateUtils.js';
import { calculateTotalPrice } from '../../utils/priceUtils.js';
import { createHttpError } from '../../utils/responseUtils.js';
import { cleanText } from '../../utils/sanitizeUtils.js';
import { assertPhoneVerification, consumePhoneVerification } from '../phone-verifications/phoneVerification.service.js';

const bookingInclude = {
  room: { include: { images: true, ratePeriods: true } },
  guest: true,
  payments: true,
};

function publicBookingSummary(booking) {
  return {
    bookingCode: booking.bookingCode,
    roomId: booking.roomId,
    roomName: booking.room?.name,
    roomImage: booking.room?.images?.find((image) => image.isMain)?.url || booking.room?.images?.[0]?.url || '',
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    nights: booking.nights,
    guests: booking.guests,
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
  return {
    bookingCode: booking.bookingCode,
    roomId: booking.roomId,
    roomName: booking.room?.name,
    roomImage: booking.room?.images?.find((image) => image.isMain)?.url || booking.room?.images?.[0]?.url || '',
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    nights: booking.nights,
    guests: booking.guests,
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
  return booking?.bookingStatus !== 'CANCELLED' && booking?.paymentStatus === 'PAID';
}

export async function syncBookingToBluejay(booking) {
  if (!isBluejayBookingCreateEnabled()) return booking;
  if (booking.bluejaySyncStatus === 'SYNCED') return booking;
  if (!canSyncBookingToBluejay(booking)) return booking;

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      bluejaySyncStatus: 'PENDING',
      bluejaySyncError: null,
    },
  });

  try {
    const result = await createBluejayBooking({ booking });
    if (result.skipped) {
      return prisma.booking.findUnique({ where: { id: booking.id }, include: bookingInclude });
    }

    return prisma.booking.update({
      where: { id: booking.id },
      data: {
        bluejayBookingId: result.payload.id,
        bluejayBookingCode: result.payload.code,
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

  const room = await prisma.room.findUnique({ where: { id: input.roomId }, include: { ratePeriods: true } });
  const availability = await assertRoomCanBeBooked(room, input.checkIn, input.checkOut, input.guests);
  if (!availability.ok) throw createHttpError(availability.statusCode, availability.message);
  const externalStay = await getBluejayStayAvailability({
    roomIds: [room.id],
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: input.guests,
  });
  const externalPriceSummary = externalStay.rooms?.[room.id]?.priceSummary || null;

  const bookingCode = await createUniqueBookingCode(prisma);
  const paymentStatus =
    input.paymentMethod === 'payAtProperty' || input.paymentMethod === 'cashAtProperty'
      ? 'PAY_AT_PROPERTY'
      : 'PENDING';

  const booking = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Room" WHERE id = ${input.roomId} FOR UPDATE`;
    const lockedRoom = await tx.room.findUnique({ where: { id: input.roomId }, include: { ratePeriods: true } });
    const lockedAvailability = await assertRoomCanBeBooked(lockedRoom, input.checkIn, input.checkOut, input.guests, {
      db: tx,
      checkExternal: false,
    });
    if (!lockedAvailability.ok) {
      throw createHttpError(lockedAvailability.statusCode, lockedAvailability.message);
    }

    const existingIdempotentBooking = input.idempotencyKey
      ? await tx.booking.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
          include: bookingInclude,
        })
      : null;
    if (existingIdempotentBooking) return existingIdempotentBooking;

    const price =
      externalPriceSummary ||
      calculateTotalPrice({
        room: lockedRoom,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        guests: input.guests,
      });

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
        roomId: lockedRoom.id,
        guestId: guest.id,
        checkIn: toHotelDate(input.checkIn),
        checkOut: toHotelDate(input.checkOut),
        nights: price.nights,
        guests: Number(input.guests),
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
  return prisma.booking.update({ where: { bookingCode }, data: { bookingStatus: 'CANCELLED' } });
}
