CREATE TABLE "BookingRoom" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "guests" INTEGER NOT NULL DEFAULT 1,
    "adults" INTEGER NOT NULL DEFAULT 1,
    "children" INTEGER NOT NULL DEFAULT 0,
    "pricePerNight" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "serviceFee" INTEGER NOT NULL DEFAULT 0,
    "taxAmount" INTEGER NOT NULL DEFAULT 0,
    "totalPrice" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingRoom_pkey" PRIMARY KEY ("id")
);

INSERT INTO "BookingRoom" (
    "id",
    "bookingId",
    "roomId",
    "quantity",
    "guests",
    "adults",
    "children",
    "pricePerNight",
    "subtotal",
    "discountAmount",
    "serviceFee",
    "taxAmount",
    "totalPrice",
    "currency",
    "createdAt"
)
SELECT
    CONCAT('legacy_', "id"),
    "id",
    "roomId",
    1,
    "guests",
    "adults",
    "children",
    "pricePerNight",
    "subtotal",
    "discountAmount",
    "serviceFee",
    "taxAmount",
    "totalPrice",
    "currency",
    "createdAt"
FROM "Booking";

CREATE UNIQUE INDEX "BookingRoom_bookingId_roomId_key" ON "BookingRoom"("bookingId", "roomId");
CREATE INDEX "BookingRoom_roomId_idx" ON "BookingRoom"("roomId");

ALTER TABLE "BookingRoom"
ADD CONSTRAINT "BookingRoom_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BookingRoom"
ADD CONSTRAINT "BookingRoom_roomId_fkey"
FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
