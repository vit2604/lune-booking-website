import { storageKeys } from '../constants/storageKeys.js';

const MAX_CACHED_MESSAGES = 100;

function storageAvailable() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function readCachedChatMessages(sessionCode) {
  if (!storageAvailable() || !sessionCode) return [];
  try {
    const cache = JSON.parse(window.localStorage.getItem(storageKeys.chatMessageCache) || '{}');
    return Array.isArray(cache?.[sessionCode]?.messages) ? cache[sessionCode].messages : [];
  } catch {
    return [];
  }
}

export function cacheChatMessages(sessionCode, messages) {
  if (!storageAvailable() || !sessionCode || !Array.isArray(messages)) return;
  try {
    const cache = JSON.parse(window.localStorage.getItem(storageKeys.chatMessageCache) || '{}');
    const durableMessages = messages
      .filter((message) => (
        !String(message?.id || '').startsWith('pending-')
        && !message?.attachmentData
      ))
      .slice(-MAX_CACHED_MESSAGES);
    window.localStorage.setItem(storageKeys.chatMessageCache, JSON.stringify({
      ...cache,
      [sessionCode]: { messages: durableMessages, updatedAt: new Date().toISOString() },
    }));
  } catch {
    // Chat still works when storage is blocked or full; the API remains authoritative.
  }
}

export function clearChatPersistence(sessionCode) {
  if (!storageAvailable()) return;
  window.localStorage.removeItem(storageKeys.chatSessionCode);
  window.localStorage.removeItem(storageKeys.chatDraft);
  if (!sessionCode) return;
  try {
    const cache = JSON.parse(window.localStorage.getItem(storageKeys.chatMessageCache) || '{}');
    delete cache[sessionCode];
    window.localStorage.setItem(storageKeys.chatMessageCache, JSON.stringify(cache));
  } catch {
    window.localStorage.removeItem(storageKeys.chatMessageCache);
  }
}

export function readChatDraft() {
  if (!storageAvailable()) return '';
  return window.localStorage.getItem(storageKeys.chatDraft) || '';
}

export function saveChatDraft(value) {
  if (!storageAvailable()) return;
  if (value) window.localStorage.setItem(storageKeys.chatDraft, value);
  else window.localStorage.removeItem(storageKeys.chatDraft);
}
