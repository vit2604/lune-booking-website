import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { prisma } from './config/prisma.js';
import { corsMiddleware } from './config/cors.js';
import { env } from './config/env.js';
import { authRateLimit } from './middlewares/rateLimitMiddleware.js';
import { errorMiddleware, notFoundMiddleware } from './middlewares/errorMiddleware.js';
import { requestContextMiddleware } from './middlewares/requestContextMiddleware.js';
import { aiRouter } from './modules/ai/ai.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { adminBluejayRouter } from './modules/bluejay/bluejay.routes.js';
import { adminBookingRouter, publicBookingRouter } from './modules/bookings/booking.routes.js';
import { adminChatRouter, publicChatRouter } from './modules/chat/chat.routes.js';
import { currencyRouter } from './modules/currency/currency.routes.js';
import { adminMediaRouter } from './modules/media/media.routes.js';
import { adminPaymentRouter, paymentWebhookRouter, publicPaymentRouter } from './modules/payments/payment.routes.js';
import { adminRateRouter } from './modules/rates/rate.routes.js';
import { adminRoomRouter, publicRoomRouter } from './modules/rooms/room.routes.js';
import { adminSettingRouter, publicSettingRouter } from './modules/settings/setting.routes.js';
import { sendSuccess } from './utils/responseUtils.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(corsMiddleware());
  app.use(express.json({ limit: '2mb' }));
  app.use(requestContextMiddleware);
  morgan.token('id', (req) => req.id);
  morgan.token('path', (req) => req.path);
  app.use(morgan(':id :method :path :status :response-time ms'));

  app.get('/api/health', async (_req, res) => {
    sendSuccess(res, {
      status: 'ok',
      currentTime: new Date().toISOString(),
      environment: env.NODE_ENV,
    });
  });

  app.get('/api/ready', async (_req, res) => {
    let databaseConnected = true;
    try {
      await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Database health check timeout')), 1500);
        }),
      ]);
    } catch (_error) {
      databaseConnected = false;
    }

    const payload = {
      status: databaseConnected ? 'ready' : 'not_ready',
      databaseConnected,
      currentTime: new Date().toISOString(),
      environment: env.NODE_ENV,
    };

    if (!databaseConnected) {
      return res.status(503).json({
        success: false,
        message: 'Not ready',
        data: payload,
      });
    }

    return sendSuccess(res, payload);
  });

  app.use('/api/auth', authRateLimit, authRouter);
  app.use('/api/rooms', publicRoomRouter);
  app.use('/api/bookings', publicBookingRouter);
  app.use('/api', publicPaymentRouter);
  app.use('/api/settings', publicSettingRouter);
  app.use('/api/currency', currencyRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/chat', publicChatRouter);
  app.use('/api/admin/rooms', adminRoomRouter);
  app.use('/api/admin/bluejay', adminBluejayRouter);
  app.use('/api/admin', adminRateRouter);
  app.use('/api/admin/bookings', adminBookingRouter);
  app.use('/api/admin', adminPaymentRouter);
  app.use('/api/admin/settings', adminSettingRouter);
  app.use('/api/admin/chat', adminChatRouter);
  app.use('/api/admin/media', adminMediaRouter);
  app.use('/api/webhooks', paymentWebhookRouter);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
