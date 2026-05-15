import { Router } from 'express';
import { requireAdmin, requireAuth } from '../../middlewares/authMiddleware.js';
import { validate } from '../../middlewares/validateMiddleware.js';
import {
  adminChatStats,
  adminClose,
  adminRead,
  adminReopen,
  adminSendMessage,
  adminSession,
  adminSessions,
  createSession,
  publicMessages,
  publicRead,
  publicSendMessage,
} from './chat.controller.js';
import { adminMessageSchema, createSessionSchema, guestMessageSchema } from './chat.validation.js';

export const publicChatRouter = Router();
export const adminChatRouter = Router();

publicChatRouter.post('/sessions', validate(createSessionSchema), createSession);
publicChatRouter.get('/sessions/:sessionCode/messages', publicMessages);
publicChatRouter.post('/sessions/:sessionCode/messages', validate(guestMessageSchema), publicSendMessage);
publicChatRouter.patch('/sessions/:sessionCode/read', publicRead);

adminChatRouter.use(requireAuth, requireAdmin);
adminChatRouter.get('/stats', adminChatStats);
adminChatRouter.get('/sessions', adminSessions);
adminChatRouter.get('/sessions/:sessionCode', adminSession);
adminChatRouter.post('/sessions/:sessionCode/messages', validate(adminMessageSchema), adminSendMessage);
adminChatRouter.patch('/sessions/:sessionCode/read', adminRead);
adminChatRouter.patch('/sessions/:sessionCode/close', adminClose);
adminChatRouter.patch('/sessions/:sessionCode/reopen', adminReopen);
