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
  return apiRequest('/admin/rooms');
}

export function adminListBookings(query = {}) {
  const params = new URLSearchParams(query);
  return apiRequest(`/admin/bookings${params.toString() ? `?${params}` : ''}`);
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
