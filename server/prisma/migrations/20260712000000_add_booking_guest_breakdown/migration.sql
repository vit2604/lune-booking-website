ALTER TABLE "Booking"
ADD COLUMN "adults" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "children" INTEGER NOT NULL DEFAULT 0;

UPDATE "Booking"
SET "adults" = "guests",
    "children" = 0;
