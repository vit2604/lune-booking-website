ALTER TABLE "ChatMessage"
ADD COLUMN "attachmentData" TEXT,
ADD COLUMN "attachmentMime" TEXT,
ADD COLUMN "attachmentName" TEXT,
ADD COLUMN "attachmentSize" INTEGER;
