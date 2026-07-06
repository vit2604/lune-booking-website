import { Router } from 'express';
import { requireAdmin, requireAuth } from '../../middlewares/authMiddleware.js';
import { validate } from '../../middlewares/validateMiddleware.js';
import { adminBluejayConfig, adminBluejayDiagnostics } from './bluejay.controller.js';
import { bluejayDiagnosticsQuerySchema } from './bluejay.validation.js';

export const adminBluejayRouter = Router();

adminBluejayRouter.use(requireAuth, requireAdmin);
adminBluejayRouter.get('/config', adminBluejayConfig);
adminBluejayRouter.get('/diagnostics', validate(bluejayDiagnosticsQuerySchema), adminBluejayDiagnostics);
