import { Router } from 'express';
import { phoneOtpRateLimit } from '../../middlewares/rateLimitMiddleware.js';
import { validate } from '../../middlewares/validateMiddleware.js';
import { phoneVerificationConfig, requestOtp, verifyOtp } from './phoneVerification.controller.js';
import { phoneOtpRequestSchema, phoneOtpVerifySchema } from './phoneVerification.validation.js';

export const phoneVerificationRouter = Router();

phoneVerificationRouter.get('/config', phoneVerificationConfig);
phoneVerificationRouter.post('/request', phoneOtpRateLimit, validate(phoneOtpRequestSchema), requestOtp);
phoneVerificationRouter.post('/verify', phoneOtpRateLimit, validate(phoneOtpVerifySchema), verifyOtp);
