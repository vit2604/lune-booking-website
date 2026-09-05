import { Router } from 'express';
import { telegramWebhook } from './chatTelegramWebhook.controller.js';

export const telegramChatWebhookRouter = Router();
telegramChatWebhookRouter.post('/telegram/chat', telegramWebhook);
