import { describe, expect, it } from 'vitest';
import { isValidPhoneNumber, parseValidPhoneNumber } from './phoneValidation.js';

describe('server phone validation', () => {
  it('validates national numbers against their selected country', () => {
    expect(isValidPhoneNumber({ phoneCode: '+84', country: 'Vietnam', phoneNumber: '0901234567' })).toBe(true);
    expect(isValidPhoneNumber({ phoneCode: '+84', country: 'France', phoneNumber: '0901234567' })).toBe(true);
    expect(isValidPhoneNumber({ phoneCode: '+84', country: 'Vietnam', phoneNumber: '12345' })).toBe(false);
  });

  it('normalizes valid numbers to E.164', () => {
    expect(parseValidPhoneNumber({ phoneCode: '+44 United Kingdom', phoneNumber: '020 7946 0018' })?.number)
      .toBe('+442079460018');
  });
});
