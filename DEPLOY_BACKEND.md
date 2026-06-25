# Deploy Backend API

Backend runs from `server/` with Node.js, Express, Prisma, PostgreSQL, JWT auth, and Socket.IO.

## Recommended Hosting

Use one of:
- Render Web Service
- Railway service
- Fly.io app
- VPS with Node.js process manager

The backend should be public at a separate API domain, for example:

```text
https://api.luneboutiquedanang.id.vn
```

## Environment Variables

Set these on the backend host:

```env
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=4000
CORS_ORIGIN=https://luneboutiquedanang.id.vn,https://www.luneboutiquedanang.id.vn
SOCKET_CORS_ORIGIN=https://luneboutiquedanang.id.vn,https://www.luneboutiquedanang.id.vn
BCRYPT_SALT_ROUNDS=10
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_strong_admin_password
ADMIN_EMAIL=admin@luneboutiquedanang.id.vn
CURRENCY_PROVIDER=frankfurter
FRANKFURTER_BASE_URL=https://api.frankfurter.dev/v1
PAYOS_ENABLED=false
PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=
PAYOS_RETURN_URL=https://luneboutiquedanang.id.vn/success
PAYOS_CANCEL_URL=https://luneboutiquedanang.id.vn/payment
PAYOS_WEBHOOK_URL=https://api.luneboutiquedanang.id.vn/api/webhooks/payment/payos
PAYOS_TIMEOUT_MS=15000
```

Do not commit real secrets to Git. `JWT_SECRET`, database credentials, and real payment/provider secrets must live in the hosting provider environment variables.

## Render Setup

1. Create a new Web Service.
2. Root directory: `server`
3. Runtime: Node.js
4. Build Command:

```bash
npm install && npm run prisma:generate
```

5. Start Command:

```bash
npm run start
```

6. Add all environment variables above.
7. After deploy, run migrations and seed from Render Shell or local terminal with production env:

```bash
npm run prisma:deploy
npm run prisma:seed
```

## Railway Setup

1. Create a PostgreSQL database.
2. Create a backend service from the repo.
3. Set service root to `server`.
4. Add the environment variables above.
5. Use:

```bash
npm install && npm run prisma:generate
```

as build command and:

```bash
npm run start
```

as start command.

6. Run:

```bash
npm run prisma:deploy
npm run prisma:seed
```

## VPS Setup

```bash
cd server
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
npm run start
```

For production VPS, run the server behind Nginx/Caddy with HTTPS and a process manager such as PM2.

## Health Check

Open:

```text
https://api.luneboutiquedanang.id.vn/api/health
```

Expected response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "databaseConnected": true,
    "currentTime": "...",
    "environment": "production"
  }
}
```

## Production Notes

- Do not run `prisma migrate reset` on production.
- `npm run prisma:seed` is idempotent and only creates missing default data.
- Change the admin password after first setup.
- PayOS QR payments are created by the backend only. Put `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, and `PAYOS_CHECKSUM_KEY` in backend environment variables, then set the PayOS webhook URL to `/api/webhooks/payment/payos`.
- Card and wallet providers other than PayOS are placeholders. Do not process card data directly in frontend.
- Keep `CORS_ORIGIN` restricted to the real frontend domain.
