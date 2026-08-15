CREATE TYPE "AiContentMode" AS ENUM ('REVIEW_REQUIRED', 'AUTO_AFTER_UPLOAD', 'FULL_AUTO_SAFE');
CREATE TYPE "AiWorkflowState" AS ENUM ('TREND_DETECTED', 'IDEA_PROPOSED', 'AWAITING_MEDIA', 'MEDIA_UPLOADED', 'MEDIA_ANALYZING', 'MEDIA_REJECTED', 'MEDIA_READY', 'DRAFT_GENERATING', 'DRAFT_READY', 'AWAITING_APPROVAL', 'APPROVED', 'SCHEDULED', 'PUBLISHING', 'PUBLISH_UNKNOWN', 'PUBLISHED', 'PUBLISH_FAILED', 'PAUSED', 'ARCHIVED');
CREATE TYPE "AiJobState" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'DEAD_LETTER', 'CANCELLED');
CREATE TYPE "ConsentStatus" AS ENUM ('UNKNOWN', 'GRANTED', 'DENIED', 'NOT_REQUIRED');

ALTER TABLE "MediaAsset"
  ADD COLUMN "originalFilename" TEXT,
  ADD COLUMN "safeFilename" TEXT,
  ADD COLUMN "detectedMime" TEXT,
  ADD COLUMN "sha256" TEXT,
  ADD COLUMN "perceptualHash" TEXT,
  ADD COLUMN "width" INTEGER,
  ADD COLUMN "height" INTEGER,
  ADD COLUMN "durationSeconds" DOUBLE PRECISION,
  ADD COLUMN "orientation" TEXT,
  ADD COLUMN "fileSizeBytes" BIGINT,
  ADD COLUMN "storageKey" TEXT,
  ADD COLUMN "capturedAt" TIMESTAMP(3),
  ADD COLUMN "blurScore" DOUBLE PRECISION,
  ADD COLUMN "exposureScore" DOUBLE PRECISION,
  ADD COLUMN "audioScore" DOUBLE PRECISION,
  ADD COLUMN "faceCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "privacyFlags" JSONB,
  ADD COLUMN "consentStatus" "ConsentStatus" NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN "qualityStatus" TEXT NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "rejectionReason" TEXT,
  ADD COLUMN "tags" JSONB,
  ADD COLUMN "usageCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastUsedAt" TIMESTAMP(3),
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE TABLE "AiBusinessProfile" (
  "id" TEXT NOT NULL DEFAULT 'lune', "brandName" TEXT NOT NULL, "address" TEXT NOT NULL,
  "hotline" TEXT NOT NULL, "website" TEXT NOT NULL, "verifiedFacts" JSONB NOT NULL,
  "allowedCtas" JSONB NOT NULL, "languages" JSONB NOT NULL, "toneOfVoice" TEXT NOT NULL,
  "forbiddenClaims" JSONB NOT NULL, "trendKeywords" JSONB NOT NULL DEFAULT '[]', "autonomyMode" "AiContentMode" NOT NULL DEFAULT 'REVIEW_REQUIRED',
  "emergencyStop" BOOLEAN NOT NULL DEFAULT false, "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiBusinessProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiTrendSignal" (
  "id" TEXT NOT NULL, "source" TEXT NOT NULL, "sourceUrl" TEXT, "title" TEXT NOT NULL,
  "summary" TEXT, "publishedAt" TIMESTAMP(3), "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "geographicScope" TEXT, "keywords" JSONB NOT NULL, "reliability" DOUBLE PRECISION NOT NULL,
  "commercialUseStatus" TEXT NOT NULL, "dedupHash" TEXT NOT NULL, "expiresAt" TIMESTAMP(3),
  "score" DOUBLE PRECISION, "scoreBreakdown" JSONB, "riskFlags" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiTrendSignal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiContentIdea" (
  "id" TEXT NOT NULL, "trendId" TEXT, "title" TEXT NOT NULL, "objective" TEXT NOT NULL,
  "audience" TEXT NOT NULL, "contentPillar" TEXT NOT NULL, "outputType" TEXT NOT NULL,
  "keyMessage" TEXT NOT NULL, "rationale" TEXT NOT NULL, "sourceUrl" TEXT,
  "estimatedMinutes" INTEGER NOT NULL DEFAULT 15, "recommendedPublishAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3), "priority" INTEGER NOT NULL DEFAULT 50,
  "allowedMode" "AiContentMode" NOT NULL DEFAULT 'REVIEW_REQUIRED', "claimsToVerify" JSONB NOT NULL,
  "status" "AiWorkflowState" NOT NULL DEFAULT 'IDEA_PROPOSED', "feedback" TEXT, "selectedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiContentIdea_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiShotItem" (
  "id" TEXT NOT NULL, "ideaId" TEXT NOT NULL, "sortOrder" INTEGER NOT NULL, "mediaType" TEXT NOT NULL,
  "orientation" TEXT NOT NULL, "aspectRatio" TEXT NOT NULL, "durationSeconds" INTEGER,
  "instruction" TEXT NOT NULL, "position" TEXT, "cameraDirection" TEXT, "movement" TEXT,
  "lighting" TEXT, "preparation" TEXT, "avoid" TEXT, "acceptance" TEXT NOT NULL,
  "fallback" TEXT, "takes" INTEGER NOT NULL DEFAULT 2, "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiShotItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiContentDraft" (
  "id" TEXT NOT NULL, "ideaId" TEXT, "state" "AiWorkflowState" NOT NULL DEFAULT 'DRAFT_READY',
  "version" INTEGER NOT NULL DEFAULT 1, "captionVi" TEXT NOT NULL, "captionEn" TEXT NOT NULL,
  "captionKo" TEXT, "shortCaption" TEXT NOT NULL, "headline" TEXT NOT NULL, "cta" TEXT NOT NULL,
  "hashtags" JSONB NOT NULL, "altText" TEXT NOT NULL, "factsUsed" JSONB NOT NULL,
  "sourceIds" JSONB NOT NULL, "riskFlags" JSONB NOT NULL, "confidence" DOUBLE PRECISION NOT NULL,
  "recommendedPublishAt" TIMESTAMP(3), "approvedAt" TIMESTAMP(3), "approvedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiContentDraft_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiContentAsset" (
  "id" TEXT NOT NULL, "draftId" TEXT NOT NULL, "mediaAssetId" TEXT NOT NULL, "role" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0, "renderMeta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiContentAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiPublication" (
  "id" TEXT NOT NULL, "draftId" TEXT NOT NULL, "idempotencyKey" TEXT NOT NULL,
  "publisher" TEXT NOT NULL DEFAULT 'mock', "pageId" TEXT, "approvedVersion" INTEGER NOT NULL,
  "contentHash" TEXT NOT NULL, "state" "AiWorkflowState" NOT NULL DEFAULT 'SCHEDULED',
  "scheduledAt" TIMESTAMP(3), "claimedAt" TIMESTAMP(3), "claimOwner" TEXT,
  "remotePostId" TEXT, "remotePermalink" TEXT, "failureCode" TEXT, "failureMessage" TEXT,
  "reconciliationDue" BOOLEAN NOT NULL DEFAULT false, "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiPublication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiPublicationAttempt" (
  "id" TEXT NOT NULL, "publicationId" TEXT NOT NULL, "attemptNumber" INTEGER NOT NULL,
  "status" TEXT NOT NULL, "responseCode" INTEGER, "remotePostId" TEXT, "errorCategory" TEXT,
  "errorMessage" TEXT, "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "finishedAt" TIMESTAMP(3),
  CONSTRAINT "AiPublicationAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiJob" (
  "id" TEXT NOT NULL, "type" TEXT NOT NULL, "payload" JSONB NOT NULL,
  "state" "AiJobState" NOT NULL DEFAULT 'PENDING', "idempotencyKey" TEXT NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "claimedAt" TIMESTAMP(3),
  "claimOwner" TEXT, "claimToken" TEXT, "leaseExpiresAt" TIMESTAMP(3), "heartbeatAt" TIMESTAMP(3),
  "attempts" INTEGER NOT NULL DEFAULT 0, "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  "lastError" TEXT, "finishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiMetaConnection" (
  "id" TEXT NOT NULL, "pageId" TEXT NOT NULL, "pageName" TEXT NOT NULL,
  "tokenCiphertext" TEXT NOT NULL, "tokenIv" TEXT NOT NULL, "tokenAuthTag" TEXT NOT NULL,
  "encryptionKeyVersion" TEXT NOT NULL, "grantedScopes" JSONB NOT NULL, "tokenExpiresAt" TIMESTAMP(3),
  "connectedById" TEXT NOT NULL, "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastHealthCheckAt" TIMESTAMP(3), "disconnectedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiMetaConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiMetaOAuthState" (
  "id" TEXT NOT NULL, "stateHash" TEXT NOT NULL, "adminId" TEXT NOT NULL, "redirectUri" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL, "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiMetaOAuthState_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiAnalyticsSnapshot" (
  "id" TEXT NOT NULL, "publicationId" TEXT NOT NULL, "windowHours" INTEGER NOT NULL,
  "reach" INTEGER NOT NULL DEFAULT 0, "impressions" INTEGER NOT NULL DEFAULT 0,
  "reactions" INTEGER NOT NULL DEFAULT 0, "comments" INTEGER NOT NULL DEFAULT 0,
  "shares" INTEGER NOT NULL DEFAULT 0, "linkClicks" INTEGER NOT NULL DEFAULT 0,
  "videoViews" INTEGER NOT NULL DEFAULT 0, "watchTimeMs" BIGINT NOT NULL DEFAULT 0,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiAnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiConsentRecord" (
  "id" TEXT NOT NULL, "mediaAssetId" TEXT NOT NULL, "status" "ConsentStatus" NOT NULL,
  "scope" TEXT NOT NULL, "evidenceRef" TEXT, "grantedAt" TIMESTAMP(3), "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3), "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiConsentRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiServiceUsage" (
  "id" TEXT NOT NULL, "service" TEXT NOT NULL, "periodKey" TEXT NOT NULL,
  "units" INTEGER NOT NULL DEFAULT 0, "hardLimit" INTEGER NOT NULL, "disabledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiServiceUsage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiAuditLog" (
  "id" TEXT NOT NULL, "actorId" TEXT, "action" TEXT NOT NULL, "entityType" TEXT NOT NULL,
  "entityId" TEXT, "correlationId" TEXT, "ipHash" TEXT, "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MediaAsset_sha256_key" ON "MediaAsset"("sha256");
CREATE INDEX "MediaAsset_qualityStatus_createdAt_idx" ON "MediaAsset"("qualityStatus", "createdAt");
CREATE INDEX "MediaAsset_deletedAt_idx" ON "MediaAsset"("deletedAt");
CREATE UNIQUE INDEX "AiTrendSignal_dedupHash_key" ON "AiTrendSignal"("dedupHash");
CREATE INDEX "AiTrendSignal_score_expiresAt_idx" ON "AiTrendSignal"("score", "expiresAt");
CREATE INDEX "AiContentIdea_status_createdAt_idx" ON "AiContentIdea"("status", "createdAt");
CREATE UNIQUE INDEX "AiShotItem_ideaId_sortOrder_key" ON "AiShotItem"("ideaId", "sortOrder");
CREATE INDEX "AiContentDraft_state_recommendedPublishAt_idx" ON "AiContentDraft"("state", "recommendedPublishAt");
CREATE UNIQUE INDEX "AiContentAsset_draftId_mediaAssetId_role_key" ON "AiContentAsset"("draftId", "mediaAssetId", "role");
CREATE UNIQUE INDEX "AiPublication_idempotencyKey_key" ON "AiPublication"("idempotencyKey");
CREATE UNIQUE INDEX "AiPublication_remotePostId_key" ON "AiPublication"("remotePostId");
CREATE INDEX "AiPublication_state_scheduledAt_idx" ON "AiPublication"("state", "scheduledAt");
CREATE UNIQUE INDEX "AiPublication_draftId_approvedVersion_publisher_pageId_key" ON "AiPublication"("draftId", "approvedVersion", "publisher", "pageId");
CREATE UNIQUE INDEX "AiPublicationAttempt_publicationId_attemptNumber_key" ON "AiPublicationAttempt"("publicationId", "attemptNumber");
CREATE UNIQUE INDEX "AiJob_idempotencyKey_key" ON "AiJob"("idempotencyKey");
CREATE INDEX "AiJob_state_scheduledAt_idx" ON "AiJob"("state", "scheduledAt");
CREATE INDEX "AiJob_claimOwner_heartbeatAt_idx" ON "AiJob"("claimOwner", "heartbeatAt");
CREATE UNIQUE INDEX "AiMetaConnection_pageId_key" ON "AiMetaConnection"("pageId");
CREATE UNIQUE INDEX "AiMetaOAuthState_stateHash_key" ON "AiMetaOAuthState"("stateHash");
CREATE INDEX "AiMetaOAuthState_adminId_expiresAt_idx" ON "AiMetaOAuthState"("adminId", "expiresAt");
CREATE UNIQUE INDEX "AiAnalyticsSnapshot_publicationId_windowHours_key" ON "AiAnalyticsSnapshot"("publicationId", "windowHours");
CREATE INDEX "AiConsentRecord_mediaAssetId_status_idx" ON "AiConsentRecord"("mediaAssetId", "status");
CREATE UNIQUE INDEX "AiServiceUsage_service_periodKey_key" ON "AiServiceUsage"("service", "periodKey");
CREATE INDEX "AiAuditLog_entityType_entityId_createdAt_idx" ON "AiAuditLog"("entityType", "entityId", "createdAt");
CREATE INDEX "AiAuditLog_actorId_createdAt_idx" ON "AiAuditLog"("actorId", "createdAt");

ALTER TABLE "AiContentIdea" ADD CONSTRAINT "AiContentIdea_trendId_fkey" FOREIGN KEY ("trendId") REFERENCES "AiTrendSignal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AiShotItem" ADD CONSTRAINT "AiShotItem_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "AiContentIdea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiContentDraft" ADD CONSTRAINT "AiContentDraft_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "AiContentIdea"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AiContentAsset" ADD CONSTRAINT "AiContentAsset_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "AiContentDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiContentAsset" ADD CONSTRAINT "AiContentAsset_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AiPublication" ADD CONSTRAINT "AiPublication_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "AiContentDraft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AiPublicationAttempt" ADD CONSTRAINT "AiPublicationAttempt_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "AiPublication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiAnalyticsSnapshot" ADD CONSTRAINT "AiAnalyticsSnapshot_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "AiPublication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiConsentRecord" ADD CONSTRAINT "AiConsentRecord_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
