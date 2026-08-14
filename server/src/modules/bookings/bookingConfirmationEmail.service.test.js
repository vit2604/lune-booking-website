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
  guest: { fullName: 'Nguyen <Van> A', email: 'guest@example.com' },
  roomItems: [{ room: { name: 'One-bedroom Apartment' }, quantity: 1 }],
};

const settings = {
  branding: { address: '92-94 Tháº¡ch Lam, ÄÃ  Náºµng' },
  contact: { phone: '+84 867 802 229', email: 'luneboutique92tl@gmail.com' },
  policies: { checkIn: 'Check-in from 14:00', checkOut: 'Check-out before 12:00' },
};

describe('booking confirmation email', () => {
  it('builds a bilingual confirmation with booking and stay details', () => {
    const email = buildBookingConfirmationEmail(booking, settings);

    expect(email.subject).toContain('LUNE-260813-ABCD');
    expect(email.html).toContain('BOOKING CONFIRMED');
    expect(email.html).toContain('XÃ¡c nháº­n Ä‘áº·t phÃ²ng');
    expect(email.html).toContain('One-bedroom Apartment');
    expect(email.html).toContain('1,430,000');
    expect(email.text).toContain('Paid / ÄÃ£ thanh toÃ¡n');
  });

  it('escapes guest-controlled values in HTML', () => {
    const email = buildBookingConfirmationEmail(booking, settings);
    expect(email.html).toContain('Nguyen &lt;Van&gt; A');
    expect(email.html).not.toContain('Nguyen <Van> A');
  });
});

