-- Rollback migration: 20261012140000_add_linkedin_and_twitter_providers
-- In PostgreSQL, enum values are additive. To remove, delete rows using the values:
DELETE FROM "social_accounts" WHERE "provider" IN ('LINKEDIN', 'TWITTER_X');
DELETE FROM "social_accounts" WHERE "accountType" IN ('LINKEDIN_PAGE', 'LINKEDIN_PROFILE', 'TWITTER_PROFILE');
