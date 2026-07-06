ALTER TABLE "Booking"
ADD COLUMN "bluejayBookingId" TEXT,
ADD COLUMN "bluejayBookingCode" TEXT,
ADD COLUMN "bluejaySyncStatus" TEXT NOT NULL DEFAULT 'NOT_SYNCED',
ADD COLUMN "bluejaySyncError" TEXT,
ADD COLUMN "bluejaySyncedAt" TIMESTAMP(3);
