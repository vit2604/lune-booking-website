# Lune Engineering Playbook

This project uses the quality workflow inspired by `fdhhhdjd/Class-AI-Agent`: specify, plan, build, test, review, then deploy. The goal is practical reliability for a small hotel booking MVP, not process for its own sake.

## Quality Gates

Before deploying or sharing a test link:

```bash
npm run quality:check
```

This runs:

- Unit tests for booking dates, room availability, pricing, and room catalog data.
- Production frontend build.

For backend changes:

```bash
cd server
npm ci
npx prisma validate
npm run prisma:generate
```

## Critical Guest Flows

Always test these manually after UI or service changes:

- Home search -> Rooms -> Room Detail -> Booking -> Payment -> Success.
- Invalid date states: past check-in, checkout equal to check-in, checkout before check-in.
- Capacity rule: a room for 2 guests must block 3+ guests.
- Availability rule: overlapping bookings are blocked, checkout-to-checkin handoff is allowed.
- Payment: pay at property, bank transfer, copy transfer content, success page summary.
- Language switcher and currency selector after reload.
- Mobile width 375px and 430px.

## Code Review Axes

Review every meaningful change against:

- Correctness: booking, pricing, payment status, room routing, localStorage/API fallback.
- Readability: simple functions, clear names, no duplicated hard-coded business rules.
- Architecture: components call service layer; backend owns production pricing and availability.
- Security: no secret keys in frontend, admin JWT from backend, no real card handling in browser.
- Performance: optimized images, no unnecessary animation on input-heavy/admin screens.

## Data Rules

- Room card images must be room overview photos, not bathroom/detail photos.
- `src/data/rooms.js` is the mock fallback catalog.
- Admin room storage version must be bumped when default room data changes.
- Backend seed data must mirror the public mock catalog enough for production API mode.

## Deployment Rule

Production data must come from backend + PostgreSQL. `localStorage` is only for language, currency, admin token, chat fallback, and mock/demo mode.
