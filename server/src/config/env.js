import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const emptyToUndefined = (value) => (value === '' ? undefined : value);
const optionalString = z.preprocess(emptyToUndefined, z.string().optional());
const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());
const optionalEmail = z.preprocess(emptyToUndefined, z.string().email().optional());
const availabilityMethod = z.preprocess(
  (value) => (value === '' || value == null ? undefined : String(value).toUpperCase()),
  z.enum(['GET', 'POST']).default('GET'),
);
const optionalBoolean = (defaultValue = false) =>
  z.preprocess(
    emptyToUndefined,
    z
      .string()
      .optional()
      .default(defaultValue ? 'true' : 'false')
      .transform((value) => ['true', '1', 'yes', 'y'].includes(value.toLowerCase())),
  );

const schema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://127.0.0.1:5173'),
  SOCKET_CORS_ORIGIN: optionalString,
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),
  ADMIN_USERNAME: optionalString,
  ADMIN_PASSWORD: optionalString,
  ADMIN_EMAIL: optionalEmail,
  CURRENCY_PROVIDER: z.string().default('frankfurter'),
  FRANKFURTER_BASE_URL: z.string().url().default('https://api.frankfurter.dev/v1'),
  BLUEJAY_ENABLED: optionalBoolean(false),
  BLUEJAY_API_BASE_URL: optionalUrl,
  BLUEJAY_AVAILABILITY_PATH: z.string().default('/search-roomtypes'),
  BLUEJAY_AVAILABILITY_METHOD: availabilityMethod,
  BLUEJAY_API_TOKEN: optionalString,
  BLUEJAY_AUTH_HEADER_NAME: z.preprocess(emptyToUndefined, z.string().default('ApiKey')),
  BLUEJAY_AUTH_HEADER_PREFIX: z.preprocess(emptyToUndefined, z.string().default('none')),
  BLUEJAY_PROPERTY_ID: optionalString,
  BLUEJAY_CHANNEL_CODE: optionalString,
  BLUEJAY_ROOM_MAPPING_JSON: optionalString,
  BLUEJAY_RATEPLAN_MAPPING_JSON: optionalString,
  BLUEJAY_CREATE_BOOKING_ENABLED: optionalBoolean(false),
  BLUEJAY_USER_AGENT: z.string().default('WebLuneBluejayAdapter/1.0'),
  BLUEJAY_TIMEOUT_MS: z.coerce.number().default(6000),
  BLUEJAY_FAIL_CLOSED: optionalBoolean(true),
  PAYOS_ENABLED: optionalBoolean(false),
  PAYOS_CLIENT_ID: optionalString,
  PAYOS_API_KEY: optionalString,
  PAYOS_CHECKSUM_KEY: optionalString,
  PAYOS_RETURN_URL: optionalUrl,
  PAYOS_CANCEL_URL: optionalUrl,
  PAYOS_WEBHOOK_URL: optionalUrl,
  PAYOS_TIMEOUT_MS: z.coerce.number().default(15000),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid server environment:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
