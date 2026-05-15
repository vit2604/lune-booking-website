import { getVisibleRooms } from '../admin/services/adminRoomService.js';
import { apiRequest } from './apiClient.js';

function normalizeApiRoom(room) {
  return {
    ...room,
    type: room.type || 'Apartment',
    price: Number(room.price || room.basePrice || 0),
    bed: room.bed || room.bedType || '',
    beds: room.beds || room.bedType || '',
    bathroom: room.bathroom || 'Private bathroom',
    description: room.description || room.fullDescription || '',
    image: room.image || room.mainImage || room.gallery?.[0] || '',
    gallery: room.gallery?.length ? room.gallery : room.images?.map((image) => image.url) || [],
    status: room.status === 'ACTIVE' ? 'active' : room.status?.toLowerCase(),
  };
}

export async function fetchRoomsWithFallback(query = {}) {
  try {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params.set(key, value);
    });
    const data = await apiRequest(`/rooms${params.toString() ? `?${params}` : ''}`);
    return { source: 'api', rooms: data.map(normalizeApiRoom) };
  } catch (_error) {
    return { source: 'local', rooms: getVisibleRooms() };
  }
}

export async function fetchRoomWithFallback(slug, query = {}) {
  try {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params.set(key, value);
    });
    const data = await apiRequest(`/rooms/${slug}${params.toString() ? `?${params}` : ''}`);
    return { source: 'api', room: normalizeApiRoom(data.room), availability: data.availability };
  } catch (_error) {
    return { source: 'local', room: null, availability: null };
  }
}

export async function checkRoomAvailability(roomId, query = {}) {
  const params = new URLSearchParams(query);
  return apiRequest(`/rooms/${roomId}/availability?${params}`);
}
