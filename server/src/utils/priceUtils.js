import { calculateNights, normalizeDate, toHotelDate } from './dateUtils.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS);
}

function getNightDateString(checkIn, offset) {
  const start = toHotelDate(checkIn);
  if (!start) return '';
  return normalizeDate(addDays(start, offset));
}

function normalizeRatePeriod(period) {
  return {
    ...period,
    start: normalizeDate(period.startDate),
    end: normalizeDate(period.endDate),
    price: Number(period.price || 0),
  };
}

export function getNightlyRates(room, checkIn, checkOut) {
  const nights = calculateNights(checkIn, checkOut);
  const basePrice = Number(room.basePrice || 0);
  const ratePeriods = (room.ratePeriods || [])
    .map(normalizeRatePeriod)
    .filter((period) => period.start && period.end && period.price > 0)
    .sort((a, b) => {
      if (a.start !== b.start) return a.start.localeCompare(b.start);
      return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
    });

  return Array.from({ length: nights }, (_, index) => {
    const date = getNightDateString(checkIn, index);
    const matchedPeriod = ratePeriods.find((period) => date >= period.start && date < period.end);
    return {
      date,
      price: matchedPeriod?.price || basePrice,
      ratePeriodId: matchedPeriod?.id || null,
      note: matchedPeriod?.note || '',
    };
  });
}

export function calculateBaseRoomPrice(room, nights, nightlyRates = []) {
  if (nightlyRates.length) {
    return nightlyRates.reduce((sum, night) => sum + Number(night.price || 0), 0);
  }
  return Number(room.basePrice || 0) * Number(nights || 0);
}

export function calculateLongStayDiscount(room, nights, subtotal) {
  if (!room.longStayDiscountEnabled) return 0;
  if (Number(nights) < Number(room.longStayMinNights || 0)) return 0;
  return Math.round(Number(subtotal || 0) * (Number(room.longStayDiscountPercent || 0) / 100));
}

export function calculateServiceFee(room, subtotal) {
  return Math.round(Number(subtotal || 0) * (Number(room.serviceFeePercent || 0) / 100));
}

export function calculateTax(room, subtotal) {
  return Math.round(Number(subtotal || 0) * (Number(room.taxPercent || 0) / 100));
}

export function calculateTotalPrice({ room, checkIn, checkOut }) {
  const nights = calculateNights(checkIn, checkOut);
  const nightlyRates = getNightlyRates(room, checkIn, checkOut);
  const subtotal = calculateBaseRoomPrice(room, nights, nightlyRates);
  const discountAmount = calculateLongStayDiscount(room, nights, subtotal);
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const serviceFee = calculateServiceFee(room, discountedSubtotal);
  const taxAmount = calculateTax(room, discountedSubtotal);
  const totalPrice = discountedSubtotal + serviceFee + taxAmount;
  const averagePricePerNight = nights > 0 ? Math.round(subtotal / nights) : Number(room.basePrice || 0);

  return {
    pricePerNight: averagePricePerNight,
    nights,
    nightlyRates,
    subtotal,
    discountAmount,
    serviceFee,
    taxAmount,
    totalPrice,
    currency: 'VND',
  };
}
