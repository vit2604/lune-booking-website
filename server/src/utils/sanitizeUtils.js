const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function cleanText(value, maxLength = 1000) {
  return String(value || '')
    .replace(CONTROL_CHARS, '')
    .trim()
    .slice(0, maxLength);
}

export function sanitizePublicAssetUrl(value, { allowDataImage = true, maxLength = 250000 } = {}) {
  const url = cleanText(value, maxLength);
  if (!url) return '';
  if (url.startsWith('/images/')) return url;
  if (allowDataImage && url.startsWith('data:image/')) return url;

  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:') return parsed.toString();
    if (
      process.env.NODE_ENV !== 'production' &&
      parsed.protocol === 'http:' &&
      ['localhost', '127.0.0.1'].includes(parsed.hostname)
    ) {
      return parsed.toString();
    }
  } catch {
    return '';
  }

  return '';
}
