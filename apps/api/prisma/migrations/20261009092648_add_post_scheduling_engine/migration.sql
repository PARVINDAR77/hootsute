-- CreateEnum
CREATE TYPE "ScheduledPostStatus" AS ENUM ('SCHEDULED', 'PROCESSING', 'PARTIALLY_PUBLISHED', 'PUBLISHED', 'FAILED', 'CANCELLED', 'NEEDS_REAPPROVAL');

-- CreateEnum
CREATE TYPE "PublishTargetStatus" AS ENUM ('PENDING', 'DISPATCHING', 'PUBLISHED', 'FAILED', 'AUTH_REQUIRED', 'AMBIGUOUS_TIMEOUT', 'RETRYING', 'CANCELLED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "AttemptOutcome" AS ENUM ('SUCCESS', 'DEFINITIVE_FAILURE', 'AMBIGUOUS_TIMEOUT', 'AUTH_FAILURE', 'RATE_LIMITED');

-- CreateTable
CREATE TABLE "scheduled_posts" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "status" "ScheduledPostStatus" NOT NULL DEFAULT 'SCHEDULED',
    "approvedRevisionNumber" INTEGER NOT NULL,
    "contentSnapshot" JSONB NOT NULL,
    "snapshotHash" TEXT NOT NULL,
    "queueJobId" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledById" TEXT,
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_post_targets" (
    "id" TEXT NOT NULL,
    "scheduledPostId" TEXT NOT NULL,
    "socialAccountId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "variantId" TEXT,
    "status" "PublishTargetStatus" NOT NULL DEFAULT 'PENDING',
    "externalPostId" TEXT,
    "externalPostUrl" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastAttemptAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "rawResponse" JSONB,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_post_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publishing_attempts" (
    "id" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "outcome" "AttemptOutcome" NOT NULL,
    "sanitizedErrorCode" TEXT,
    "sanitizedErrorMessage" TEXT,
    "externalPostId" TEXT,
    "reconciliationStatus" TEXT,
    "reconciledAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "publishing_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scheduled_posts_workspaceId_scheduledAt_idx" ON "scheduled_posts"("workspaceId", "scheduledAt");

-- CreateIndex
CREATE INDEX "scheduled_posts_workspaceId_status_idx" ON "scheduled_posts"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "scheduled_posts_draftId_idx" ON "scheduled_posts"("draftId");

-- CreateIndex
CREATE INDEX "scheduled_posts_scheduledAt_status_idx" ON "scheduled_posts"("scheduledAt", "status");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_post_targets_idempotencyKey_key" ON "scheduled_post_targets"("idempotencyKey");

-- CreateIndex
CREATE INDEX "scheduled_post_targets_scheduledPostId_idx" ON "scheduled_post_targets"("scheduledPostId");

-- CreateIndex
CREATE INDEX "scheduled_post_targets_socialAccountId_idx" ON "scheduled_post_targets"("socialAccountId");

-- CreateIndex
CREATE INDEX "scheduled_post_targets_status_nextRetryAt_idx" ON "scheduled_post_targets"("status", "nextRetryAt");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_post_targets_scheduledPostId_socialAccountId_key" ON "scheduled_post_targets"("scheduledPostId", "socialAccountId");

-- CreateIndex
CREATE INDEX "publishing_attempts_targetId_idx" ON "publishing_attempts"("targetId");

-- CreateIndex
CREATE INDEX "publishing_attempts_outcome_idx" ON "publishing_attempts"("outcome");

-- CreateIndex
CREATE UNIQUE INDEX "publishing_attempts_targetId_attemptNumber_key" ON "publishing_attempts"("targetId", "attemptNumber");

-- AddForeignKey
ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "content_drafts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_post_targets" ADD CONSTRAINT "scheduled_post_targets_scheduledPostId_fkey" FOREIGN KEY ("scheduledPostId") REFERENCES "scheduled_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_post_targets" ADD CONSTRAINT "scheduled_post_targets_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "social_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publishing_attempts" ADD CONSTRAINT "publishing_attempts_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "scheduled_post_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
