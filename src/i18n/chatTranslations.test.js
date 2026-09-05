import { describe, expect, it } from 'vitest';
import ar from './locales/ar.js';
import de from './locales/de.js';
import en from './locales/en.js';
import es from './locales/es.js';
import fr from './locales/fr.js';
import hi from './locales/hi.js';
import id from './locales/id.js';
import italian from './locales/it.js';
import ja from './locales/ja.js';
import ko from './locales/ko.js';
import ms from './locales/ms.js';
import ru from './locales/ru.js';
import th from './locales/th.js';
import vi from './locales/vi.js';
import zhTw from './locales/zh-TW.js';
import zh from './locales/zh.js';

const locales = { ar, de, en, es, fr, hi, id, it: italian, ja, ko, ms, ru, th, vi, 'zh-TW': zhTw, zh };

const requiredKeys = [
  'chatWithUs',
  'luneSupport',
  'usuallyReplies',
  'startConversation',
  'typeMessage',
  'send',
  'close',
  'quickBookRoom',
  'quickAvailability',
  'quickEarlyCheckIn',
  'quickPayment',
  'quickBookingHelp',
];

const customerFacingKeys = [
  'chatWithUs',
  'usuallyReplies',
  'startConversation',
  'typeMessage',
  'send',
  'quickBookRoom',
  'quickAvailability',
  'quickEarlyCheckIn',
  'quickPayment',
  'quickBookingHelp',
];

describe('chat translations', () => {
  Object.entries(locales).forEach(([code, locale]) => {
    it(`${code} provides every visible chat label`, () => {
      requiredKeys.forEach((key) => {
        expect(locale.chat[key], key).toBeTypeOf('string');
        expect(locale.chat[key].trim(), key).not.toBe('');
      });
    });
  });

  Object.entries(locales)
    .filter(([code]) => code !== 'en')
    .forEach(([code, locale]) => {
      it(`${code} does not fall back to English customer-facing chat copy`, () => {
      customerFacingKeys.forEach((key) => {
        expect(locale.chat[key], key).not.toBe(en.chat[key]);
      });
      });
    });
});
