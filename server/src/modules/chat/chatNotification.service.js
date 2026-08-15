import { env } from '../../config/env.js';

const telegramApiBaseUrl = 'https://api.telegram.org';

function isTelegramConfigured() {
  return Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID);
}

function compactText(value, maxLength = 700) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 3)}...`;
}

function buildTelegramMessage(message) {
  const guestName = message.senderName || 'Guest';
  const lines = [
    'Tin nhan moi tu website Lune',
    `Khach: ${guestName}`,
    `Ma chat: ${message.sessionCode}`,
  ];

  if (message.message && message.message !== '[Image]') lines.push(`Noi dung: ${compactText(message.message)}`);
  if (message.attachmentData) lines.push('Khach da gui 1 hinh anh');

  if (env.TELEGRAM_CHAT_ADMIN_URL) {
    const separator = env.TELEGRAM_CHAT_ADMIN_URL.includes('?') ? '&' : '?';
    lines.push(`Mo admin: ${env.TELEGRAM_CHAT_ADMIN_URL}${separator}session=${encodeURIComponent(message.sessionCode)}`);
  }

  return lines.join('\n');
}

export async function notifyGuestChatMessage(message) {
  if (!isTelegramConfigured()) return;

  try {
    let response;
    if (message.attachmentData) {
      const match = String(message.attachmentData).match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
      if (!match) throw new Error('Invalid chat image payload');
      const form = new FormData();
      form.append('chat_id', env.TELEGRAM_CHAT_ID);
      form.append('caption', compactText(buildTelegramMessage(message), 1000));
      form.append('photo', new Blob([Buffer.from(match[2], 'base64')], { type: match[1] }), 'guest-image.webp');
      response = await fetch(`${telegramApiBaseUrl}/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        body: form,
      });
    } else {
      response = await fetch(`${telegramApiBaseUrl}/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text: buildTelegramMessage(message),
          disable_web_page_preview: true,
        }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('Telegram chat notification failed:', response.status, compactText(errorText, 300));
    }
  } catch (error) {
    console.warn('Telegram chat notification failed:', error.message);
  }
}
