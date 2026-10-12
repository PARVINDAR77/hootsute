-- CreateEnum
CREATE TYPE "CompetitorCategory" AS ENUM ('DIRECT', 'INDIRECT', 'ASPIRATIONAL');

-- CreateTable
CREATE TABLE "competitor_profiles" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "avatarUrl" TEXT,
    "category" "CompetitorCategory" NOT NULL DEFAULT 'DIRECT',
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitor_social_accounts" (
    "id" TEXT NOT NULL,
    "competitorProfileId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "handle" TEXT NOT NULL,
    "publicUrl" TEXT,
    "followersCount" INTEGER NOT NULL DEFAULT 0,
    "followingCount" INTEGER NOT NULL DEFAULT 0,
    "postsCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitor_social_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitor_benchmark_snapshots" (
    "id" TEXT NOT NULL,
    "competitorProfileId" TEXT NOT NULL,
    "platform" "SocialPlatform",
    "period" "AnalyticsMetricPeriod" NOT NULL DEFAULT 'DAY',
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "followerGrowthRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "followersCount" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "postingFrequencyWeekly" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "estReach" INTEGER NOT NULL DEFAULT 0,
    "estImpressions" INTEGER NOT NULL DEFAULT 0,
    "sentimentScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "sentimentDistribution" JSONB NOT NULL DEFAULT '{"positive":0,"neutral":0,"negative":0}',
    "topPostExcerpt" TEXT,
    "topPostEngagementRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competitor_benchmark_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "competitor_profiles_workspaceId_idx" ON "competitor_profiles"("workspaceId");

-- CreateIndex
CREATE INDEX "competitor_profiles_workspaceId_isActive_idx" ON "competitor_profiles"("workspaceId", "isActive");

-- CreateIndex
CREATE INDEX "competitor_social_accounts_competitorProfileId_idx" ON "competitor_social_accounts"("competitorProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "competitor_social_accounts_competitorProfileId_platform_key" ON "competitor_social_accounts"("competitorProfileId", "platform");

-- CreateIndex
CREATE INDEX "competitor_benchmark_snapshots_competitorProfileId_snapshot_idx" ON "competitor_benchmark_snapshots"("competitorProfileId", "snapshotDate");

-- CreateIndex
CREATE INDEX "competitor_benchmark_snapshots_competitorProfileId_period_idx" ON "competitor_benchmark_snapshots"("competitorProfileId", "period");

-- AddForeignKey
ALTER TABLE "competitor_profiles" ADD CONSTRAINT "competitor_profiles_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitor_social_accounts" ADD CONSTRAINT "competitor_social_accounts_competitorProfileId_fkey" FOREIGN KEY ("competitorProfileId") REFERENCES "competitor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitor_benchmark_snapshots" ADD CONSTRAINT "competitor_benchmark_snapshots_competitorProfileId_fkey" FOREIGN KEY ("competitorProfileId") REFERENCES "competitor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
