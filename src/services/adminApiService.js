import { apiRequest } from './apiClient.js';

export function adminLogin(username, password) {
  return apiRequest('/auth/admin/login', {
    method: 'POST',
    token: '',
    body: { username, password },
  });
}

export function adminMe() {
  return apiRequest('/auth/me');
}

export function adminListRooms() {
  return apiRequest('/admin/rooms', { timeoutMs: 15000 });
}

export function adminGetRoom(roomId) {
  return apiRequest(`/admin/rooms/${roomId}`, { timeoutMs: 15000 });
}

export function adminCreateRoom(room) {
  return apiRequest('/admin/rooms', {
    method: 'POST',
    body: room,
    timeoutMs: 15000,
  });
}

export function adminUpdateRoom(roomId, room) {
  return apiRequest(`/admin/rooms/${roomId}`, {
    method: 'PUT',
    body: room,
    timeoutMs: 15000,
  });
}

export function adminDeleteRoom(roomId) {
  return apiRequest(`/admin/rooms/${roomId}`, { method: 'DELETE', timeoutMs: 15000 });
}

export function adminUpdateRoomStatus(roomId, status) {
  return apiRequest(`/admin/rooms/${roomId}/status`, {
    method: 'PATCH',
    body: { status },
    timeoutMs: 15000,
  });
}

export function adminListBookings(query = {}) {
  const params = new URLSearchParams(query);
  return apiRequest(`/admin/bookings${params.toString() ? `?${params}` : ''}`);
}

export function adminUpdateBookingStatus(bookingCode, bookingStatus) {
  return apiRequest(`/admin/bookings/${bookingCode}/status`, {
    method: 'PATCH',
    body: { bookingStatus },
  });
}

export function adminUpdatePaymentStatus(bookingCode, paymentStatus) {
  return apiRequest(`/admin/bookings/${bookingCode}/payment-status`, {
    method: 'PATCH',
    body: { paymentStatus },
  });
}

export function adminUpdateInternalNote(bookingCode, internalNote) {
  return apiRequest(`/admin/bookings/${bookingCode}/internal-note`, {
    method: 'PATCH',
    body: { internalNote },
  });
}

export function adminDeleteBooking(bookingCode) {
  return apiRequest(`/admin/bookings/${bookingCode}`, { method: 'DELETE' });
}

export function adminGetPaymentSettings() {
  return apiRequest('/admin/payment-settings');
}

export function adminSavePaymentSettings(paymentMethods) {
  return apiRequest('/admin/payment-settings', {
    method: 'PUT',
    body: { paymentMethods },
  });
}

export function adminListChatSessions(query = {}) {
  const params = new URLSearchParams(query);
  return apiRequest(`/admin/chat/sessions${params.toString() ? `?${params}` : ''}`, { timeoutMs: 1200 });
}

export function adminGetChatSession(sessionCode) {
  return apiRequest(`/admin/chat/sessions/${sessionCode}`, { timeoutMs: 1200 });
}

export function adminSendChatMessage(sessionCode, message) {
  return apiRequest(`/admin/chat/sessions/${sessionCode}/messages`, {
    method: 'POST',
    body: { message },
    timeoutMs: 1200,
  });
}
