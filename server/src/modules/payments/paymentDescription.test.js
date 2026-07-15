import { describe, expect, it } from 'vitest';
import { buildPayosDescription } from './paymentDescription.js';

describe('buildPayosDescription', () => {
  it('uses the full guest name followed by chuyen tien', () => {
    expect(buildPayosDescription({ guest: { fullName: 'Nguyễn Đăng Vương' } }))
      .toBe('Nguyen Dang Vuong chuyen tien');
  });

  it('removes unsupported punctuation without truncating the guest name', () => {
    expect(buildPayosDescription({ guest: { fullName: '  An @ Lune  ' } }))
      .toBe('An Lune chuyen tien');
    expect(buildPayosDescription({ guest: { fullName: 'Nguyen AlexanderLongName' } }))
      .toBe('Nguyen AlexanderLongName chuyen tien');
    expect(buildPayosDescription({})).toBe('Khach chuyen tien');
  });
});
