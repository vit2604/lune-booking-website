import { useEffect } from 'react';

export const SITE_ORIGIN = 'https://www.luneboutiquedanang.com';
export const BRAND = 'Lune Boutique Hotel & Apartment Da Nang';
const DEFAULT_IMAGE = `${SITE_ORIGIN}/images/lune/exterior/exterior-1.webp`;

function setNameMeta(name, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setPropMeta(property, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setRobots(noindex) {
  let el = document.head.querySelector('meta[name="robots"]');
  if (noindex) {
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', 'robots');
      document.head.appendChild(el);
    }
    el.setAttribute('content', 'noindex, nofollow');
  } else if (el) {
    // Restore indexability when navigating from a noindex page to a public one.
    el.setAttribute('content', 'index, follow');
  }
}

/**
 * Keeps the document head in sync with the current route for an SPA: title,
 * description, canonical URL, Open Graph and Twitter tags, and robots.
 * No external dependency — upserts tags directly so navigation updates them.
 */
export default function useDocumentMeta({ title, description, path = '/', image, noindex = false }) {
  useEffect(() => {
    const fullTitle = title || BRAND;
    const url = `${SITE_ORIGIN}${path === '/' ? '/' : path.replace(/\/$/, '')}`;

    document.title = fullTitle;
    setNameMeta('description', description);
    setPropMeta('og:title', fullTitle);
    setPropMeta('og:description', description);
    setPropMeta('og:url', url);
    setPropMeta('og:image', image || DEFAULT_IMAGE);
    setNameMeta('twitter:title', fullTitle);
    setNameMeta('twitter:description', description);
    setCanonical(url);
    setRobots(noindex);
  }, [title, description, path, image, noindex]);
}
