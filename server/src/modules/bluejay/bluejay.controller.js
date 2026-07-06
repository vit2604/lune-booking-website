import { sendSuccess } from '../../utils/responseUtils.js';
import { diagnoseBluejayAvailability, getBluejayConfigSummary } from './bluejay.service.js';

export async function adminBluejayConfig(_req, res, next) {
  try {
    return sendSuccess(res, getBluejayConfigSummary());
  } catch (error) {
    return next(error);
  }
}

export async function adminBluejayDiagnostics(req, res, next) {
  try {
    return sendSuccess(res, await diagnoseBluejayAvailability(req.validated.query));
  } catch (error) {
    return next(error);
  }
}
