import { env } from '../../config/env.js';
import { calculateNights, normalizeDate } from '../../utils/dateUtils.js';
import { getNightlyRates } from '../../utils/priceUtils.js';
import { createHttpError } from '../../utils/responseUtils.js';

const DEFAULT_MEAL_PLAN = { breakfast: false, lunch: false, dinner: false };

function safeJsonParse(value, fallback = {}) {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch (_error) {
    return fallback;
  }
}

function parseRoomMapping() {
  return safeJsonParse(env.BLUEJAY_ROOM_MAPPING_JSON, {});
}

function parseRatePlanMapping() {
  return safeJsonParse(env.BLUEJAY_RATEPLAN_MAPPING_JSON, {});
}

function getExternalRoomId(roomId) {
  const mapping = parseRoomMapping();
  return mapping[roomId] || mapping[String(roomId)] || '';
}

function getConfiguredRatePlanId(roomId, externalRoomId) {
  const mapping = parseRatePlanMapping();
  return mapping[roomId] || mapping[String(roomId)] || mapping[externalRoomId] || mapping[String(externalRoomId)] || '';
}

function requireBluejayConfig() {
  if (!env.BLUEJAY_API_BASE_URL) {
    throw createHttpError(500, 'Bluejay API base URL is not configured');
  }
  if (!env.BLUEJAY_API_TOKEN) {
    throw createHttpError(500, 'Bluejay API token is not configured');
  }
  if (!env.BLUEJAY_PROPERTY_ID) {
    throw createHttpError(500, 'Bluejay property ID is not configured');
  }
}

function buildBluejayUrl(path, params = {}) {
  const baseUrl = env.BLUEJAY_API_BASE_URL.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${baseUrl}${normalizedPath}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

function buildAuthHeaders() {
  const prefix =
    env.BLUEJAY_AUTH_HEADER_PREFIX && env.BLUEJAY_AUTH_HEADER_PREFIX.toLowerCase() !== 'none'
      ? `${env.BLUEJAY_AUTH_HEADER_PREFIX} `
      : '';

  const headers = {
    [env.BLUEJAY_AUTH_HEADER_NAME]: `${prefix}${env.BLUEJAY_API_TOKEN}`,
  };

  if (env.BLUEJAY_AUTH_HEADER_NAME !== 'ApiKey') {
    headers.ApiKey = env.BLUEJAY_API_TOKEN;
  }

  return headers;
}

function getBluejayUserAgent() {
  return env.BLUEJAY_USER_AGENT || 'WebLuneBluejayAdapter/1.0';
}

async function readResponsePayload(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (_error) {
    return { raw: text.slice(0, 1000) };
  }
}

function extractBluejayError(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const error = payload.errors || payload.error;
  if (!error) return null;

  if (Array.isArray(error)) {
    return error
      .map((item) => item?.message || item?.title || item?.detail || item?.code)
      .filter(Boolean)
      .join('; ');
  }

  if (typeof error === 'object') {
    return error.message || error.title || error.detail || error.code || 'Bluejay API returned an error';
  }

  return String(error);
}

async function bluejayRequest(path, { method = 'GET', params, body, signal } = {}) {
  requireBluejayConfig();
  const headers = {
    Accept: 'application/json',
    'User-Agent': getBluejayUserAgent(),
    ...buildAuthHeaders(),
  };

  const options = { method, headers, signal };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const response = await fetch(buildBluejayUrl(path, params), options);
  const payload = await readResponsePayload(response);
  const bluejayError = extractBluejayError(payload);

  if (!response.ok || bluejayError) {
    const error = new Error(bluejayError || `Bluejay request failed with HTTP ${response.status}`);
    error.statusCode = response.status || 502;
    error.payload = payload;
    throw error;
  }

  return payload;
}

async function withTimeout(callback) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.BLUEJAY_TIMEOUT_MS);

  try {
    return await callback(controller.signal);
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw createHttpError(504, 'Bluejay request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function getAttributes(payload) {
  const data = payload?.data;
  if (!data || typeof data !== 'object') return null;
  return data.attributes || null;
}

function getRoomTypeList(payload) {
  const attributes = getAttributes(payload);
  if (Array.isArray(attributes)) return attributes;
  if (attributes && typeof attributes === 'object') {
    if (Array.isArray(attributes.roomlist)) return attributes.roomlist;
    if (Array.isArray(attributes.roomtypes)) return attributes.roomtypes;
  }
  return [];
}

function normalizeRatePlan(rate) {
  return {
    ...rate,
    rateplan_id: rate?.rateplan_id ?? rate?.rate_plan_id ?? rate?.id,
    total: Number(rate?.total ?? 0),
    pre_discount_total: Number(rate?.pre_discount_total ?? rate?.total ?? 0),
    price_in_day: Array.isArray(rate?.price_in_day) ? rate.price_in_day : [],
    mealplan: rate?.mealplan || rate?.meal_plans || DEFAULT_MEAL_PLAN,
  };
}

function normalizeRoomType(roomType) {
  const rates = Array.isArray(roomType?.rates) ? roomType.rates.map(normalizeRatePlan) : [];
  return {
    ...roomType,
    id: roomType?.id,
    available: Number(roomType?.available ?? 0),
    rates,
  };
}

function selectMatchedRoomType(roomTypes, externalRoomId) {
  return roomTypes.map(normalizeRoomType).find((roomType) => String(roomType.id) === String(externalRoomId)) || null;
}

function selectRatePlan(roomType, roomId, externalRoomId) {
  if (!roomType) return null;
  const configuredRatePlanId = getConfiguredRatePlanId(roomId, externalRoomId);
  if (configuredRatePlanId) {
    return roomType.rates.find((rate) => String(rate.rateplan_id) === String(configuredRatePlanId)) || null;
  }
  return roomType.rates[0] || null;
}

function money(value) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? Math.round(numeric) : 0;
}

function getPhoneNumber(guest) {
  return `${guest?.phoneCode || ''}${guest?.phoneNumber || ''}`.replace(/\s+/g, '').trim();
}

function normalizeTime(value, fallback) {
  const match = String(value || '').match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (!match) return fallback;
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

function getArrivalTime(booking, ratePlan) {
  return normalizeTime(booking.arrivalTime, normalizeTime(ratePlan?.arrival, '14:00'));
}

function getDepartureTime(ratePlan) {
  return normalizeTime(ratePlan?.departure, '12:00');
}

function buildPriceInDay({ ratePlan, room, booking }) {
  if (Array.isArray(ratePlan?.price_in_day) && ratePlan.price_in_day.length) {
    return ratePlan.price_in_day.map((item) => ({
      night: normalizeDate(item.night),
      amount: money(item.amount ?? item.price),
      pre_discount_price: money(item.pre_discount_price ?? item.pre_discount_total ?? item.price ?? item.amount),
    }));
  }

  return getNightlyRates(room, booking.checkIn, booking.checkOut).map((night) => ({
    night: night.date,
    amount: money(night.price),
    pre_discount_price: money(night.price),
  }));
}

function sumPriceInDay(priceInDay = []) {
  return money(priceInDay.reduce((sum, item) => sum + Number(item.amount ?? item.price ?? 0), 0));
}

function buildBluejayPriceSummary(ratePlan, checkIn, checkOut, guests = 1) {
  const nights = calculateNights(checkIn, checkOut);
  const nightlyRates = Array.isArray(ratePlan?.price_in_day)
    ? ratePlan.price_in_day.map((item) => ({
        date: normalizeDate(item.night),
        price: money(item.amount ?? item.price),
        ratePeriodId: String(ratePlan.rateplan_id || ''),
        note: ratePlan.title || ratePlan.name || 'Bluejay BE rate',
      }))
    : [];
  const subtotal = nightlyRates.length
    ? money(nightlyRates.reduce((sum, item) => sum + Number(item.price || 0), 0))
    : money(ratePlan?.total || 0);
  const pricePerNight = nights > 0 ? money(subtotal / nights) : subtotal;

  return {
    pricePerNight,
    nights,
    checkIn: normalizeDate(checkIn),
    checkOut: normalizeDate(checkOut),
    guests: Number(guests || 1),
    nightlyRates,
    subtotal,
    discountAmount: 0,
    serviceFee: 0,
    taxAmount: 0,
    totalPrice: subtotal,
    currency: 'VND',
    source: 'bluejay',
    ratePlanId: ratePlan?.rateplan_id || null,
  };
}

export function isBluejayEnabled() {
  return Boolean(env.BLUEJAY_ENABLED || (env.BLUEJAY_API_BASE_URL && env.BLUEJAY_API_TOKEN && env.BLUEJAY_PROPERTY_ID));
}

export function isBluejayBookingCreateEnabled() {
  return Boolean(env.BLUEJAY_CREATE_BOOKING_ENABLED);
}

export function getBluejayConfigSummary() {
  const mapping = parseRoomMapping();
  const rateMapping = parseRatePlanMapping();
  return {
    enabled: isBluejayEnabled(),
    createBookingEnabled: env.BLUEJAY_CREATE_BOOKING_ENABLED,
    baseUrlConfigured: Boolean(env.BLUEJAY_API_BASE_URL),
    tokenConfigured: Boolean(env.BLUEJAY_API_TOKEN),
    authHeaderName: env.BLUEJAY_AUTH_HEADER_NAME,
    authHeaderPrefix: env.BLUEJAY_AUTH_HEADER_PREFIX,
    propertyId: env.BLUEJAY_PROPERTY_ID || '',
    channelCode: env.BLUEJAY_CHANNEL_CODE || '',
    failClosed: env.BLUEJAY_FAIL_CLOSED,
    roomMappings: mapping,
    ratePlanMappings: rateMapping,
  };
}

export async function listBluejayRoomTypes({ image = 'none', lang = 'vi-VN' } = {}) {
  return withTimeout(async (signal) =>
    bluejayRequest('/roomtypes', {
      signal,
      params: {
        property: env.BLUEJAY_PROPERTY_ID,
        image,
        lang,
        order: 'asc',
        filter: 'name',
      },
    }),
  );
}

export async function searchBluejayRoomTypes({ checkIn, checkOut, guests = 1, child = 0, image = 'none', lang = 'vi-VN' }) {
  return withTimeout(async (signal) =>
    bluejayRequest('/search-roomtypes', {
      signal,
      params: {
        property: env.BLUEJAY_PROPERTY_ID,
        from: normalizeDate(checkIn),
        to: normalizeDate(checkOut),
        adult: Number(guests || 1),
        child: Number(child || 0),
        image,
        lang,
      },
    }),
  );
}

export async function diagnoseBluejayAvailability({ roomId, checkIn, checkOut, guests = 1 }) {
  const roomTypePayload = await listBluejayRoomTypes();
  const searchPayload =
    checkIn && checkOut ? await searchBluejayRoomTypes({ checkIn, checkOut, guests }) : { data: { attributes: [] } };

  const roomTypes = getRoomTypeList(roomTypePayload).map(normalizeRoomType);
  const searchRoomTypes = getRoomTypeList(searchPayload).map(normalizeRoomType);
  const externalRoomId = roomId ? getExternalRoomId(roomId) : '';
  const matchedRoomType = externalRoomId ? selectMatchedRoomType(searchRoomTypes, externalRoomId) : null;
  const matchedRatePlan = matchedRoomType ? selectRatePlan(matchedRoomType, roomId, externalRoomId) : null;

  return {
    config: getBluejayConfigSummary(),
    roomTypes: roomTypes.map((roomType) => ({
      id: roomType.id,
      title: roomType.title,
      code: roomType.code,
      occAdult: roomType.occ_adult,
      occChild: roomType.occ_child,
      occMax: roomType.occ_max,
      numOfRooms: roomType.num_of_rooms,
    })),
    search: {
      checkIn: normalizeDate(checkIn),
      checkOut: normalizeDate(checkOut),
      guests: Number(guests || 1),
      roomTypeCount: searchRoomTypes.length,
      availableTotal: searchRoomTypes.reduce((sum, item) => sum + Number(item.available || 0), 0),
      ratePlanTotal: searchRoomTypes.reduce((sum, item) => sum + item.rates.length, 0),
      roomTypes: searchRoomTypes.map((roomType) => ({
        id: roomType.id,
        title: roomType.title,
        available: roomType.available,
        ratesCount: roomType.rates.length,
        firstRatePlanId: roomType.rates[0]?.rateplan_id || null,
        firstRateTotal: roomType.rates[0]?.total || null,
      })),
    },
    selectedRoom: roomId
      ? {
          localRoomId: roomId,
          externalRoomId,
          foundInSearch: Boolean(matchedRoomType),
          available: Number(matchedRoomType?.available || 0),
          ratesCount: matchedRoomType?.rates?.length || 0,
          selectedRatePlanId: matchedRatePlan?.rateplan_id || null,
        }
      : null,
  };
}

export async function checkBluejayRoomAvailability({ roomId, checkIn, checkOut, guests }) {
  if (!isBluejayEnabled()) {
    return { checked: false, available: true, reason: 'Bluejay availability is disabled' };
  }

  const externalRoomId = getExternalRoomId(roomId);
  if (!externalRoomId) {
    return { checked: true, available: false, reason: 'Bluejay room mapping is missing' };
  }

  try {
    const payload = await searchBluejayRoomTypes({ checkIn, checkOut, guests });
    const matchedRoomType = selectMatchedRoomType(getRoomTypeList(payload), externalRoomId);

    if (!matchedRoomType) {
      return { checked: true, available: false, reason: 'Bluejay did not return this room type' };
    }

    const ratePlan = selectRatePlan(matchedRoomType, roomId, externalRoomId);
    const available = Number(matchedRoomType.available || 0) > 0 && Boolean(ratePlan);

    return {
      checked: true,
      source: 'bluejay',
      available,
      inventory: matchedRoomType.available,
      ratePlanId: ratePlan?.rateplan_id || null,
      reason: available ? '' : 'Bluejay returned no available inventory or no rate plan for this stay',
      raw: {
        id: matchedRoomType.id,
        title: matchedRoomType.title,
        available: matchedRoomType.available,
        ratesCount: matchedRoomType.rates.length,
      },
    };
  } catch (error) {
    return {
      checked: true,
      available: !env.BLUEJAY_FAIL_CLOSED,
      reason: error?.message || 'Bluejay availability request failed',
    };
  }
}

export async function getBluejayStayAvailability({ roomIds = [], checkIn, checkOut, guests = 1 }) {
  const uniqueRoomIds = [...new Set(roomIds.filter(Boolean))];
  if (!isBluejayEnabled()) {
    return { checked: false, source: 'local', rooms: {} };
  }

  const buildFallbackRooms = (reason, available) =>
    Object.fromEntries(
      uniqueRoomIds.map((roomId) => [
        roomId,
        {
          checked: true,
          source: 'bluejay',
          available,
          reason,
          priceSummary: null,
        },
      ]),
    );

  try {
    const payload = await searchBluejayRoomTypes({ checkIn, checkOut, guests });
    const roomTypes = getRoomTypeList(payload);
    const rooms = {};

    uniqueRoomIds.forEach((roomId) => {
      const externalRoomId = getExternalRoomId(roomId);
      if (!externalRoomId) {
        rooms[roomId] = {
          checked: true,
          source: 'bluejay',
          available: false,
          reason: 'Bluejay room mapping is missing',
          priceSummary: null,
        };
        return;
      }

      const matchedRoomType = selectMatchedRoomType(roomTypes, externalRoomId);
      const ratePlan = selectRatePlan(matchedRoomType, roomId, externalRoomId);
      const available = Number(matchedRoomType?.available || 0) > 0 && Boolean(ratePlan);

      rooms[roomId] = {
        checked: true,
        source: 'bluejay',
        externalRoomId,
        available,
        inventory: Number(matchedRoomType?.available || 0),
        ratePlanId: ratePlan?.rateplan_id || null,
        ratePlanName: ratePlan?.title || ratePlan?.name || '',
        reason: available ? '' : 'Bluejay returned no available inventory or no rate plan for this stay',
        priceSummary: ratePlan ? buildBluejayPriceSummary(ratePlan, checkIn, checkOut, guests) : null,
      };
    });

    return { checked: true, source: 'bluejay', rooms };
  } catch (error) {
    return {
      checked: true,
      source: 'bluejay',
      rooms: buildFallbackRooms(error?.message || 'Bluejay availability request failed', !env.BLUEJAY_FAIL_CLOSED),
    };
  }
}

async function getCreateBookingContext({ booking, room }) {
  const externalRoomId = getExternalRoomId(room.id);
  if (!externalRoomId) {
    throw createHttpError(500, 'Bluejay room mapping is missing');
  }

  const payload = await searchBluejayRoomTypes({
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guests: booking.guests,
  });
  const matchedRoomType = selectMatchedRoomType(getRoomTypeList(payload), externalRoomId);
  const ratePlan = selectRatePlan(matchedRoomType, room.id, externalRoomId);

  if (!matchedRoomType || Number(matchedRoomType.available || 0) <= 0 || !ratePlan) {
    throw createHttpError(409, 'Bluejay returned no available inventory or no rate plan for this stay');
  }

  return { externalRoomId, matchedRoomType, ratePlan };
}

function buildBluejayBookingPayload({ booking, room, ratePlan, externalRoomId }) {
  const guest = booking.guest || {};
  const checkIn = normalizeDate(booking.checkIn);
  const checkOut = normalizeDate(booking.checkOut);
  const priceInDay = buildPriceInDay({ ratePlan, room, booking });
  const nights = calculateNights(checkIn, checkOut);
  const roomTotal = priceInDay.length ? sumPriceInDay(priceInDay) : money(ratePlan.total || 0);
  const averageAmount = nights > 0 ? money(roomTotal / nights) : roomTotal;
  const mealPlan = {
    ...DEFAULT_MEAL_PLAN,
    ...(ratePlan.mealplan || {}),
  };

  return {
    property_id: Number(env.BLUEJAY_PROPERTY_ID),
    customer: {
      customer_name: guest.fullName || 'Website Guest',
      customer_email: guest.email || '',
      customer_phone: getPhoneNumber(guest),
    },
    check_in: checkIn,
    check_out: checkOut,
    arrival: getArrivalTime(booking, ratePlan),
    departure: getDepartureTime(ratePlan),
    channel: env.BLUEJAY_CHANNEL_CODE,
    reference_code: booking.bookingCode,
    rooms: [
      {
        amount: averageAmount,
        quantity: 1,
        total: roomTotal,
        room_type_id: Number(externalRoomId),
        guests: [
          {
            guest_name: guest.fullName || 'Website Guest',
            guest_email: guest.email || '',
            guest_phone: getPhoneNumber(guest),
            primary: true,
          },
        ],
        rateplan: {
          rate_plan_id: Number(ratePlan.rateplan_id),
          occ_adult: Number(booking.guests || 1),
          occ_child: 0,
          meal_plans: {
            breakfast: Boolean(mealPlan.breakfast),
            lunch: Boolean(mealPlan.lunch),
            dinner: Boolean(mealPlan.dinner),
          },
        },
        price_in_day: priceInDay,
      },
    ],
    extra_services: null,
    discounts: null,
    services_price: 0,
    total: roomTotal,
    grand_total: roomTotal,
    discount: 0,
    currency: 'VND',
    note: booking.specialRequest || `Website booking ${booking.bookingCode}`,
  };
}

function normalizeCreatedBooking(payload) {
  const attributes = getAttributes(payload);
  const booking = attributes?.booking || attributes || {};
  return {
    id: booking.id ? String(booking.id) : null,
    code: booking.code || booking.book_code || booking.bookingCode || null,
    status: booking.status || null,
    message: payload?.meta?.message || '',
  };
}

export async function createBluejayBooking({ booking }) {
  if (!isBluejayBookingCreateEnabled()) {
    return { skipped: true, reason: 'Bluejay booking creation is disabled' };
  }

  if (!env.BLUEJAY_CHANNEL_CODE) {
    throw createHttpError(500, 'Bluejay channel code is not configured');
  }

  const { room } = booking;
  const context = await getCreateBookingContext({ booking, room });
  const body = buildBluejayBookingPayload({
    booking,
    room,
    ratePlan: context.ratePlan,
    externalRoomId: context.externalRoomId,
  });

  const payload = await withTimeout(async (signal) =>
    bluejayRequest('/booking/create', {
      method: 'POST',
      body,
      signal,
    }),
  );

  return {
    skipped: false,
    payload: normalizeCreatedBooking(payload),
  };
}
