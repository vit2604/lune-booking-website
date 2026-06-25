import { prisma } from '../../config/prisma.js';
import { normalizeDate, toHotelDate } from '../../utils/dateUtils.js';
import { createHttpError } from '../../utils/responseUtils.js';
import { cleanText } from '../../utils/sanitizeUtils.js';

const rateInclude = {
  room: {
    select: {
      id: true,
      name: true,
      slug: true,
      basePrice: true,
      status: true,
    },
  },
};

function normalizeRatePeriod(period) {
  if (!period) return period;
  return {
    ...period,
    startDate: normalizeDate(period.startDate),
    endDate: normalizeDate(period.endDate),
  };
}

function normalizeRatePeriods(periods) {
  return periods.map(normalizeRatePeriod);
}

function parseDateRange(startDate, endDate) {
  const start = toHotelDate(startDate);
  const end = toHotelDate(endDate);
  if (!start || !end) throw createHttpError(400, 'Please select a valid start and end date');
  if (end <= start) throw createHttpError(400, 'End date must be after start date');
  return { start, end };
}

async function assertRoomExists(roomId) {
  const room = await prisma.room.findUnique({ where: { id: roomId }, select: { id: true } });
  if (!room) throw createHttpError(404, 'Room not found');
}

async function assertNoOverlap({ roomId, start, end, excludeId }) {
  const overlap = await prisma.roomRatePeriod.findFirst({
    where: {
      roomId,
      id: excludeId ? { not: excludeId } : undefined,
      startDate: { lt: end },
      endDate: { gt: start },
    },
    select: { id: true, startDate: true, endDate: true },
  });

  if (overlap) {
    throw createHttpError(409, 'This room already has a custom price in the selected date range');
  }
}

export async function listRatePeriods(query = {}) {
  const from = query.from ? toHotelDate(query.from) : null;
  const to = query.to ? toHotelDate(query.to) : null;
  const periods = await prisma.roomRatePeriod.findMany({
    where: {
      roomId: query.roomId || undefined,
      startDate: to ? { lt: to } : undefined,
      endDate: from ? { gt: from } : undefined,
    },
    include: rateInclude,
    orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
  });

  return normalizeRatePeriods(periods);
}

export async function createRatePeriod(input) {
  const { start, end } = parseDateRange(input.startDate, input.endDate);
  await assertRoomExists(input.roomId);
  await assertNoOverlap({ roomId: input.roomId, start, end });

  const period = await prisma.roomRatePeriod.create({
    data: {
      roomId: input.roomId,
      startDate: start,
      endDate: end,
      price: Number(input.price),
      note: cleanText(input.note, 300) || null,
    },
    include: rateInclude,
  });

  return normalizeRatePeriod(period);
}

export async function updateRatePeriod(id, input) {
  const existing = await prisma.roomRatePeriod.findUnique({ where: { id } });
  if (!existing) throw createHttpError(404, 'Rate period not found');

  const { start, end } = parseDateRange(input.startDate, input.endDate);
  await assertRoomExists(input.roomId);
  await assertNoOverlap({ roomId: input.roomId, start, end, excludeId: id });

  const period = await prisma.roomRatePeriod.update({
    where: { id },
    data: {
      roomId: input.roomId,
      startDate: start,
      endDate: end,
      price: Number(input.price),
      note: cleanText(input.note, 300) || null,
    },
    include: rateInclude,
  });

  return normalizeRatePeriod(period);
}

export async function deleteRatePeriod(id) {
  const existing = await prisma.roomRatePeriod.findUnique({ where: { id } });
  if (!existing) throw createHttpError(404, 'Rate period not found');
  return normalizeRatePeriod(await prisma.roomRatePeriod.delete({ where: { id }, include: rateInclude }));
}
