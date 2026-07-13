import { storageKeys } from '../../constants/storageKeys.js';
import { canUseMockFallback } from '../../config/apiConfig.js';
import { adminLogin as backendAdminLogin } from '../../services/adminApiService.js';

const ADMIN_SESSION_KEY = storageKeys.adminLoggedIn;
const ADMIN_USER_KEY = storageKeys.adminUser;
const ADMIN_TOKEN_KEY = storageKeys.adminToken;

const MOCK_ADMIN = {
  username: import.meta.env.VITE_MOCK_ADMIN_USERNAME || 'admin',
  password: import.meta.env.VITE_MOCK_ADMIN_PASSWORD || '',
};

export async function login(username, password) {
  try {
    const data = await backendAdminLogin(username, password);
    localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
    localStorage.setItem(ADMIN_SESSION_KEY, 'true');
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.admin));
    return { ok: true, source: 'api' };
  } catch (_error) {
    if (!canUseMockFallback()) {
      return { ok: false, message: _error.message || 'Backend login failed.' };
    }
    // Local fallback keeps the MVP usable when the API server is not running.
    // Production must use backend authentication, JWT/session cookies, RBAC, and secure password storage.
    // Do not ship real passwords in frontend code.
    if (MOCK_ADMIN.password && username === MOCK_ADMIN.username && password === MOCK_ADMIN.password) {
      localStorage.setItem(ADMIN_SESSION_KEY, 'true');
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify({ username, role: 'admin' }));
      return { ok: true, source: 'local' };
    }
  }

  return { ok: false, message: 'Invalid username or password' };
}

export function logout() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function isAdminLoggedIn() {
  const hasBackendToken = Boolean(localStorage.getItem(ADMIN_TOKEN_KEY));
  if (!canUseMockFallback()) return hasBackendToken;
  return hasBackendToken || localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

export function getAdminUser() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_USER_KEY)) || null;
  } catch {
    return null;
  }
}
