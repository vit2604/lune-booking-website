# Production Database

Use PostgreSQL for production. Good managed options:

- Neon PostgreSQL
- Supabase PostgreSQL
- Render PostgreSQL
- Railway PostgreSQL

## Create Database

1. Create a PostgreSQL project/database.
2. Copy the production connection string.
3. Add it to backend environment variables as `DATABASE_URL`.

Example:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME?sslmode=require
```

For Neon or other serverless Postgres providers, prefer a pooled connection string for app runtime if recommended by the provider.

## Run Prisma

From `server/`:

```bash
npm install
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
```

`prisma:deploy` runs:

```bash
prisma migrate deploy
```

This is the correct production migration command.

## Seed Behavior

The production seed is idempotent. It creates missing defaults only:

- Admin account from `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_EMAIL`
- Default rooms
- Amenities
- Payment methods
- Site settings

It does not delete rooms, bookings, payment settings, or site settings already in the production database.

## Never Run On Production

Do not run:

```bash
prisma migrate reset
```

Do not delete production data manually unless you have a backup.

## Backup Notes

Before launch:

- Enable automated database backups if the provider supports it.
- Export a backup before large migrations.
- Keep database credentials out of frontend code.
