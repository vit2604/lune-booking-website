export function classifyPublishError(status) {
  if (status === 401 || status === 403) return { retry: false, category: 'AUTH_RECONNECT_REQUIRED' };
  if (status === 429) return { retry: true, category: 'RATE_LIMIT' };
  if (status === 0) return { retry: false, category: 'PUBLISH_UNKNOWN_RECONCILE' };
  if (status >= 500) return { retry: true, category: 'TRANSIENT' };
  return { retry: false, category: 'VALIDATION' };
}

export function retryDelayMs(attempt, { baseMs = 2_000, maxMs = 15 * 60_000, random = Math.random } = {}) {
  const exponential = Math.min(maxMs, baseMs * (2 ** Math.max(0, attempt - 1)));
  return Math.round(exponential * (0.75 + random() * 0.5));
}
