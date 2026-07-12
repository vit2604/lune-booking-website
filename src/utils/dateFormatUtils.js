function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return {
      year: value.getFullYear(),
      month: value.getMonth() + 1,
      day: value.getDate(),
    };
  }
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return null;
  return { year, month, day };
}

export function formatDateInputDisplay(date) {
  const parsed = parseDate(date);
  if (!parsed) return date || '';

  return `${String(parsed.day).padStart(2, '0')}/${String(parsed.month).padStart(2, '0')}/${parsed.year}`;
}

export function formatShortDisplayDate(date) {
  const parsed = parseDate(date);
  if (!parsed) return date || '';

  return `${String(parsed.day).padStart(2, '0')}/${String(parsed.month).padStart(2, '0')}`;
}

export function formatDisplayDate(date) {
  return formatDateInputDisplay(date);
}

export function formatDateRange(checkIn, checkOut) {
  return `${formatDisplayDate(checkIn)} - ${formatDisplayDate(checkOut)}`;
}
