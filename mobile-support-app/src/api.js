import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest, getToken, saveAuth } from './apiClient';
import { defaultSocketUrl, storageKeys } from './config';

export async function login(username, password) {
  const data = await apiRequest('/auth/admin/login', {
    method: 'POST',
    token: '',
    body: { username, password },
  });
  await saveAuth(data);
  return data;
}

export function listChatSessions(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`/admin/chat/sessions${query ? `?${query}` : ''}`, { timeoutMs: 20000 });
}

export function getChatSession(sessionCode) {
  return apiRequest(`/admin/chat/sessions/${sessionCode}`, { timeoutMs: 20000 });
}

export function sendAdminMessage(sessionCode, message) {
  return apiRequest(`/admin/chat/sessions/${sessionCode}/messages`, {
    method: 'POST',
    body: { message },
    timeoutMs: 20000,
  });
}

export function markAdminRead(sessionCode) {
  return apiRequest(`/admin/chat/sessions/${sessionCode}/read`, {
    method: 'PATCH',
    timeoutMs: 10000,
  });
}

export function translateText({ text, sourceLanguage = 'auto', targetLanguage }) {
  return apiRequest('/ai/translate', {
    method: 'POST',
    token: '',
    body: { text, sourceLanguage, targetLanguage },
    timeoutMs: 12000,
  });
}

export async function connectAdminSocket({ onMessage, onSession, onError }) {
  const token = await getToken();
  const socketUrl = (await AsyncStorage.getItem(storageKeys.socketUrl)) || defaultSocketUrl;
  const socket = io(socketUrl, {
    autoConnect: true,
    transports: ['websocket', 'polling'],
    auth: { token },
  });

  socket.on('connect', () => {
    socket.emit('admin:join', { token });
  });
  socket.on('chat:message', onMessage);
  socket.on('admin:new_session', onSession);
  socket.on('chat:error', onError);
  socket.on('connect_error', (error) => onError?.({ message: error.message || 'Socket connection failed' }));

  return socket;
}
