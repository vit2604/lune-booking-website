ALTER TABLE "Booking"
ADD COLUMN "confirmationEmailSentAt" TIMESTAMP(3),
ADD COLUMN "confirmationEmailClaimedAt" TIMESTAMP(3),
ADD COLUMN "confirmationEmailNextAttemptAt" TIMESTAMP(3),
ADD COLUMN "confirmationEmailAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "confirmationEmailError" TEXT;

-- Existing confirmed stays predate this feature. Mark them as already handled so
-- deploying the worker never sends a surprise confirmation to historical guests.
UPDATE "Booking"
SET "confirmationEmailSentAt" = NOW()
WHERE "bookingStatus" = 'CONFIRMED';

CREATE INDEX "Booking_confirmationEmail_retry_idx"
ON "Booking" ("bookingStatus", "confirmationEmailSentAt", "confirmationEmailNextAttemptAt");

