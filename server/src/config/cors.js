import cors from 'cors';
import { env } from './env.js';

export function parseOrigins(value) {
  return String(value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function corsMiddleware() {
  const origins = parseOrigins(env.CORS_ORIGIN);
  return cors({
    origin(origin, callback) {
      if (!origin || origins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  });
}
