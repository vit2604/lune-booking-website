import { describe, expect, it } from 'vitest';
import { buildPayosDescription } from '../../server/src/modules/payments/paymentDescription.js';

describe('buildPayosDescription', () => {
  it('uses the full guest name followed by chuyen tien', () => {
    expect(buildPayosDescription({ guest: { fullName: 'Dang Trung Vuong' } }))
      .toBe('Dang Trung Vuong chuyen tien');
    expect(buildPayosDescription({ guest: { fullName: 'Nguyen Dang Vuong' } }))
      .toBe('Nguyen Dang Vuong chuyen tien');
    expect(buildPayosDescription({ guest: { fullName: 'Nguyen AlexanderLongName' } }))
      .toBe('Nguyen AlexanderLongName chuyen tien');
  });

  it('removes unsupported punctuation without truncating the guest name', () => {
    expect(buildPayosDescription({ guest: { fullName: '  An @ Lune  ' } }))
      .toBe('An Lune chuyen tien');
    expect(buildPayosDescription({})).toBe('Khach chuyen tien');
  });
});
