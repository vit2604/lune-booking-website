import { Router } from 'express';
import { requireAdmin, requireAuth } from '../../middlewares/authMiddleware.js';
import { adminSaveSetting, adminSettings, publicSettings } from './setting.controller.js';

export const publicSettingRouter = Router();
export const adminSettingRouter = Router();

publicSettingRouter.get('/public', publicSettings);

adminSettingRouter.use(requireAuth, requireAdmin);
adminSettingRouter.get('/', adminSettings);
adminSettingRouter.put('/:key', adminSaveSetting);
