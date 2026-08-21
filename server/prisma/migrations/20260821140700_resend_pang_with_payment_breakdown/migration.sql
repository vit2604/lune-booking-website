-- Requeue the Pang Wei Liang booking after the payment-breakdown template is live.
UPDATE "Booking"
SET
  "confirmationEmailSentAt" = NULL,
  "confirmationEmailClaimedAt" = NULL,
  "confirmationEmailNextAttemptAt" = NULL,
  "confirmationEmailAttempts" = 0,
  "confirmationEmailError" = NULL
WHERE "bookingCode" = 'LUNE-20260810-41440454'
  AND "bookingStatus" = 'CONFIRMED';
