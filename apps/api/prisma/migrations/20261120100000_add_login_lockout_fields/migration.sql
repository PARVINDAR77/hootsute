-- Additive migration: progressive account lockout fields for brute-force defense
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastFailedLoginAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "users_lockedUntil_idx" ON "users"("lockedUntil");
