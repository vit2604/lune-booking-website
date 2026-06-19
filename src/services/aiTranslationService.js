import { apiRequest } from './apiClient.js';

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
    'i want to book a room': 'Tôi muốn đặt phòng.',
    'do you have availability?': 'Khách hỏi khách sạn còn phòng không.',
    'can i check in early?': 'Khách hỏi có thể nhận phòng sớm không.',
    'how can i pay?': 'Khách hỏi có thể thanh toán bằng cách nào.',
    'i need help with my booking': 'Khách cần hỗ trợ về đặt phòng.',
    '예약하고 싶습니다': 'Khách muốn đặt phòng.',
    '객실이 있나요?': 'Khách hỏi còn phòng không.',
    '조기 체크인이 가능한가요?': 'Khách hỏi có thể nhận phòng sớm không.',
    '결제는 어떻게 하나요?': 'Khách hỏi có thể thanh toán bằng cách nào.',
    '예약 도움이 필요합니다': 'Khách cần hỗ trợ về đặt phòng.',
  },
  ko: {
    'xin quý khách hãy chờ trong giây lát. đội ngũ lune sẽ phản hồi ngay.':
      '잠시만 기다려 주세요. Lune 팀이 곧 답변드리겠습니다.',
    'chúng tôi đã nhận được tin nhắn của quý khách. vui lòng chờ trong giây lát.':
      '메시지를 받았습니다. 잠시만 기다려 주세요.',
  },
  en: {
    'xin quý khách hãy chờ trong giây lát. đội ngũ lune sẽ phản hồi ngay.':
      'Please wait a moment. The Lune team will reply shortly.',
  },
};

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
  if (!cleanText) return sameText('', targetLanguage, sourceLanguage);
  if (sourceLanguage !== 'auto' && sourceLanguage === targetLanguage) {
    return sameText(cleanText, targetLanguage, sourceLanguage);
  }

  try {
    return await apiRequest('/ai/translate', {
      method: 'POST',
      body: { text: cleanText, sourceLanguage, targetLanguage },
      timeoutMs: 7000,
    });
  } catch (_error) {
    return localPhraseTranslate(cleanText, targetLanguage, sourceLanguage);
  }
}

export async function translateForAdmin(message, guestLanguage = 'auto') {
  return translateText(message, 'vi', guestLanguage || 'auto');
}

export async function translateForGuest(message, guestLanguage = 'en') {
  return translateText(message, guestLanguage || 'en', 'vi');
}
