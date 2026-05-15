import { prisma } from '../../config/prisma.js';
import { assertRoomCanBeBooked, isRoomAvailable } from '../../utils/availabilityUtils.js';
import { toHotelDate } from '../../utils/dateUtils.js';
import { calculateTotalPrice } from '../../utils/priceUtils.js';
import { createHttpError } from '../../utils/responseUtils.js';

const roomInclude = {
  images: { orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }] },
  amenities: { include: { amenity: true } },
  translations: true,
  blockedDates: true,
};

function toSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function localizeRoom(room, lang = 'en') {
  const translation =
    room.translations?.find((item) => item.languageCode === lang) ||
    room.translations?.find((item) => item.languageCode === 'en');

  return {
    id: room.id,
    slug: room.slug,
    name: translation?.name || room.name,
    shortDescription: translation?.shortDescription || room.shortDescription,
    fullDescription: translation?.fullDescription || room.fullDescription,
    priceNote: translation?.priceNote || '',
    policies: translation?.policiesJson || [],
    suitableFor: translation?.suitableForJson || [],
    basePrice: room.basePrice,
    price: room.basePrice,
    size: room.size,
    maxGuests: room.maxGuests,
    bedType: room.bedType,
    numberOfBeds: room.numberOfBeds,
    status: room.status,
    isFeatured: room.isFeatured,
    mainImage: room.images?.find((image) => image.isMain)?.url || room.images?.[0]?.url || '',
    image: room.images?.find((image) => image.isMain)?.url || room.images?.[0]?.url || '',
    images: room.images || [],
    gallery: (room.images || []).map((image) => image.url),
    amenities: (room.amenities || []).map((item) => item.amenity.key),
    pricingRules: {
      basePrice: room.basePrice,
      weekendPrice: room.weekendPrice,
      holidayPrice: room.holidayPrice,
      longStayDiscount: {
        enabled: room.longStayDiscountEnabled,
        minNights: room.longStayMinNights,
        discountPercent: room.longStayDiscountPercent,
      },
      serviceFeePercent: room.serviceFeePercent,
      taxPercent: room.taxPercent,
    },
    availabilityRules: {
      minNights: room.minNights,
      maxNights: room.maxNights,
      allowSameDayBooking: room.allowSameDayBooking,
      advanceBookingDays: room.advanceBookingDays,
      cleaningBufferHours: room.cleaningBufferHours,
    },
    blockedDates: room.blockedDates || [],
  };
}

export async function listPublicRooms(query = {}) {
  const rooms = await prisma.room.findMany({
    where: {
      status: query.status ? query.status : 'ACTIVE',
      maxGuests: query.guests ? { gte: Number(query.guests) } : undefined,
    },
    include: roomInclude,
    orderBy: [{ sortOrder: 'asc' }, { basePrice: 'asc' }],
  });

  const mapped = await Promise.all(
    rooms.map(async (room) => {
      const localized = localizeRoom(room, query.lang || 'en');
      let availabilityStatus = 'available';
      let available = true;
      if (query.checkIn && query.checkOut) {
        const check = await isRoomAvailable(room.id, toHotelDate(query.checkIn), toHotelDate(query.checkOut));
        availabilityStatus = check.available ? 'available' : 'not_available';
        available = check.available;
      }
      return {
        ...localized,
        availabilityStatus,
        available,
        priceSummary:
          query.checkIn && query.checkOut
            ? calculateTotalPrice({ room, checkIn: query.checkIn, checkOut: query.checkOut })
            : null,
      };
    }),
  );

  return query.checkIn && query.checkOut ? mapped.filter((room) => room.available) : mapped;
}

export async function getPublicRoom(slug, query = {}) {
  const room = await prisma.room.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    include: roomInclude,
  });
  if (!room || room.status === 'HIDDEN') throw createHttpError(404, 'Room not found');

  const localized = localizeRoom(room, query.lang || 'en');
  const availability =
    query.checkIn && query.checkOut
      ? await getRoomAvailability(room.id, query)
      : { available: room.status === 'ACTIVE', reason: '', nights: 0, price: null };

  return { room: localized, availability };
}

export async function getRoomAvailability(roomId, query) {
  const room = await prisma.room.findUnique({ where: { id: roomId }, include: roomInclude });
  if (!room) throw createHttpError(404, 'Room not found');
  const validation = await assertRoomCanBeBooked(room, query.checkIn, query.checkOut, query.guests || 1);
  const price = calculateTotalPrice({ room, checkIn: query.checkIn, checkOut: query.checkOut });
  return {
    available: validation.ok,
    reason: validation.ok ? '' : validation.message,
    nights: price.nights,
    price,
  };
}

export async function listAdminRooms() {
  return prisma.room.findMany({ include: roomInclude, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
}

export async function getAdminRoom(id) {
  const room = await prisma.room.findUnique({ where: { id }, include: roomInclude });
  if (!room) throw createHttpError(404, 'Room not found');
  return room;
}

export async function createAdminRoom(input) {
  return prisma.room.create({
    data: {
      ...input,
      slug: input.slug || toSlug(input.name),
      translations: {
        create: {
          languageCode: 'en',
          name: input.name,
          shortDescription: input.shortDescription,
          fullDescription: input.fullDescription,
        },
      },
    },
    include: roomInclude,
  });
}

export async function updateAdminRoom(id, input) {
  await getAdminRoom(id);
  return prisma.room.update({
    where: { id },
    data: { ...input, slug: input.slug || toSlug(input.name) },
    include: roomInclude,
  });
}

export async function deleteAdminRoom(id) {
  const bookingCount = await prisma.booking.count({ where: { roomId: id } });
  if (bookingCount > 0) {
    return prisma.room.update({ where: { id }, data: { status: 'HIDDEN' } });
  }
  return prisma.room.delete({ where: { id } });
}

export function updateRoomStatus(id, status) {
  return prisma.room.update({ where: { id }, data: { status } });
}

export function addBlockedDate(roomId, data) {
  return prisma.roomBlockedDate.create({
    data: {
      roomId,
      startDate: toHotelDate(data.startDate),
      endDate: toHotelDate(data.endDate),
      reason: data.reason || '',
    },
  });
}

export function deleteBlockedDate(roomId, blockedDateId) {
  return prisma.roomBlockedDate.deleteMany({ where: { id: blockedDateId, roomId } });
}
