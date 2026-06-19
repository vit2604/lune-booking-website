import { Router } from 'express';
import { validate } from '../../middlewares/validateMiddleware.js';
import { translate } from './ai.controller.js';
import { translateSchema } from './ai.validation.js';

export const aiRouter = Router();

aiRouter.post('/translate', validate(translateSchema), translate);
