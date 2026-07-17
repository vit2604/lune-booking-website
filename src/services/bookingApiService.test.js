import { describe, expect, it } from 'vitest';
import { normalizeBookingForApi } from './bookingApiService.js';

describe('normalizeBookingForApi', () => {
  it('does not default a new booking to pay at property before payment is selected', () => {
    const payload = normalizeBookingForApi({
      roomId: 'studio-balcony',
      checkIn: '2026-07-20',
      checkOut: '2026-07-21',
      guests: 2,
      adults: 2,
      children: 0,
      guestInfo: {
        fullName: 'Quoc Cuong',
        email: 'guest@example.com',
        phoneCode: '+84 Vietnam',
        phone: '0789825204',
        country: 'Vietnam',
      },
    });

    expect(payload.paymentMethod).toBeUndefined();
  });

  it('keeps an explicitly selected payment method', () => {
    const payload = normalizeBookingForApi({
      roomId: 'studio-balcony',
      checkIn: '2026-07-20',
      checkOut: '2026-07-21',
      guests: 2,
      paymentMethod: 'vietQr',
      guestInfo: {
        fullName: 'Quoc Cuong',
        phoneCode: '+84 Vietnam',
        phone: '0789825204',
        country: 'Vietnam',
      },
    });

    expect(payload.paymentMethod).toBe('vietQr');
  });
});
