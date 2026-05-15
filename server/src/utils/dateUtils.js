const DAY_MS = 24 * 60 * 60 * 1000;

export function normalizeDate(date) {
  if (!date) return '';
  if (date instanceof Date) {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(
      date.getUTCDate(),
    ).padStart(2, '0')}`;
  }
  const [year, month, day] = String(date).slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return '';
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function toHotelDate(date) {
  const normalized = normalizeDate(date);
  if (!normalized) return null;
  const [year, month, day] = normalized.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function todayString() {
  return normalizeDate(new Date());
}

export function calculateNights(checkIn, checkOut) {
  const start = toHotelDate(checkIn);
  const end = toHotelDate(checkOut);
  if (!start || !end || end <= start) return 0;
  return Math.round((end.getTime() - start.getTime()) / DAY_MS);
}

export function hasDateOverlap(rangeA, rangeB) {
  const aStart = toHotelDate(rangeA.checkIn || rangeA.startDate);
  const aEnd = toHotelDate(rangeA.checkOut || rangeA.endDate);
  const bStart = toHotelDate(rangeB.checkIn || rangeB.startDate);
  const bEnd = toHotelDate(rangeB.checkOut || rangeB.endDate);
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  return aStart < bEnd && aEnd > bStart;
}

export function validateDateRange(checkIn, checkOut) {
  const normalizedCheckIn = normalizeDate(checkIn);
  const normalizedCheckOut = normalizeDate(checkOut);
  const nights = calculateNights(normalizedCheckIn, normalizedCheckOut);

  if (!normalizedCheckIn) return { ok: false, message: 'Please select your check-in date' };
  if (!normalizedCheckOut) return { ok: false, message: 'Please select your check-out date' };
  if (normalizedCheckIn < todayString()) return { ok: false, message: 'Check-in date cannot be in the past' };
  if (nights <= 0) return { ok: false, message: 'Check-out date must be after check-in date' };

  return { ok: true, nights, checkIn: normalizedCheckIn, checkOut: normalizedCheckOut };
}
