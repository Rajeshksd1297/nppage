-- Fix Free plan features - ensure it has no premium features
UPDATE subscription_plans 
SET 
  premium_themes = false,
  advanced_analytics = false,
  no_watermark = false,
  contact_form = false,
  newsletter_integration = false,
  blog = false,
  events = false,
  awards = false,
  faq = false,
  custom_domain = false
WHERE name = 'Free';

-- Update trial period to 30 days for the setup_user_trial function
CREATE OR REPLACE FUNCTION public.setup_user_trial()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  pro_plan_id uuid;
BEGIN
  -- Get Pro plan ID
  SELECT id INTO pro_plan_id FROM subscription_plans WHERE name = 'Pro' LIMIT 1;
  
  -- Create 30-day Pro trial for new user (updated from 15 days)
  IF pro_plan_id IS NOT NULL THEN
    INSERT INTO user_subscriptions (
      user_id, 
      plan_id, 
      status, 
      trial_ends_at,
      current_period_start,
      current_period_end
    ) VALUES (
      NEW.id,
      pro_plan_id,
      'trialing',
      NOW() + INTERVAL '30 days',
      NOW(),
      NOW() + INTERVAL '30 days'
    );
  END IF;
  
  RETURN NEW;
END;
$$;