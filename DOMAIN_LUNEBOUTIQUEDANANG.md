# Domain Setup: luneboutiquedanang.id.vn

Production target:

```text
Frontend: https://luneboutiquedanang.id.vn
Frontend www: https://www.luneboutiquedanang.id.vn
Backend API: https://api.luneboutiquedanang.id.vn
Current backend fallback: https://lune-booking-api.onrender.com
```

## DNS Records To Add

Add these records in the DNS manager for `luneboutiquedanang.id.vn`.

```text
Type   Host/Name   Value
A      @           76.76.21.21
CNAME  www         Use the exact CNAME value shown in Vercel Domains
CNAME  api         lune-booking-api.onrender.com
```

Notes:

- The apex/root domain `luneboutiquedanang.id.vn` should point to Vercel.
- The `www` subdomain should point to the Vercel CNAME value shown in the project Domains page.
- The `api` subdomain should point to Render with `lune-booking-api.onrender.com`.
- DNS can take a few minutes to 24 hours to fully propagate.

## Vercel Frontend

Project:

```text
lune-boutique-da-nang
```

Add these domains in Vercel:

```text
luneboutiquedanang.id.vn
www.luneboutiquedanang.id.vn
```

Vercel environment variables after `api.luneboutiquedanang.id.vn` is verified:

```env
VITE_API_BASE_URL=https://api.luneboutiquedanang.id.vn/api
VITE_SOCKET_URL=https://api.luneboutiquedanang.id.vn
VITE_USE_MOCK_FALLBACK=false
```

Safe temporary Vercel environment variables while API DNS is still pending:

```env
VITE_API_BASE_URL=https://lune-booking-api.onrender.com/api
VITE_SOCKET_URL=https://lune-booking-api.onrender.com
VITE_USE_MOCK_FALLBACK=false
```

## Render Backend

Service:

```text
lune-booking-api
```

Custom domain added:

```text
api.luneboutiquedanang.id.vn
```

Render DNS record required:

```text
Type: CNAME
Host: api
Value: lune-booking-api.onrender.com
```

Render environment variables:

```env
CORS_ORIGIN=https://luneboutiquedanang.id.vn,https://www.luneboutiquedanang.id.vn,https://lune-boutique-da-nang.vercel.app,http://localhost:5173,http://127.0.0.1:5173
SOCKET_CORS_ORIGIN=https://luneboutiquedanang.id.vn,https://www.luneboutiquedanang.id.vn,https://lune-boutique-da-nang.vercel.app,http://localhost:5173,http://127.0.0.1:5173
```

Do not commit `DATABASE_URL`, `JWT_SECRET`, real payment secrets, or deploy hooks.

## Verification Checklist

After DNS records are added:

1. In Vercel, verify `luneboutiquedanang.id.vn`.
2. In Vercel, verify `www.luneboutiquedanang.id.vn`.
3. In Render, verify `api.luneboutiquedanang.id.vn`.
4. Open `https://api.luneboutiquedanang.id.vn/api/health`.
5. Open `https://luneboutiquedanang.id.vn`.
6. Create a test booking.
7. Open `/admin/login` and confirm the booking appears in admin.
8. Test payment methods and chat.
