import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { storageKeys } from '../constants/storageKeys.js';
import {
  cacheChatMessages,
  clearChatPersistence,
  readCachedChatMessages,
  readChatDraft,
  saveChatDraft,
} from './chatPersistence.js';

describe('chat persistence', () => {
  beforeAll(() => {
    const values = new Map();
    vi.stubGlobal('localStorage', {
      clear: () => values.clear(),
      getItem: (key) => values.has(key) ? values.get(key) : null,
      removeItem: (key) => values.delete(key),
      setItem: (key, value) => values.set(key, String(value)),
    });
    vi.stubGlobal('window', { localStorage });
  });

  beforeEach(() => localStorage.clear());

  it('restores durable messages and excludes optimistic messages', () => {
    cacheChatMessages('CHAT-1', [
      { id: 'saved', message: 'hello' },
      { id: 'pending-1', message: 'sending' },
      { id: 'image', message: '[Image]', attachmentData: 'data:image/webp;base64,large' },
    ]);
    expect(readCachedChatMessages('CHAT-1')).toEqual([{ id: 'saved', message: 'hello' }]);
  });

  it('keeps caches isolated by session', () => {
    cacheChatMessages('CHAT-1', [{ id: 'one' }]);
    cacheChatMessages('CHAT-2', [{ id: 'two' }]);
    expect(readCachedChatMessages('CHAT-1')).toEqual([{ id: 'one' }]);
    expect(readCachedChatMessages('CHAT-2')).toEqual([{ id: 'two' }]);
  });

  it('persists drafts and clears only the active session data', () => {
    localStorage.setItem(storageKeys.chatSessionCode, 'CHAT-1');
    cacheChatMessages('CHAT-1', [{ id: 'one' }]);
    cacheChatMessages('CHAT-2', [{ id: 'two' }]);
    saveChatDraft('unfinished');

    expect(readChatDraft()).toBe('unfinished');
    clearChatPersistence('CHAT-1');

    expect(localStorage.getItem(storageKeys.chatSessionCode)).toBeNull();
    expect(readChatDraft()).toBe('');
    expect(readCachedChatMessages('CHAT-1')).toEqual([]);
    expect(readCachedChatMessages('CHAT-2')).toEqual([{ id: 'two' }]);
  });
});
