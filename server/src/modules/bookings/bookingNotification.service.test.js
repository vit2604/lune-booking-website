import { describe, expect, it } from 'vitest';
import { buildBookingTelegramMessage } from './bookingNotification.service.js';

describe('booking Telegram notification', () => {
  it('includes the information staff need to act on a new booking', () => {
    const text = buildBookingTelegramMessage({
      bookingCode: 'LUNE-260811-TEST',
      guest: {
        fullName: 'Nguyen Van A',
        phoneCode: '+84',
        phoneNumber: '901234567',
        email: 'guest@example.com',
      },
      checkIn: new Date('2026-09-10T00:00:00.000Z'),
      checkOut: new Date('2026-09-12T00:00:00.000Z'),
      nights: 2,
      adults: 2,
      children: 1,
      roomItems: [{ room: { name: 'Căn hộ 1 phòng ngủ' }, quantity: 1 }],
      totalPrice: 1_430_000,
      currency: 'VND',
      paymentMethod: 'payAtProperty',
      paymentStatus: 'PAY_AT_PROPERTY',
      specialRequest: 'Cần phòng yên tĩnh',
    });

    expect(text).toContain('LUNE-260811-TEST');
    expect(text).toContain('Nguyen Van A');
    expect(text).toContain('+84 901234567');
    expect(text).toContain('Căn hộ 1 phòng ngủ × 1');
    expect(text).toContain('1.430.000');
    expect(text).toContain('Cần phòng yên tĩnh');
  });
});
