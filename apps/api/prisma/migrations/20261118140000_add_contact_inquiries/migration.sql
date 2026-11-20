-- Additive migration: persist public website contact form submissions
CREATE TABLE IF NOT EXISTS "contact_inquiries" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "company" TEXT,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "status" TEXT NOT NULL DEFAULT 'RECEIVED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "contact_inquiries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "contact_inquiries_email_idx" ON "contact_inquiries"("email");
CREATE INDEX IF NOT EXISTS "contact_inquiries_createdAt_idx" ON "contact_inquiries"("createdAt");
