import { getRooms } from './adminRoomService.js';

const MEDIA_KEY = 'lune_admin_media';

function readCustomMedia() {
  try {
    return JSON.parse(localStorage.getItem(MEDIA_KEY)) || [];
  } catch {
    return [];
  }
}

function writeCustomMedia(media) {
  localStorage.setItem(MEDIA_KEY, JSON.stringify(media));
  window.dispatchEvent(new Event('lune:media-updated'));
}

export function getMedia() {
  const roomImages = getRooms().flatMap((room) =>
    [room.image, ...(room.gallery || [])]
      .filter(Boolean)
      .map((url) => ({
        id: `room-${room.id}-${url}`,
        url,
        title: room.name,
        source: 'room',
        roomId: room.id,
      })),
  );

  const combined = [...readCustomMedia(), ...roomImages];
  const seen = new Set();
  return combined.filter((item) => {
    if (!item.url || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

export function addMedia(item) {
  const media = readCustomMedia();
  const nextItem = {
    id: item.id || `media-${Date.now()}`,
    title: item.title || 'Lune image',
    url: item.url,
    source: item.source || 'custom',
    createdAt: new Date().toISOString(),
  };
  writeCustomMedia([nextItem, ...media]);
  return nextItem;
}

export function deleteMedia(id) {
  writeCustomMedia(readCustomMedia().filter((item) => item.id !== id));
}
