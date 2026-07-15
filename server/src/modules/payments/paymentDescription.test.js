import { describe, expect, it } from 'vitest';
import { buildPayosDescription } from './paymentDescription.js';

describe('buildPayosDescription', () => {
  it('uses the final guest name followed by chuyen tien', () => {
    expect(buildPayosDescription({ guest: { fullName: 'Nguyễn Đăng Vương' } }))
      .toBe('Vuong chuyen tien');
  });

  it('removes unsupported punctuation without truncating the final name', () => {
    expect(buildPayosDescription({ guest: { fullName: '  An @ Lune  ' } }))
      .toBe('Lune chuyen tien');
    expect(buildPayosDescription({ guest: { fullName: 'Nguyen AlexanderLongName' } }))
      .toBe('AlexanderLongName chuyen tien');
    expect(buildPayosDescription({})).toBe('Khach chuyen tien');
  });
});
