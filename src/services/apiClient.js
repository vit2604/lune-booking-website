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

function firstValidationMessage(payload) {
  const fieldErrors = payload?.errors?.fieldErrors;
  if (!fieldErrors || typeof fieldErrors !== 'object') return '';
  return Object.values(fieldErrors)
    .flatMap((messages) => (Array.isArray(messages) ? messages : []))
    .find(Boolean) || '';
}

export function getApiErrorMessage(payload) {
  if (payload?.message !== 'Validation error') return payload?.message || 'API request failed';

  const detail = firstValidationMessage(payload);
  if (/expected number to be <=\s*3/i.test(detail)) {
    return 'Số lượng phòng đã chọn vượt quá giới hạn của máy chủ. Vui lòng tải lại trang và thử lại.';
  }
  return detail || 'Thông tin đặt phòng chưa hợp lệ. Vui lòng kiểm tra lại.';
}

export function getAdminToken() {
  return localStorage.getItem(storageKeys.adminToken);
}

function expireAdminSession() {
  localStorage.removeItem(storageKeys.adminToken);
  localStorage.removeItem(storageKeys.adminLoggedIn);
  localStorage.removeItem(storageKeys.adminUser);
  window.dispatchEvent(new Event('lune:admin-session-expired'));
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
      if (response.status === 401 && token) expireAdminSession();
      throw new ApiError(getApiErrorMessage(payload), response.status, payload);
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
