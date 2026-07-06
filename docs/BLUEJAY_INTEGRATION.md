# Bluejay PMS API v2 Integration

The backend integrates with Bluejay PMS API v2 in two places:

1. Availability: `GET /search-roomtypes` before showing rooms or accepting a booking.
2. Booking creation: `POST /booking/create` after a local booking is created.

Real PMS bookings are only created when `BLUEJAY_CREATE_BOOKING_ENABLED=true`.

## Required Backend Environment Variables

Keep all values in backend-only environment variables. Never expose the API key in Vite or frontend code.

```env
BLUEJAY_ENABLED=true
BLUEJAY_CREATE_BOOKING_ENABLED=true
BLUEJAY_API_BASE_URL=https://api-pms.bluejaypms.com/api/v2
BLUEJAY_API_TOKEN=
BLUEJAY_AUTH_HEADER_NAME=ApiKey
BLUEJAY_AUTH_HEADER_PREFIX=none
BLUEJAY_PROPERTY_ID=6439
BLUEJAY_CHANNEL_CODE=BEL
BLUEJAY_ROOM_MAPPING_JSON={"one-bedroom-condo":"12666","one-bedroom-apartment-balcony":"12663","two-bedroom-apartment":"12665","studio-two-bed-balcony":"12664","two-bedroom-apartment-balcony":"12662"}
BLUEJAY_RATEPLAN_MAPPING_JSON={}
BLUEJAY_USER_AGENT=WebLuneBluejayAdapter/1.0
BLUEJAY_TIMEOUT_MS=10000
BLUEJAY_FAIL_CLOSED=true
```

`BLUEJAY_CHANNEL_CODE` is the PMS sales channel/source code. The API document uses `BEL` in the create booking example. Confirm this value with Bluejay or the hotel before production traffic if a different channel should be used.

## How To Recognize Common States

Use the admin diagnostics endpoint:

```text
GET /api/admin/bluejay/diagnostics?checkIn=2026-12-01&checkOut=2026-12-02&guests=2&roomId=one-bedroom-condo
```

What to look for:

- `config.tokenConfigured=true`: the backend has a token configured.
- `roomTypes` has rows: auth, base URL, property ID, and room type access are working.
- `search.availableTotal > 0`: PMS inventory is exposed to API/BE for that stay.
- `search.ratePlanTotal > 0`: at least one rate plan is exposed to API/BE for that stay.
- `selectedRoom.foundInSearch=true`: local room mapping points to a valid Bluejay room type.
- `selectedRoom.selectedRatePlanId` has a value: the backend has enough data to create a booking.

If `/roomtypes` works but `/search-roomtypes` returns room types with `available=0` and `ratesCount=0`, the usual cause is not the API key. It means the PMS has not exposed inventory/rates to the API/BE source for those stay dates, or the room/rate is not mapped to the sale source used by this API key.

## Local Room Mapping

Current mapping from local website room IDs to Bluejay room type IDs:

| Local room ID | Bluejay room type ID | Bluejay title |
|---|---:|---|
| `one-bedroom-condo` | `12666` | One Bedroom Apartment |
| `one-bedroom-apartment-balcony` | `12663` | One Bedroom Studio Apartment with Balcony |
| `two-bedroom-apartment` | `12665` | Two Bedroom Apartment |
| `studio-two-bed-balcony` | `12664` | Studio Apartment with Balcony |
| `two-bedroom-apartment-balcony` | `12662` | Two Bedroom Apartment With Bancony |

If Bluejay later changes room type IDs, update `BLUEJAY_ROOM_MAPPING_JSON`.

## Booking Creation

For booking creation the backend:

1. Checks local availability and blocked dates.
2. Calls Bluejay `search-roomtypes`.
3. Selects the mapped room type.
4. Selects the configured rate plan from `BLUEJAY_RATEPLAN_MAPPING_JSON`, or the first returned rate plan if no explicit mapping exists.
5. Sends `POST /booking/create` with local booking code as `reference_code`.
6. Stores PMS sync status on the local booking.

The booking table stores:

- `bluejayBookingId`
- `bluejayBookingCode`
- `bluejaySyncStatus`
- `bluejaySyncError`
- `bluejaySyncedAt`

With `BLUEJAY_FAIL_CLOSED=true`, booking creation is blocked if Bluejay availability or booking creation fails.
