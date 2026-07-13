export const MAX_ROOMS_PER_BOOKING = 3;

export function normalizeBookingRoomSelections(input = {}) {
  const source = Array.isArray(input.rooms) && input.rooms.length
    ? input.rooms
    : [{
        roomId: input.roomId,
        quantity: 1,
        guests: input.guests,
        adults: input.adults,
        children: input.children,
      }];

  return source.map((item) => {
    const children = Math.max(0, Number(item.children || 0));
    const fallbackGuests = Math.max(1, Number(item.guests || input.guests || 1));
    const adults = Math.max(1, Number(item.adults || fallbackGuests - children || 1));
    return {
      roomId: String(item.roomId || ''),
      quantity: Math.max(1, Number(item.quantity || 1)),
      adults,
      children,
      guests: adults + children,
    };
  });
}

export function getTotalRoomQuantity(items = []) {
  return items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

export function scaleRoomPrice(price = {}, quantity = 1) {
  const count = Math.max(1, Number(quantity || 1));
  return {
    ...price,
    quantity: count,
    pricePerNight: Number(price.pricePerNight || 0),
    subtotal: Number(price.subtotal || 0) * count,
    discountAmount: Number(price.discountAmount || 0) * count,
    serviceFee: Number(price.serviceFee || 0) * count,
    taxAmount: Number(price.taxAmount || 0) * count,
    totalPrice: Number(price.totalPrice || 0) * count,
  };
}

export function aggregateBookingRoomPrices(items = []) {
  return items.reduce(
    (total, item) => ({
      nights: total.nights || Number(item.nights || 0),
      guests: total.guests + Number(item.guests || 0) * Number(item.quantity || 1),
      adults: total.adults + Number(item.adults || 0) * Number(item.quantity || 1),
      children: total.children + Number(item.children || 0) * Number(item.quantity || 1),
      pricePerNight:
        total.pricePerNight + Number(item.pricePerNight || 0) * Number(item.quantity || 1),
      subtotal: total.subtotal + Number(item.subtotal || 0),
      discountAmount: total.discountAmount + Number(item.discountAmount || 0),
      serviceFee: total.serviceFee + Number(item.serviceFee || 0),
      taxAmount: total.taxAmount + Number(item.taxAmount || 0),
      totalPrice: total.totalPrice + Number(item.totalPrice || 0),
    }),
    {
      nights: 0,
      guests: 0,
      adults: 0,
      children: 0,
      pricePerNight: 0,
      subtotal: 0,
      discountAmount: 0,
      serviceFee: 0,
      taxAmount: 0,
      totalPrice: 0,
    },
  );
}
