import { getVisibleRooms } from '../admin/services/adminRoomService.js';
import { canUseMockFallback } from '../config/apiConfig.js';
import { apiRequest } from './apiClient.js';

function normalizeApiRoom(room) {
  const priceSummary = room.priceSummary || null;
  return {
    ...room,
    type: room.type || 'Apartment',
    price: Number(priceSummary?.pricePerNight || room.price || room.basePrice || 0),
    priceSummary,
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
  } catch (error) {
    if (!canUseMockFallback()) throw error;
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
    return {
      source: 'api',
      room: normalizeApiRoom({ ...data.room, priceSummary: data.availability?.price || data.room?.priceSummary || null }),
      availability: data.availability,
    };
  } catch (error) {
    if (!canUseMockFallback()) throw error;
    return { source: 'local', room: null, availability: null };
  }
}

export async function checkRoomAvailability(roomId, query = {}) {
  const params = new URLSearchParams(query);
  return apiRequest(`/rooms/${roomId}/availability?${params}`);
}
