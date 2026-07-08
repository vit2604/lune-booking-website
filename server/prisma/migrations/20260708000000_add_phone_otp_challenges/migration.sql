CREATE TABLE "PhoneOtpChallenge" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "tokenHash" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhoneOtpChallenge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PhoneOtpChallenge_phone_createdAt_idx" ON "PhoneOtpChallenge"("phone", "createdAt");
CREATE INDEX "PhoneOtpChallenge_tokenHash_idx" ON "PhoneOtpChallenge"("tokenHash");
CREATE INDEX "PhoneOtpChallenge_expiresAt_idx" ON "PhoneOtpChallenge"("expiresAt");
