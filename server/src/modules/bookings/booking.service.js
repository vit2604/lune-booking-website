import { prisma } from '../../config/prisma.js';
import { assertRoomCanBeBooked } from '../../utils/availabilityUtils.js';
import { createUniqueBookingCode } from '../../utils/bookingCodeUtils.js';
import { toHotelDate } from '../../utils/dateUtils.js';
import { calculateTotalPrice } from '../../utils/priceUtils.js';
import { createHttpError } from '../../utils/responseUtils.js';

const bookingInclude = {
  room: { include: { images: true } },
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

export async function createBooking(input) {
  const room = await prisma.room.findUnique({ where: { id: input.roomId } });
  const availability = await assertRoomCanBeBooked(room, input.checkIn, input.checkOut, input.guests);
  if (!availability.ok) throw createHttpError(availability.statusCode, availability.message);

  const price = calculateTotalPrice({ room, checkIn: input.checkIn, checkOut: input.checkOut, guests: input.guests });
  const bookingCode = await createUniqueBookingCode(prisma);
  const paymentStatus =
    input.paymentMethod === 'payAtProperty' || input.paymentMethod === 'cashAtProperty'
      ? 'PAY_AT_PROPERTY'
      : 'PENDING';

  const booking = await prisma.$transaction(async (tx) => {
    const guest = await tx.guest.create({
      data: {
        fullName: input.guest.fullName,
        email: input.guest.email || null,
        phoneCode: input.guest.phoneCode,
        phoneNumber: input.guest.phoneNumber,
        country: input.guest.country,
        nationality: input.guest.nationality || null,
      },
    });

    const created = await tx.booking.create({
      data: {
        bookingCode,
        roomId: room.id,
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
        specialRequest: input.specialRequest || null,
        arrivalTime: input.arrivalTime || null,
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
  });

  return publicBookingSummary(booking);
}

export async function getPublicBooking(bookingCode) {
  const booking = await prisma.booking.findUnique({ where: { bookingCode }, include: bookingInclude });
  if (!booking) throw createHttpError(404, 'Booking not found');
  return publicBookingSummary(booking);
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
  return prisma.$transaction(async (tx) => {
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
}

export async function updateInternalNote(bookingCode, internalNote) {
  return prisma.booking.update({ where: { bookingCode }, data: { internalNote }, include: bookingInclude });
}

export async function deleteBooking(bookingCode) {
  return prisma.booking.update({ where: { bookingCode }, data: { bookingStatus: 'CANCELLED' } });
}
