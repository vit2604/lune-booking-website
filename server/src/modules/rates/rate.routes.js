import { Router } from 'express';
import { requireAdmin, requireAuth } from '../../middlewares/authMiddleware.js';
import { validate } from '../../middlewares/validateMiddleware.js';
import {
  adminCreateRatePeriod,
  adminDeleteRatePeriod,
  adminRatePeriods,
  adminUpdateRatePeriod,
} from './rate.controller.js';
import {
  ratePeriodParamsSchema,
  ratePeriodQuerySchema,
  ratePeriodSchema,
  updateRatePeriodSchema,
} from './rate.validation.js';

export const adminRateRouter = Router();

adminRateRouter.use(requireAuth, requireAdmin);
adminRateRouter.get('/rates', validate(ratePeriodQuerySchema), adminRatePeriods);
adminRateRouter.post('/rates', validate(ratePeriodSchema), adminCreateRatePeriod);
adminRateRouter.put('/rates/:id', validate(updateRatePeriodSchema), adminUpdateRatePeriod);
adminRateRouter.delete('/rates/:id', validate(ratePeriodParamsSchema), adminDeleteRatePeriod);
