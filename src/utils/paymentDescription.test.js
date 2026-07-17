import { describe, expect, it } from 'vitest';
import { buildPayosDescription } from '../../server/src/modules/payments/paymentDescription.js';

describe('buildPayosDescription', () => {
  it('uses the guest middle and final names followed by chuyen tien', () => {
    expect(buildPayosDescription({ guest: { fullName: 'Dang Trung Vuong' } }))
      .toBe('trung vuong chuyen tien');
    expect(buildPayosDescription({ guest: { fullName: 'Nguyen Dang Vuong' } }))
      .toBe('dang vuong chuyen tien');
  });

  it('removes unsupported punctuation and keeps descriptions within PayOS limits', () => {
    expect(buildPayosDescription({ guest: { fullName: '  An @ Lune  ' } }))
      .toBe('an lune chuyen tien');
    expect(buildPayosDescription({})).toBe('khach chuyen tien');
    expect(buildPayosDescription({ guest: { fullName: 'Tran Nguyen AlexanderLongName' } }))
      .toBe('nguyen alexan chuyen tien');
    expect(buildPayosDescription({ guest: { fullName: 'Tran Nguyen AlexanderLongName' } })).toHaveLength(25);
  });
});
