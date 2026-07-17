import { describe, expect, it, vi } from 'vitest';

function configureBluejayEnv() {
  process.env.DATABASE_URL = 'postgresql://lune:lune@localhost:5432/lune_booking_db';
  process.env.JWT_SECRET = 'test-secret-with-enough-length';
  process.env.BLUEJAY_ENABLED = 'true';
  process.env.BLUEJAY_CREATE_BOOKING_ENABLED = 'true';
  process.env.BLUEJAY_API_BASE_URL = 'https://api-pms.bluejaypms.com/api/v2';
  process.env.BLUEJAY_API_TOKEN = 'test-token';
  process.env.BLUEJAY_AUTH_HEADER_NAME = 'ApiKey';
  process.env.BLUEJAY_AUTH_HEADER_PREFIX = 'none';
  process.env.BLUEJAY_PROPERTY_ID = '6439';
  process.env.BLUEJAY_CHANNEL_CODE = 'BEL';
  process.env.BLUEJAY_ROOM_MAPPING_JSON = '{}';
  process.env.BLUEJAY_RATEPLAN_MAPPING_JSON = '{}';
}

describe('Bluejay create booking payload', () => {
  it('keeps payment fields out of booking/create so booking/modify can confirm once', async () => {
    vi.resetModules();
    configureBluejayEnv();
    const { buildBluejayBookingPayload } = await import('../../server/src/modules/bluejay/bluejay.service.js');

    const payload = buildBluejayBookingPayload({
      booking: {
        bookingCode: 'LUNE-20260715-47227332',
        checkIn: '2026-07-16',
        checkOut: '2026-07-17',
        arrivalTime: '14:00',
        guests: 1,
        adults: 1,
        children: 0,
        totalPrice: 1200000,
        currency: 'VND',
        guest: {
          fullName: 'Website Guest',
          email: 'guest@example.com',
          phoneCode: '+84',
          phoneNumber: '901234567',
        },
        payments: [
          { method: 'vietQr', status: 'PAID', amount: 120000 },
          { method: 'payAtProperty', status: 'PAY_AT_PROPERTY', amount: 1200000 },
        ],
      },
      roomContexts: [
        {
          item: {
            roomId: 'one-bedroom-apartment-balcony',
            quantity: 1,
            guests: 1,
            adults: 1,
            children: 0,
          },
          room: { id: 'one-bedroom-apartment-balcony', name: 'One Bedroom Studio Apartment with Balcony' },
          externalRoomId: '12663',
          ratePlan: {
            rateplan_id: 20914,
            total: 1200000,
            mealplan: { breakfast: false, lunch: false, dinner: false },
            price_in_day: [
              { night: '2026-07-16', amount: 1200000, pre_discount_price: 1200000 },
            ],
          },
        },
      ],
    });

    expect(payload.total_pay).toBeUndefined();
    expect(payload.payment).toBeUndefined();
    expect(payload.note).toContain('Da coc 120.000 VND');
    expect(payload.rooms[0].rateplan.rate_plan_id).toBe(20914);
    expect(payload.grand_total).toBe(1200000);
  });
});
