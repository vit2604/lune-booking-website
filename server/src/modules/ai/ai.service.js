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

function normalizeLanguage(language) {
  return languageAliases[language] || language || 'auto';
}

function detectLanguageFallback(text = '') {
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

export async function translateText({ text, sourceLanguage = 'auto', targetLanguage }) {
  const cleanText = String(text || '').trim();
  const normalizedTarget = normalizeLanguage(targetLanguage);
  const normalizedSource = sourceLanguage === 'auto' ? 'auto' : normalizeLanguage(sourceLanguage);

  if (!cleanText) {
    return {
      originalText: '',
      translatedText: '',
      sourceLanguage: 'auto',
      targetLanguage: normalizedTarget,
      provider: 'empty',
      translated: false,
    };
  }

  if (normalizedSource !== 'auto' && normalizedSource === normalizedTarget) {
    return {
      originalText: cleanText,
      translatedText: cleanText,
      sourceLanguage: normalizedSource,
      targetLanguage: normalizedTarget,
      provider: 'same-language',
      translated: false,
    };
  }

  try {
    // Production note: replace this public provider with a backend-owned AI translation provider
    // such as OpenAI/Gemini/DeepL and keep provider keys only in backend environment variables.
    const params = new URLSearchParams({
      client: 'gtx',
      sl: normalizedSource,
      tl: normalizedTarget,
      dt: 't',
      q: cleanText,
    });
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params.toString()}`, {
      headers: { 'User-Agent': 'LuneBooking/1.0' },
    });
    if (!response.ok) throw new Error(`Translation provider failed: ${response.status}`);
    const payload = await response.json();
    const result = parseGooglePayload(payload);
    if (!result.translatedText) throw new Error('Translation provider returned empty text');
    return {
      originalText: cleanText,
      translatedText: result.translatedText,
      sourceLanguage: result.detectedLanguage || detectLanguageFallback(cleanText),
      targetLanguage: normalizedTarget,
      provider: 'google-public',
      translated: result.translatedText !== cleanText,
    };
  } catch (_error) {
    return {
      originalText: cleanText,
      translatedText: cleanText,
      sourceLanguage: detectLanguageFallback(cleanText),
      targetLanguage: normalizedTarget,
      provider: 'fallback-original',
      translated: false,
      warning: 'Translation provider unavailable. Showing original message.',
    };
  }
}
