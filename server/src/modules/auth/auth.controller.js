import { sendSuccess } from '../../utils/responseUtils.js';
import { getMe, loginAdmin } from './auth.service.js';

export async function adminLogin(req, res, next) {
  try {
    const result = await loginAdmin(req.validated.body);
    return sendSuccess(res, result, 'Login successful');
  } catch (error) {
    return next(error);
  }
}

export function me(req, res) {
  return sendSuccess(res, getMe(req.user));
}

export function logout(_req, res) {
  return sendSuccess(res, null, 'Logged out');
}
