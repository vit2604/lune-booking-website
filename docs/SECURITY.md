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

