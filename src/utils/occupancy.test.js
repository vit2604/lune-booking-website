import { describe, expect, it } from 'vitest';
import { fitsRoomCapacity, getMaxChildren, getRoomCapacity } from './occupancy.js';

describe('room occupancy rules', () => {
  it('caps a 4-guest room at 4 adults and a total of 6', () => {
    expect(getRoomCapacity(4)).toEqual({ maxAdults: 4, maxTotal: 6, maxChildren: 4 });
  });

  it('scales a 2-guest room proportionally to a total of 3', () => {
    expect(getRoomCapacity(2)).toEqual({ maxAdults: 2, maxTotal: 3, maxChildren: 2 });
  });

  it('matches the requested adult/child combinations for the large room', () => {
    expect(getMaxChildren(4, 4)).toBe(2); // 4 adults + 2 children
    expect(getMaxChildren(4, 2)).toBe(4); // 2 adults + up to 4 children
    expect(getMaxChildren(4, 1)).toBe(4); // 1 adult + 4 children
  });

  it('gives fewer children to a small room as adults increase', () => {
    expect(getMaxChildren(2, 2)).toBe(1);
    expect(getMaxChildren(2, 1)).toBe(2);
  });

  it('accepts valid parties and rejects overbooked ones', () => {
    expect(fitsRoomCapacity(4, 4, 2)).toBe(true);
    expect(fitsRoomCapacity(4, 1, 4)).toBe(true);
    expect(fitsRoomCapacity(4, 4, 3)).toBe(false); // total 7 > 6
    expect(fitsRoomCapacity(4, 5, 0)).toBe(false); // 5 adults > 4
    expect(fitsRoomCapacity(4, 0, 2)).toBe(false); // needs at least 1 adult
    expect(fitsRoomCapacity(2, 2, 2)).toBe(false); // total 4 > 3
  });
});
