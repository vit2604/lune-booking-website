# Website Audit Report

## 1. Tong quan he thong

Website Lune Boutique Hotel & Apartment Da Nang is a React/Vite frontend with an Express/Prisma/PostgreSQL backend. The main production goal is direct room booking with admin management, payment settings, PayOS QR support, chat, multilingual UI and mobile-first UX.

## 2. Cong nghe dang su dung

| Area | Technology |
|---|---|
| Frontend | React 19, Vite |
| Routing | React Router |
| Styling | Tailwind CSS, CSS variables |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| ORM | Prisma |
| Admin auth | JWT, bcrypt |
| Payment | Backend-only PayOS SDK, bank transfer, pay at property |
| Realtime | Socket.IO |
| Tests | Vitest |
| Deployment | Vercel frontend, Render/Railway/VPS backend |

## 3. Cac van de da phat hien

| ID | Hang muc | Muc do | Mo ta | File | Trang thai |
|---|---|---|---|---|---|
| B-001 | Payment | High | PayOS needed backend-only env, QR generation and webhook handling without exposing keys. | `server/src/modules/payments/payment.service.js`, `src/pages/PaymentPage.jsx` | Fixed |
| B-002 | Mobile UI | High | Mobile brand text could clip `Apartment`. | `src/components/Navbar.jsx` | Fixed |
| B-003 | SEO | Medium | JSON-LD address had broken Vietnamese encoding. | `index.html` | Fixed |
| B-004 | Security headers | Medium | CSP could block Google Fonts and JSON-LD structured data. | `vercel.json` | Fixed |
| B-005 | Accessibility | Medium | Missing skip link and explicit main content target. | `src/components/GuestLayout.jsx`, `src/index.css` | Fixed |
| B-006 | DevOps | Medium | Render blueprint did not include PayOS env placeholders. | `render.yaml` | Fixed |
| B-007 | QA docs | Low | Required before/after/manual audit docs were missing. | `docs/` | Fixed |

## 4. Cac thay doi da thuc hien

- Added PayOS SDK backend integration and QR code generation.
- Added PayOS webhook verification path through `/api/webhooks/payment/payos`.
- Made PayOS payment status updates idempotent so a paid booking is not downgraded by later webhook noise.
- Added PayOS env variables to backend `.env.example`, deploy docs and Render blueprint.
- Updated Payment Page to show PayOS QR/checkout when backend returns a real payment request.
- Changed payment UI label from generic VietQR to PayOS QR.
- Fixed mobile brand text wrapping for `Lune Boutique Apartment`.
- Fixed JSON-LD Vietnamese address.
- Updated Vercel CSP to allow Google Fonts and exact JSON-LD hash.
- Added skip link, visible focus style and `main#main-content`.
- Added `docs/website-audit-before.md`, this report and `docs/manual-testing-checklist.md`.

## 5. UI/UX

- Mobile brand now wraps into two lines instead of clipping.
- Payment page now clearly separates PayOS QR, bank transfer and pay-at-property behavior.
- Payment fallback message is explicit when PayOS is not configured.

## 6. Responsive

- Code-level mobile checks were applied to navbar and focus behavior.
- Manual testing still required on real iPhone/Android for keyboard, date input and PayOS checkout handoff.

## 7. Accessibility

- Added skip-to-main-content link.
- Added visible global `:focus-visible` outline.
- Main content now has a stable target id.

## 8. Performance

- Existing build uses route-level lazy loading.
- Images are already mostly WebP assets.
- Build output remains acceptable for MVP; future work should add image `srcset/sizes` and Lighthouse measurement on production.

## 9. SEO

- Existing title, description, canonical, Open Graph, sitemap and robots are present.
- Fixed JSON-LD Hotel address encoding.
- CSP now allows the JSON-LD script by hash instead of broad inline scripts.

## 10. Security

- No real PayOS secret is stored in frontend or source.
- Payment provider keys are backend env only.
- CSP, referrer policy, permissions policy and no-store headers are configured in Vercel.
- Frontend and backend npm high-level audits passed with 0 vulnerabilities.
- Remaining production requirement: configure real PayOS keys in Render and rotate any credential that was ever shared outside env systems.

## 11. Booking logic

- Existing tests cover date utilities, pricing and availability.
- Backend remains the source of truth for booking creation, price calculation and availability.
- Manual production test should confirm duplicate booking prevention against the live database.

## 12. API va database

- Backend app imports successfully with required env placeholders.
- PayOS webhook endpoint exists under `/api/webhooks/payment/payos`.
- Production database migration/seed must still be run on the real PostgreSQL database when deploying.

## 13. Testing

- Unit tests: pass.
- Production build: pass.
- npm audit frontend/backend: pass.
- Browser mobile test was attempted through the in-app browser but timed out in the automation runtime; manual checklist has been added for device verification.

## 14. Cac lenh da chay

```bash
npm test
npm run build
npm audit --audit-level=high
npm --prefix server audit --audit-level=high
node --check server/src/modules/payments/payment.service.js
node --check server/src/modules/payments/payment.controller.js
node --check server/src/config/env.js
```

Backend import smoke:

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/db JWT_SECRET=1234567890123456 node -e "import('./src/app.js')"
```

## 15. Ket qua build va test

- `npm test`: 4 files passed, 18 tests passed.
- `npm run build`: passed.
- `npm audit --audit-level=high`: found 0 vulnerabilities.
- `npm --prefix server audit --audit-level=high`: found 0 vulnerabilities.
- Backend syntax/import smoke: passed.

## 16. Cac van de chua the tu sua

| Van de | Ly do | Cach xu ly |
|---|---|---|
| PayOS live key setup | Requires merchant secret values from PayOS dashboard and Render env access. | Set backend env values, redeploy backend, register webhook URL in PayOS. |
| Real payment confirmation | Requires real PayOS transaction/webhook test. | Make a small test payment or PayOS sandbox transaction and confirm admin payment status changes. |
| Live mobile device QA | Requires physical iPhone/Android or stable browser emulation. | Use `docs/manual-testing-checklist.md`. |
| Legal text final approval | Hotel/legal owner must confirm policy wording. | Review Policies page before public launch. |

## 17. Cac bien moi truong can thiet

```env
PAYOS_ENABLED=true
PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=
PAYOS_RETURN_URL=https://luneboutiquedanang.id.vn/success
PAYOS_CANCEL_URL=https://luneboutiquedanang.id.vn/payment
PAYOS_WEBHOOK_URL=https://<backend-domain>/api/webhooks/payment/payos
PAYOS_TIMEOUT_MS=15000
```

## 18. Huong dan deploy

1. Set PayOS env variables on Render backend.
2. Set `PAYOS_WEBHOOK_URL` to the public backend webhook URL.
3. Redeploy backend.
4. In PayOS dashboard, configure webhook URL to `/api/webhooks/payment/payos`.
5. Redeploy frontend on Vercel if `vercel.json` or frontend files changed.
6. Test a full booking with PayOS QR.

## 19. Checklist nghiem thu cuoi cung

- [ ] Frontend production build succeeds.
- [ ] Backend starts with production env.
- [ ] `/api/health` returns database connected.
- [ ] Guest can create booking.
- [ ] Payment page creates PayOS QR for booking.
- [ ] PayOS webhook updates payment status.
- [ ] Admin sees booking and payment status.
- [ ] Mobile 320/375/390/414px has no horizontal scroll.
- [ ] Contact, Policies, Rooms and Success pages load.
- [ ] No real secret exists in repo.
