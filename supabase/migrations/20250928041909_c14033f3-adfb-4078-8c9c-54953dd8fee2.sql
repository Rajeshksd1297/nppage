-- Force reset the Free plan to have no premium features
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
WHERE name = 'Free' AND price_monthly = 0;