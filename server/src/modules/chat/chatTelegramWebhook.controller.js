import { timingSafeEqual } from 'node:crypto';
import { env } from '../../config/env.js';
import { translateText } from '../ai/ai.service.js';
import { getSessionByCode, sendAdminMessage } from './chat.service.js';
import { sendTelegramStatus, sessionCodeFromTelegramReply } from './chatNotification.service.js';

function secretMatches(received = '') {
  const expected = env.TELEGRAM_WEBHOOK_SECRET || '';
  const receivedBuffer = Buffer.from(String(received));
  const expectedBuffer = Buffer.from(expected);
  return Boolean(expected && receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer));
}

export function telegramWebhook(req, res) {
  if (!secretMatches(req.get('x-telegram-bot-api-secret-token'))) return res.sendStatus(401);
  res.sendStatus(200);
  void handleTelegramReply(req.app.get('io'), req.body)
    .catch((error) => console.warn('Telegram chat reply failed:', error.message));
}

export async function handleTelegramReply(io, update = {}) {
  const telegramMessage = update.message;
  if (!telegramMessage?.text || telegramMessage.from?.is_bot) return false;
  if (String(telegramMessage.chat?.id) !== String(env.TELEGRAM_CHAT_ID)) return false;

  const sessionCode = sessionCodeFromTelegramReply(telegramMessage);
  if (!sessionCode) return false;
  const session = await getSessionByCode(sessionCode);
  const translated = await translateText({
    text: telegramMessage.text,
    sourceLanguage: 'vi',
    targetLanguage: session.language || 'en',
  });
  if (translated.provider === 'fallback-original') {
    await sendTelegramStatus('Khong dich duoc tin nhan. Chua gui cho khach, vui long thu lai.', telegramMessage.message_id);
    return false;
  }
  const outgoingText = translated.translatedText || telegramMessage.text;
  const created = await sendAdminMessage(sessionCode, outgoingText, 'Lune Telegram');
  const payload = { ...created, sessionCode };
  io?.to(`chat:${sessionCode}`).emit('chat:message', payload);
  io?.to('admin:support').emit('chat:message', payload);

  const languageNote = translated.translated
    ? `Da dich sang ${session.language} va gui cho khach.`
    : 'Da gui cho khach.';
  await sendTelegramStatus(languageNote, telegramMessage.message_id);
  return true;
}
