import { apiRequest } from './apiClient.js';

export async function getPhoneVerificationConfig() {
  return apiRequest('/phone-verification/config', { timeoutMs: 8000 });
}

export async function requestPhoneOtp({ phoneCode, phoneNumber }) {
  return apiRequest('/phone-verification/request', {
    method: 'POST',
    body: { phoneCode, phoneNumber },
    timeoutMs: 15000,
  });
}

export async function verifyPhoneOtp({ phoneCode, phoneNumber, challengeId, code }) {
  return apiRequest('/phone-verification/verify', {
    method: 'POST',
    body: { phoneCode, phoneNumber, challengeId, code },
    timeoutMs: 15000,
  });
}
