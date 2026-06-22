# Lune Booking Backend

Backend API for Lune Boutique Hotel & Apartment Da Nang MVP booking system.

## Stack

- Node.js 20+ and Express.js
- PostgreSQL
- Prisma ORM
- Socket.IO for live chat
- JWT admin authentication
- bcrypt password hashing
- zod validation
- helmet, cors, morgan, express-rate-limit
- PayOS SDK for backend-only QR payment links

## Run Local

1. Install backend dependencies:

```bash
cd server
npm install
```

2. Create environment file:

```bash
copy .env.example .env
```

3. Run PostgreSQL:

```bash
docker compose up -d
```

4. Prepare Prisma:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

5. Run backend:

```bash
npm run dev
```

6. Run frontend from the project root:

```bash
npm install
npm run dev
```

## URLs

- API base: `http://localhost:4000/api`
- Health check: `http://localhost:4000/api/health`
- Socket.IO: `http://localhost:4000`
- Prisma Studio: `cd server && npm run prisma:studio`

## Admin Development Account

- Username: `admin`
- Password: `luneadmin123`

This is a development seed account only. Production must use `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_EMAIL` environment variables and a strong password.

## Frontend Env

Root `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
VITE_USE_MOCK_FALLBACK=true
```

In production, set `VITE_USE_MOCK_FALLBACK=false` so real rooms, bookings, admin login and payment methods come from the backend.

## PayOS Env

Real PayOS credentials must live only in backend environment variables:

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

After setting these on the backend host, register the webhook URL in the PayOS dashboard. Never put PayOS API keys in frontend code, localStorage, Git, or admin settings returned to guests.

## Main API Routes

- `GET /api/health`
- `POST /api/auth/admin/login`
- `GET /api/auth/me`
- `GET /api/rooms`
- `GET /api/rooms/:slug`
- `GET /api/rooms/:id/availability`
- `POST /api/bookings`
- `GET /api/bookings/:bookingCode`
- `GET /api/payment-methods`
- `POST /api/payments/create`
- `POST /api/payments/verify`
- `POST /api/webhooks/payment/payos`
- `GET /api/currency/rates`
- `GET /api/currency/convert`
- `GET /api/settings/public`
- `POST /api/chat/sessions`
- `GET /api/chat/sessions/:sessionCode/messages`
- `POST /api/chat/sessions/:sessionCode/messages`

Admin APIs use:

```http
Authorization: Bearer <token>
```

## Security Notes

- Do not store plain-text passwords. Seed uses bcrypt.
- `JWT_SECRET` must come from `.env`, never hard-coded.
- Do not store payment provider secret keys in frontend code.
- Do not process real card data in frontend.
- PayOS payment status must be trusted only after backend webhook verification.
- Currency live rates should be fetched by backend when an API key is required.
- Production should enable HTTPS, backups, monitoring, strong admin password and restricted CORS.
