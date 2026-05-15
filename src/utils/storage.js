const BOOKING_DRAFT_KEY = 'lune_booking_draft';
const BOOKING_CONFIRMED_KEY = 'lune_booking_confirmed';

const canUseStorage = () => typeof window !== 'undefined' && window.localStorage;

export const saveBookingDraft = (booking) => {
  if (!canUseStorage()) return;
  localStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(booking));
};

export const loadBookingDraft = () => {
  if (!canUseStorage()) return null;
  try {
    return JSON.parse(localStorage.getItem(BOOKING_DRAFT_KEY));
  } catch {
    return null;
  }
};

export const saveConfirmedBooking = (booking) => {
  if (!canUseStorage()) return;
  localStorage.setItem(BOOKING_CONFIRMED_KEY, JSON.stringify(booking));
};

export const loadConfirmedBooking = () => {
  if (!canUseStorage()) return null;
  try {
    return JSON.parse(localStorage.getItem(BOOKING_CONFIRMED_KEY));
  } catch {
    return null;
  }
};
