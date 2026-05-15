import { calculateNights } from './dateUtils.js';

export function formatVND(amount) {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(
    Math.max(0, Math.round(Number(amount) || 0)),
  )} VND`;
}

export function getPricingRules(room) {
  return {
    basePrice: Number(room?.price || room?.pricingRules?.basePrice || 0),
    weekendPrice: null,
    holidayPrice: null,
    longStayDiscount: {
      enabled: true,
      minNights: 7,
      discountPercent: 5,
    },
    serviceFeePercent: 0,
    taxPercent: 0,
    ...(room?.pricingRules || {}),
  };
}

export function calculateBaseRoomPrice(room, nights) {
  const rules = getPricingRules(room);
  return Math.max(0, Number(nights || 0) * Number(rules.basePrice || room?.price || 0));
}

export function calculateLongStayDiscount(room, nights) {
  const rules = getPricingRules(room);
  const config = rules.longStayDiscount || {};
  if (!config.enabled || Number(nights) < Number(config.minNights || 0)) return 0;
  return Math.round(calculateBaseRoomPrice(room, nights) * (Number(config.discountPercent || 0) / 100));
}

export function calculateServiceFee(subtotal, room) {
  const rules = getPricingRules(room);
  return Math.round(Math.max(0, Number(subtotal || 0)) * (Number(rules.serviceFeePercent || 0) / 100));
}

export function calculateTax(subtotal, room) {
  const rules = getPricingRules(room);
  return Math.round(Math.max(0, Number(subtotal || 0)) * (Number(rules.taxPercent || 0) / 100));
}

export function calculateTotalPrice({ room, checkIn, checkOut }) {
  const nights = calculateNights(checkIn, checkOut);
  const pricePerNight = getPricingRules(room).basePrice || Number(room?.price || 0);
  const roomSubtotal = calculateBaseRoomPrice(room, nights);
  const longStayDiscount = calculateLongStayDiscount(room, nights);
  const discountedSubtotal = Math.max(0, roomSubtotal - longStayDiscount);
  const serviceFee = calculateServiceFee(discountedSubtotal, room);
  const tax = calculateTax(discountedSubtotal, room);
  const total = discountedSubtotal + serviceFee + tax;

  return {
    nights,
    pricePerNight,
    roomSubtotal,
    longStayDiscount,
    serviceFee,
    tax,
    total,
  };
}
