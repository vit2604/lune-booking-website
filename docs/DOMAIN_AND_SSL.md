# Domain and SSL

Canonical production URL:

`https://www.luneboutiquedanang.com`

Secondary domains should redirect with 301/308 to the canonical URL:

- `http://luneboutiquedanang.com/*`
- `https://luneboutiquedanang.com/*`
- `https://luneboutiquedanang.id.vn/*`
- `https://www.luneboutiquedanang.id.vn/*`
- Vercel preview/old production hostnames when used publicly

## Current repository configuration

- `vercel.json` redirects apex `.com`, `.id.vn`, and Vercel host to `https://www.luneboutiquedanang.com`.
- `index.html`, sitemap, robots, Open Graph, and JSON-LD use the `.com` canonical domain.
- `vercel.json` includes HSTS after HTTPS was verified.

## DNS target

Frontend:

- `www.luneboutiquedanang.com` -> Vercel CNAME target shown in Vercel.
- `luneboutiquedanang.com` -> Vercel apex A records or Vercel-recommended DNS.

Backend:

- Current direct API: `https://lune-booking-api.onrender.com`.
- Optional future API domain: `api.luneboutiquedanang.com` -> Render custom domain target.

## Vercel environment

Set:

```env
VITE_API_BASE_URL=https://lune-booking-api.onrender.com/api
VITE_SOCKET_URL=https://lune-booking-api.onrender.com
VITE_USE_MOCK_FALLBACK=false
```

If `api.luneboutiquedanang.com` is configured later, update:

```env
VITE_API_BASE_URL=https://api.luneboutiquedanang.com/api
VITE_SOCKET_URL=https://api.luneboutiquedanang.com
```

## Render environment

Set CORS to exact frontend domains:

```env
CORS_ORIGIN=https://www.luneboutiquedanang.com,https://luneboutiquedanang.com
SOCKET_CORS_ORIGIN=https://www.luneboutiquedanang.com,https://luneboutiquedanang.com
```

Add `.id.vn` only while the old domain is still in use.

## Verification commands

```bash
curl -I https://www.luneboutiquedanang.com
curl -IL http://luneboutiquedanang.com
curl -I https://lune-booking-api.onrender.com/api/health
curl -I https://lune-booking-api.onrender.com/api/ready
```

Expected:

- final frontend URL is HTTPS canonical `www`;
- `Strict-Transport-Security` exists;
- no `http://` image/script/iframe resources;
- backend CORS allows only configured frontend origins.

