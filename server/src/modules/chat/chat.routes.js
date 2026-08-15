import { Router } from 'express';
import multer from 'multer';
import { requireAdmin, requireAuth } from '../../middlewares/authMiddleware.js';
import { chatRateLimit } from '../../middlewares/rateLimitMiddleware.js';
import { validate } from '../../middlewares/validateMiddleware.js';
import {
  adminChatStats,
  adminClose,
  adminDelete,
  adminRead,
  adminReopen,
  adminSendMessage,
  adminSession,
  adminSessions,
  createSession,
  publicMessages,
  publicRead,
  publicSendImage,
  publicSendMessage,
} from './chat.controller.js';
import { adminMessageSchema, createSessionSchema, guestMessageSchema } from './chat.validation.js';

export const publicChatRouter = Router();
export const adminChatRouter = Router();

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (/^image\/(jpeg|png|webp|avif)$/i.test(file.mimetype)) return callback(null, true);
    const error = new Error('Only JPEG, PNG, WebP, or AVIF images are allowed');
    error.statusCode = 400;
    return callback(error);
  },
});

function uploadSingleImage(req, res, next) {
  imageUpload.single('image')(req, res, (error) => {
    if (error?.code === 'LIMIT_FILE_SIZE') error.statusCode = 413;
    next(error);
  });
}

publicChatRouter.use(chatRateLimit);
publicChatRouter.post('/sessions', validate(createSessionSchema), createSession);
publicChatRouter.get('/sessions/:sessionCode/messages', publicMessages);
publicChatRouter.post('/sessions/:sessionCode/messages', validate(guestMessageSchema), publicSendMessage);
publicChatRouter.post('/sessions/:sessionCode/images', uploadSingleImage, publicSendImage);
publicChatRouter.patch('/sessions/:sessionCode/read', publicRead);

adminChatRouter.use(requireAuth, requireAdmin);
adminChatRouter.get('/stats', adminChatStats);
adminChatRouter.get('/sessions', adminSessions);
adminChatRouter.get('/sessions/:sessionCode', adminSession);
adminChatRouter.post('/sessions/:sessionCode/messages', validate(adminMessageSchema), adminSendMessage);
adminChatRouter.patch('/sessions/:sessionCode/read', adminRead);
adminChatRouter.patch('/sessions/:sessionCode/close', adminClose);
adminChatRouter.patch('/sessions/:sessionCode/reopen', adminReopen);
adminChatRouter.delete('/sessions/:sessionCode', adminDelete);
