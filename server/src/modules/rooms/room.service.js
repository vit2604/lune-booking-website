import { prisma } from '../../config/prisma.js';
import { assertRoomCanBeBooked, isRoomAvailable } from '../../utils/availabilityUtils.js';
import { toHotelDate } from '../../utils/dateUtils.js';
import { calculateTotalPrice } from '../../utils/priceUtils.js';
import { createHttpError } from '../../utils/responseUtils.js';
import { sanitizePublicAssetUrl } from '../../utils/sanitizeUtils.js';

const roomInclude = {
  images: { orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }] },
  amenities: { include: { amenity: true } },
  translations: true,
  blockedDates: true,
  ratePeriods: { orderBy: [{ startDate: 'asc' }, { updatedAt: 'desc' }] },
};

function toSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function splitAdminRoomInput(input) {
  const {
    image,
    gallery,
    amenities,
    priceNote,
    ...roomData
  } = input;

  return {
    roomData,
    image: image || '',
    gallery: Array.isArray(gallery) ? gallery : [],
    amenities: Array.isArray(amenities) ? amenities : [],
    priceNote: priceNote || '',
  };
}

async function syncRoomImages(tx, roomId, { image, gallery, name }) {
  const urls = [...new Set([image, ...gallery].map((url) => sanitizePublicAssetUrl(url)).filter(Boolean))];
  await tx.roomImage.deleteMany({ where: { roomId } });
  if (!urls.length) return;

  await tx.roomImage.createMany({
    data: urls.map((url, index) => ({
      roomId,
      url,
      altText: `${name} image ${index + 1}`,
      isMain: index === 0,
      sortOrder: index,
    })),
  });
}

async function syncRoomAmenities(tx, roomId, amenities) {
  await tx.roomAmenity.deleteMany({ where: { roomId } });
  const uniqueAmenities = [...new Set(amenities.filter(Boolean))];
  if (!uniqueAmenities.length) return;

  for (const key of uniqueAmenities) {
    const amenity = await tx.amenity.upsert({
      where: { key },
      update: {},
      create: { key },
    });
    await tx.roomAmenity.create({
      data: { roomId, amenityId: amenity.id },
    });
  }
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
    ratePeriods: room.ratePeriods || [],
  };
}

export async function listPublicRooms(query = {}) {
  const rooms = await prisma.room.findMany({
    where: {
      status: 'ACTIVE',
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
        const check = await isRoomAvailable(
          room.id,
          toHotelDate(query.checkIn),
          toHotelDate(query.checkOut),
          query.guests || 1,
        );
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
  const { roomData, image, gallery, amenities, priceNote } = splitAdminRoomInput(input);
  return prisma.$transaction(async (tx) => {
    const room = await tx.room.create({
      data: {
        ...roomData,
        slug: roomData.slug || toSlug(roomData.name),
        translations: {
          create: {
            languageCode: 'en',
            name: roomData.name,
            shortDescription: roomData.shortDescription,
            fullDescription: roomData.fullDescription,
            priceNote,
          },
        },
      },
    });
    await syncRoomImages(tx, room.id, { image, gallery, name: roomData.name });
    await syncRoomAmenities(tx, room.id, amenities);
    return tx.room.findUnique({ where: { id: room.id }, include: roomInclude });
  });
}

export async function updateAdminRoom(id, input) {
  await getAdminRoom(id);
  const { roomData, image, gallery, amenities, priceNote } = splitAdminRoomInput(input);
  return prisma.$transaction(async (tx) => {
    const room = await tx.room.update({
      where: { id },
      data: { ...roomData, slug: roomData.slug || toSlug(roomData.name) },
    });
    await tx.roomTranslation.upsert({
      where: { roomId_languageCode: { roomId: id, languageCode: 'en' } },
      update: {
        name: roomData.name,
        shortDescription: roomData.shortDescription,
        fullDescription: roomData.fullDescription,
        priceNote,
      },
      create: {
        roomId: id,
        languageCode: 'en',
        name: roomData.name,
        shortDescription: roomData.shortDescription,
        fullDescription: roomData.fullDescription,
        priceNote,
      },
    });
    // The current admin room form edits the default room content only.
    // Keep public language views in sync so changes are visible immediately on the guest site.
    await tx.roomTranslation.updateMany({
      where: { roomId: id, languageCode: { not: 'en' } },
      data: {
        name: roomData.name,
        shortDescription: roomData.shortDescription,
        fullDescription: roomData.fullDescription,
        priceNote,
      },
    });
    await syncRoomImages(tx, id, { image, gallery, name: roomData.name });
    await syncRoomAmenities(tx, id, amenities);
    return tx.room.findUnique({ where: { id: room.id }, include: roomInclude });
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
