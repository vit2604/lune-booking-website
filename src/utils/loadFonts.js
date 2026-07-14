const FONT_CSS_URL =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;500;600;700&display=swap';

// Gan stylesheet font tu JS de khong chan render (CSP chan inline onload handler).
// index.html da preload san file CSS nay nen khong ton them round-trip.
export function loadFonts() {
  if (typeof document === 'undefined') return;
  if (document.querySelector(`link[rel="stylesheet"][href="${FONT_CSS_URL}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = FONT_CSS_URL;
  document.head.appendChild(link);
}
