-- Reset package features to proper restrictions based on plan type
UPDATE subscription_plans 
SET 
  premium_themes = false,
  advanced_analytics = false,
  no_watermark = false,
  contact_form = false,
  newsletter_integration = false,
  blog = false,
  gallery = false,
  events = false,
  awards = false,
  faq = false,
  custom_domain = false
WHERE name = 'Free';

-- Set Pro plan features correctly  
UPDATE subscription_plans 
SET 
  premium_themes = true,
  advanced_analytics = true,
  no_watermark = true,
  contact_form = true,
  newsletter_integration = true,
  blog = true,
  gallery = true,
  events = true,
  awards = true,
  faq = true,
  custom_domain = true
WHERE name = 'Pro';

-- Remove the extra "New Package" that shouldn't exist
DELETE FROM subscription_plans WHERE name = 'New Package';