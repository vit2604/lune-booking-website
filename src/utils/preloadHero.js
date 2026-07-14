import { MOBILE_MEDIA_QUERY, getMobileVariant } from './responsiveImage.js';

const HERO_IMAGE = '/images/lune/exterior/exterior-1.webp';

// Chay som trong main.jsx: bat dau tai anh hero cua trang chu truoc khi chunk HomePage load xong.
// Chi preload tren trang chu de khong ton bang thong khi khach vao thang cac trang khac.
export function preloadHomeHeroImage() {
  if (typeof window === 'undefined' || window.location.pathname !== '/') return;
  const isMobileViewport = window.matchMedia(MOBILE_MEDIA_QUERY).matches;
  const href = isMobileViewport ? getMobileVariant(HERO_IMAGE) ?? HERO_IMAGE : HERO_IMAGE;
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.fetchPriority = 'high';
  link.href = href;
  document.head.appendChild(link);
}
