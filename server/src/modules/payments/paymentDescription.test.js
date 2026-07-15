import { describe, expect, it } from 'vitest';
import { buildPayosDescription } from './paymentDescription.js';

describe('buildPayosDescription', () => {
  it('uses an ASCII guest name and short transfer suffix', () => {
    expect(buildPayosDescription({ guest: { fullName: 'Nguyễn Đăng Vương' } }))
      .toBe('Nguyen Dang Vuong ck');
  });

  it('keeps PayOS descriptions within the 25-character limit', () => {
    expect(buildPayosDescription({ guest: { fullName: '  An @ Lune  ' } }))
      .toBe('An Lune ck');
    expect(buildPayosDescription({ guest: { fullName: 'Nguyen AlexanderLongName' } }))
      .toBe('Nguyen AlexanderLongNa ck');
    expect(buildPayosDescription({})).toBe('Khach ck');
    expect(buildPayosDescription({ guest: { fullName: 'Nguyen AlexanderLongName' } })).toHaveLength(25);
  });
});
