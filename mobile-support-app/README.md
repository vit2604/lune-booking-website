# Lune Support APK

Mobile support app for Lune Boutique Hotel & Apartment Da Nang staff.

The app connects to the existing Lune backend:

- Admin login with JWT.
- Realtime chat updates with Socket.IO.
- Guest messages are translated to Vietnamese for staff.
- Staff replies are written in Vietnamese and translated back to the guest language before sending.
- No translation API key is stored in the APK. Translation is requested through the Lune backend endpoint `/api/ai/translate`.

## Local Setup

```bash
cd mobile-support-app
npm install
npm run start
```

Scan the Expo QR code with Expo Go on Android.

## Build APK

Install and login to EAS once:

```bash
npx eas-cli login
```

Build an APK for direct installation:

```bash
cd mobile-support-app
npm run build:apk
```

EAS will return a download link for the `.apk`.

## Environment

Default production values:

```env
EXPO_PUBLIC_API_BASE_URL=https://lune-booking-api.onrender.com/api
EXPO_PUBLIC_SOCKET_URL=https://lune-booking-api.onrender.com
```

For local backend testing:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.x:4000/api
EXPO_PUBLIC_SOCKET_URL=http://192.168.1.x:4000
```

Use your computer LAN IP, not `localhost`, when testing from a real phone.

## Security Notes

- Do not put provider API keys, PayOS keys, database URLs, or JWT secrets in this app.
- Admin socket access requires a valid admin JWT.
- Production push notifications require Firebase/FCM or Expo push notification setup later.
- Background realtime delivery on Android requires push notifications; foreground realtime works through Socket.IO.

## Staff Flow

1. Open app.
2. Login with Lune admin/staff account.
3. Tap a guest conversation.
4. Read original guest message and Vietnamese translation.
5. Type reply in Vietnamese.
6. App translates reply to guest language and sends it to the website chat.
