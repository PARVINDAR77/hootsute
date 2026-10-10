-- CreateEnum
CREATE TYPE "WhatsAppMessageStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "RecipientConsentStatus" AS ENUM ('OPTED_IN', 'OPTED_OUT', 'PENDING_VERIFICATION');

-- CreateTable
CREATE TABLE "workspace_whatsapp_configs" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "wabaId" TEXT NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "encryptedAccessToken" TEXT NOT NULL,
    "businessPhoneNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_whatsapp_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_recipient_consents" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" "RecipientConsentStatus" NOT NULL DEFAULT 'OPTED_IN',
    "consentSource" TEXT NOT NULL DEFAULT 'WORKSPACE_ADMIN_REGISTRATION',
    "optedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "optedOutAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_recipient_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_notification_messages" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "draftId" TEXT,
    "recipientConsentId" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "templateName" TEXT NOT NULL DEFAULT 'content_draft_approval_request',
    "language" TEXT NOT NULL DEFAULT 'en',
    "parameters" JSONB,
    "status" "WhatsAppMessageStatus" NOT NULL DEFAULT 'QUEUED',
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_notification_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_webhook_events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspace_whatsapp_configs_workspaceId_key" ON "workspace_whatsapp_configs"("workspaceId");

-- CreateIndex
CREATE INDEX "workspace_whatsapp_configs_workspaceId_idx" ON "workspace_whatsapp_configs"("workspaceId");

-- CreateIndex
CREATE INDEX "whatsapp_recipient_consents_workspaceId_status_idx" ON "whatsapp_recipient_consents"("workspaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_recipient_consents_workspaceId_phoneNumber_key" ON "whatsapp_recipient_consents"("workspaceId", "phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_notification_messages_providerMessageId_key" ON "whatsapp_notification_messages"("providerMessageId");

-- CreateIndex
CREATE INDEX "whatsapp_notification_messages_workspaceId_createdAt_idx" ON "whatsapp_notification_messages"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "whatsapp_notification_messages_draftId_idx" ON "whatsapp_notification_messages"("draftId");

-- CreateIndex
CREATE INDEX "whatsapp_notification_messages_providerMessageId_idx" ON "whatsapp_notification_messages"("providerMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_webhook_events_eventId_key" ON "whatsapp_webhook_events"("eventId");

-- CreateIndex
CREATE INDEX "whatsapp_webhook_events_eventId_idx" ON "whatsapp_webhook_events"("eventId");

-- AddForeignKey
ALTER TABLE "workspace_whatsapp_configs" ADD CONSTRAINT "workspace_whatsapp_configs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_recipient_consents" ADD CONSTRAINT "whatsapp_recipient_consents_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_recipient_consents" ADD CONSTRAINT "whatsapp_recipient_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_notification_messages" ADD CONSTRAINT "whatsapp_notification_messages_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_notification_messages" ADD CONSTRAINT "whatsapp_notification_messages_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "content_drafts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_notification_messages" ADD CONSTRAINT "whatsapp_notification_messages_recipientConsentId_fkey" FOREIGN KEY ("recipientConsentId") REFERENCES "whatsapp_recipient_consents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
