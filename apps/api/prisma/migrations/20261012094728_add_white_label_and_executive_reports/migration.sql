-- CreateEnum
CREATE TYPE "ReportFrequency" AS ENUM ('WEEKLY', 'MONTHLY', 'ON_DEMAND');

-- CreateTable
CREATE TABLE "white_label_configs" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "customDomain" TEXT,
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#6366f1',
    "secondaryColor" TEXT NOT NULL DEFAULT '#4f46e5',
    "accentColor" TEXT NOT NULL DEFAULT '#06b6d4',
    "supportEmail" TEXT,
    "portalTitle" TEXT,
    "customCss" TEXT,
    "hidePoweredBy" BOOLEAN NOT NULL DEFAULT false,
    "clientAccessUrl" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "white_label_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_report_schedules" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "frequency" "ReportFrequency" NOT NULL DEFAULT 'WEEKLY',
    "recipients" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "includeSocial" BOOLEAN NOT NULL DEFAULT true,
    "includeLinks" BOOLEAN NOT NULL DEFAULT true,
    "includeListening" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executive_report_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_executive_reports" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "scheduleId" TEXT,
    "title" TEXT NOT NULL,
    "frequency" "ReportFrequency" NOT NULL DEFAULT 'ON_DEMAND',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "metricsSummary" JSONB NOT NULL DEFAULT '{}',
    "htmlContent" TEXT NOT NULL,
    "pdfStorageUrl" TEXT,
    "recipientsSent" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sentAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_executive_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "white_label_configs_workspaceId_key" ON "white_label_configs"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "white_label_configs_customDomain_key" ON "white_label_configs"("customDomain");

-- CreateIndex
CREATE INDEX "white_label_configs_workspaceId_idx" ON "white_label_configs"("workspaceId");

-- CreateIndex
CREATE INDEX "white_label_configs_customDomain_idx" ON "white_label_configs"("customDomain");

-- CreateIndex
CREATE INDEX "executive_report_schedules_workspaceId_idx" ON "executive_report_schedules"("workspaceId");

-- CreateIndex
CREATE INDEX "executive_report_schedules_workspaceId_isActive_idx" ON "executive_report_schedules"("workspaceId", "isActive");

-- CreateIndex
CREATE INDEX "generated_executive_reports_workspaceId_idx" ON "generated_executive_reports"("workspaceId");

-- CreateIndex
CREATE INDEX "generated_executive_reports_workspaceId_createdAt_idx" ON "generated_executive_reports"("workspaceId", "createdAt");

-- AddForeignKey
ALTER TABLE "white_label_configs" ADD CONSTRAINT "white_label_configs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_report_schedules" ADD CONSTRAINT "executive_report_schedules_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_report_schedules" ADD CONSTRAINT "executive_report_schedules_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_executive_reports" ADD CONSTRAINT "generated_executive_reports_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_executive_reports" ADD CONSTRAINT "generated_executive_reports_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "executive_report_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
