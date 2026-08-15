import { describe, expect, it } from 'vitest';
import { formatCurrency, getDisplayPriceText } from './currencyUtils.js';

describe('currency display', () => {
  it('uses explicit currency codes instead of ambiguous dollar symbols', () => {
    expect(formatCurrency(917, 'TWD')).toBe('TWD 917');
    expect(formatCurrency(29, 'USD')).toBe('USD 29');
    expect(formatCurrency(43, 'AUD')).toBe('AUD 43');
  });

  it('shows the selected currency as the primary room price', () => {
    expect(getDisplayPriceText(715000, 'TWD')).toBe('≈ TWD 917');
    expect(getDisplayPriceText(715000, 'VND')).toBe('715,000 VND');
  });
});
