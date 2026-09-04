import { beforeAll, describe, expect, it } from 'vitest';

let selectRatePlan;

beforeAll(async () => {
  process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/test';
  process.env.JWT_SECRET ||= 'test-secret-at-least-16-characters';
  process.env.BLUEJAY_RATEPLAN_MAPPING_JSON = '{}';
  ({ selectRatePlan } = await import('../../server/src/modules/bluejay/bluejay.service.js'));
});

describe('Bluejay Direct rate selection', () => {
  it('selects the Direct rate even when Bluejay returns it after another rate', () => {
    const roomType = {
      rates: [
        { rateplan_id: 10, title: 'Non-refundable promotion', total: 650000 },
        { rateplan_id: 20, title: 'Direct', total: 715000 },
      ],
    };

    expect(selectRatePlan(roomType, 'one-bedroom-condo', '12666')).toEqual(
      expect.objectContaining({ rateplan_id: 20, title: 'Direct' }),
    );
  });

  it('falls back to the first rate when Bluejay has no Direct-labelled rate', () => {
    const firstRate = { rateplan_id: 30, title: 'Standard', total: 800000 };
    expect(selectRatePlan({ rates: [firstRate] }, 'room', '123')).toBe(firstRate);
  });
});
