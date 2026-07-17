import { describe, expect, it, vi } from 'vitest';

function configureBluejayEnv({ headerName = 'ApiKey', prefix = 'none' } = {}) {
  process.env.DATABASE_URL = 'postgresql://lune:lune@localhost:5432/lune_booking_db';
  process.env.JWT_SECRET = 'test-secret-with-enough-length';
  process.env.BLUEJAY_API_BASE_URL = 'https://api-pms.bluejaypms.com/api/v2';
  process.env.BLUEJAY_API_TOKEN = 'test-token';
  process.env.BLUEJAY_AUTH_HEADER_NAME = headerName;
  process.env.BLUEJAY_AUTH_HEADER_PREFIX = prefix;
  process.env.BLUEJAY_PROPERTY_ID = '6439';
}

describe('Bluejay auth headers', () => {
  it('sends only the configured API key header casing', async () => {
    vi.resetModules();
    configureBluejayEnv();
    const { buildAuthHeaders } = await import('../../server/src/modules/bluejay/bluejay.service.js');

    expect(buildAuthHeaders()).toEqual({ ApiKey: 'test-token' });
  });

  it('supports lowercase API key casing when configured', async () => {
    vi.resetModules();
    configureBluejayEnv({ headerName: 'apikey' });
    const { buildAuthHeaders } = await import('../../server/src/modules/bluejay/bluejay.service.js');

    expect(buildAuthHeaders()).toEqual({ apikey: 'test-token' });
  });

  it('preserves configured auth prefixes', async () => {
    vi.resetModules();
    configureBluejayEnv({ prefix: 'Bearer' });
    const { buildAuthHeaders } = await import('../../server/src/modules/bluejay/bluejay.service.js');

    expect(buildAuthHeaders()).toEqual({ ApiKey: 'Bearer test-token' });
  });
});
