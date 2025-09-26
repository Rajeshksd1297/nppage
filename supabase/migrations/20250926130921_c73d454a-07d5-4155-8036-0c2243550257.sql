-- Update subscription plans to only Free and Pro
DELETE FROM subscription_plans WHERE name NOT IN ('Free', 'Pro');

-- Update Free plan features
UPDATE subscription_plans 
SET 
  max_books = 3,
  max_publications = 1,
  custom_domain = false,
  advanced_analytics = false,
  premium_themes = false,
  no_watermark = false,
  contact_form = false,
  newsletter_integration = false,
  media_kit = false,
  price_monthly = 0,
  price_yearly = 0,
  features = '["Up to 3 books", "Basic profile", "Standard themes", "Community support"]'::jsonb
WHERE name = 'Free';

-- Update Pro plan features  
UPDATE subscription_plans 
SET 
  max_books = -1,
  max_publications = -1,
  custom_domain = true,
  advanced_analytics = true,
  premium_themes = true,
  no_watermark = true,
  contact_form = true,
  newsletter_integration = true,
  media_kit = true,
  price_monthly = 29,
  price_yearly = 299,
  features = '["Unlimited books", "Custom domain", "Advanced analytics", "Premium themes", "No watermark", "Contact forms", "Newsletter integration", "Media kit", "Priority support"]'::jsonb
WHERE name = 'Pro';

-- Add trial_ends_at field to user_subscriptions
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone;

-- Create function to handle new user trial
CREATE OR REPLACE FUNCTION public.setup_user_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
as $$
DECLARE
  pro_plan_id uuid;
BEGIN
  -- Get Pro plan ID
  SELECT id INTO pro_plan_id FROM subscription_plans WHERE name = 'Pro' LIMIT 1;
  
  -- Create 15-day Pro trial for new user
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
      NOW() + INTERVAL '15 days',
      NOW(),
      NOW() + INTERVAL '15 days'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update the existing trigger to also setup trial
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create new trigger for trial setup
CREATE TRIGGER on_auth_user_trial_setup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.setup_user_trial();