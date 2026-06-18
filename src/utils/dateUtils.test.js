import { describe, expect, it } from 'vitest';
import {
  calculateNights,
  getDatesBetween,
  hasDateOverlap,
  isValidDateRange,
  normalizeDate,
} from './dateUtils.js';

describe('hotel date utilities', () => {
  it('normalizes date strings safely for hotel-night math', () => {
    expect(normalizeDate('2026-5-7')).toBe('2026-05-07');
    expect(normalizeDate('2026-05-07T23:00:00.000Z')).toBe('2026-05-07');
    expect(normalizeDate('bad-date')).toBe('');
  });

  it('calculates nights by calendar dates, not local hours', () => {
    expect(calculateNights('2026-05-15', '2026-05-16')).toBe(1);
    expect(calculateNights('2026-05-15', '2026-05-17')).toBe(2);
    expect(calculateNights('2026-05-15', '2026-05-15')).toBe(0);
    expect(calculateNights('2026-05-17', '2026-05-15')).toBe(0);
  });

  it('treats check-out as non-occupied for availability overlap', () => {
    const existing = { checkIn: '2026-05-15', checkOut: '2026-05-17' };

    expect(isValidDateRange('2026-05-17', '2026-05-18')).toBe(true);
    expect(hasDateOverlap({ checkIn: '2026-05-17', checkOut: '2026-05-18' }, existing)).toBe(false);
    expect(hasDateOverlap({ checkIn: '2026-05-16', checkOut: '2026-05-18' }, existing)).toBe(true);
  });

  it('lists occupied nights and excludes checkout date', () => {
    expect(getDatesBetween('2026-05-15', '2026-05-18')).toEqual([
      '2026-05-15',
      '2026-05-16',
      '2026-05-17',
    ]);
  });
});
