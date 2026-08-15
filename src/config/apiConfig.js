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
  return !isPrivateOrLoopbackHost(window.location.hostname);
}

function isPrivateOrLoopbackHost(hostname) {
  if (['localhost', '127.0.0.1', '::1'].includes(hostname)) return true;
  const parts = hostname.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  return parts[0] === 10 || (parts[0] === 192 && parts[1] === 168) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31);
}

function localRuntimeUrl(port, suffix = '') {
  if (typeof window === 'undefined') return `http://localhost:${port}${suffix}`;
  return `http://${window.location.hostname}:${port}${suffix}`;
}

function getDefaultApiBaseUrl() {
  return isPublicFrontendHost() ? productionApiUrl : localRuntimeUrl(4000, '/api');
}

function getDefaultSocketUrl() {
  return isPublicFrontendHost() ? productionSocketUrl : localRuntimeUrl(4000);
}

function getMockFallbackDefault() {
  return isPublicFrontendHost() ? 'false' : 'true';
}

export const apiConfig = {
  baseUrl: isPublicFrontendHost() ? (import.meta.env.VITE_API_BASE_URL || getDefaultApiBaseUrl()) : getDefaultApiBaseUrl(),
  socketUrl: isPublicFrontendHost() ? (import.meta.env.VITE_SOCKET_URL || getDefaultSocketUrl()) : getDefaultSocketUrl(),
  useMockFallback: isPublicFrontendHost() && String(import.meta.env.VITE_USE_MOCK_FALLBACK ?? getMockFallbackDefault()) === 'true',
  timeoutMs: isPublicFrontendHost() ? 60000 : 10000,
};

export function shouldUseMockOnly() {
  return apiConfig.useMockFallback && isPublicFrontendHost() && isLocalUrl(apiConfig.baseUrl);
}

export function canUseMockFallback() {
  return apiConfig.useMockFallback;
}
