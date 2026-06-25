-- Additive migration for booking idempotency.
-- Safe rollback:
--   DROP INDEX IF EXISTS "Booking_idempotencyKey_key";
--   ALTER TABLE "Booking" DROP COLUMN IF EXISTS "idempotencyKey";
-- Backup production database before applying any migration:
--   pg_dump "$DATABASE_URL" --format=custom --file=backup-before-idempotency.dump

ALTER TABLE "Booking" ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "Booking_idempotencyKey_key" ON "Booking"("idempotencyKey");
