import { imagesWithMobileVariant } from './mobileImageManifest.js';

// Breakpoint khop voi Tailwind `lg` — duoi nguong nay dung ban mobile, tu nguong tro len luon dung anh goc.
export const MOBILE_MEDIA_QUERY = '(max-width: 1023.98px)';

export function getMobileVariant(src) {
  if (typeof src !== 'string' || !imagesWithMobileVariant.has(src)) return null;
  const match = src.match(/^(.*)\.(webp|jpe?g|png)$/i);
  return match ? `${match[1]}-mobile.webp` : null;
}
