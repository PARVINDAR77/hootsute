-- Expand SocialProvider enum
ALTER TYPE "SocialProvider" ADD VALUE IF NOT EXISTS 'PINTEREST';
ALTER TYPE "SocialProvider" ADD VALUE IF NOT EXISTS 'YOUTUBE';
ALTER TYPE "SocialProvider" ADD VALUE IF NOT EXISTS 'TIKTOK';
ALTER TYPE "SocialProvider" ADD VALUE IF NOT EXISTS 'THREADS';

-- Expand SocialAccountType enum
ALTER TYPE "SocialAccountType" ADD VALUE IF NOT EXISTS 'PINTEREST_BUSINESS';
ALTER TYPE "SocialAccountType" ADD VALUE IF NOT EXISTS 'YOUTUBE_CHANNEL';
ALTER TYPE "SocialAccountType" ADD VALUE IF NOT EXISTS 'TIKTOK_BUSINESS';
ALTER TYPE "SocialAccountType" ADD VALUE IF NOT EXISTS 'TIKTOK_CREATOR';
ALTER TYPE "SocialAccountType" ADD VALUE IF NOT EXISTS 'THREADS_PROFILE';

-- Expand SocialPlatform enum
ALTER TYPE "SocialPlatform" ADD VALUE IF NOT EXISTS 'PINTEREST';
ALTER TYPE "SocialPlatform" ADD VALUE IF NOT EXISTS 'YOUTUBE';
ALTER TYPE "SocialPlatform" ADD VALUE IF NOT EXISTS 'TIKTOK';
ALTER TYPE "SocialPlatform" ADD VALUE IF NOT EXISTS 'THREADS';

-- Remove WhatsApp integration tables and enums
DROP TABLE IF EXISTS "whatsapp_notification_messages" CASCADE;
DROP TABLE IF EXISTS "whatsapp_recipient_consents" CASCADE;
DROP TABLE IF EXISTS "workspace_whatsapp_configs" CASCADE;
DROP TABLE IF EXISTS "whatsapp_webhook_events" CASCADE;
DROP TYPE IF EXISTS "WhatsAppMessageStatus";
DROP TYPE IF EXISTS "RecipientConsentStatus";
