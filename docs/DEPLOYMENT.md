# Deployment

## Frontend: Vercel

Project root: repository root.

Settings:

- Framework: Vite
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`

Environment:

```env
VITE_API_BASE_URL=https://lune-booking-api.onrender.com/api
VITE_SOCKET_URL=https://lune-booking-api.onrender.com
VITE_USE_MOCK_FALLBACK=false
```

Deploy:

```bash
npm ci
npm run build
npx vercel --prod --scope vit2604s-projects
```

## Backend: Render

Root directory: `server`

Build command:

```bash
npm ci && npm run prisma:generate
```

Start command:

```bash
npm run prisma:deploy && npm run prisma:seed && npm run start
```

Health check path:

```text
/api/health
```

Readiness check:

```text
/api/ready
```

## Database migration

Before production migration:

```bash
pg_dump "$DATABASE_URL" --format=custom --file=backup-before-deploy.dump
```

Apply:

```bash
cd server
npm ci
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
```

Never run `prisma migrate reset` in production.

## Required backend environment

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

Optional:

```env
BLUEJAY_ENABLED=false
PAYOS_ENABLED=false
```

