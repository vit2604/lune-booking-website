import { Router } from 'express';
import { requireAdmin, requireAuth } from '../../middlewares/authMiddleware.js';
import { validate } from '../../middlewares/validateMiddleware.js';
import {
  adminPaymentSettings,
  adminSavePaymentSettings,
  createPayment,
  paymentWebhook,
  publicPaymentMethods,
  verifyPayment,
} from './payment.controller.js';
import { createPaymentSchema, paymentSettingsSchema, verifyPaymentSchema } from './payment.validation.js';

export const publicPaymentRouter = Router();
export const adminPaymentRouter = Router();
export const paymentWebhookRouter = Router();

publicPaymentRouter.get('/payment-methods', publicPaymentMethods);
publicPaymentRouter.post('/payments/create', validate(createPaymentSchema), createPayment);
publicPaymentRouter.post('/payments/verify', validate(verifyPaymentSchema), verifyPayment);

adminPaymentRouter.use(requireAuth, requireAdmin);
adminPaymentRouter.get('/payment-settings', adminPaymentSettings);
adminPaymentRouter.put('/payment-settings', validate(paymentSettingsSchema), adminSavePaymentSettings);

paymentWebhookRouter.post('/payment/:provider', paymentWebhook);
