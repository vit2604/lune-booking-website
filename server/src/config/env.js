import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://127.0.0.1:5173'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),
  CURRENCY_PROVIDER: z.string().default('frankfurter'),
  FRANKFURTER_BASE_URL: z.string().url().default('https://api.frankfurter.dev/v1'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid server environment:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
