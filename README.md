# Lune Boutique Hotel & Apartment Da Nang

Production-oriented booking website for Lune Boutique Apartment in Da Nang.

Canonical URL:

`https://www.luneboutiquedanang.com`

## Stack

- Frontend: React, Vite, React Router, Tailwind CSS.
- Backend: Node.js, Express, Socket.IO.
- Database: PostgreSQL.
- ORM: Prisma.
- Auth: JWT bearer token, bcrypt password hashing.
- Hosting: Vercel frontend, Render backend.

## Requirements

- Node.js 20+
- npm
- PostgreSQL 15+ or Docker Compose

## Install

```bash
npm ci
cd server
npm ci
```

## Development

Frontend:

```bash
npm run dev
```

Backend:

```bash
cd server
cp .env.example .env
npm run prisma:generate
npm run dev
```

Database with Docker:

```bash
docker compose up -d
cd server
npm run prisma:migrate
npm run prisma:seed
```

## Test and build

Frontend unit tests:

```bash
npm run test
```

Frontend production build:

```bash
npm run build
```

Backend schema validation:

```bash
cd server
npx prisma validate
npm run prisma:generate
```

Quality gate:

```bash
npm run quality:check
```

## Production environment

Frontend `.env.example`:

```env
VITE_API_BASE_URL=https://lune-booking-api.onrender.com/api
VITE_SOCKET_URL=https://lune-booking-api.onrender.com
VITE_USE_MOCK_FALLBACK=false
```

Backend required env:

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://www.luneboutiquedanang.com,https://luneboutiquedanang.com
SOCKET_CORS_ORIGIN=https://www.luneboutiquedanang.com,https://luneboutiquedanang.com
ADMIN_USERNAME=
ADMIN_PASSWORD=
ADMIN_EMAIL=
```

Never commit real `.env` files or secret values.

## Migration and seed

Production:

```bash
cd server
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
```

Before production migration:

```bash
pg_dump "$DATABASE_URL" --format=custom --file=backup-before-migration.dump
```

Never run `prisma migrate reset` in production.

## Deployment

Frontend: see `docs/DEPLOYMENT.md`.

Backend: see `docs/DEPLOYMENT.md` and `render.yaml`.

Domain/SSL: see `docs/DOMAIN_AND_SSL.md`.

## Backup

See `docs/BACKUP_AND_RECOVERY.md`.

## Rollback

See `docs/ROLLBACK.md`.

## Security

See `docs/SECURITY.md`.

Important:

- Backend calculates final price.
- Backend validates availability.
- Booking creation uses transaction locking and idempotency.
- Admin APIs require backend authorization.
- PayOS/Bluejay credentials must stay in backend env only.

## Troubleshooting

Frontend route refresh 404:

- Confirm `vercel.json` rewrite to `/index.html` exists.

API CORS error:

- Check `CORS_ORIGIN` and `SOCKET_CORS_ORIGIN` on Render.

Booking unavailable unexpectedly:

- Check existing bookings, blocked dates, and Bluejay settings.

Chrome says "Not secure":

- Verify URL starts with `https://`.
- Clear site data for the domain if old HTTP state is cached.
- Run `curl -I https://www.luneboutiquedanang.com`.

