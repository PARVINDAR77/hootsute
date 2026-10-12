-- CreateEnum
CREATE TYPE "ApprovalStepStatus" AS ENUM ('PENDING', 'APPROVED', 'CHANGES_REQUESTED', 'SKIPPED');

-- AlterEnum
ALTER TYPE "DraftStatus" ADD VALUE 'CHANGES_REQUESTED';

-- AlterTable
ALTER TABLE "content_drafts" ADD COLUMN     "approvalWorkflowId" TEXT;

-- CreateTable
CREATE TABLE "approval_workflows" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_workflow_steps" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "requiredRole" "WorkspaceRole" NOT NULL DEFAULT 'EDITOR',
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_workflow_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draft_step_reviews" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "reviewerUserId" TEXT,
    "status" "ApprovalStepStatus" NOT NULL DEFAULT 'PENDING',
    "decisionNotes" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "draft_step_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draft_comments" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentCommentId" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedByUserId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "draft_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "approval_workflows_workspaceId_idx" ON "approval_workflows"("workspaceId");

-- CreateIndex
CREATE INDEX "approval_workflows_workspaceId_isDefault_idx" ON "approval_workflows"("workspaceId", "isDefault");

-- CreateIndex
CREATE INDEX "approval_workflow_steps_workflowId_idx" ON "approval_workflow_steps"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "approval_workflow_steps_workflowId_stepOrder_key" ON "approval_workflow_steps"("workflowId", "stepOrder");

-- CreateIndex
CREATE INDEX "draft_step_reviews_draftId_idx" ON "draft_step_reviews"("draftId");

-- CreateIndex
CREATE INDEX "draft_step_reviews_stepId_idx" ON "draft_step_reviews"("stepId");

-- CreateIndex
CREATE INDEX "draft_step_reviews_reviewerUserId_idx" ON "draft_step_reviews"("reviewerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "draft_step_reviews_draftId_stepId_key" ON "draft_step_reviews"("draftId", "stepId");

-- CreateIndex
CREATE INDEX "draft_comments_draftId_idx" ON "draft_comments"("draftId");

-- CreateIndex
CREATE INDEX "draft_comments_workspaceId_idx" ON "draft_comments"("workspaceId");

-- CreateIndex
CREATE INDEX "draft_comments_parentCommentId_idx" ON "draft_comments"("parentCommentId");

-- CreateIndex
CREATE INDEX "draft_comments_draftId_isResolved_idx" ON "draft_comments"("draftId", "isResolved");

-- AddForeignKey
ALTER TABLE "content_drafts" ADD CONSTRAINT "content_drafts_approvalWorkflowId_fkey" FOREIGN KEY ("approvalWorkflowId") REFERENCES "approval_workflows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_workflows" ADD CONSTRAINT "approval_workflows_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_workflow_steps" ADD CONSTRAINT "approval_workflow_steps_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "approval_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_step_reviews" ADD CONSTRAINT "draft_step_reviews_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "content_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_step_reviews" ADD CONSTRAINT "draft_step_reviews_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "approval_workflow_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_step_reviews" ADD CONSTRAINT "draft_step_reviews_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_comments" ADD CONSTRAINT "draft_comments_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "content_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_comments" ADD CONSTRAINT "draft_comments_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_comments" ADD CONSTRAINT "draft_comments_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_comments" ADD CONSTRAINT "draft_comments_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_comments" ADD CONSTRAINT "draft_comments_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "draft_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
