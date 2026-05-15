const BOOKINGS_KEY = 'lune_bookings';
const CONFIRMED_KEY = 'lune_booking_confirmed';

function readBookings() {
  let bookings = [];
  try {
    bookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY)) || [];
  } catch {
    bookings = [];
  }

  try {
    const confirmed = JSON.parse(localStorage.getItem(CONFIRMED_KEY));
    if (confirmed?.bookingCode && !bookings.some((item) => item.bookingCode === confirmed.bookingCode)) {
      bookings = [confirmed, ...bookings];
    }
  } catch {
    return bookings;
  }

  return bookings;
}

function writeBookings(bookings) {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  window.dispatchEvent(new Event('lune:bookings-updated'));
}

export function getBookings() {
  return readBookings().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export function saveBooking(booking) {
  const bookings = readBookings();
  const existingIndex = bookings.findIndex((item) => item.bookingCode === booking.bookingCode);
  const nextBooking = {
    ...booking,
    bookingStatus: booking.bookingStatus || 'received',
    paymentStatus: booking.paymentStatus || 'pending',
    createdAt: booking.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    bookings[existingIndex] = { ...bookings[existingIndex], ...nextBooking };
  } else {
    bookings.unshift(nextBooking);
  }

  writeBookings(bookings);
  return nextBooking;
}

export function getBookingByCode(code) {
  return readBookings().find((booking) => booking.bookingCode === code) || null;
}

export function updateBookingStatus(code, status) {
  const bookings = readBookings().map((booking) =>
    booking.bookingCode === code ? { ...booking, bookingStatus: status, updatedAt: new Date().toISOString() } : booking,
  );
  writeBookings(bookings);
}

export function updatePaymentStatus(code, status) {
  const bookings = readBookings().map((booking) =>
    booking.bookingCode === code ? { ...booking, paymentStatus: status, updatedAt: new Date().toISOString() } : booking,
  );
  writeBookings(bookings);
}

export function addInternalNote(code, note) {
  const bookings = readBookings().map((booking) =>
    booking.bookingCode === code ? { ...booking, internalNote: note, updatedAt: new Date().toISOString() } : booking,
  );
  writeBookings(bookings);
}

export function deleteBooking(code) {
  writeBookings(readBookings().filter((booking) => booking.bookingCode !== code));
}
