// Room occupancy rules (mirror of the frontend src/utils/occupancy.js).
//
// A room stores a single `maxGuests` number (its adult capacity). Children may
// be squeezed in beyond that, so the total headcount grows proportionally with
// the room size (1.5x) while the adult count stays capped at `maxGuests` and
// children never exceed MAX_CHILDREN.

export const OCCUPANCY_FACTOR = 1.5;
export const MAX_CHILDREN = 4;

export function getRoomCapacity(maxGuests) {
  const maxAdults = Math.max(1, Number(maxGuests) || 1);
  const maxTotal = Math.max(maxAdults, Math.round(maxAdults * OCCUPANCY_FACTOR));
  return {
    maxAdults,
    maxTotal,
    maxChildren: Math.max(0, Math.min(MAX_CHILDREN, maxTotal - 1)),
  };
}

export function fitsRoomCapacity(maxGuests, adults, children = 0) {
  const { maxAdults, maxTotal } = getRoomCapacity(maxGuests);
  const adultCount = Number(adults) || 0;
  const childCount = Number(children) || 0;
  return (
    adultCount >= 1 &&
    adultCount <= maxAdults &&
    childCount >= 0 &&
    childCount <= MAX_CHILDREN &&
    adultCount + childCount <= maxTotal
  );
}
