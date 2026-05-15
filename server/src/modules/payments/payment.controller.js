import { sendSuccess } from '../../utils/responseUtils.js';
import {
  createPaymentRequest,
  getEnabledPaymentMethods,
  getPaymentSettings,
  savePaymentSettings,
  verifyPaymentMock,
} from './payment.service.js';

export async function publicPaymentMethods(_req, res) {
  sendSuccess(res, await getEnabledPaymentMethods());
}

export async function adminPaymentSettings(_req, res) {
  sendSuccess(res, await getPaymentSettings());
}

export async function adminSavePaymentSettings(req, res) {
  sendSuccess(res, await savePaymentSettings(req.body), 'Payment settings saved');
}

export async function createPayment(req, res) {
  sendSuccess(res, await createPaymentRequest(req.body), 'Payment request created', 201);
}

export async function verifyPayment(req, res) {
  sendSuccess(res, await verifyPaymentMock(req.body.bookingCode));
}

export function paymentWebhook(req, res) {
  sendSuccess(res, {
    provider: req.params.provider,
    received: true,
    note: 'Webhook placeholder. Production must verify signatures and update payment status server-side.',
  });
}
