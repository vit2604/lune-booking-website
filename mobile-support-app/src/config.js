export const defaultApiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://lune-booking-api.onrender.com/api';

export const defaultSocketUrl =
  process.env.EXPO_PUBLIC_SOCKET_URL || 'https://lune-booking-api.onrender.com';

export const storageKeys = {
  token: 'lune_support_token',
  admin: 'lune_support_admin',
  apiBaseUrl: 'lune_support_api_base_url',
  socketUrl: 'lune_support_socket_url',
};

export const quickReplies = [
  'Xin quý khách hãy chờ trong giây lát. Đội ngũ Lune sẽ phản hồi ngay.',
  'Dạ Lune đã nhận được tin nhắn của quý khách. Em sẽ kiểm tra phòng và báo lại ngay ạ.',
  'Dạ quý khách cho em xin ngày nhận phòng, ngày trả phòng và số khách để kiểm tra phòng trống ạ.',
  'Dạ Lune nằm tại 92-94 Thạch Lam, Sơn Trà, Đà Nẵng, gần biển Mỹ Khê ạ.',
  'Dạ quý khách có thể thanh toán tại khách sạn hoặc chuyển khoản theo thông tin chính thức trên website.',
];
