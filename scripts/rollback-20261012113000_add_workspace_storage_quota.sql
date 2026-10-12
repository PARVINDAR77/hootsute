-- Rollback migration: 20261012113000_add_workspace_storage_quota
ALTER TABLE "workspaces" DROP COLUMN IF EXISTS "maxMediaAssets";
ALTER TABLE "workspaces" DROP COLUMN IF EXISTS "storageQuotaBytes";
ALTER TABLE "workspaces" DROP COLUMN IF EXISTS "planTier";
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261012113000_add_workspace_storage_quota';
