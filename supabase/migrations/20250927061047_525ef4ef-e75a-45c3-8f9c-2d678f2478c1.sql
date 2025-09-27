-- Add new feature columns to subscription_plans table
ALTER TABLE subscription_plans 
ADD COLUMN blog boolean DEFAULT false,
ADD COLUMN gallery boolean DEFAULT false,
ADD COLUMN events boolean DEFAULT false,
ADD COLUMN awards boolean DEFAULT false,
ADD COLUMN faq boolean DEFAULT false;

-- Add comments to explain the new fields
COMMENT ON COLUMN subscription_plans.blog IS 'Enable blog functionality for this subscription plan';
COMMENT ON COLUMN subscription_plans.gallery IS 'Enable gallery functionality for this subscription plan';
COMMENT ON COLUMN subscription_plans.events IS 'Enable events functionality for this subscription plan';
COMMENT ON COLUMN subscription_plans.awards IS 'Enable awards functionality for this subscription plan';
COMMENT ON COLUMN subscription_plans.faq IS 'Enable FAQ functionality for this subscription plan';

-- Update existing plans to have the new features disabled by default
UPDATE subscription_plans SET 
  blog = false,
  gallery = false,
  events = false,
  awards = false,
  faq = false
WHERE blog IS NULL OR gallery IS NULL OR events IS NULL OR awards IS NULL OR faq IS NULL;