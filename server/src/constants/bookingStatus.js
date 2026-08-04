export const bookingStatuses = ['RECEIVED', 'CONFIRMED', 'CANCELLED'];
export const paymentStatusesHoldingRoom = ['PAID', 'PAY_AT_PROPERTY'];

export function isBookingHoldingRoom(booking = {}) {
  if (booking.bookingStatus === 'CONFIRMED') return true;
  if (booking.bookingStatus !== 'RECEIVED') return false;
  return paymentStatusesHoldingRoom.includes(booking.paymentStatus);
}

export function bookingHoldWhere() {
  return {
    OR: [
      { bookingStatus: 'CONFIRMED' },
      {
        bookingStatus: 'RECEIVED',
        paymentStatus: { in: paymentStatusesHoldingRoom },
      },
    ],
  };
}
