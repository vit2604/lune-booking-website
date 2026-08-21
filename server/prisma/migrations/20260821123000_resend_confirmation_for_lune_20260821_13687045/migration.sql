-- Requeue the corrected UTF-8 confirmation for the explicitly requested booking.
UPDATE "Booking"
SET
  "confirmationEmailSentAt" = NULL,
  "confirmationEmailClaimedAt" = NULL,
  "confirmationEmailNextAttemptAt" = NULL,
  "confirmationEmailAttempts" = 0,
  "confirmationEmailError" = NULL
WHERE "bookingCode" = 'LUNE-20260821-13687045'
  AND "bookingStatus" = 'CONFIRMED';
