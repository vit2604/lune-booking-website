import { sendSuccess } from '../../utils/responseUtils.js';
import { createRatePeriod, deleteRatePeriod, listRatePeriods, updateRatePeriod } from './rate.service.js';

export async function adminRatePeriods(req, res, next) {
  try {
    return sendSuccess(res, await listRatePeriods(req.validated.query));
  } catch (error) {
    return next(error);
  }
}

export async function adminCreateRatePeriod(req, res, next) {
  try {
    return sendSuccess(res, await createRatePeriod(req.validated.body), 'Rate period created', 201);
  } catch (error) {
    return next(error);
  }
}

export async function adminUpdateRatePeriod(req, res, next) {
  try {
    return sendSuccess(res, await updateRatePeriod(req.validated.params.id, req.validated.body), 'Rate period updated');
  } catch (error) {
    return next(error);
  }
}

export async function adminDeleteRatePeriod(req, res, next) {
  try {
    return sendSuccess(res, await deleteRatePeriod(req.validated.params.id), 'Rate period deleted');
  } catch (error) {
    return next(error);
  }
}
