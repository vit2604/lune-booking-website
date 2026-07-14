export function bookingStatusAfterPayment(currentBookingStatus, paymentStatus) {
  if (currentBookingStatus === 'RECEIVED' && paymentStatus === 'FAILED') return 'CANCELLED';
  return currentBookingStatus;
}
