import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../config/apiConfig.js', () => ({
  apiConfig: { baseUrl: 'https://api.example.test', timeoutMs: 1000 },
  shouldUseMockOnly: () => false,
}));

const values = new Map();
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, String(value)),
  removeItem: (key) => values.delete(key),
  clear: () => values.clear(),
};
globalThis.window = new EventTarget();

const { apiRequest } = await import('./apiClient.js');

describe('admin API client', () => {
  beforeEach(() => {
    values.clear();
    vi.restoreAllMocks();
  });

  it('adds the admin JWT to authenticated requests', async () => {
    localStorage.setItem('lune_admin_token', 'jwt-token');
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { ok: true } }),
    });

    await expect(apiRequest('/admin/rooms')).resolves.toEqual({ ok: true });
    const request = globalThis.fetch.mock.calls[0][1];
    expect(request.headers.get('Authorization')).toBe('Bearer jwt-token');
  });

  it('expires the local admin session when the backend returns 401', async () => {
    localStorage.setItem('lune_admin_token', 'expired-token');
    localStorage.setItem('lune_admin_logged_in', 'true');
    localStorage.setItem('lune_admin_user', '{}');
    const expired = vi.fn();
    window.addEventListener('lune:admin-session-expired', expired, { once: true });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ success: false, message: 'Unauthorized' }),
    });

    await expect(apiRequest('/admin/rooms')).rejects.toMatchObject({ status: 401 });
    expect(localStorage.getItem('lune_admin_token')).toBeNull();
    expect(localStorage.getItem('lune_admin_logged_in')).toBeNull();
    expect(expired).toHaveBeenCalledOnce();
  });
});
