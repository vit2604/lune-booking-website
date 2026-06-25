-- Add date-range room pricing for admin rate calendar.
CREATE TABLE "RoomRatePeriod" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "price" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomRatePeriod_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RoomRatePeriod_roomId_startDate_endDate_idx" ON "RoomRatePeriod"("roomId", "startDate", "endDate");

ALTER TABLE "RoomRatePeriod"
ADD CONSTRAINT "RoomRatePeriod_roomId_fkey"
FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
