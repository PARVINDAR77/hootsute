-- CreateEnum
CREATE TYPE "DraftStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CampaignObjective" AS ENUM ('ENGAGEMENT', 'SALES_LEADS', 'ANNOUNCEMENT', 'FESTIVAL_WISHES', 'BRAND_AWARENESS', 'EVENT_PROMOTION', 'EDUCATIONAL', 'RECRUITMENT');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('POST', 'REEL_STORY_BRIEF', 'CAROUSEL', 'CAMPAIGN');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'LINKEDIN', 'TWITTER_X');

-- CreateEnum
CREATE TYPE "BrandTone" AS ENUM ('PROFESSIONAL', 'CASUAL_FRIENDLY', 'FESTIVE_WARM', 'INSPIRATIONAL', 'URGENT_PROMOTIONAL', 'AUTHORITATIVE', 'PLAYFUL');

-- CreateTable
CREATE TABLE "workspace_brand_profiles" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "industry" TEXT,
    "businessDescription" TEXT,
    "targetAudience" TEXT,
    "productsAndServices" TEXT,
    "brandVoice" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "supportedLanguages" TEXT[] DEFAULT ARRAY['en']::TEXT[],
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "logoUrl" TEXT,
    "slogan" TEXT,
    "websiteUrl" TEXT,
    "contactDetails" JSONB,
    "brandGuidelines" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_brand_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_drafts" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "updatedByUserId" TEXT,
    "title" TEXT NOT NULL,
    "objective" "CampaignObjective" NOT NULL DEFAULT 'ENGAGEMENT',
    "contentType" "ContentType" NOT NULL DEFAULT 'POST',
    "language" TEXT NOT NULL DEFAULT 'en',
    "status" "DraftStatus" NOT NULL DEFAULT 'DRAFT',
    "approvalRequestedByUserId" TEXT,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_variants" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "headline" TEXT,
    "body" TEXT NOT NULL,
    "callToAction" TEXT,
    "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "linkUrl" TEXT,
    "mediaBrief" TEXT,
    "mediaAssetUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_revisions" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "variantId" TEXT,
    "revisionNumber" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "promptSummary" TEXT,
    "inputSnapshot" JSONB,
    "outputSnapshot" JSONB NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "festival_occasions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "culturalContext" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "dateType" TEXT NOT NULL,
    "typicalPeriod" TEXT NOT NULL,
    "supportedRegions" TEXT[] DEFAULT ARRAY['All India']::TEXT[],
    "promptGuidance" TEXT NOT NULL,
    "suggestedHashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "festival_occasions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspace_brand_profiles_workspaceId_key" ON "workspace_brand_profiles"("workspaceId");

-- CreateIndex
CREATE INDEX "workspace_brand_profiles_workspaceId_idx" ON "workspace_brand_profiles"("workspaceId");

-- CreateIndex
CREATE INDEX "content_drafts_workspaceId_idx" ON "content_drafts"("workspaceId");

-- CreateIndex
CREATE INDEX "content_drafts_status_idx" ON "content_drafts"("status");

-- CreateIndex
CREATE INDEX "content_drafts_createdByUserId_idx" ON "content_drafts"("createdByUserId");

-- CreateIndex
CREATE INDEX "content_drafts_approvalRequestedByUserId_idx" ON "content_drafts"("approvalRequestedByUserId");

-- CreateIndex
CREATE INDEX "content_drafts_approvedByUserId_idx" ON "content_drafts"("approvedByUserId");

-- CreateIndex
CREATE INDEX "content_variants_draftId_idx" ON "content_variants"("draftId");

-- CreateIndex
CREATE INDEX "content_variants_platform_idx" ON "content_variants"("platform");

-- CreateIndex
CREATE INDEX "content_revisions_draftId_idx" ON "content_revisions"("draftId");

-- CreateIndex
CREATE INDEX "content_revisions_variantId_idx" ON "content_revisions"("variantId");

-- CreateIndex
CREATE INDEX "content_revisions_createdByUserId_idx" ON "content_revisions"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "content_revisions_draftId_revisionNumber_key" ON "content_revisions"("draftId", "revisionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "festival_occasions_slug_key" ON "festival_occasions"("slug");

-- CreateIndex
CREATE INDEX "festival_occasions_slug_idx" ON "festival_occasions"("slug");

-- CreateIndex
CREATE INDEX "festival_occasions_isActive_idx" ON "festival_occasions"("isActive");

-- AddForeignKey
ALTER TABLE "workspace_brand_profiles" ADD CONSTRAINT "workspace_brand_profiles_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_drafts" ADD CONSTRAINT "content_drafts_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_drafts" ADD CONSTRAINT "content_drafts_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_drafts" ADD CONSTRAINT "content_drafts_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_drafts" ADD CONSTRAINT "content_drafts_approvalRequestedByUserId_fkey" FOREIGN KEY ("approvalRequestedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_drafts" ADD CONSTRAINT "content_drafts_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_variants" ADD CONSTRAINT "content_variants_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "content_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_revisions" ADD CONSTRAINT "content_revisions_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "content_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_revisions" ADD CONSTRAINT "content_revisions_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "content_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_revisions" ADD CONSTRAINT "content_revisions_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
