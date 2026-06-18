import { env } from '../../config/env.js';

function parseRoomMapping() {
  if (!env.BLUEJAY_ROOM_MAPPING_JSON) return {};
  try {
    const parsed = JSON.parse(env.BLUEJAY_ROOM_MAPPING_JSON);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_error) {
    console.warn('Invalid BLUEJAY_ROOM_MAPPING_JSON. Bluejay availability will fail closed for mapped checks.');
    return {};
  }
}

function getExternalRoomId(roomId) {
  const mapping = parseRoomMapping();
  return mapping[roomId] || mapping[String(roomId)] || '';
}

function buildBluejayUrl() {
  const baseUrl = env.BLUEJAY_API_BASE_URL?.replace(/\/$/, '');
  const path = env.BLUEJAY_AVAILABILITY_PATH.startsWith('/')
    ? env.BLUEJAY_AVAILABILITY_PATH
    : `/${env.BLUEJAY_AVAILABILITY_PATH}`;
  return `${baseUrl}${path}`;
}

function buildAuthHeaders() {
  if (!env.BLUEJAY_API_TOKEN) return {};
  const prefix =
    env.BLUEJAY_AUTH_HEADER_PREFIX && env.BLUEJAY_AUTH_HEADER_PREFIX.toLowerCase() !== 'none'
      ? `${env.BLUEJAY_AUTH_HEADER_PREFIX} `
      : '';
  return { [env.BLUEJAY_AUTH_HEADER_NAME]: `${prefix}${env.BLUEJAY_API_TOKEN}` };
}

function buildAvailabilityPayload({ externalRoomId, checkIn, checkOut, guests }) {
  return {
    propertyId: env.BLUEJAY_PROPERTY_ID,
    roomId: externalRoomId,
    checkIn,
    checkOut,
    guests: Number(guests || 1),
  };
}

function buildAvailabilityRequest(payload, signal) {
  const method = env.BLUEJAY_AVAILABILITY_METHOD;
  const headers = {
    Accept: 'application/json',
    ...buildAuthHeaders(),
  };

  if (method === 'GET') {
    const url = new URL(buildBluejayUrl());
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
    });
    return { url: url.toString(), options: { method, headers, signal } };
  }

  return {
    url: buildBluejayUrl(),
    options: {
      method,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    },
  };
}

function normalizeBluejayAvailability(payload, externalRoomId) {
  if (!payload) return { available: false, reason: 'Bluejay returned an empty response' };

  if (typeof payload.available === 'boolean') {
    return { available: payload.available, reason: payload.reason || payload.message || '' };
  }

  if (typeof payload.isAvailable === 'boolean') {
    return { available: payload.isAvailable, reason: payload.reason || payload.message || '' };
  }

  const rooms = payload.rooms || payload.data?.rooms || payload.availability || payload.data?.availability;
  if (Array.isArray(rooms)) {
    const matched = rooms.find((room) => {
      const candidateId = room.id || room.roomId || room.roomTypeId || room.code || room.externalId;
      return String(candidateId) === String(externalRoomId);
    });

    if (!matched) return { available: false, reason: 'Bluejay did not return this room as available' };

    const inventory = Number(
      matched.availableRooms ?? matched.availableUnits ?? matched.inventory ?? matched.quantity ?? matched.availableCount ?? 0,
    );
    const available =
      matched.available === true ||
      matched.isAvailable === true ||
      String(matched.status || '').toLowerCase() === 'available' ||
      inventory > 0;

    return {
      available,
      reason: available ? '' : matched.reason || matched.message || 'Bluejay reports no available inventory',
      inventory: Number.isFinite(inventory) ? inventory : undefined,
      raw: matched,
    };
  }

  return { available: false, reason: 'Bluejay response format is not recognized' };
}

export function isBluejayEnabled() {
  return Boolean(env.BLUEJAY_ENABLED);
}

export async function checkBluejayRoomAvailability({ roomId, checkIn, checkOut, guests }) {
  if (!isBluejayEnabled()) {
    return { checked: false, available: true, reason: 'Bluejay availability is disabled' };
  }

  if (!env.BLUEJAY_API_BASE_URL) {
    return { checked: true, available: false, reason: 'Bluejay API base URL is not configured' };
  }

  const externalRoomId = getExternalRoomId(roomId);
  if (!externalRoomId) {
    return { checked: true, available: false, reason: 'Bluejay room mapping is missing' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.BLUEJAY_TIMEOUT_MS);

  try {
    const payload = buildAvailabilityPayload({ externalRoomId, checkIn, checkOut, guests });
    const request = buildAvailabilityRequest(payload, controller.signal);
    const response = await fetch(request.url, request.options);

    if (!response.ok) {
      return {
        checked: true,
        available: !env.BLUEJAY_FAIL_CLOSED,
        reason: `Bluejay availability request failed with HTTP ${response.status}`,
      };
    }

    const responsePayload = await response.json();
    const normalized = normalizeBluejayAvailability(responsePayload, externalRoomId);
    return { checked: true, source: 'bluejay', ...normalized };
  } catch (error) {
    return {
      checked: true,
      available: !env.BLUEJAY_FAIL_CLOSED,
      reason:
        error?.name === 'AbortError'
          ? 'Bluejay availability request timed out'
          : error?.message || 'Bluejay availability request failed',
    };
  } finally {
    clearTimeout(timeout);
  }
}
