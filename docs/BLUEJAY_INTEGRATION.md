# Bluejay Availability Integration

This project checks room availability in two layers:

1. Local Lune database: existing bookings and manually blocked dates.
2. Bluejay/PMS API: external room inventory for the selected stay dates.

When `BLUEJAY_ENABLED=true`, the backend will call Bluejay before returning available rooms and before creating a booking. If Bluejay is unavailable or the room mapping is missing, `BLUEJAY_FAIL_CLOSED=true` blocks the booking so guests cannot reserve a room with uncertain inventory.

## Required Backend Environment Variables

```env
BLUEJAY_ENABLED=true
BLUEJAY_API_BASE_URL=https://bluejay-api.example.com
BLUEJAY_AVAILABILITY_PATH=/availability
BLUEJAY_AVAILABILITY_METHOD=POST
BLUEJAY_API_TOKEN=
BLUEJAY_AUTH_HEADER_NAME=Authorization
BLUEJAY_AUTH_HEADER_PREFIX=Bearer
BLUEJAY_PROPERTY_ID=
BLUEJAY_ROOM_MAPPING_JSON={"deluxe-studio":"BLUEJAY_ROOM_ID_1","superior-apartment":"BLUEJAY_ROOM_ID_2","family-apartment":"BLUEJAY_ROOM_ID_3","long-stay-apartment":"BLUEJAY_ROOM_ID_4","type-3-kitchen-apartment":"BLUEJAY_ROOM_ID_5"}
BLUEJAY_TIMEOUT_MS=6000
BLUEJAY_FAIL_CLOSED=true
```

If Bluejay uses an API key header instead of bearer auth, use:

```env
BLUEJAY_AUTH_HEADER_NAME=x-api-key
BLUEJAY_AUTH_HEADER_PREFIX=none
```

## Request Sent To Bluejay

For `POST`, the backend sends JSON:

```json
{
  "propertyId": "LUNE_PROPERTY_ID",
  "roomId": "BLUEJAY_ROOM_ID",
  "checkIn": "2026-09-09",
  "checkOut": "2026-09-10",
  "guests": 2
}
```

For `GET`, the same values are sent as query parameters.

## Supported Response Shapes

The adapter accepts common availability response formats, for example:

```json
{ "available": true }
```

```json
{
  "rooms": [
    { "roomId": "BLUEJAY_ROOM_ID", "availableRooms": 1 }
  ]
}
```

```json
{
  "data": {
    "availability": [
      { "roomTypeId": "BLUEJAY_ROOM_ID", "status": "available" }
    ]
  }
}
```

If the actual Bluejay response is different, update `server/src/modules/bluejay/bluejay.service.js` in `normalizeBluejayAvailability()`.

## Test Flow

1. Set the Bluejay env vars in backend hosting.
2. Restart/redeploy backend.
3. Call:

```text
GET /api/rooms?checkIn=2026-09-09&checkOut=2026-09-10&guests=2
```

Only rooms available in both the local database and Bluejay should be returned.

4. Try creating a booking:

```text
POST /api/bookings
```

The backend checks Bluejay again immediately before saving the booking.

## Security Notes

- Do not put real Bluejay API tokens in frontend code or Vercel public env.
- Keep PMS/API secrets only in backend environment variables.
- Production booking must fail closed when external availability cannot be verified.
