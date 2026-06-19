import { sendSuccess } from '../../utils/responseUtils.js';
import { translateText } from './ai.service.js';

export async function translate(req, res) {
  const result = await translateText(req.validated.body);
  sendSuccess(res, result, 'Translated');
}
