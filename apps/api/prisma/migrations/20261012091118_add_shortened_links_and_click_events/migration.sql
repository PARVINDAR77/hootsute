-- CreateTable
CREATE TABLE "shortened_links" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "title" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmTerm" TEXT,
    "utmContent" TEXT,
    "destinationUrl" TEXT NOT NULL,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "lastClickedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "shortened_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "link_click_events" (
    "id" TEXT NOT NULL,
    "shortenedLinkId" TEXT NOT NULL,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipHash" TEXT,
    "referrer" TEXT,
    "userAgent" TEXT,
    "deviceType" TEXT NOT NULL DEFAULT 'DESKTOP',
    "browser" TEXT,
    "os" TEXT,
    "countryCode" TEXT,

    CONSTRAINT "link_click_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shortened_links_shortCode_key" ON "shortened_links"("shortCode");

-- CreateIndex
CREATE INDEX "shortened_links_workspaceId_idx" ON "shortened_links"("workspaceId");

-- CreateIndex
CREATE INDEX "shortened_links_shortCode_idx" ON "shortened_links"("shortCode");

-- CreateIndex
CREATE INDEX "shortened_links_workspaceId_createdAt_idx" ON "shortened_links"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "link_click_events_shortenedLinkId_idx" ON "link_click_events"("shortenedLinkId");

-- CreateIndex
CREATE INDEX "link_click_events_shortenedLinkId_clickedAt_idx" ON "link_click_events"("shortenedLinkId", "clickedAt");

-- AddForeignKey
ALTER TABLE "shortened_links" ADD CONSTRAINT "shortened_links_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shortened_links" ADD CONSTRAINT "shortened_links_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "link_click_events" ADD CONSTRAINT "link_click_events_shortenedLinkId_fkey" FOREIGN KEY ("shortenedLinkId") REFERENCES "shortened_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;
