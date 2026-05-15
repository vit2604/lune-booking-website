import cors from 'cors';
import { env } from './env.js';

export function corsMiddleware() {
  const origins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
  return cors({
    origin(origin, callback) {
      if (!origin || origins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  });
}
