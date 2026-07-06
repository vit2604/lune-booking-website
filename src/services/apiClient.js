import { apiConfig, shouldUseMockOnly } from '../config/apiConfig.js';
import { storageKeys } from '../constants/storageKeys.js';

class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export function getAdminToken() {
  return localStorage.getItem(storageKeys.adminToken);
}

export async function apiRequest(path, options = {}) {
  if (shouldUseMockOnly() && !options.ignoreMockOnly) {
    throw new ApiError('Backend API is not configured for this deployment.', 0, {
      success: false,
      message: 'Using frontend mock/localStorage fallback.',
    });
  }

  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), options.timeoutMs || apiConfig.timeoutMs);
  const headers = new Headers(options.headers || {});
  const token = options.token ?? getAdminToken();

  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);

  try {
    const response = await fetch(`${apiConfig.baseUrl}${path}`, {
      ...options,
      headers,
      body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body,
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
      throw new ApiError(payload.message || 'API request failed', response.status, payload);
    }
    return payload.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === 'AbortError') {
      throw new ApiError('The booking system took too long to respond. Please try again.', 0, { code: 'timeout' });
    }
    throw new ApiError('Could not reach the booking system. Please try again.', 0, { code: 'network' });
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

export { ApiError };
