-- CreateEnum
CREATE TYPE "AnalyticsMetricPeriod" AS ENUM ('DAY', 'WEEK', 'DAYS_28', 'LIFETIME');

-- CreateEnum
CREATE TYPE "PostAnalyticsType" AS ENUM ('POST', 'IMAGE', 'VIDEO', 'REEL', 'CAROUSEL', 'STORY');

-- CreateEnum
CREATE TYPE "SyncJobType" AS ENUM ('ACCOUNT_DAILY', 'POST_INCREMENTAL', 'MANUAL_REFRESH', 'HISTORICAL_BACKFILL');

-- CreateEnum
CREATE TYPE "SyncJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'PARTIAL_SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "GrowthInsightCategory" AS ENUM ('TIMING', 'CONTENT_FORMAT', 'ENGAGEMENT', 'TOPIC_AUDIENCE', 'CONSISTENCY');

-- CreateTable
CREATE TABLE "account_analytics_snapshots" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "socialAccountId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "period" "AnalyticsMetricPeriod" NOT NULL DEFAULT 'DAY',
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "followersCount" INTEGER,
    "followersNetChange" INTEGER,
    "impressions" INTEGER,
    "reach" INTEGER,
    "profileViews" INTEGER,
    "websiteClicks" INTEGER,
    "engagementTotal" INTEGER,
    "engagementRate" DOUBLE PRECISION,
    "provenance" TEXT,
    "rawMetrics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_analytics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_analytics_snapshots" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "socialAccountId" TEXT NOT NULL,
    "scheduledPostTargetId" TEXT,
    "externalPostId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "postType" "PostAnalyticsType" NOT NULL DEFAULT 'POST',
    "publishedAt" TIMESTAMP(3),
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "likesCount" INTEGER,
    "commentsCount" INTEGER,
    "sharesCount" INTEGER,
    "savesCount" INTEGER,
    "impressions" INTEGER,
    "reach" INTEGER,
    "clicks" INTEGER,
    "videoViews" INTEGER,
    "watchTimeMs" BIGINT,
    "engagementRate" DOUBLE PRECISION,
    "provenance" TEXT,
    "rawMetrics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_analytics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_sync_jobs" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "socialAccountId" TEXT,
    "jobType" "SyncJobType" NOT NULL,
    "status" "SyncJobStatus" NOT NULL DEFAULT 'QUEUED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "itemsProcessed" INTEGER NOT NULL DEFAULT 0,
    "itemsFailed" INTEGER NOT NULL DEFAULT 0,
    "lastSuccessfulSyncAt" TIMESTAMP(3),
    "leaseExpiresAt" TIMESTAMP(3),
    "claimToken" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_sync_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_sync_errors" (
    "id" TEXT NOT NULL,
    "syncJobId" TEXT NOT NULL,
    "socialAccountId" TEXT,
    "externalPostId" TEXT,
    "errorCode" TEXT NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "httpStatus" INTEGER,
    "isPermissionError" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_sync_errors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growth_insights" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "category" "GrowthInsightCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "suggestedAction" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "dismissedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "account_analytics_snapshots_workspaceId_snapshotDate_idx" ON "account_analytics_snapshots"("workspaceId", "snapshotDate");

-- CreateIndex
CREATE INDEX "account_analytics_snapshots_socialAccountId_snapshotDate_idx" ON "account_analytics_snapshots"("socialAccountId", "snapshotDate");

-- CreateIndex
CREATE INDEX "account_analytics_snapshots_workspaceId_platform_snapshotDa_idx" ON "account_analytics_snapshots"("workspaceId", "platform", "snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "account_analytics_snapshots_socialAccountId_period_snapshot_key" ON "account_analytics_snapshots"("socialAccountId", "period", "snapshotDate");

-- CreateIndex
CREATE INDEX "post_analytics_snapshots_workspaceId_snapshotDate_idx" ON "post_analytics_snapshots"("workspaceId", "snapshotDate");

-- CreateIndex
CREATE INDEX "post_analytics_snapshots_socialAccountId_snapshotDate_idx" ON "post_analytics_snapshots"("socialAccountId", "snapshotDate");

-- CreateIndex
CREATE INDEX "post_analytics_snapshots_externalPostId_idx" ON "post_analytics_snapshots"("externalPostId");

-- CreateIndex
CREATE INDEX "post_analytics_snapshots_scheduledPostTargetId_idx" ON "post_analytics_snapshots"("scheduledPostTargetId");

-- CreateIndex
CREATE INDEX "post_analytics_snapshots_workspaceId_platform_snapshotDate_idx" ON "post_analytics_snapshots"("workspaceId", "platform", "snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "post_analytics_snapshots_socialAccountId_externalPostId_sna_key" ON "post_analytics_snapshots"("socialAccountId", "externalPostId", "snapshotDate");

-- CreateIndex
CREATE INDEX "analytics_sync_jobs_workspaceId_status_idx" ON "analytics_sync_jobs"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "analytics_sync_jobs_socialAccountId_status_idx" ON "analytics_sync_jobs"("socialAccountId", "status");

-- CreateIndex
CREATE INDEX "analytics_sync_jobs_status_leaseExpiresAt_idx" ON "analytics_sync_jobs"("status", "leaseExpiresAt");

-- CreateIndex
CREATE INDEX "analytics_sync_errors_syncJobId_idx" ON "analytics_sync_errors"("syncJobId");

-- CreateIndex
CREATE INDEX "analytics_sync_errors_socialAccountId_idx" ON "analytics_sync_errors"("socialAccountId");

-- CreateIndex
CREATE INDEX "analytics_sync_errors_isPermissionError_idx" ON "analytics_sync_errors"("isPermissionError");

-- CreateIndex
CREATE INDEX "growth_insights_workspaceId_category_idx" ON "growth_insights"("workspaceId", "category");

-- CreateIndex
CREATE INDEX "growth_insights_workspaceId_dismissedAt_idx" ON "growth_insights"("workspaceId", "dismissedAt");

-- AddForeignKey
ALTER TABLE "account_analytics_snapshots" ADD CONSTRAINT "account_analytics_snapshots_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_analytics_snapshots" ADD CONSTRAINT "account_analytics_snapshots_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "social_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_analytics_snapshots" ADD CONSTRAINT "post_analytics_snapshots_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_analytics_snapshots" ADD CONSTRAINT "post_analytics_snapshots_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "social_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_analytics_snapshots" ADD CONSTRAINT "post_analytics_snapshots_scheduledPostTargetId_fkey" FOREIGN KEY ("scheduledPostTargetId") REFERENCES "scheduled_post_targets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_sync_jobs" ADD CONSTRAINT "analytics_sync_jobs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_sync_jobs" ADD CONSTRAINT "analytics_sync_jobs_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "social_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_sync_errors" ADD CONSTRAINT "analytics_sync_errors_syncJobId_fkey" FOREIGN KEY ("syncJobId") REFERENCES "analytics_sync_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_sync_errors" ADD CONSTRAINT "analytics_sync_errors_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "social_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_insights" ADD CONSTRAINT "growth_insights_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_insights" ADD CONSTRAINT "growth_insights_dismissedById_fkey" FOREIGN KEY ("dismissedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
