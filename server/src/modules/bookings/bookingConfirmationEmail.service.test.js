import { describe, expect, it } from 'vitest';
import { buildBookingConfirmationEmail } from './bookingConfirmationEmail.service.js';

const booking = {
  bookingCode: 'LUNE-260813-ABCD',
  checkIn: new Date('2026-09-10T00:00:00.000Z'),
  checkOut: new Date('2026-09-12T00:00:00.000Z'),
  nights: 2,
  adults: 2,
  children: 1,
  totalPrice: 1_430_000,
  currency: 'VND',
  paymentStatus: 'PAID',
  payments: [{ status: 'PAID', amount: 1_430_000, rawPayloadJson: { paymentPurpose: 'full' } }],
  guest: { fullName: 'Nguyen <Van> A', email: 'guest@example.com' },
  roomItems: [{ room: { name: 'One-bedroom Apartment' }, quantity: 1 }],
};

const settings = {
  branding: { address: '92-94 Thạch Lam, Đà Nẵng' },
  contact: { phone: '+84 867 802 229', email: 'luneboutique92tl@gmail.com' },
  policies: { checkIn: 'Check-in from 14:00', checkOut: 'Check-out before 12:00' },
};

describe('booking confirmation email', () => {
  it('builds a bilingual confirmation with booking and stay details', () => {
    const email = buildBookingConfirmationEmail(booking, settings);

    expect(email.subject).toContain('LUNE-260813-ABCD');
    expect(email.html).toContain('BOOKING CONFIRMED');
    expect(email.subject).toBe('Booking confirmed | Xác nhận đặt phòng – LUNE-260813-ABCD');
    expect(email.html).toContain('Xác nhận đặt phòng');
    expect(email.html).toContain('One-bedroom Apartment');
    expect(email.html).toContain('1,430,000');
    expect(email.html).toContain('1,430,000 VND');
    expect(email.text).toContain('Fully paid / Đã thanh toán toàn bộ');
    expect(email.text).toContain('Amount paid / Số tiền đã thanh toán: 1,430,000 VND');
    expect(`${email.subject}\n${email.html}\n${email.text}`).not.toMatch(/Ã|Â|Ä|Æ|â€|áº|á»/);
  });

  it('escapes guest-controlled values in HTML', () => {
    const email = buildBookingConfirmationEmail(booking, settings);
    expect(email.html).toContain('Nguyen &lt;Van&gt; A');
    expect(email.html).not.toContain('Nguyen <Van> A');
  });

  it('shows the paid deposit, percentage, and remaining balance', () => {
    const email = buildBookingConfirmationEmail({
      ...booking,
      totalPrice: 1_000_000,
      payments: [{
        status: 'PAID',
        amount: 300_000,
        rawPayloadJson: { paymentPurpose: 'deposit', depositPercent: 30, balanceAmount: 700_000 },
      }],
    }, settings);

    expect(email.html).toContain('Deposit paid (30%) / Tiền cọc đã thanh toán');
    expect(email.html).toContain('300,000 VND');
    expect(email.html).toContain('Amount due at property / Còn lại thanh toán tại khách sạn');
    expect(email.html).toContain('700,000 VND');
    expect(email.text).toContain('Deposit paid 30% / Đã thanh toán tiền cọc 30%');
  });

  it('shows the balance and method for an international card paid at the property', () => {
    const email = buildBookingConfirmationEmail({
      ...booking,
      totalPrice: 1_050_000,
      paymentStatus: 'PAY_AT_PROPERTY',
      paymentMethod: 'creditCard',
      payments: [],
    }, settings);

    expect(email.html).toContain('Amount paid / Số tiền đã thanh toán');
    expect(email.html).toContain('0 VND');
    expect(email.html).toContain('Amount due at property / Còn lại thanh toán tại khách sạn');
    expect(email.html).toContain('1,050,000 VND');
    expect(email.html).toContain('International card at property (+5%)');
    expect(email.text).toContain('Pay at property / Thanh toán tại khách sạn');
  });
});
