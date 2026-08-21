-- Requeue only the newest confirmed booking for the explicitly requested guest.
UPDATE "Booking"
SET
  "confirmationEmailSentAt" = NULL,
  "confirmationEmailClaimedAt" = NULL,
  "confirmationEmailNextAttemptAt" = NULL,
  "confirmationEmailAttempts" = 0,
  "confirmationEmailError" = NULL
WHERE "id" = (
  SELECT b."id"
  FROM "Booking" AS b
  INNER JOIN "Guest" AS g ON g."id" = b."guestId"
  WHERE LOWER(BTRIM(g."fullName")) = LOWER('Pang Wei Liang')
    AND b."bookingStatus" = 'CONFIRMED'
    AND g."email" IS NOT NULL
  ORDER BY b."createdAt" DESC
  LIMIT 1
);
