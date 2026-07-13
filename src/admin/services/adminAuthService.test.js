import { beforeEach, describe, expect, it, vi } from 'vitest';

const backendAdminLogin = vi.fn();

vi.mock('../../services/adminApiService.js', () => ({
  adminLogin: backendAdminLogin,
}));

vi.mock('../../config/apiConfig.js', () => ({
  canUseMockFallback: () => false,
}));

const values = new Map();
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, String(value)),
  removeItem: (key) => values.delete(key),
  clear: () => values.clear(),
};

const { getAdminUser, isAdminLoggedIn, login, logout } = await import('./adminAuthService.js');

describe('production admin authentication', () => {
  beforeEach(() => {
    values.clear();
    backendAdminLogin.mockReset();
  });

  it('stores the backend JWT and admin profile after login', async () => {
    backendAdminLogin.mockResolvedValue({ token: 'jwt-token', admin: { username: 'admin', role: 'ADMIN' } });

    await expect(login('admin', 'secret')).resolves.toEqual({ ok: true, source: 'api' });
    expect(isAdminLoggedIn()).toBe(true);
    expect(getAdminUser()).toEqual({ username: 'admin', role: 'ADMIN' });
  });

  it('rejects a stale mock-only session in production', () => {
    localStorage.setItem('lune_admin_logged_in', 'true');
    expect(isAdminLoggedIn()).toBe(false);
  });

  it('clears every admin session value on logout', () => {
    localStorage.setItem('lune_admin_token', 'jwt-token');
    localStorage.setItem('lune_admin_logged_in', 'true');
    localStorage.setItem('lune_admin_user', '{}');

    logout();

    expect(isAdminLoggedIn()).toBe(false);
    expect(getAdminUser()).toBeNull();
  });
});
