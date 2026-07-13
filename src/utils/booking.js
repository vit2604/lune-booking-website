import { getMaxChildren, getRoomCapacity } from './occupancy.js';

export const SERVICE_FEE_PLACEHOLDER = 0;
export const MAX_ROOMS_PER_BOOKING = 3;

export const formatCurrency = (value) =>
  `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(value || 0)))} VND`;

export const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const addDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

export const getDefaultDates = () => {
  const today = new Date();
  return {
    checkIn: toDateInputValue(addDays(today, 1)),
    checkOut: toDateInputValue(addDays(today, 2)),
  };
};

const parseInputDate = (value) => {
  if (!value) return null;
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 12);
};

export const calculateNights = (checkIn, checkOut) => {
  const start = parseInputDate(checkIn);
  const end = parseInputDate(checkOut);
  if (!start || !end || end <= start) return 0;
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
};

export const calculateTotal = (pricePerNight, checkIn, checkOut) =>
  calculateNights(checkIn, checkOut) * pricePerNight;

export const calculateRoomSubtotal = (pricePerNight, checkIn, checkOut) =>
  calculateNights(checkIn, checkOut) * pricePerNight;

export const calculateServiceFee = () => SERVICE_FEE_PLACEHOLDER;

export const calculateGrandTotal = (pricePerNight, checkIn, checkOut) =>
  calculateRoomSubtotal(pricePerNight, checkIn, checkOut) + calculateServiceFee();

export const hasPricedBookingDraft = (booking) =>
  Number(booking?.totalPrice ?? booking?.total ?? booking?.roomSubtotal ?? booking?.subtotal ?? 0) > 0;

const priceSummaryMatchesStay = (priceSummary, { checkIn, checkOut, guests, adults, children }) => {
  if (!priceSummary) return false;
  const guestCounts = normalizeGuestCounts({ adults, children, guests });
  const summaryGuests = Number(priceSummary.guests || guestCounts.guests);
  const summaryAdults = Number(priceSummary.adults || guestCounts.adults);
  const summaryChildren = Number(priceSummary.children || 0);
  return (
    (!priceSummary.checkIn || priceSummary.checkIn === checkIn) &&
    (!priceSummary.checkOut || priceSummary.checkOut === checkOut) &&
    summaryGuests === guestCounts.guests &&
    summaryAdults === guestCounts.adults &&
    summaryChildren === guestCounts.children
  );
};

export const validateStay = ({ checkIn, checkOut, guests, maxGuests, messages = {} }) => {
  const errors = {};
  const guestCount = Number(guests);
  const today = toDateInputValue(new Date());

  if (!checkIn) errors.checkIn = messages.checkInRequired || 'Please select a check-in date.';
  if (!checkOut) errors.checkOut = messages.checkOutRequired || 'Please select a check-out date.';

  if (checkIn && checkIn < today) {
    errors.checkIn = messages.checkInPast || 'Check-in date cannot be in the past.';
  }

  if (checkIn && checkOut && calculateNights(checkIn, checkOut) <= 0) {
    errors.checkOut = messages.checkoutAfterCheckin || 'Check-out date must be after check-in date.';
  }

  const maxTotal = maxGuests ? getRoomCapacity(maxGuests).maxTotal : 0;
  if (!guestCount || guestCount < 1) {
    errors.guests = messages.guestsRequired || 'Please select at least 1 guest.';
  } else if (maxTotal && guestCount > maxTotal) {
    errors.guests = messages.guestsMax || `This room allows up to ${maxTotal} guests.`;
  }

  return errors;
};

export const normalizeGuestCounts = ({ adults, children, guests, maxGuests } = {}) => {
  const effectiveMax = Number(maxGuests) || 4;
  const { maxAdults } = getRoomCapacity(effectiveMax);
  const fallbackGuests = Math.max(1, Number(guests || 1));
  const adultCount = Math.min(maxAdults, Math.max(1, Number(adults || fallbackGuests || 1)));
  const childCount = Math.min(getMaxChildren(effectiveMax, adultCount), Math.max(0, Number(children || 0)));
  return {
    adults: adultCount,
    children: childCount,
    guests: adultCount + childCount,
  };
};

export const formatGuestBreakdown = (booking, t = (key) => key) => {
  const counts = booking?.rooms?.length
    ? booking.rooms.reduce(
        (total, item) => ({
          adults: total.adults + Number(item.adults || item.guests || 1) * Number(item.quantity || 1),
          children: total.children + Number(item.children || 0) * Number(item.quantity || 1),
        }),
        { adults: 0, children: 0 },
      )
    : normalizeGuestCounts({
        adults: booking?.adults,
        children: booking?.children,
        guests: booking?.guests,
        maxGuests: booking?.maxGuests,
      });
  const adultLabel = counts.adults === 1 ? t('common.adult') : t('common.adults');
  const childLabel = counts.children === 1 ? t('common.child') : t('common.children');
  const parts = [`${counts.adults} ${adultLabel}`];
  if (counts.children > 0) parts.push(`${counts.children} ${childLabel}`);
  return parts.join(', ');
};

export const getPaymentStatus = (paymentMethod) => {
  if (['pay-at-property', 'payAtProperty', 'cashAtProperty', 'cash-at-property', 'creditCard'].includes(paymentMethod)) {
    return 'pay_at_property';
  }
  if (paymentMethod === 'creditCardPaidMock') return 'paid_mock';
  return 'pending';
};

export const getPaymentMethodLabel = (paymentMethod) => {
  const labels = {
    'pay-at-property': 'Pay at property',
    payAtProperty: 'Pay at property',
    'cash-at-property': 'Cash at property',
    cashAtProperty: 'Cash at property',
    'bank-transfer': 'Bank transfer',
    bankTransfer: 'Bank transfer',
    'qr-payment': 'QR payment placeholder',
    qrPayment: 'QR payment placeholder',
    vietQr: 'VietQR',
    creditCard: 'Credit/Debit Card',
    stripe: 'Stripe',
    paypal: 'PayPal',
    vnpay: 'VNPay',
    momo: 'MoMo',
    zaloPay: 'ZaloPay',
    internationalTransfer: 'International transfer',
  };
  return labels[paymentMethod] || 'Pay at property';
};

export const buildBookingDraft = ({
  room,
  roomItems,
  quantity = 1,
  checkIn,
  checkOut,
  guests,
  adults,
  children,
  guestInfo,
  paymentMethod,
  bookingCode,
  bookingStatus,
}) => {
  const selections = roomItems?.length
    ? roomItems
    : [{ room, quantity, adults, children, guests }];
  const nights = calculateNights(checkIn, checkOut);
  const normalizedRoomItems = selections.map((selection) => {
    const sourceRoom = selection.room || selection;
    const itemQuantity = Math.min(
      MAX_ROOMS_PER_BOOKING,
      Math.max(1, Number(selection.quantity || sourceRoom.quantity || 1)),
    );
    const maxGuests = Number(sourceRoom.maxGuests || selection.maxGuests || guests || 1);
    const guestCounts = normalizeGuestCounts({
      adults: selection.adults ?? sourceRoom.adults ?? adults,
      children: selection.children ?? sourceRoom.children ?? children,
      guests: selection.guests ?? sourceRoom.guests ?? guests,
      maxGuests,
    });
    const priceSummary = priceSummaryMatchesStay(sourceRoom.priceSummary, {
      checkIn,
      checkOut,
      guests: guestCounts.guests,
      adults: guestCounts.adults,
      children: guestCounts.children,
    })
      ? sourceRoom.priceSummary
      : null;
    const itemNights = Number(priceSummary?.nights || nights);
    const pricePerNight = Number(priceSummary?.pricePerNight || sourceRoom.pricePerNight || sourceRoom.price || sourceRoom.basePrice || 0);
    const existingQuantity = Math.max(1, Number(sourceRoom.quantity || selection.quantity || 1));
    const unitSubtotal = Number(
      priceSummary?.subtotal ??
      sourceRoom.unitSubtotal ??
      (sourceRoom.subtotal ? Number(sourceRoom.subtotal) / existingQuantity : itemNights * pricePerNight),
    );
    const unitDiscountAmount = Number(
      priceSummary?.discountAmount ?? sourceRoom.unitDiscountAmount ?? Number(sourceRoom.discountAmount || 0) / existingQuantity,
    );
    const unitServiceFee = Number(
      priceSummary?.serviceFee ?? sourceRoom.unitServiceFee ?? Number(sourceRoom.serviceFee || 0) / existingQuantity,
    );
    const unitTaxAmount = Number(
      priceSummary?.taxAmount ?? sourceRoom.unitTaxAmount ?? Number(sourceRoom.taxAmount || 0) / existingQuantity,
    );
    const unitTotalPrice = Number(
      priceSummary?.totalPrice ??
      sourceRoom.unitTotalPrice ??
      (sourceRoom.totalPrice ? Number(sourceRoom.totalPrice) / existingQuantity : unitSubtotal + unitServiceFee + unitTaxAmount),
    );
    const language =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('lune_language') || localStorage.getItem('lune_guest_language') || 'en'
        : 'en';
    const roomName =
      sourceRoom.translations?.[language]?.name ||
      sourceRoom.translations?.en?.name ||
      sourceRoom.roomName ||
      sourceRoom.name;

    return {
      roomId: sourceRoom.id || sourceRoom.roomId,
      roomName,
      roomImage: sourceRoom.image || sourceRoom.roomImage || sourceRoom.mainImage || '',
      maxGuests,
      availableQuantity: Number(sourceRoom.availableQuantity ?? sourceRoom.bluejay?.inventory ?? MAX_ROOMS_PER_BOOKING),
      roomType: sourceRoom.type || sourceRoom.roomType || 'Apartment',
      size: sourceRoom.size || '',
      bed: sourceRoom.bed || sourceRoom.bedType || sourceRoom.beds || '',
      quantity: itemQuantity,
      guests: guestCounts.guests,
      adults: guestCounts.adults,
      children: guestCounts.children,
      pricePerNight,
      nights: itemNights,
      unitSubtotal,
      unitDiscountAmount,
      unitServiceFee,
      unitTaxAmount,
      unitTotalPrice,
      subtotal: unitSubtotal * itemQuantity,
      discountAmount: unitDiscountAmount * itemQuantity,
      serviceFee: unitServiceFee * itemQuantity,
      taxAmount: unitTaxAmount * itemQuantity,
      totalPrice: unitTotalPrice * itemQuantity,
      nightlyRates: priceSummary?.nightlyRates || sourceRoom.nightlyRates || [],
      priceSummary,
    };
  });
  const primaryRoom = normalizedRoomItems[0];
  const roomSubtotal = normalizedRoomItems.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount = normalizedRoomItems.reduce((sum, item) => sum + item.discountAmount, 0);
  const serviceFee = normalizedRoomItems.reduce((sum, item) => sum + item.serviceFee, 0);
  const taxAmount = normalizedRoomItems.reduce((sum, item) => sum + item.taxAmount, 0);
  const totalPrice = normalizedRoomItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalRooms = normalizedRoomItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAdults = normalizedRoomItems.reduce((sum, item) => sum + item.adults * item.quantity, 0);
  const totalChildren = normalizedRoomItems.reduce((sum, item) => sum + item.children * item.quantity, 0);
  const pricePerNight = normalizedRoomItems.reduce((sum, item) => sum + item.pricePerNight * item.quantity, 0);
  const selectedPaymentMethod = paymentMethod || 'payAtProperty';

  return {
    bookingCode: bookingCode || createBookingCode(),
    roomId: primaryRoom.roomId,
    roomName: primaryRoom.roomName,
    roomImage: primaryRoom.roomImage,
    maxGuests: primaryRoom.maxGuests,
    roomType: primaryRoom.roomType,
    size: primaryRoom.size,
    bed: primaryRoom.bed,
    rooms: normalizedRoomItems,
    totalRooms,
    pricePerNight,
    checkIn,
    checkOut,
    guests: totalAdults + totalChildren,
    adults: totalAdults,
    children: totalChildren,
    nights,
    roomSubtotal,
    subtotal: roomSubtotal,
    discountAmount,
    serviceFee,
    taxAmount,
    total: totalPrice,
    totalPrice,
    nightlyRates: primaryRoom.nightlyRates,
    priceSummary: primaryRoom.priceSummary,
    guestInfo: guestInfo || null,
    paymentMethod: selectedPaymentMethod,
    bookingStatus: bookingStatus || 'received',
    paymentStatus: getPaymentStatus(selectedPaymentMethod),
    updatedAt: new Date().toISOString(),
  };
};

export const createBookingCode = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(1000 + Math.random() * 9000));
  return `LUNE-${year}${month}${day}-${random}`;
};
