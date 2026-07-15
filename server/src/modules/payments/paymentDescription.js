const PAYOS_DESCRIPTION_SUFFIX = ' chuyen tien';

function normalizeGuestName(value) {
  return String(value || '')
    .replace(/Đ/g, 'D')
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildPayosDescription(booking) {
  const guestName = normalizeGuestName(booking?.guest?.fullName) || 'Khach';
  return `${guestName}${PAYOS_DESCRIPTION_SUFFIX}`;
}
