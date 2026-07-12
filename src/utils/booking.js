import { getMaxChildren, getRoomCapacity } from './occupancy.js';

export const SERVICE_FEE_PLACEHOLDER = 0;

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
  const counts = normalizeGuestCounts({
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
  const guestCounts = normalizeGuestCounts({ adults, children, guests, maxGuests: room.maxGuests });
  const guestsCount = guestCounts.guests;
  const priceSummary = priceSummaryMatchesStay(room.priceSummary, {
    checkIn,
    checkOut,
    guests: guestsCount,
    adults: guestCounts.adults,
    children: guestCounts.children,
  })
    ? room.priceSummary
    : null;
  const nights = Number(priceSummary?.nights || calculateNights(checkIn, checkOut));
  const pricePerNight = Number(priceSummary?.pricePerNight || room.price || room.basePrice || 0);
  const roomSubtotal = Number(priceSummary?.subtotal ?? priceSummary?.totalPrice ?? nights * pricePerNight);
  const serviceFee = Number(priceSummary?.serviceFee ?? calculateServiceFee());
  const totalPrice = Number(priceSummary?.totalPrice ?? roomSubtotal + serviceFee);
  const selectedPaymentMethod = paymentMethod || 'payAtProperty';
  const language =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('lune_language') || localStorage.getItem('lune_guest_language') || 'en'
      : 'en';
  const localizedRoomName = room.translations?.[language]?.name || room.translations?.en?.name || room.name;

  return {
    bookingCode: bookingCode || createBookingCode(),
    roomId: room.id,
    roomName: localizedRoomName,
    roomImage: room.image,
    maxGuests: room.maxGuests,
    roomType: room.type,
    size: room.size,
    bed: room.bed || room.bedType || room.beds,
    pricePerNight,
    checkIn,
    checkOut,
    guests: guestsCount,
    adults: guestCounts.adults,
    children: guestCounts.children,
    nights,
    roomSubtotal,
    subtotal: roomSubtotal,
    serviceFee,
    total: totalPrice,
    totalPrice,
    nightlyRates: priceSummary?.nightlyRates || [],
    priceSummary: priceSummary
      ? {
          ...priceSummary,
          checkIn,
          checkOut,
          guests: guestsCount,
          adults: guestCounts.adults,
          children: guestCounts.children,
        }
      : null,
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
