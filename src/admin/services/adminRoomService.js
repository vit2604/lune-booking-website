import { rooms as defaultRooms } from '../../data/rooms.js';
import { legacyStorageKeys, readJsonStorage, storageKeys, writeJsonStorage } from '../../constants/storageKeys.js';

const ROOMS_KEY = storageKeys.rooms;

const toSlug = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getDefaultRoom = (room) => defaultRooms.find((item) => item.id === room.id || item.slug === room.slug);

const normalizeRoom = (room) => {
  const defaultRoom = getDefaultRoom(room) || {};
  return ({
  ...room,
  id: room.id || crypto.randomUUID(),
  slug: room.slug || toSlug(room.name || 'room'),
  type: room.type || 'Apartment',
  status: room.status || 'active',
  beds: room.beds || room.bed || '',
  numberOfBeds: Number(room.numberOfBeds || 1),
  price: Number(room.price || 0),
  discountPrice: Number(room.discountPrice || 0),
  longStayPrice: Number(room.longStayPrice || 0),
  priceVisible: room.priceVisible ?? true,
  priceNote: room.priceNote || '',
  maxGuests: Number(room.maxGuests || 1),
  size: room.size || '',
  image: room.image || room.gallery?.[0] || '',
  gallery: room.gallery?.length ? room.gallery : room.image ? [room.image] : [],
  amenities: room.amenities || [],
  roomPolicies: room.roomPolicies || {
    checkInTime: '14:00',
    checkOutTime: '12:00',
    smokingPolicy: 'No smoking inside the room',
    petPolicy: 'Pets are not allowed',
    cancellationNote: 'Contact our team for cancellation requests.',
    extraNote: '',
  },
  translations: {
    ...(defaultRoom.translations || {}),
    ...(room.translations || {
    en: {
      name: room.name || '',
      shortDescription: room.shortDescription || '',
      description: room.description || '',
      policyNote: '',
    },
    }),
  },
});
};

const seedRooms = () => defaultRooms.map((room) => normalizeRoom({ ...room, status: 'active' }));

function readRooms() {
  const stored = readJsonStorage(ROOMS_KEY, null, legacyStorageKeys.rooms);
  if (Array.isArray(stored) && stored.length) return stored.map(normalizeRoom);
  return seedRooms();
}

function writeRooms(rooms) {
  writeJsonStorage(ROOMS_KEY, rooms.map(normalizeRoom));
  window.dispatchEvent(new Event('lune:rooms-updated'));
}

export function getRooms() {
  return readRooms();
}

export function getVisibleRooms() {
  return readRooms().filter((room) => room.status !== 'hidden');
}

export function getRoomById(id) {
  return readRooms().find((room) => room.id === id || room.slug === id) || null;
}

export function createRoom(room) {
  const rooms = readRooms();
  const normalized = normalizeRoom({
    ...room,
    id: room.id || `room-${Date.now()}`,
    slug: room.slug || toSlug(room.name || `room-${Date.now()}`),
  });
  writeRooms([normalized, ...rooms]);
  return normalized;
}

export function updateRoom(id, room) {
  const rooms = readRooms();
  const updatedRooms = rooms.map((item) =>
    item.id === id ? normalizeRoom({ ...item, ...room, id }) : item,
  );
  writeRooms(updatedRooms);
  return updatedRooms.find((item) => item.id === id) || null;
}

export function deleteRoom(id) {
  writeRooms(readRooms().filter((room) => room.id !== id));
}

export function toggleRoomStatus(id) {
  const rooms = readRooms();
  const updatedRooms = rooms.map((room) =>
    room.id === id ? { ...room, status: room.status === 'hidden' ? 'active' : 'hidden' } : room,
  );
  writeRooms(updatedRooms);
  return updatedRooms.find((room) => room.id === id) || null;
}

export function resetRooms() {
  writeRooms(seedRooms());
}

export function generateRoomSlug(name) {
  return toSlug(name || '');
}
