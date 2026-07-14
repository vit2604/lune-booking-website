import { describe, expect, it } from 'vitest';
import { getMobileVariant } from './responsiveImage.js';

describe('getMobileVariant', () => {
  it('tra ve duong dan -mobile.webp cho anh co trong manifest', () => {
    expect(getMobileVariant('/images/lune/exterior/exterior-1.webp')).toBe(
      '/images/lune/exterior/exterior-1-mobile.webp',
    );
    expect(getMobileVariant('/images/lune/contact-sheet.jpg')).toBe('/images/lune/contact-sheet-mobile.webp');
  });

  it('tra ve null cho anh khong co ban mobile hoac nguon ngoai', () => {
    expect(getMobileVariant('/images/lune/logo-lune.png')).toBeNull();
    expect(getMobileVariant('https://example.com/photo.webp')).toBeNull();
    expect(getMobileVariant(undefined)).toBeNull();
  });
});
