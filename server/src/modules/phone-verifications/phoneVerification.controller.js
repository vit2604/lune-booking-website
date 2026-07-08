import { sendSuccess } from '../../utils/responseUtils.js';
import { getPhoneVerificationConfig, requestPhoneOtp, verifyPhoneOtp } from './phoneVerification.service.js';

export async function phoneVerificationConfig(_req, res) {
  return sendSuccess(res, getPhoneVerificationConfig());
}

export async function requestOtp(req, res, next) {
  try {
    return sendSuccess(res, await requestPhoneOtp(req.validated.body), 'OTP sent');
  } catch (error) {
    return next(error);
  }
}

export async function verifyOtp(req, res, next) {
  try {
    return sendSuccess(res, await verifyPhoneOtp(req.validated.body), 'Phone verified');
  } catch (error) {
    return next(error);
  }
}
