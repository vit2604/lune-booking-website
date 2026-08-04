export function bookingStatusAfterPayment(currentBookingStatus, paymentStatus) {
  if (paymentStatus === 'FAILED') return 'CANCELLED';
  return currentBookingStatus;
}
