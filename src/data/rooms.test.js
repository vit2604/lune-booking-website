import { describe, expect, it } from 'vitest';
import { rooms, roomTypes } from './rooms.js';

const knownBathroomOrDetailImages = new Set([
  '/images/lune/type-1-r201/type-1-r201-1.webp',
  '/images/lune/type-2-r601/type-2-r601-1.webp',
  '/images/lune/type-3-standard/type-3-standard-1.webp',
  '/images/lune/type-4-studio/type-4-studio-1.webp',
]);

describe('room catalog data', () => {
  it('has unique ids and slugs for routing and admin editing', () => {
    expect(new Set(rooms.map((room) => room.id)).size).toBe(rooms.length);
    expect(new Set(rooms.map((room) => room.slug)).size).toBe(rooms.length);
  });

  it('uses strong overview images as room card images', () => {
    rooms.forEach((room) => {
      expect(room.gallery?.length, `${room.id} should have gallery images`).toBeGreaterThan(0);
      expect(room.image, `${room.id} image should be first gallery item`).toBe(room.gallery[0]);
      expect(knownBathroomOrDetailImages.has(room.image), `${room.id} should not use bathroom/detail image`).toBe(false);
    });
  });

  it('splits Type 3 photos into two separate sellable room types', () => {
    const compact = rooms.find((room) => room.id === 'long-stay-apartment');
    const kitchen = rooms.find((room) => room.id === 'type-3-kitchen-apartment');

    expect(compact?.type).toBe('Deluxe double');
    expect(kitchen?.type).toBe('Type 3 kitchen');
    expect(compact?.gallery).not.toEqual(kitchen?.gallery);
    expect(compact?.image).toBe('/images/lune/type-3-standard/type-3-standard-5.webp');
    expect(kitchen?.image).toBe('/images/lune/type-3-standard/type-3-standard-10.webp');
  });

  it('keeps the filter list aligned with room data', () => {
    const actualTypes = new Set(rooms.map((room) => room.type));
    roomTypes.forEach((type) => expect(actualTypes.has(type)).toBe(true));
  });
});
