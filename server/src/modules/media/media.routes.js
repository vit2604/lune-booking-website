import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin, requireAuth } from '../../middlewares/authMiddleware.js';
import { validate } from '../../middlewares/validateMiddleware.js';
import { mediaCreate, mediaDelete, mediaList } from './media.controller.js';

export const adminMediaRouter = Router();

adminMediaRouter.use(requireAuth, requireAdmin);
adminMediaRouter.get('/', mediaList);
adminMediaRouter.post(
  '/',
  validate(
    z.object({
      body: z.object({
      url: z.string().min(1),
      type: z.enum(['IMAGE', 'VIDEO', 'FILE']).default('IMAGE'),
      altText: z.string().optional(),
      source: z.enum(['URL', 'UPLOAD']).default('URL'),
    }),
      params: z.object({}).passthrough(),
      query: z.object({}).passthrough(),
    }),
  ),
  mediaCreate,
);
adminMediaRouter.delete('/:id', mediaDelete);
