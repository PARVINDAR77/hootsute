-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "MediaProcessingStatus" AS ENUM ('PENDING', 'UPLOADING', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "MediaStorageProvider" AS ENUM ('S3', 'LOCAL_MOCK');

-- AlterTable
ALTER TABLE "content_variants" ADD COLUMN "mediaAssetId" TEXT;

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "storageProvider" "MediaStorageProvider" NOT NULL DEFAULT 'S3',
    "mimeType" TEXT NOT NULL,
    "mediaType" "MediaType" NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "durationSeconds" DOUBLE PRECISION,
    "processingStatus" "MediaProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "checksumSha256" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_storageKey_key" ON "media_assets"("storageKey");

-- CreateIndex
CREATE INDEX "media_assets_workspaceId_processingStatus_idx" ON "media_assets"("workspaceId", "processingStatus");

-- CreateIndex
CREATE INDEX "media_assets_workspaceId_createdAt_idx" ON "media_assets"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "media_assets_workspaceId_deletedAt_idx" ON "media_assets"("workspaceId", "deletedAt");

-- CreateIndex
CREATE INDEX "media_assets_storageKey_idx" ON "media_assets"("storageKey");

-- CreateIndex
CREATE INDEX "content_variants_mediaAssetId_idx" ON "content_variants"("mediaAssetId");

-- AddForeignKey
ALTER TABLE "content_variants" ADD CONSTRAINT "content_variants_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
