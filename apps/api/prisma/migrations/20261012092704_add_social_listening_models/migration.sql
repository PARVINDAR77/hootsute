-- CreateEnum
CREATE TYPE "ListeningSentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');

-- CreateTable
CREATE TABLE "listening_queries" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keywords" TEXT[],
    "excludedKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "platforms" "SocialPlatform"[],
    "languages" TEXT[] DEFAULT ARRAY['en']::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sentimentFilter" TEXT NOT NULL DEFAULT 'ALL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listening_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listening_mentions" (
    "id" TEXT NOT NULL,
    "queryId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "externalId" TEXT NOT NULL,
    "authorHandle" TEXT NOT NULL,
    "authorName" TEXT,
    "authorAvatarUrl" TEXT,
    "authorFollowersCount" INTEGER NOT NULL DEFAULT 0,
    "content" TEXT NOT NULL,
    "url" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentiment" "ListeningSentiment" NOT NULL DEFAULT 'NEUTRAL',
    "sentimentScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "reachEstimate" INTEGER NOT NULL DEFAULT 0,
    "engagementCount" INTEGER NOT NULL DEFAULT 0,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listening_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listening_queries_workspaceId_idx" ON "listening_queries"("workspaceId");

-- CreateIndex
CREATE INDEX "listening_queries_workspaceId_isActive_idx" ON "listening_queries"("workspaceId", "isActive");

-- CreateIndex
CREATE INDEX "listening_mentions_workspaceId_publishedAt_idx" ON "listening_mentions"("workspaceId", "publishedAt");

-- CreateIndex
CREATE INDEX "listening_mentions_queryId_idx" ON "listening_mentions"("queryId");

-- CreateIndex
CREATE INDEX "listening_mentions_workspaceId_sentiment_idx" ON "listening_mentions"("workspaceId", "sentiment");

-- CreateIndex
CREATE UNIQUE INDEX "listening_mentions_platform_externalId_key" ON "listening_mentions"("platform", "externalId");

-- AddForeignKey
ALTER TABLE "listening_queries" ADD CONSTRAINT "listening_queries_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listening_queries" ADD CONSTRAINT "listening_queries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listening_mentions" ADD CONSTRAINT "listening_mentions_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "listening_queries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listening_mentions" ADD CONSTRAINT "listening_mentions_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
