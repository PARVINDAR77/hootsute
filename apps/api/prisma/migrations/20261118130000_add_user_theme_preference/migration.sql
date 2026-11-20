-- Additive migration: persist user theme preference (light default, optional dark)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "themePreference" TEXT NOT NULL DEFAULT 'light';
