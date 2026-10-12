-- CreateEnum
CREATE TYPE "AutomationTriggerType" AS ENUM ('INBOX_NEW_MESSAGE', 'OCCASION_UPCOMING', 'POST_PUBLISHED', 'POST_HIGH_PERFORMANCE');

-- CreateEnum
CREATE TYPE "AutomationActionType" AS ENUM ('AUTO_REPLY', 'AUTO_HIDE_SPAM', 'GENERATE_AI_DRAFT', 'DISPATCH_WEBHOOK', 'RECYCLE_POST');

-- CreateEnum
CREATE TYPE "AutomationExecutionStatus" AS ENUM ('SUCCESS', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "automation_rules" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "triggerType" "AutomationTriggerType" NOT NULL,
    "conditions" JSONB NOT NULL DEFAULT '{}',
    "actionType" "AutomationActionType" NOT NULL,
    "actionConfig" JSONB NOT NULL DEFAULT '{}',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "lastExecutedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_execution_logs" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "triggerEvent" TEXT NOT NULL,
    "status" "AutomationExecutionStatus" NOT NULL,
    "inputPayload" JSONB,
    "outputResult" JSONB,
    "errorMessage" TEXT,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_execution_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "automation_rules_workspaceId_isEnabled_idx" ON "automation_rules"("workspaceId", "isEnabled");

-- CreateIndex
CREATE INDEX "automation_rules_workspaceId_triggerType_idx" ON "automation_rules"("workspaceId", "triggerType");

-- CreateIndex
CREATE INDEX "automation_execution_logs_workspaceId_executedAt_idx" ON "automation_execution_logs"("workspaceId", "executedAt");

-- CreateIndex
CREATE INDEX "automation_execution_logs_ruleId_executedAt_idx" ON "automation_execution_logs"("ruleId", "executedAt");

-- AddForeignKey
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_execution_logs" ADD CONSTRAINT "automation_execution_logs_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "automation_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_execution_logs" ADD CONSTRAINT "automation_execution_logs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
