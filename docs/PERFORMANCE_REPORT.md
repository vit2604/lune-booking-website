# Performance Report

Date: 2026-06-25

## Current build snapshot

Command:

```bash
npm run build
```

Observed output:

- main app chunk around 369 KB before gzip;
- CSS around 49 KB before gzip;
- route/component chunks are split by Vite dynamic imports.

## Targets

- LCP <= 2.5s on mobile 4G.
- INP <= 200ms.
- CLS <= 0.1.

## Implemented

- Vite hashed assets.
- Route/component chunking.
- Hero image is not lazy loaded.
- Gallery/card images use local WebP assets in current project.
- Vercel static asset caching.

## Recommendations

1. Run Lighthouse on:
   - `/`
   - `/rooms`
   - room detail page
   - `/booking`
   - `/contact`
   - `/admin/login`
2. Generate responsive `srcset` for large hotel photos.
3. Compress oversized images before upload.
4. Keep third-party scripts minimal.
5. Avoid caching availability/price responses too aggressively.
6. Consider moving AI chat translation work off critical path.

## Lighthouse

Not run in this pass because Lighthouse CLI is not installed in the repo. Install later:

```bash
npm i -D lighthouse
npx lighthouse https://www.luneboutiquedanang.com --view
```

