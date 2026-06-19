# Deploy Frontend To Vercel

Frontend is a Vite React app at the repository root.

## Vercel Settings

Import the GitHub repository into Vercel and use:

```text
Framework Preset: Vite
Install Command: npm install
Build Command: npm run build
Output Directory: dist
Root Directory: repository root
```

`vercel.json` is already configured so refreshing `/rooms`, `/booking`, `/payment`, and `/admin/dashboard` does not return 404.

## Environment Variables

Set these in Vercel Project Settings:

```env
VITE_API_BASE_URL=https://api.luneboutiquedanang.id.vn/api
VITE_SOCKET_URL=https://api.luneboutiquedanang.id.vn
VITE_USE_MOCK_FALLBACK=false
```

For production booking, keep `VITE_USE_MOCK_FALLBACK=false`. When false:
- Rooms load from backend API.
- Bookings are created through backend API.
- Admin login uses backend JWT.
- Admin bookings and payment settings use backend API.
- API errors are shown instead of silently creating local mock bookings.

## Domain Setup

Use Vercel Domains to connect:

```text
luneboutiquedanang.id.vn
www.luneboutiquedanang.id.vn
```

Use your backend host DNS to connect:

```text
api.luneboutiquedanang.id.vn
```

Then update:

```env
VITE_API_BASE_URL=https://api.luneboutiquedanang.id.vn/api
VITE_SOCKET_URL=https://api.luneboutiquedanang.id.vn
```

Also update backend:

```env
CORS_ORIGIN=https://luneboutiquedanang.id.vn,https://www.luneboutiquedanang.id.vn
SOCKET_CORS_ORIGIN=https://luneboutiquedanang.id.vn,https://www.luneboutiquedanang.id.vn
```

## Final Frontend Test

After deploy:

1. Open `/`.
2. Open `/rooms`.
3. Open one room detail page.
4. Complete `/booking`.
5. Confirm `/payment`.
6. Verify `/booking-success` or `/success`.
7. Open `/admin/login`.
8. Login with the production admin account.
9. Confirm `/admin/bookings` shows the real database booking.
