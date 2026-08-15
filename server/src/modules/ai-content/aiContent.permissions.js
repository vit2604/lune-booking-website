import { createHttpError } from '../../utils/responseUtils.js';
import { env } from '../../config/env.js';

const ROLE_PERMISSIONS = Object.freeze({
  ADMIN: new Set(['READ', 'UPLOAD', 'EDIT', 'APPROVE', 'SCHEDULE', 'MOCK_PUBLISH', 'META_ADMIN', 'LIVE_PUBLISH', 'STOP_ACTIVATE', 'STOP_RELEASE', 'DIAGNOSTICS']),
  STAFF: new Set(['READ', 'UPLOAD', 'EDIT', 'STOP_ACTIVATE']),
});

export function requireAiContentPermission(permission) {
  return (req, _res, next) => {
    if (!ROLE_PERMISSIONS[req.user?.role]?.has(permission)) return next(createHttpError(403, 'Insufficient AI Content permission'));
    return next();
  };
}

export function requireStopPermission(req, _res, next) {
  const permission = req.body?.active ? 'STOP_ACTIVATE' : 'STOP_RELEASE';
  if (permission === 'STOP_RELEASE') {
    const age = req.user?.authenticatedAt ? Date.now() - req.user.authenticatedAt.getTime() : Infinity;
    if (age > 15 * 60_000) return next(createHttpError(403, 'Recent sign-in required to release emergency stop'));
  }
  return requireAiContentPermission(permission)(req, _res, next);
}

export function requirePublishPermission(req, res, next) {
  const permission = env.AI_CONTENT_LIVE_META_ENABLED ? 'LIVE_PUBLISH' : 'MOCK_PUBLISH';
  if (env.AI_CONTENT_LIVE_META_ENABLED) {
    const age = req.user?.authenticatedAt ? Date.now() - req.user.authenticatedAt.getTime() : Infinity;
    if (age > 15 * 60_000) return next(createHttpError(403, 'Recent sign-in required for live publishing'));
  }
  return requireAiContentPermission(permission)(req, res, next);
}

export function requireSchedulePermission(req, res, next) {
  if (env.AI_CONTENT_LIVE_META_ENABLED) {
    const age = req.user?.authenticatedAt ? Date.now() - req.user.authenticatedAt.getTime() : Infinity;
    if (age > 15 * 60_000) return next(createHttpError(403, 'Recent sign-in required for live scheduling'));
  }
  return requireAiContentPermission('SCHEDULE')(req, res, next);
}
