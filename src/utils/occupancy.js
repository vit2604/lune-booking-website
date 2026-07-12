// Room occupancy rules.
//
// A room stores a single `maxGuests` number (its adult capacity). Children may
// be squeezed in beyond that, so the total headcount is allowed to grow
// proportionally with the room size while the adult count stays capped at
// `maxGuests`.
//
// Anchor requested by the property (largest room, maxGuests = 4):
//   4 adults + 2 children, 2 adults + 3-4 children, 1 adult + 4 children.
// That is a total-headcount cap of 6 (= 4 * 1.5) with children never above 4.
// The same 1.5x factor scales the rule to every room type.

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

// Largest number of children allowed once `adults` is chosen.
export function getMaxChildren(maxGuests, adults) {
  const { maxTotal } = getRoomCapacity(maxGuests);
  const adultCount = Math.max(1, Number(adults) || 1);
  return Math.max(0, Math.min(MAX_CHILDREN, maxTotal - adultCount));
}

// Whether a given party fits a room under the occupancy rules.
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
