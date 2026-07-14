import { describe, expect, it } from 'vitest';
import { validatePhoneNumber } from './phoneValidation.js';

describe('validatePhoneNumber', () => {
  it('accepts valid local and international Vietnamese numbers', () => {
    expect(validatePhoneNumber({ phoneCode: '+84 Vietnam', phoneNumber: '090 123 4567' })).toBe(true);
    expect(validatePhoneNumber({ phoneCode: '+84 Vietnam', phoneNumber: '+84901234567' })).toBe(true);
  });

  it('rejects invalid lengths and country-code mismatches', () => {
    expect(validatePhoneNumber({ phoneCode: '+84 Vietnam', phoneNumber: '12345' })).toBe(false);
    expect(validatePhoneNumber({ phoneCode: '+84 Vietnam', phoneNumber: '+12025550123' })).toBe(false);
  });

  it('validates numbers using the selected country rules', () => {
    expect(validatePhoneNumber({ phoneCode: '+1 United States/Canada', phoneNumber: '202-555-0123' })).toBe(true);
    expect(validatePhoneNumber({ phoneCode: '+65 Singapore', phoneNumber: '8123 4567' })).toBe(true);
    expect(validatePhoneNumber({ phoneCode: '+91 India', phoneNumber: '1111111111' })).toBe(false);
  });

  it('requires an international number when Other is selected', () => {
    expect(validatePhoneNumber({ phoneCode: 'Other', phoneNumber: '+358401234567' })).toBe(true);
    expect(validatePhoneNumber({ phoneCode: 'Other', phoneNumber: '0401234567' })).toBe(false);
  });
});
