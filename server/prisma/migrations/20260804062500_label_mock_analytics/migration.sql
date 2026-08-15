ALTER TABLE "AiAnalyticsSnapshot"
ADD COLUMN "isMock" BOOLEAN NOT NULL DEFAULT false;

UPDATE "AiAnalyticsSnapshot" AS snapshot
SET "isMock" = true
FROM "AiPublication" AS publication
WHERE snapshot."publicationId" = publication."id"
  AND publication."publisher" = 'mock';
