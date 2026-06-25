import crypto from 'node:crypto';

export function requestContextMiddleware(req, res, next) {
  const incomingRequestId = String(req.headers['x-request-id'] || '').trim();
  req.id = incomingRequestId && incomingRequestId.length <= 100 ? incomingRequestId : crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
}
