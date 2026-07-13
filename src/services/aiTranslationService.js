import { apiRequest } from './apiClient.js';

const languageAliases = {
  'zh-TW': 'zh-TW',
  zh: 'zh-CN',
  ko: 'ko',
  ja: 'ja',
  vi: 'vi',
  en: 'en',
  th: 'th',
  ru: 'ru',
  fr: 'fr',
  de: 'de',
  es: 'es',
  it: 'it',
  id: 'id',
  ms: 'ms',
  ar: 'ar',
  hi: 'hi',
};

const sameText = (text, targetLanguage, sourceLanguage = 'auto') => ({
  originalText: text,
  translatedText: text,
  sourceLanguage,
  targetLanguage,
  provider: 'local-original',
  translated: false,
});

const knownPhrases = {
  vi: {
    'i want to book a room': 'Khách muốn đặt phòng.',
    'do you have availability?': 'Khách hỏi khách sạn còn phòng không.',
    'can i check in early?': 'Khách hỏi có thể nhận phòng sớm không.',
    'how can i pay?': 'Khách hỏi có thể thanh toán bằng cách nào.',
    'i need help with my booking': 'Khách cần hỗ trợ về đặt phòng.',
    '예약하고 싶습니다': 'Khách muốn đặt phòng.',
    '객실이 있나요?': 'Khách hỏi còn phòng không.',
    '조기 체크인이 가능한가요?': 'Khách hỏi có thể nhận phòng sớm không.',
    '결제는 어떻게 하나요?': 'Khách hỏi có thể thanh toán bằng cách nào.',
    '예약 도움이 필요합니다': 'Khách cần hỗ trợ về đặt phòng.',
    '我想订房': 'Khách muốn đặt phòng.',
    '有空房吗?': 'Khách hỏi còn phòng không.',
    '可以提前入住吗?': 'Khách hỏi có thể nhận phòng sớm không.',
    '怎么付款?': 'Khách hỏi có thể thanh toán bằng cách nào.',
    'мне нужна помощь с бронированием': 'Khách cần hỗ trợ về đặt phòng.',
  },
  ko: {
    'xin quý khách hãy chờ trong giây lát. đội ngũ lune sẽ phản hồi ngay.':
      '잠시만 기다려 주세요. Lune 팀이 곧 답변드리겠습니다.',
    'chúng tôi đã nhận được tin nhắn của quý khách. vui lòng chờ trong giây lát.':
      '메시지를 받았습니다. 잠시만 기다려 주세요.',
    'khách muốn đặt phòng.': '객실 예약을 원하십니다.',
    'khách hỏi khách sạn còn phòng không.': '객실 가능 여부를 문의하셨습니다.',
  },
  zh: {
    'xin quý khách hãy chờ trong giây lát. đội ngũ lune sẽ phản hồi ngay.':
      '请稍候，Lune 团队会尽快回复您。',
    'chúng tôi đã nhận được tin nhắn của quý khách. vui lòng chờ trong giây lát.':
      '我们已收到您的消息，请稍候。',
  },
  ru: {
    'xin quý khách hãy chờ trong giây lát. đội ngũ lune sẽ phản hồi ngay.':
      'Пожалуйста, подождите немного. Команда Lune скоро ответит.',
    'chúng tôi đã nhận được tin nhắn của quý khách. vui lòng chờ trong giây lát.':
      'Мы получили ваше сообщение. Пожалуйста, подождите немного.',
  },
  en: {
    'xin quý khách hãy chờ trong giây lát. đội ngũ lune sẽ phản hồi ngay.':
      'Please wait a moment. The Lune team will reply shortly.',
    'chúng tôi đã nhận được tin nhắn của quý khách. vui lòng chờ trong giây lát.':
      'We have received your message. Please wait a moment.',
  },
};

function normalizeLanguage(language) {
  return languageAliases[language] || language || 'auto';
}

export function detectMessageLanguage(text = '') {
  if (/[\uac00-\ud7af]/.test(text)) return 'ko';
  if (/[\u3040-\u30ff]/.test(text)) return 'ja';
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  if (/[\u0e00-\u0e7f]/.test(text)) return 'th';
  if (/[\u0400-\u04ff]/.test(text)) return 'ru';
  if (/[\u0600-\u06ff]/.test(text)) return 'ar';
  if (/[ăâđêôơưáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(text)) {
    return 'vi';
  }
  return 'en';
}

function parseGooglePayload(payload) {
  const translatedText = Array.isArray(payload?.[0])
    ? payload[0].map((part) => part?.[0] || '').join('')
    : '';
  return {
    translatedText,
    detectedLanguage: payload?.[2] || '',
  };
}

async function translateWithPublicProvider(text, targetLanguage, sourceLanguage = 'auto') {
  const normalizedTarget = normalizeLanguage(targetLanguage);
  const normalizedSource = sourceLanguage === 'auto' ? 'auto' : normalizeLanguage(sourceLanguage);
  const params = new URLSearchParams({
    client: 'gtx',
    sl: normalizedSource,
    tl: normalizedTarget,
    dt: 't',
    q: text,
  });
  const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params.toString()}`);
  if (!response.ok) throw new Error(`Translation provider failed: ${response.status}`);
  const payload = await response.json();
  const result = parseGooglePayload(payload);
  if (!result.translatedText) throw new Error('Translation provider returned empty text');
  return {
    originalText: text,
    translatedText: result.translatedText,
    sourceLanguage: result.detectedLanguage || (sourceLanguage === 'auto' ? detectMessageLanguage(text) : sourceLanguage),
    targetLanguage: normalizedTarget,
    provider: 'google-public-client',
    translated: result.translatedText !== text,
  };
}

function localPhraseTranslate(text, targetLanguage, sourceLanguage = 'auto') {
  const normalized = String(text || '').trim().toLowerCase();
  const translatedText = knownPhrases[targetLanguage]?.[normalized];
  if (!translatedText) return sameText(text, targetLanguage, sourceLanguage);
  return {
    originalText: text,
    translatedText,
    sourceLanguage: sourceLanguage === 'auto' ? detectMessageLanguage(text) : sourceLanguage,
    targetLanguage,
    provider: 'local-phrasebook',
    translated: true,
  };
}

export async function translateText(text, targetLanguage, sourceLanguage = 'auto') {
  const cleanText = String(text || '').trim();
  const normalizedTarget = normalizeLanguage(targetLanguage);
  const normalizedSource = sourceLanguage === 'auto' ? 'auto' : normalizeLanguage(sourceLanguage);
  if (!cleanText) return sameText('', normalizedTarget, normalizedSource);
  if (normalizedSource !== 'auto' && normalizedSource === normalizedTarget) {
    return sameText(cleanText, normalizedTarget, normalizedSource);
  }

  try {
    return await apiRequest('/ai/translate', {
      method: 'POST',
      body: { text: cleanText, sourceLanguage: normalizedSource, targetLanguage: normalizedTarget },
      timeoutMs: 7000,
    });
  } catch (apiError) {
    try {
      return await translateWithPublicProvider(cleanText, normalizedTarget, normalizedSource);
    } catch (_providerError) {
      const fallback = localPhraseTranslate(cleanText, normalizedTarget, normalizedSource);
      return fallback.translated
        ? fallback
        : {
            ...fallback,
            warning: apiError.message || 'Translation provider unavailable.',
          };
    }
  }
}

export async function translateForAdmin(message, guestLanguage = 'auto') {
  return translateText(message, 'vi', guestLanguage || 'auto');
}

export async function translateForGuest(message, guestLanguage = 'en') {
  return translateText(message, guestLanguage || 'en', 'vi');
}
