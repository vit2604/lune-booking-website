import { Router } from 'express';
import { convert, rates } from './currency.controller.js';

export const currencyRouter = Router();

currencyRouter.get('/rates', rates);
currencyRouter.get('/convert', convert);
