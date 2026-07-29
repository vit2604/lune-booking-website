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
    `Noi dung: ${compactText(message.message)}`,
  ];

  if (env.TELEGRAM_CHAT_ADMIN_URL) {
    const separator = env.TELEGRAM_CHAT_ADMIN_URL.includes('?') ? '&' : '?';
    lines.push(`Mo admin: ${env.TELEGRAM_CHAT_ADMIN_URL}${separator}session=${encodeURIComponent(message.sessionCode)}`);
  }

  return lines.join('\n');
}

export async function notifyGuestChatMessage(message) {
  if (!isTelegramConfigured()) return;

  try {
    const response = await fetch(`${telegramApiBaseUrl}/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: buildTelegramMessage(message),
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('Telegram chat notification failed:', response.status, compactText(errorText, 300));
    }
  } catch (error) {
    console.warn('Telegram chat notification failed:', error.message);
  }
}
