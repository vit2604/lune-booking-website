import { Router } from 'express';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import { authRateLimit } from '../../middlewares/rateLimitMiddleware.js';
import { validate } from '../../middlewares/validateMiddleware.js';
import { adminLogin, logout, me } from './auth.controller.js';
import { adminLoginSchema } from './auth.validation.js';

export const authRouter = Router();

authRouter.post('/admin/login', authRateLimit, validate(adminLoginSchema), adminLogin);
authRouter.get('/me', requireAuth, me);
authRouter.post('/logout', requireAuth, logout);
