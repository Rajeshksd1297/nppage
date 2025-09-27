-- Add available themes field to subscription plans for package-theme relationships
ALTER TABLE subscription_plans 
ADD COLUMN available_themes jsonb DEFAULT '[]'::jsonb;

-- Add comment to explain the field
COMMENT ON COLUMN subscription_plans.available_themes IS 'Array of theme IDs that are available for this subscription plan';

-- Update existing plans to have empty available themes array if null
UPDATE subscription_plans SET available_themes = '[]'::jsonb WHERE available_themes IS NULL;