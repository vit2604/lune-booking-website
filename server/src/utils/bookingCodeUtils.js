export function createBookingCode() {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate(),
  ).padStart(2, '0')}`;
  const random = Math.floor(1000 + Math.random() * 9000);
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
