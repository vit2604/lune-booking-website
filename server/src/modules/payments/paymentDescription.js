const PAYOS_DESCRIPTION_SUFFIX = ' chuyen tien';
const PAYOS_DESCRIPTION_MAX_LENGTH = 25;

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
  const guestName = normalizeGuestName(booking?.guest?.fullName).toLowerCase();
  const shortName = guestName.split(' ').filter(Boolean).slice(-2).join(' ') || 'khach';
  const maxNameLength = PAYOS_DESCRIPTION_MAX_LENGTH - PAYOS_DESCRIPTION_SUFFIX.length;
  return `${shortName.slice(0, maxNameLength).trim() || 'khach'}${PAYOS_DESCRIPTION_SUFFIX}`;
}
