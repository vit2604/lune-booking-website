import { sendSuccess } from '../../utils/responseUtils.js';
import {
  createPaymentRequest,
  getEnabledPaymentMethods,
  getPaymentSettings,
  handlePayosWebhook,
  savePaymentSettings,
  verifyPaymentStatus,
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
  sendSuccess(res, await verifyPaymentStatus(req.body.bookingCode, {
    forceBluejaySync: Boolean(req.body.forceBluejaySync),
  }));
}

export async function paymentWebhook(req, res) {
  if (String(req.params.provider || '').toLowerCase() === 'payos') {
    sendSuccess(res, await handlePayosWebhook(req.body), 'PayOS webhook received');
    return;
  }

  sendSuccess(res, {
    provider: req.params.provider,
    received: true,
    note: 'Webhook placeholder. Production must verify signatures and update payment status server-side.',
  });
}
