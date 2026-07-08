import { storageKeys, readJsonStorage, writeJsonStorage } from '../constants/storageKeys.js';
import { apiRequest } from './apiClient.js';

function localSessions() {
  return readJsonStorage(storageKeys.chatSessions, []);
}

function localMessages() {
  return readJsonStorage(storageKeys.chatMessages, []);
}

function saveLocalSessions(sessions) {
  writeJsonStorage(storageKeys.chatSessions, sessions);
  window.dispatchEvent(new Event('lune:chat-updated'));
}

function saveLocalMessages(messages) {
  writeJsonStorage(storageKeys.chatMessages, messages);
  window.dispatchEvent(new Event('lune:chat-updated'));
}

function createLocalSession(input = {}) {
  const session = {
    sessionCode: `LOCAL-${Date.now()}`,
    guestName: input.guestName || '',
    guestPhone: input.guestPhone || '',
    guestEmail: input.guestEmail || '',
    language: input.language || 'en',
    status: 'OPEN',
    unreadByAdmin: 0,
    unreadByGuest: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveLocalSessions([session, ...localSessions()]);
  return session;
}

export async function createChatSessionWithFallback(input = {}) {
  try {
    return { source: 'api', session: await apiRequest('/chat/sessions', { method: 'POST', body: input, timeoutMs: 15000 }) };
  } catch (_error) {
    return { source: 'local', session: createLocalSession(input) };
  }
}

export async function getChatMessagesWithFallback(sessionCode) {
  try {
    return { source: 'api', messages: await apiRequest(`/chat/sessions/${sessionCode}/messages`) };
  } catch (_error) {
    return { source: 'local', messages: localMessages().filter((message) => message.sessionCode === sessionCode) };
  }
}

export async function sendGuestMessageWithFallback(sessionCode, message, meta = {}) {
  try {
    return {
      source: 'api',
      message: await apiRequest(`/chat/sessions/${sessionCode}/messages`, {
        method: 'POST',
        body: { message, ...meta },
        timeoutMs: 15000,
      }),
    };
  } catch (_error) {
    // Continue with local demo storage if the backend or socket is unavailable.
  }

  const created = {
    id: crypto.randomUUID(),
    sessionCode,
    senderType: 'GUEST',
    sender: 'guest',
    message,
    text: message,
    createdAt: new Date().toISOString(),
    readByGuest: true,
    readByAdmin: false,
  };
  saveLocalMessages([...localMessages(), created]);
  saveLocalSessions(
    localSessions().map((session) =>
      session.sessionCode === sessionCode
        ? { ...session, unreadByAdmin: (session.unreadByAdmin || 0) + 1, updatedAt: created.createdAt }
        : session,
    ),
  );
  return { source: 'local', message: created };
}
