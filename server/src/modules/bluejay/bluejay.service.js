import { env } from '../../config/env.js';
import { calculateNights, normalizeDate } from '../../utils/dateUtils.js';
import { getNightlyRates } from '../../utils/priceUtils.js';
import { createHttpError } from '../../utils/responseUtils.js';
import {
  assertBluejayBookingConfirmed,
  buildBluejayConfirmationPath,
  buildBluejayConfirmationPayload as buildConfirmationPayload,
  buildBluejayPaymentPayload,
  getLatestPaidPayment,
  normalizeCreatedBooking,
} from './bluejayConfirmationUtils.js';
import { getBluejayPaymentSummary } from './bluejayPaymentUtils.js';

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
  const url = normalizedPath.startsWith('/api/')
    ? new URL(`${new URL(baseUrl).origin}${normalizedPath}`)
    : new URL(`${baseUrl}${normalizedPath}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

export function buildAuthHeaders() {
  return {
    ApiKey: env.BLUEJAY_API_TOKEN,
  };
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

function normalizeOccupancy({ guests = 1, adults, children, child } = {}) {
  const childCount = Math.max(0, Number(children ?? child ?? 0));
  const totalGuests = Math.max(1, Number(guests || 1));
  const adultCount = Math.max(1, Number(adults || totalGuests - childCount || 1));
  return {
    adults: adultCount,
    children: childCount,
    guests: adultCount + childCount,
  };
}

function buildBluejayPriceSummary(ratePlan, checkIn, checkOut, guests = 1, adults, children = 0) {
  const occupancy = normalizeOccupancy({ guests, adults, children });
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
    guests: occupancy.guests,
    adults: occupancy.adults,
    children: occupancy.children,
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

export async function searchBluejayRoomTypes({ checkIn, checkOut, guests = 1, adults, children, child = 0, image = 'none', lang = 'vi-VN' }) {
  const occupancy = normalizeOccupancy({ guests, adults, children, child });
  return withTimeout(async (signal) =>
    bluejayRequest('/search-roomtypes', {
      signal,
      params: {
        property: env.BLUEJAY_PROPERTY_ID,
        from: normalizeDate(checkIn),
        to: normalizeDate(checkOut),
        adult: occupancy.adults,
        child: occupancy.children,
        image,
        lang,
      },
    }),
  );
}

export async function diagnoseBluejayAvailability({ roomId, checkIn, checkOut, guests = 1, adults, children = 0 }) {
  const roomTypePayload = await listBluejayRoomTypes();
  const searchPayload =
    checkIn && checkOut ? await searchBluejayRoomTypes({ checkIn, checkOut, guests, adults, children }) : { data: { attributes: [] } };

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
      guests: normalizeOccupancy({ guests, adults, children }).guests,
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

export async function checkBluejayRoomAvailability({ roomId, checkIn, checkOut, guests, adults, children = 0 }) {
  if (!isBluejayEnabled()) {
    return { checked: false, available: true, reason: 'Bluejay availability is disabled' };
  }

  const externalRoomId = getExternalRoomId(roomId);
  if (!externalRoomId) {
    return { checked: true, available: false, reason: 'Bluejay room mapping is missing' };
  }

  try {
    const payload = await searchBluejayRoomTypes({ checkIn, checkOut, guests, adults, children });
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

export async function getBluejayStayAvailability({ roomIds = [], checkIn, checkOut, guests = 1, adults, children = 0 }) {
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
    const occupancy = normalizeOccupancy({ guests, adults, children });
    const payload = await searchBluejayRoomTypes({ checkIn, checkOut, guests: occupancy.guests, adults: occupancy.adults, children: occupancy.children });
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
        priceSummary: ratePlan ? buildBluejayPriceSummary(ratePlan, checkIn, checkOut, occupancy.guests, occupancy.adults, occupancy.children) : null,
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

function getBookingRoomItems(booking) {
  if (booking.roomItems?.length) return booking.roomItems;
  return [{
    roomId: booking.roomId,
    room: booking.room,
    quantity: 1,
    guests: booking.guests,
    adults: booking.adults,
    children: booking.children,
  }];
}

async function getCreateBookingContext({ booking, item }) {
  const room = item.room;
  const externalRoomId = getExternalRoomId(item.roomId || room.id);
  if (!externalRoomId) {
    throw createHttpError(500, 'Bluejay room mapping is missing');
  }

  const payload = await searchBluejayRoomTypes({
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guests: item.guests,
    adults: item.adults,
    children: item.children,
  });
  const matchedRoomType = selectMatchedRoomType(getRoomTypeList(payload), externalRoomId);
  const ratePlan = selectRatePlan(matchedRoomType, room.id, externalRoomId);
  const quantity = Math.max(1, Number(item.quantity || 1));

  if (!matchedRoomType || Number(matchedRoomType.available || 0) < quantity || !ratePlan) {
    throw createHttpError(409, `Bluejay does not have ${quantity} ${room.name || 'room'} room(s) available`);
  }

  return { item, room, externalRoomId, matchedRoomType, ratePlan };
}

export function buildBluejayBookingPayload({ booking, roomContexts, room, ratePlan, externalRoomId }) {
  const guest = booking.guest || {};
  const checkIn = normalizeDate(booking.checkIn);
  const checkOut = normalizeDate(booking.checkOut);
  const contexts = roomContexts?.length
    ? roomContexts
    : [{
        item: {
          roomId: room?.id,
          room,
          quantity: 1,
          guests: booking.guests,
          adults: booking.adults,
          children: booking.children,
        },
        room,
        ratePlan,
        externalRoomId,
      }];
  const rooms = contexts.map((context, index) => {
    const quantity = Math.max(1, Number(context.item.quantity || 1));
    const priceInDay = buildPriceInDay({ ratePlan: context.ratePlan, room: context.room, booking });
    const unitRoomTotal = priceInDay.length ? sumPriceInDay(priceInDay) : money(context.ratePlan.total || 0);
    const lineTotal = unitRoomTotal * quantity;
    const mealPlan = {
      ...DEFAULT_MEAL_PLAN,
      ...(context.ratePlan.mealplan || {}),
    };
    return {
      amount: unitRoomTotal,
      quantity,
      total: lineTotal,
      room_type_id: Number(context.externalRoomId),
      guests: [
        {
          guest_name: guest.fullName || 'Website Guest',
          guest_email: guest.email || '',
          guest_phone: getPhoneNumber(guest),
          primary: index === 0,
        },
      ],
      rateplan: {
        rate_plan_id: Number(context.ratePlan.rateplan_id),
        occ_adult: Number(context.item.adults || context.item.guests || 1),
        occ_child: Number(context.item.children || 0),
        meal_plans: {
          breakfast: Boolean(mealPlan.breakfast),
          lunch: Boolean(mealPlan.lunch),
          dinner: Boolean(mealPlan.dinner),
        },
      },
      price_in_day: priceInDay,
    };
  });
  const roomTotal = rooms.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const { paidAmount, remainingAmount } = getBluejayPaymentSummary(booking.payments, booking.totalPrice);
  const paidPayment = getLatestPaidPayment(booking.payments);
  const paymentNote = paidAmount > 0
    ? `Da coc ${paidAmount.toLocaleString('vi-VN')} VND; con lai ${remainingAmount.toLocaleString('vi-VN')} VND.`
    : '';
  const guestNote = booking.specialRequest || `Website booking ${booking.bookingCode}`;

  return {
    property_id: Number(env.BLUEJAY_PROPERTY_ID),
    customer: {
      customer_name: guest.fullName || 'Website Guest',
      customer_email: guest.email || '',
      customer_phone: getPhoneNumber(guest),
    },
    check_in: checkIn,
    check_out: checkOut,
    arrival: getArrivalTime(booking, contexts[0]?.ratePlan),
    departure: getDepartureTime(contexts[0]?.ratePlan),
    channel: env.BLUEJAY_CHANNEL_CODE,
    reference_code: booking.bookingCode,
    rooms,
    extra_services: null,
    discounts: null,
    services_price: 0,
    total: roomTotal,
    grand_total: roomTotal,
    ...(paidAmount > 0 ? {
      total_pay: paidAmount,
      payment: buildBluejayPaymentPayload({ booking, amount: paidAmount, payment: paidPayment }),
    } : {}),
    discount: 0,
    currency: 'VND',
    note: [paymentNote, guestNote].filter(Boolean).join(' '),
  };
}

export function buildBluejayConfirmationPayload(booking) {
  const redirectUrl = env.PAYOS_RETURN_URL || `${String(env.CORS_ORIGIN || 'https://www.luneboutiquedanang.com').split(',')[0].replace(/\/$/, '')}/success`;
  return buildConfirmationPayload(booking, {
    propertyId: env.BLUEJAY_PROPERTY_ID,
    channelCode: env.BLUEJAY_CHANNEL_CODE,
    redirectUrl,
  });
}

export { normalizeCreatedBooking };

export async function createBluejayBooking({ booking }) {
  if (!isBluejayBookingCreateEnabled()) {
    return { skipped: true, reason: 'Bluejay booking creation is disabled' };
  }

  if (!env.BLUEJAY_CHANNEL_CODE) {
    throw createHttpError(500, 'Bluejay channel code is not configured');
  }

  const roomContexts = await Promise.all(
    getBookingRoomItems(booking).map((item) => getCreateBookingContext({ booking, item })),
  );
  const inventoryByRoomType = roomContexts.reduce((inventory, context) => {
    const key = String(context.externalRoomId);
    const current = inventory.get(key) || { requested: 0, available: Number(context.matchedRoomType.available || 0), room: context.room };
    current.requested += Math.max(1, Number(context.item.quantity || 1));
    current.available = Math.min(current.available, Number(context.matchedRoomType.available || 0));
    inventory.set(key, current);
    return inventory;
  }, new Map());
  for (const { requested, available, room: selectedRoom } of inventoryByRoomType.values()) {
    if (requested > available) {
      throw createHttpError(409, `Bluejay does not have ${requested} ${selectedRoom.name || 'room'} room(s) available`);
    }
  }
  const body = buildBluejayBookingPayload({
    booking,
    roomContexts,
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

export async function confirmBluejayBooking({ booking }) {
  if (!booking?.bluejayBookingCode) {
    throw createHttpError(500, 'Bluejay booking code is missing');
  }
  if (!booking?.bluejayBookingId) {
    throw createHttpError(500, 'Bluejay booking ID is missing');
  }
  const payload = await withTimeout(async (signal) =>
    bluejayRequest(buildBluejayConfirmationPath(booking), {
      method: 'POST',
      body: buildBluejayConfirmationPayload(booking),
      signal,
    }),
  );
  const confirmed = assertBluejayBookingConfirmed(payload, booking.bluejayBookingCode);
  return { skipped: false, payload: confirmed };
}
