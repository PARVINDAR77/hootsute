-- Rollback migration: 20261012120000_add_workspace_billing_and_subscriptions
DROP TABLE IF EXISTS "billing_invoices" CASCADE;
DROP TABLE IF EXISTS "workspace_subscriptions" CASCADE;
DROP TYPE IF EXISTS "BillingInterval";
DROP TYPE IF EXISTS "SubscriptionStatus";
DROP TYPE IF EXISTS "SubscriptionPlan";
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261012120000_add_workspace_billing_and_subscriptions';
