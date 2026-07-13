const productionApiUrl = 'https://lune-booking-api.onrender.com/api';
const productionSocketUrl = 'https://lune-booking-api.onrender.com';
const localApiUrl = 'http://localhost:4000/api';
const localSocketUrl = 'http://localhost:4000';

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

function getDefaultApiBaseUrl() {
  return isPublicFrontendHost() ? productionApiUrl : localApiUrl;
}

function getDefaultSocketUrl() {
  return isPublicFrontendHost() ? productionSocketUrl : localSocketUrl;
}

function getMockFallbackDefault() {
  return isPublicFrontendHost() ? 'false' : 'true';
}

export const apiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || getDefaultApiBaseUrl(),
  socketUrl: import.meta.env.VITE_SOCKET_URL || getDefaultSocketUrl(),
  useMockFallback: String(import.meta.env.VITE_USE_MOCK_FALLBACK ?? getMockFallbackDefault()) === 'true',
  timeoutMs: isPublicFrontendHost() ? 60000 : 10000,
};

export function shouldUseMockOnly() {
  return apiConfig.useMockFallback && isPublicFrontendHost() && isLocalUrl(apiConfig.baseUrl);
}

export function canUseMockFallback() {
  return apiConfig.useMockFallback;
}
