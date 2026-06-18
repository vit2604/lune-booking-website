export const apiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000',
  useMockFallback: String(import.meta.env.VITE_USE_MOCK_FALLBACK ?? 'true') === 'true',
  timeoutMs: 3000,
};

function isLocalUrl(value) {
  try {
    const url = new URL(value);
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
}

function isPublicFrontendHost() {
  if (typeof window === 'undefined') return false;
  return !['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
}

export function shouldUseMockOnly() {
  return apiConfig.useMockFallback && isPublicFrontendHost() && isLocalUrl(apiConfig.baseUrl);
}

export function canUseMockFallback() {
  return apiConfig.useMockFallback;
}
