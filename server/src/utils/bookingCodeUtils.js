import { randomInt } from 'node:crypto';

export function createBookingCode() {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate(),
  ).padStart(2, '0')}`;
  // 8 CSPRNG digits (100M combinations/day) so booking codes act as an
  // unguessable capability token and cannot be enumerated. Kept all-digits so
  // the PayOS order-code/description helpers (which strip non-digits) still work.
  const random = String(randomInt(0, 100000000)).padStart(8, '0');
  return `LUNE-${date}-${random}`;
}

export async function createUniqueBookingCode(prisma) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const bookingCode = createBookingCode();
    const existing = await prisma.booking.findUnique({ where: { bookingCode } });
    if (!existing) return bookingCode;
  }
  return `LUNE-${Date.now()}`;
}
