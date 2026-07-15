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
  const suffix = ' ck';
  const maxGuestNameLength = 25 - suffix.length;
  return `${guestName.slice(0, maxGuestNameLength).trim() || 'Khach'}${suffix}`;
}
