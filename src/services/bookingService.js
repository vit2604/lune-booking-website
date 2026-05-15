import { saveBooking } from '../admin/services/adminBookingService.js';

export function persistBooking(booking) {
  return saveBooking(booking);
}
