import { calculateNights } from './dateUtils.js';

export function calculateBaseRoomPrice(room, nights) {
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
  const subtotal = calculateBaseRoomPrice(room, nights);
  const discountAmount = calculateLongStayDiscount(room, nights, subtotal);
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const serviceFee = calculateServiceFee(room, discountedSubtotal);
  const taxAmount = calculateTax(room, discountedSubtotal);
  const totalPrice = discountedSubtotal + serviceFee + taxAmount;

  return {
    pricePerNight: Number(room.basePrice || 0),
    nights,
    subtotal,
    discountAmount,
    serviceFee,
    taxAmount,
    totalPrice,
    currency: 'VND',
  };
}
