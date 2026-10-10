-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('COMMENT', 'REPLY', 'MENTION');

-- CreateEnum
CREATE TYPE "InteractionWorkflowStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'IGNORED');

-- CreateEnum
CREATE TYPE "ReplyAttemptStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'AMBIGUOUS_TIMEOUT');

-- CreateTable
CREATE TABLE "social_interactions" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "socialAccountId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "interactionType" "InteractionType" NOT NULL DEFAULT 'COMMENT',
    "externalInteractionId" TEXT NOT NULL,
    "parentExternalId" TEXT,
    "externalPostId" TEXT,
    "externalPostUrl" TEXT,
    "authorProviderId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorUsername" TEXT,
    "authorProfileUrl" TEXT,
    "content" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "isFromPageOrAccount" BOOLEAN NOT NULL DEFAULT false,
    "workflowStatus" "InteractionWorkflowStatus" NOT NULL DEFAULT 'OPEN',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "assignedToUserId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "assignedByUserId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedByUserId" TEXT,
    "rawMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interaction_reply_attempts" (
    "id" TEXT NOT NULL,
    "interactionId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "externalReplyId" TEXT,
    "status" "ReplyAttemptStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interaction_reply_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interaction_notes" (
    "id" TEXT NOT NULL,
    "interactionId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interaction_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_webhook_events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "provider" "SocialProvider" NOT NULL,
    "eventType" TEXT,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PROCESSED',

    CONSTRAINT "social_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inbox_sync_checkpoints" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "socialAccountId" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),
    "nextCursor" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IDLE',
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inbox_sync_checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inbox_notifications" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "interactionId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inbox_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "social_interactions_workspaceId_workflowStatus_idx" ON "social_interactions"("workspaceId", "workflowStatus");

-- CreateIndex
CREATE INDEX "social_interactions_workspaceId_isRead_idx" ON "social_interactions"("workspaceId", "isRead");

-- CreateIndex
CREATE INDEX "social_interactions_workspaceId_platform_publishedAt_idx" ON "social_interactions"("workspaceId", "platform", "publishedAt");

-- CreateIndex
CREATE INDEX "social_interactions_assignedToUserId_workflowStatus_idx" ON "social_interactions"("assignedToUserId", "workflowStatus");

-- CreateIndex
CREATE INDEX "social_interactions_externalPostId_idx" ON "social_interactions"("externalPostId");

-- CreateIndex
CREATE UNIQUE INDEX "social_interactions_socialAccountId_externalInteractionId_key" ON "social_interactions"("socialAccountId", "externalInteractionId");

-- CreateIndex
CREATE UNIQUE INDEX "interaction_reply_attempts_idempotencyKey_key" ON "interaction_reply_attempts"("idempotencyKey");

-- CreateIndex
CREATE INDEX "interaction_reply_attempts_interactionId_idx" ON "interaction_reply_attempts"("interactionId");

-- CreateIndex
CREATE INDEX "interaction_reply_attempts_workspaceId_status_idx" ON "interaction_reply_attempts"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "interaction_notes_interactionId_idx" ON "interaction_notes"("interactionId");

-- CreateIndex
CREATE INDEX "interaction_notes_workspaceId_idx" ON "interaction_notes"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "social_webhook_events_eventId_key" ON "social_webhook_events"("eventId");

-- CreateIndex
CREATE INDEX "social_webhook_events_eventId_idx" ON "social_webhook_events"("eventId");

-- CreateIndex
CREATE INDEX "social_webhook_events_provider_processedAt_idx" ON "social_webhook_events"("provider", "processedAt");

-- CreateIndex
CREATE UNIQUE INDEX "inbox_sync_checkpoints_socialAccountId_key" ON "inbox_sync_checkpoints"("socialAccountId");

-- CreateIndex
CREATE INDEX "inbox_sync_checkpoints_workspaceId_idx" ON "inbox_sync_checkpoints"("workspaceId");

-- CreateIndex
CREATE INDEX "inbox_notifications_workspaceId_recipientUserId_isRead_idx" ON "inbox_notifications"("workspaceId", "recipientUserId", "isRead");

-- CreateIndex
CREATE INDEX "inbox_notifications_interactionId_idx" ON "inbox_notifications"("interactionId");

-- AddForeignKey
ALTER TABLE "social_interactions" ADD CONSTRAINT "social_interactions_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_interactions" ADD CONSTRAINT "social_interactions_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "social_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_interactions" ADD CONSTRAINT "social_interactions_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_interactions" ADD CONSTRAINT "social_interactions_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_interactions" ADD CONSTRAINT "social_interactions_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interaction_reply_attempts" ADD CONSTRAINT "interaction_reply_attempts_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "social_interactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interaction_reply_attempts" ADD CONSTRAINT "interaction_reply_attempts_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interaction_reply_attempts" ADD CONSTRAINT "interaction_reply_attempts_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interaction_notes" ADD CONSTRAINT "interaction_notes_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "social_interactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interaction_notes" ADD CONSTRAINT "interaction_notes_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interaction_notes" ADD CONSTRAINT "interaction_notes_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_sync_checkpoints" ADD CONSTRAINT "inbox_sync_checkpoints_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_sync_checkpoints" ADD CONSTRAINT "inbox_sync_checkpoints_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "social_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_notifications" ADD CONSTRAINT "inbox_notifications_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_notifications" ADD CONSTRAINT "inbox_notifications_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_notifications" ADD CONSTRAINT "inbox_notifications_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "social_interactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
