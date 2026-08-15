const SENSITIVE_KEYS = /token|secret|password|authorization|cookie|ciphertext|authTag/i;

export function redact(value, depth = 0) {
  if (depth > 5) return '[DEPTH_LIMIT]';
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  if (!value || typeof value !== 'object') return typeof value === 'string' ? value.replace(/Bearer\s+[A-Za-z0-9._~-]+/gi, 'Bearer ***') : value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, SENSITIVE_KEYS.test(key) ? '***' : redact(item, depth + 1)]));
}

export function safeError(error) {
  const status = Number(error?.status) || undefined;
  const code = ['INVALID_STATE_TRANSITION', 'FACT_GUARD_BLOCKED'].includes(error?.code) ? error.code : undefined;
  const message = status === 401 || status === 403 ? 'External authorization failed'
    : status === 429 ? 'External rate limit reached'
      : status && status < 500 ? 'External request rejected'
        : 'External or local processing failed';
  return { name: 'OperationError', message, code, status };
}
