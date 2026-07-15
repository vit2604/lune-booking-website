import { describe, expect, it } from 'vitest';
import {
  assertBluejayBookingConfirmed,
  buildBluejayConfirmationPayload,
  normalizeCreatedBooking,
} from '../../server/src/modules/bluejay/bluejayConfirmationUtils.js';

const confirmationConfig = {
  propertyId: '6439',
  channelCode: 'WEB',
  redirectUrl: 'https://www.luneboutiquedanang.com/success',
};

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
    }, confirmationConfig);

    expect(payload).toMatchObject({
      reservation: {
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
    }, confirmationConfig);

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

  it('accepts only a confirmed Bluejay response', () => {
    expect(assertBluejayBookingConfirmed({
      data: { attributes: { booking: { code: '003287', status: 'confirm' } } },
    })).toMatchObject({ code: '003287', status: 'confirm' });

    expect(() => assertBluejayBookingConfirmed({
      data: { attributes: { booking: { code: '003287', status: 'new' } } },
    })).toThrow('instead of confirm');
  });
});
