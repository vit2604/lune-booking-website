import { Router } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { requireAuth, requireRecentAuth } from '../../middlewares/authMiddleware.js';
import { validate } from '../../middlewares/validateMiddleware.js';
import * as controller from './aiContent.controller.js';
import { requireAiContentPermission, requirePublishPermission, requireSchedulePermission, requireStopPermission } from './aiContent.permissions.js';

const empty = z.object({}).passthrough();
const wrap = ({ body = empty, params = empty, query = empty } = {}) => validate(z.object({ body, params, query }));
const idParams = z.object({ id: z.string().min(1).max(64) });
const quarantineDir = path.resolve(env.AI_CONTENT_MEDIA_ROOT, 'temp');
fs.mkdirSync(quarantineDir, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({ destination: quarantineDir, filename: (_req, _file, callback) => callback(null, `${crypto.randomUUID()}.upload`) }),
  limits: { files: 6, fileSize: 50 * 1024 * 1024, fields: 6, parts: 14 },
});

export const aiContentRouter = Router();
aiContentRouter.use(requireAuth);
aiContentRouter.get('/dashboard', requireAiContentPermission('READ'), controller.dashboard);
aiContentRouter.patch('/settings', requireAiContentPermission('APPROVE'), wrap({ body: z.object({ autonomyMode: z.enum(['REVIEW_REQUIRED', 'AUTO_AFTER_UPLOAD', 'FULL_AUTO_SAFE']), trendKeywords: z.array(z.string().min(1).max(80)).max(40) }) }), controller.settingsUpdate);
aiContentRouter.get('/trends', requireAiContentPermission('READ'), controller.trends);
aiContentRouter.post('/trends/refresh', requireAiContentPermission('EDIT'), controller.trendsRefresh);
aiContentRouter.get('/ideas/today', requireAiContentPermission('READ'), controller.ideasToday);
aiContentRouter.post('/ideas/generate', requireAiContentPermission('EDIT'), controller.ideasGenerate);
aiContentRouter.post('/ideas/:id/select', requireAiContentPermission('EDIT'), wrap({ params: idParams }), controller.ideaSelect);
aiContentRouter.post('/ideas/:id/feedback', requireAiContentPermission('EDIT'), wrap({ params: idParams, body: z.object({ action: z.enum(['NOT_RELEVANT', 'SKIP_TODAY', 'USE_EXISTING_MEDIA']), feedback: z.string().max(500).optional() }) }), controller.ideaFeedback);
aiContentRouter.post('/uploads', requireAiContentPermission('UPLOAD'), upload.array('media', 6), controller.uploadsCreate);
aiContentRouter.get('/uploads/:id', requireAiContentPermission('READ'), wrap({ params: idParams }), controller.uploadGet);
aiContentRouter.get('/uploads/:id/file', requireAiContentPermission('READ'), wrap({ params: idParams }), controller.uploadFile);
aiContentRouter.post('/uploads/:id/analyze', requireAiContentPermission('UPLOAD'), wrap({ params: idParams }), controller.uploadAnalyze);
aiContentRouter.post('/uploads/:id/review', requireAiContentPermission('APPROVE'), wrap({ params: idParams, body: z.object({ approved: z.boolean(), consentStatus: z.enum(['GRANTED', 'NOT_REQUIRED', 'DENIED']), note: z.string().max(500).optional() }) }), controller.uploadReview);
aiContentRouter.delete('/uploads/:id', requireAiContentPermission('UPLOAD'), wrap({ params: idParams }), controller.uploadDelete);
aiContentRouter.post('/drafts/generate', requireAiContentPermission('EDIT'), wrap({ body: z.object({ ideaId: z.string().min(1), mediaAssetIds: z.array(z.string().min(1)).min(1).max(12) }) }), controller.draftGenerate);
aiContentRouter.get('/drafts/:id', requireAiContentPermission('READ'), wrap({ params: idParams }), controller.draftGet);
aiContentRouter.patch('/drafts/:id', requireAiContentPermission('EDIT'), wrap({ params: idParams, body: z.object({ captionVi: z.string().min(1).max(5000).optional(), captionEn: z.string().min(1).max(5000).optional(), captionKo: z.string().max(5000).nullable().optional(), headline: z.string().min(1).max(200).optional(), cta: z.string().min(1).max(300).optional(), altText: z.string().min(1).max(500).optional() }).refine((value) => Object.keys(value).length > 0) }), controller.draftUpdate);
aiContentRouter.post('/drafts/:id/render', requireAiContentPermission('EDIT'), wrap({ params: idParams }), controller.draftRender);
aiContentRouter.post('/drafts/:id/approve', requireAiContentPermission('APPROVE'), wrap({ params: idParams }), controller.draftApprove);
aiContentRouter.post('/drafts/:id/schedule', requireSchedulePermission, wrap({ params: idParams, body: z.object({ scheduledAt: z.coerce.date().refine((date) => date > new Date(), 'Schedule must be in the future') }) }), controller.draftSchedule);
aiContentRouter.post('/publications/:id/publish', requirePublishPermission, wrap({ params: idParams }), controller.publicationPublish);
aiContentRouter.post('/publications/:id/retry', requirePublishPermission, wrap({ params: idParams }), controller.publicationRetry);
aiContentRouter.post('/publications/:id/resume', requireSchedulePermission, wrap({ params: idParams, body: z.object({ scheduledAt: z.coerce.date().refine((date) => date > new Date(), 'Schedule must be in the future') }) }), controller.publicationResume);
aiContentRouter.get('/analytics', requireAiContentPermission('READ'), controller.analytics);
aiContentRouter.post('/publications/:id/analytics', requireAiContentPermission('READ'), wrap({ params: idParams, body: z.object({ windowHours: z.union([z.literal(24), z.literal(72), z.literal(168)]) }) }), controller.analyticsFetch);
aiContentRouter.post('/emergency-stop', requireStopPermission, wrap({ body: z.object({ active: z.boolean() }) }), controller.stop);
aiContentRouter.get('/integrations/meta/status', requireAiContentPermission('READ'), controller.metaStatus);
aiContentRouter.get('/integrations/meta/connect', requireAiContentPermission('META_ADMIN'), requireRecentAuth(15), controller.metaConnect);
aiContentRouter.post('/integrations/meta/callback', requireAiContentPermission('META_ADMIN'), requireRecentAuth(15), wrap({ body: z.object({ code: z.string().min(1).max(2048), state: z.string().min(32).max(256) }) }), controller.metaCallback);
aiContentRouter.post('/integrations/meta/disconnect', requireAiContentPermission('META_ADMIN'), requireRecentAuth(15), controller.metaDisconnect);
aiContentRouter.get('/diagnostics', requireAiContentPermission('DIAGNOSTICS'), controller.diagnostics);
