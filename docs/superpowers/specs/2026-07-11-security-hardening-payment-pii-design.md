# Security Hardening — Payment Flow & Personal Information (Tier 1+2)

Date: 2026-07-11
Status: Approved for implementation
Scope: Backend + config only. No UI changes.

## Goal

Harden Web Lune against the highest-impact risks affecting the payment flow and
guest personal information (PII), guided by OWASP Top 10 2021, OWASP ASVS, and
the OWASP Cheat Sheet Series. Card handling is already offloaded to PayOS
(PCI-DSS SAQ-A model), so this work focuses on access control, data
minimization, and abuse resistance.

## Key discovery

`GET /api/bookings/:bookingCode` is **not called by any frontend page**
(`fetchBookingWithFallback` is dead code; `SuccessPage`/`PaymentPage` read from
`localStorage`). Locking down this endpoint therefore breaks no UX.

## Findings addressed

| # | Severity | Issue | OWASP |
|---|----------|-------|-------|
| 1 | High | Public booking lookup returns full guest PII with no auth/rate-limit; booking codes are `LUNE-YYYYMMDD-NNNN` (9,000/day) via `Math.random()` → enumerable | A01, A04 |
| 2 | Medium | Missing rate limits on public read + `/ai/translate` | A04 |
| 3 | Medium | API responses with PII lack `Cache-Control: no-store` (Vercel headers only cover the SPA) | A05 |
| 4 | Medium | `morgan` moderate CVE (log forging) | A06 |
| 5 | Low | `internalNote` length unbounded | A04 |

## Changes

### Tier 1 — Close PII exposure

1. **Unguessable booking codes** — `server/src/utils/bookingCodeUtils.js`
   - Replace `Math.random()` 4-digit suffix with `crypto.randomInt` **8 digits**:
     `LUNE-YYYYMMDD-NNNNNNNN`. 9,000 → 100,000,000 combinations/day.
   - Stays all-digits so PayOS `buildPayosOrderCode` / `buildPayosDescription`
     (which strip non-digits) keep working and gain entropy.

2. **Remove PII from public lookup** — `server/src/modules/bookings/booking.service.js`
   - New projection `publicBookingLookup(booking)` used by `getPublicBooking()`.
   - Returns: bookingCode, room (id/name/image), dates, nights, guests count,
     price fields, currency, bookingStatus, paymentStatus, paymentMethod,
     createdAt. **No `guest` block** (no name/email/phone/country).
   - `POST /bookings` response keeps `publicBookingSummary` (the submitter gets
     back their own data over a non-cacheable POST).

3. **Rate-limit public booking lookup** — new `publicReadRateLimit`
   (60 req / 10 min) on `GET /bookings/:bookingCode`.

### Tier 2 — Defense in depth

4. **Rate limits** — `server/src/middlewares/rateLimitMiddleware.js` + `app.js`
   - `generalRateLimit` (600 req / 15 min per IP) applied to `/api`, **after**
     mounting `/api/webhooks` (provider bursts must not be blocked; webhooks are
     signature-verified) and after health/ready.
   - `aiRateLimit` (30 req / 10 min) on `/api/ai`.

5. **`Cache-Control: no-store`** — new `noStoreForSensitive` middleware sets
   `no-store` when the request path matches `/api/admin`, `/api/bookings`,
   `/api/payments`, `/api/payment-methods`, `/api/phone-verification`.

6. **`npm audit fix`** in `server/` to patch `morgan`.

7. **Cap `internalNote`** — `booking.validation.js`: `z.string().max(5000).default('')`.

## Out of scope (Tier 3, future)

JWT → httpOnly cookie, shorter token TTL, webhook placeholder tightening.

## Verification

- Restart backend; confirm clean boot and `/api/health` OK.
- `npm test` (frontend vitest) passes — changes are backend-only, no regression.
- Manual: create a booking → code matches `LUNE-\d{8}-\d{8}`; `GET
  /api/bookings/:code` returns no guest PII; repeated lookups hit 429 after limit.
