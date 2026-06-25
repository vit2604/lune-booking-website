# Rollback

## Frontend rollback

1. Open Vercel project deployments.
2. Select the last known-good production deployment.
3. Promote it to production.
4. Verify:
   - `/`
   - `/rooms`
   - `/booking`
   - `/payment`
   - `/admin/login`

## Backend rollback

1. Open Render service deployments.
2. Redeploy the last known-good image/commit.
3. Verify:
   - `/api/health`
   - `/api/ready`
   - `/api/rooms`
   - `/api/payment-methods`

## Database rollback

Prefer forward fixes. If a migration must be rolled back:

1. Stop write traffic if possible.
2. Take a fresh backup.
3. Restore into a test database first.
4. Verify data integrity.
5. Run rollback SQL only after owner approval.

Rollback for `20260625043000_add_booking_idempotency_key`:

```sql
DROP INDEX IF EXISTS "Booking_idempotencyKey_key";
ALTER TABLE "Booking" DROP COLUMN IF EXISTS "idempotencyKey";
```

Do not run rollback if new bookings depend on idempotency audit data unless the owner accepts data loss for that column.

