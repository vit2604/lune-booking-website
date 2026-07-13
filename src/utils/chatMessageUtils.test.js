import { describe, expect, it } from 'vitest';
import { appendWaitingMessage, mergeChatMessages, receiveChatMessage } from './chatMessageUtils.js';

const wait = (id, createdAt) => ({ id, senderType: 'SYSTEM', createdAt });

describe('customer chat waiting message', () => {
  it('keeps only the latest waiting message after repeated guest messages', () => {
    const first = appendWaitingMessage([], wait('wait-1', '2026-07-13T10:00:00Z'));
    const second = appendWaitingMessage(first, wait('wait-2', '2026-07-13T10:01:00Z'));

    expect(second.filter((message) => message.senderType === 'SYSTEM')).toEqual([
      wait('wait-2', '2026-07-13T10:01:00Z'),
    ]);
  });

  it('removes the waiting message when staff replies', () => {
    const messages = [wait('wait-1', '2026-07-13T10:00:00Z')];
    const result = receiveChatMessage(messages, {
      id: 'admin-1',
      senderType: 'ADMIN',
      createdAt: '2026-07-13T10:01:00Z',
    });

    expect(result.some((message) => message.senderType === 'SYSTEM')).toBe(false);
  });

  it('does not restore a stale waiting message during refresh', () => {
    const result = mergeChatMessages(
      [{ id: 'admin-1', senderType: 'ADMIN', createdAt: '2026-07-13T10:01:00Z' }],
      [wait('wait-1', '2026-07-13T10:00:00Z')],
    );

    expect(result.some((message) => message.senderType === 'SYSTEM')).toBe(false);
  });
});
