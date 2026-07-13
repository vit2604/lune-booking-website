import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

let buildBluejayConfirmationPayload;
let confirmBluejayBooking;
let normalizeCreatedBooking;

beforeAll(async () => {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  process.env.JWT_SECRET = 'test-secret-at-least-16-characters';
  process.env.BLUEJAY_PROPERTY_ID = '6439';
  process.env.BLUEJAY_CHANNEL_CODE = 'WEB';
  process.env.BLUEJAY_API_BASE_URL = 'https://bluejay.example/api/v2';
  process.env.BLUEJAY_API_TOKEN = 'test-api-token';
  process.env.BLUEJAY_ENABLED = 'true';
  process.env.BLUEJAY_CREATE_BOOKING_ENABLED = 'true';
  process.env.CORS_ORIGIN = 'https://www.luneboutiquedanang.com';
  ({
    buildBluejayConfirmationPayload,
    confirmBluejayBooking,
    normalizeCreatedBooking,
  } = await import('../../server/src/modules/bluejay/bluejay.service.js'));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Bluejay confirmation payload', () => {
  it('sends the paid deposit while preserving the full booking total', () => {
    const payload = buildBluejayConfirmationPayload({
      bookingCode: 'LUNE-20260713-1234',
      bluejayBookingCode: '003287',
      totalPrice: 1500000,
      currency: 'VND',
      paymentMethod: 'vietQr',
      payments: [
        {
          method: 'vietQr',
          amount: 150000,
          status: 'PAID',
          paidAt: '2026-07-13T10:00:00.000Z',
        },
      ],
    });

    expect(payload.reservation).toMatchObject({
      property_id: 6439,
      channel: 'WEB',
      book_code: '003287',
      reference_code: 'LUNE-20260713-1234',
      grand_total: 1500000,
      total_pay: 150000,
      currency: 'VND',
      payment: {
        amount: 150000,
        payment_method: 2,
        payment_for: '1',
        pay_currency: 'VND',
      },
    });
  });

  it('can confirm a pay-at-property booking without a payment record', () => {
    const payload = buildBluejayConfirmationPayload({
      bookingCode: 'LUNE-20260713-5678',
      bluejayBookingCode: '003288',
      totalPrice: 900000,
      currency: 'VND',
      paymentMethod: 'payAtProperty',
      payments: [],
    });

    expect(payload.reservation.total_pay).toBe(0);
    expect(payload.reservation).not.toHaveProperty('payment');
  });

  it('normalizes both wrapped and direct Bluejay booking responses', () => {
    expect(normalizeCreatedBooking({
      data: {
        attributes: {
          booking: { id: 123, code: '003287', status: 'confirm' },
        },
      },
    })).toMatchObject({ id: '123', code: '003287', status: 'confirm' });

    expect(normalizeCreatedBooking({
      attributes: { id: 124, book_code: '003288', status: 'confirm' },
    })).toMatchObject({ id: '124', code: '003288', status: 'confirm' });
  });

  it('calls the modify endpoint and accepts only a confirmed response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: {
        attributes: {
          booking: { id: 123, code: '003287', status: 'confirm' },
        },
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(confirmBluejayBooking({
      booking: {
        bookingCode: 'LUNE-20260713-1234',
        bluejayBookingCode: '003287',
        totalPrice: 1500000,
        currency: 'VND',
        paymentMethod: 'vietQr',
        payments: [{ method: 'vietQr', amount: 150000, status: 'PAID' }],
      },
    })).resolves.toMatchObject({ payload: { status: 'confirm' } });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe('https://bluejay.example/api/v2/booking/modify');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).reservation).toMatchObject({
      book_code: '003287',
      grand_total: 1500000,
      total_pay: 150000,
    });
  });

  it('rejects a successful HTTP response that does not confirm the booking', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: { attributes: { booking: { code: '003287', status: 'new' } } },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })));

    await expect(confirmBluejayBooking({
      booking: {
        bookingCode: 'LUNE-20260713-1234',
        bluejayBookingCode: '003287',
        totalPrice: 1500000,
        currency: 'VND',
        payments: [],
      },
    })).rejects.toThrow('instead of confirm');
  });
});
