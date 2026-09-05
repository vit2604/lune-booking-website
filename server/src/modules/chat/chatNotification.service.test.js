import { describe, expect, it } from 'vitest';
import { sessionCodeFromTelegramReply } from './chatNotification.service.js';

describe('Telegram chat reply mapping', () => {
  it('reads a session code from a replied text notification', () => {
    expect(sessionCodeFromTelegramReply({
      reply_to_message: { text: 'Tin nhan moi\nMa chat: CHAT-ABC-1234\nNoi dung: Xin chao' },
    })).toBe('CHAT-ABC-1234');
  });

  it('reads a session code from a replied photo caption', () => {
    expect(sessionCodeFromTelegramReply({
      reply_to_message: { caption: 'Khach gui anh\nMa chat: CHAT-IMAGE-9999' },
    })).toBe('CHAT-IMAGE-9999');
  });

  it('rejects standalone Telegram messages', () => {
    expect(sessionCodeFromTelegramReply({ text: 'hello' })).toBe('');
  });
});
