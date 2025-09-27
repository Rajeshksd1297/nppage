-- Remove media_kit column from subscription_plans table
ALTER TABLE subscription_plans DROP COLUMN IF EXISTS media_kit;