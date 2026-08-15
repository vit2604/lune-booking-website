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
  ADMIN_DEVICE_KEY: optionalString,
  CURRENCY_PROVIDER: z.string().default('frankfurter'),
  FRANKFURTER_BASE_URL: z.string().url().default('https://api.frankfurter.dev/v1'),
  EXCHANGE_RATE_BASE_URL: z.string().url().default('https://open.er-api.com/v6/latest'),
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
  PHONE_OTP_ENABLED: optionalBoolean(false),
  PHONE_OTP_REQUIRED: optionalBoolean(false),
  PHONE_OTP_TTL_MINUTES: z.coerce.number().int().positive().default(5),
  PHONE_OTP_RESEND_SECONDS: z.coerce.number().int().positive().default(60),
  PHONE_OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  PHONE_OTP_RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().default(30),
  PHONE_OTP_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  PHONE_OTP_DEBUG_RESPONSE: optionalBoolean(false),
  SMS_PROVIDER: z.preprocess(emptyToUndefined, z.enum(['log', 'webhook', 'twilio']).optional()),
  SMS_WEBHOOK_URL: optionalUrl,
  SMS_WEBHOOK_AUTH_HEADER: optionalString,
  SMS_WEBHOOK_AUTH_VALUE: optionalString,
  TWILIO_ACCOUNT_SID: optionalString,
  TWILIO_AUTH_TOKEN: optionalString,
  TWILIO_FROM_NUMBER: optionalString,
  TWILIO_MESSAGING_SERVICE_SID: optionalString,
  TELEGRAM_BOT_TOKEN: optionalString,
  TELEGRAM_CHAT_ID: optionalString,
  TELEGRAM_CHAT_ADMIN_URL: optionalUrl,
  TELEGRAM_BOOKING_ADMIN_URL: optionalUrl,
  BOOKING_CONFIRMATION_EMAIL_ENABLED: optionalBoolean(false),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().int().positive().default(465),
  SMTP_SECURE: optionalBoolean(true),
  SMTP_USER: optionalEmail,
  SMTP_APP_PASSWORD: optionalString,
  SMTP_FROM_NAME: z.string().default('Lune Boutique Hotel & Apartment Da Nang'),
  GMAIL_OAUTH_CLIENT_ID: optionalString,
  GMAIL_OAUTH_CLIENT_SECRET: optionalString,
  GMAIL_OAUTH_REFRESH_TOKEN: optionalString,
  AI_CONTENT_ENABLED: optionalBoolean(true),
  AI_CONTENT_MEDIA_ROOT: z.string().default('./data/ai-content-media'),
  AI_CONTENT_AUTONOMY_MODE: z.preprocess(emptyToUndefined, z.enum(['REVIEW_REQUIRED', 'AUTO_AFTER_UPLOAD', 'FULL_AUTO_SAFE']).default('REVIEW_REQUIRED')),
  AI_CONTENT_WORKER_ENABLED: optionalBoolean(false),
  AI_CONTENT_LIVE_META_ENABLED: optionalBoolean(false),
  AI_CONTENT_OPENCV_ENABLED: optionalBoolean(true),
  AI_CONTENT_PYTHON_PATH: z.string().default('python'),
  AI_CONTENT_DAILY_HOUR: z.coerce.number().int().min(0).max(23).default(8),
  AI_CONTENT_DAILY_MINUTE: z.coerce.number().int().min(0).max(59).default(0),
  AI_CONTENT_IMAGE_MIN_EXPOSURE: z.coerce.number().min(0).max(100).default(8),
  AI_CONTENT_IMAGE_MAX_EXPOSURE: z.coerce.number().min(0).max(100).default(96),
  AI_CONTENT_IMAGE_MIN_SHARPNESS: z.coerce.number().min(0).default(1),
  AI_CONTENT_DAILY_PUBLISH_LIMIT: z.coerce.number().int().min(1).max(10).default(2),
  OLLAMA_BASE_URL: z.string().url().default('http://127.0.0.1:11434').refine((value) => ['127.0.0.1', 'localhost', '::1'].includes(new URL(value).hostname), 'Ollama must use a loopback address'),
  OLLAMA_MODEL: optionalString,
  FFMPEG_PATH: z.string().default('ffmpeg'),
  FFPROBE_PATH: z.string().default('ffprobe'),
  META_GRAPH_VERSION: z.preprocess(emptyToUndefined, z.string().regex(/^v\d+\.\d+$/).default('v26.0')),
  META_PAGE_ID: z.string().default('61582233127486'),
  META_APP_ID: optionalString,
  META_APP_SECRET: optionalString,
  META_OAUTH_REDIRECT_URI: optionalUrl,
  META_TOKEN_ENCRYPTION_KEY: optionalString,
  META_TOKEN_KEY_VERSION: z.string().default('v1'),
}).superRefine((value, ctx) => {
  if (value.AI_CONTENT_IMAGE_MIN_EXPOSURE >= value.AI_CONTENT_IMAGE_MAX_EXPOSURE) ctx.addIssue({ code: 'custom', path: ['AI_CONTENT_IMAGE_MAX_EXPOSURE'], message: 'Maximum exposure must be greater than minimum exposure' });
  if (!value.AI_CONTENT_LIVE_META_ENABLED) return;
  for (const key of ['META_APP_ID', 'META_APP_SECRET', 'META_OAUTH_REDIRECT_URI', 'META_TOKEN_ENCRYPTION_KEY']) {
    if (!value[key]) ctx.addIssue({ code: 'custom', path: [key], message: `${key} is required when live Meta publishing is enabled` });
  }
  if (!/^\d+$/.test(value.META_PAGE_ID)) ctx.addIssue({ code: 'custom', path: ['META_PAGE_ID'], message: 'META_PAGE_ID must be numeric' });
  if (value.META_OAUTH_REDIRECT_URI && !value.META_OAUTH_REDIRECT_URI.startsWith('https://')) ctx.addIssue({ code: 'custom', path: ['META_OAUTH_REDIRECT_URI'], message: 'Meta redirect URI must use HTTPS' });
  if (value.META_TOKEN_ENCRYPTION_KEY && !/^[a-f0-9]{64}$/i.test(value.META_TOKEN_ENCRYPTION_KEY)) ctx.addIssue({ code: 'custom', path: ['META_TOKEN_ENCRYPTION_KEY'], message: 'Meta encryption key must be 64 hex characters' });
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid server environment:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
