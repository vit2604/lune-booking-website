import { createHash, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import { createHttpError } from '../utils/responseUtils.js';

const HEADER_NAME = 'x-admin-device-key';

function safeEqual(a, b) {
  const hashA = createHash('sha256').update(String(a)).digest();
  const hashB = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(hashA, hashB);
}

// Locks the admin surface (login included) to devices that hold a shared
// secret. When ADMIN_DEVICE_KEY is unset the check is disabled (local dev).
export function requireAdminDeviceKey(req, _res, next) {
  if (!env.ADMIN_DEVICE_KEY) return next();

  const provided = req.headers[HEADER_NAME];
  if (typeof provided !== 'string' || !provided || !safeEqual(provided, env.ADMIN_DEVICE_KEY)) {
    return next(createHttpError(401, 'Unauthorized'));
  }
  return next();
}
