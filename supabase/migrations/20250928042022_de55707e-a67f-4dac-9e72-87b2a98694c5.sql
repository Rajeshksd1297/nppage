-- Remove gallery feature from all subscription plans
ALTER TABLE subscription_plans DROP COLUMN IF EXISTS gallery;