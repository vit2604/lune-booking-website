const DAY_MS = 24 * 60 * 60 * 1000;

export function getTodayDateString() {
  const now = new Date();
  return normalizeDate(now);
}

export function normalizeDate(date) {
  if (!date) return '';
  if (typeof date === 'string') {
    const [year, month, day] = date.slice(0, 10).split('-').map(Number);
    if (!year || !month || !day) return '';
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

export function parseHotelDate(date) {
  const normalized = normalizeDate(date);
  if (!normalized) return null;
  const [year, month, day] = normalized.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDaysToDateString(date, days) {
  const parsed = parseHotelDate(date);
  if (!parsed) return '';
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, '0')}-${String(
    parsed.getUTCDate(),
  ).padStart(2, '0')}`;
}

export function isPastDate(date) {
  const parsed = parseHotelDate(date);
  const today = parseHotelDate(getTodayDateString());
  return Boolean(parsed && today && parsed < today);
}

export function isValidDateRange(checkIn, checkOut) {
  const start = parseHotelDate(checkIn);
  const end = parseHotelDate(checkOut);
  return Boolean(start && end && end > start);
}

export function calculateNights(checkIn, checkOut) {
  const start = parseHotelDate(checkIn);
  const end = parseHotelDate(checkOut);
  if (!start || !end || end <= start) return 0;
  return Math.round((end.getTime() - start.getTime()) / DAY_MS);
}

export function getDatesBetween(checkIn, checkOut) {
  const nights = calculateNights(checkIn, checkOut);
  return Array.from({ length: nights }, (_, index) => addDaysToDateString(checkIn, index));
}

export function hasDateOverlap(rangeA, rangeB) {
  const startA = parseHotelDate(rangeA?.checkIn || rangeA?.startDate);
  const endA = parseHotelDate(rangeA?.checkOut || rangeA?.endDate);
  const startB = parseHotelDate(rangeB?.checkIn || rangeB?.startDate);
  const endB = parseHotelDate(rangeB?.checkOut || rangeB?.endDate);
  if (!startA || !endA || !startB || !endB) return false;
  return startA < endB && endA > startB;
}

export { formatDisplayDate } from './dateFormatUtils.js';
