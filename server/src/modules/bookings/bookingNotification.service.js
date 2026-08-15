import { env } from '../../config/env.js';

const formatMoney = (value, currency = 'VND') => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency,
  maximumFractionDigits: currency === 'VND' ? 0 : 2,
}).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value));
};

function bookingRooms(booking) {
  if (booking.roomItems?.length) return booking.roomItems;
  return [{ room: booking.room, quantity: 1 }];
}

export function buildBookingTelegramMessage(booking) {
  const guest = booking.guest || {};
  const roomLines = bookingRooms(booking).map((item) => (
    `• ${item.room?.name || 'Phòng'} × ${Number(item.quantity || 1)}`
  ));
  const phone = `${guest.phoneCode || ''} ${guest.phoneNumber || ''}`.trim() || '-';
  const adminUrl = env.TELEGRAM_BOOKING_ADMIN_URL;

  return [
    '🏨 CÓ ĐẶT PHÒNG MỚI',
    '',
    `Mã đặt phòng: ${booking.bookingCode}`,
    `Khách: ${guest.fullName || '-'}`,
    `Điện thoại: ${phone}`,
    `Email: ${guest.email || '-'}`,
    `Nhận phòng: ${formatDate(booking.checkIn)}`,
    `Trả phòng: ${formatDate(booking.checkOut)} (${Number(booking.nights || 0)} đêm)`,
    `Số khách: ${Number(booking.adults || 0)} người lớn, ${Number(booking.children || 0)} trẻ em`,
    'Phòng:',
    ...roomLines,
    `Tổng tiền: ${formatMoney(booking.totalPrice, booking.currency || 'VND')}`,
    `Thanh toán: ${booking.paymentMethod || 'Chưa chọn'} · ${booking.paymentStatus || 'PENDING'}`,
    booking.arrivalTime ? `Giờ đến dự kiến: ${booking.arrivalTime}` : null,
    booking.specialRequest ? `Yêu cầu đặc biệt: ${booking.specialRequest}` : null,
    adminUrl ? `Mở quản trị: ${adminUrl}` : null,
  ].filter((line) => line !== null).join('\n');
}

export async function notifyNewBooking(booking) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID || !booking) return false;

  try {
    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: buildBookingTelegramMessage(booking),
        disable_web_page_preview: true,
      }),
    });
    if (!response.ok) throw new Error(`Telegram returned ${response.status}`);
    return true;
  } catch (error) {
    console.warn('Could not send Telegram booking notification:', error.message);
    return false;
  }
}
