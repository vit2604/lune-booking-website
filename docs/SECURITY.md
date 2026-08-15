# Security Notes

## Authentication and authorization

- Admin login uses bcrypt password hashing and JWT.
- Admin routes require backend `requireAuth` and `requireAdmin`.
- JWT secret must be stored only in backend environment variables.
- Production should rotate the default dev admin password after seed.
- MFA is not implemented yet; keep the design MFA-ready.

## Input validation

- Booking, payment, chat, rooms, and AI translation routes use Zod validation.
- Booking prices are calculated by backend, not trusted from frontend.
- Booking creation locks the selected room row and rechecks overlap in a serializable transaction.
- Public rooms endpoint only exposes `ACTIVE` rooms.

## CORS

- Use exact production origins.
- Do not use wildcard CORS with credentials.
- Keep `.id.vn` only during migration from old domain.

## Headers

Frontend headers are in `vercel.json`:

- CSP
- HSTS
- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy
- Permissions-Policy

Backend uses Helmet.

## Payment

- Do not store card data.
- Do not mark payment as paid from frontend.
- PayOS secrets must be in backend env only.
- PayOS webhook must verify provider signature before updating status.

## File/media

- Public media URLs are sanitized.
- Production file upload should use object storage.
- Do not allow executable uploads.
- Avoid SVG uploads unless sanitized.

## Secrets

Do not commit:

- `.env`
- `server/.env`
- API keys
- database URLs
- admin passwords
- PayOS keys
- Bluejay tokens

If any secret was exposed in Git history or chat, rotate it in the provider console.

## Open security work

- Add MFA or one-time recovery flow for admin.
- Add persistent audit log table for admin actions.
- Add automated secret scanning in CI.
- Consider CSP Report-Only before removing `unsafe-inline` styles.
# AI Content threat model (2026-08-01)

AI Content uses existing JWT auth plus action permissions. STAFF may read/upload/edit and activate emergency stop; ADMIN handles review, schedule, diagnostics and Meta. Meta connect/disconnect and stop release require a JWT issued in the last 15 minutes.

- Upload: disk quarantine, UUID filenames, magic + Sharp/FFprobe validation, strict limits, originals outside public root, protected streaming and explicit consent review.
- XSS/CSRF: React renders text; no untrusted HTML. Bearer auth avoids classic cookie CSRF. If auth moves to cookies, add SameSite/CSRF/Origin checks.
- SSRF: core adapters use fixed Meta origin and loopback Ollama. Arbitrary URL fetch is not enabled; `ssrfGuard` is not a standalone fetch primitive.
- Secrets: env only, Meta token AES-256-GCM, token masked, sanitized errors, minimal subprocess env. Current broader site auth still stores JWT/device key in localStorage; this is a known pre-existing XSS-impact limitation and live mode must remain gated until session hardening is completed.
- Race/duplicate: unique publication intent, conditional state claim, approved content hash/version, PostgreSQL queue fencing, `PUBLISH_UNKNOWN` after ambiguous dispatch.
- Kill switch: works without Meta; pauses schedules and cancels pending jobs without deleting drafts.

Live Meta and `FULL_AUTO_SAFE` remain operationally disabled until OpenCV/Tesseract privacy detectors, reconciliation and live sandbox verification are completed.
