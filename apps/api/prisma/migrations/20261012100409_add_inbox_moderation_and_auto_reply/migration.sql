-- CreateEnum
CREATE TYPE "InboxModerationAction" AS ENUM ('AUTO_HIDE', 'AUTO_FLAG', 'ASSIGN_TO_ROLE', 'AUTO_REPLY', 'CLOSE_INTERACTION');

-- CreateTable
CREATE TABLE "inbox_moderation_rules" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "triggerSentiment" TEXT NOT NULL DEFAULT 'ALL',
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "action" "InboxModerationAction" NOT NULL DEFAULT 'AUTO_FLAG',
    "actionPayload" JSONB NOT NULL DEFAULT '{}',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "lastTriggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inbox_moderation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inbox_auto_reply_templates" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "sentimentMatch" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inbox_auto_reply_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inbox_moderation_rules_workspaceId_idx" ON "inbox_moderation_rules"("workspaceId");

-- CreateIndex
CREATE INDEX "inbox_moderation_rules_workspaceId_isEnabled_idx" ON "inbox_moderation_rules"("workspaceId", "isEnabled");

-- CreateIndex
CREATE INDEX "inbox_auto_reply_templates_workspaceId_idx" ON "inbox_auto_reply_templates"("workspaceId");

-- CreateIndex
CREATE INDEX "inbox_auto_reply_templates_workspaceId_category_idx" ON "inbox_auto_reply_templates"("workspaceId", "category");

-- AddForeignKey
ALTER TABLE "inbox_moderation_rules" ADD CONSTRAINT "inbox_moderation_rules_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_auto_reply_templates" ADD CONSTRAINT "inbox_auto_reply_templates_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
