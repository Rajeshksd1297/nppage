-- Modify the setup_user_trial function to also assign a default publisher plan
-- This will automatically give all new users a publisher plan to try

CREATE OR REPLACE FUNCTION public.setup_user_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  pro_plan_id uuid;
  publisher_plan_id uuid;
BEGIN
  -- Get Pro plan ID for trial
  SELECT id INTO pro_plan_id FROM subscription_plans WHERE name = 'Pro' LIMIT 1;
  
  -- Get Publisher plan ID (get the first publisher plan if multiple exist)
  SELECT id INTO publisher_plan_id 
  FROM subscription_plans 
  WHERE is_publisher_plan = true 
  LIMIT 1;
  
  -- Create 30-day Pro trial for new user
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
  
  -- Also assign default publisher plan if exists (so everyone can try publisher features)
  IF publisher_plan_id IS NOT NULL THEN
    -- Check if a subscription was already created above
    IF EXISTS (SELECT 1 FROM user_subscriptions WHERE user_id = NEW.id) THEN
      -- Update existing subscription to use publisher plan instead
      UPDATE user_subscriptions 
      SET plan_id = publisher_plan_id 
      WHERE user_id = NEW.id;
    ELSE
      -- Create new subscription with publisher plan
      INSERT INTO user_subscriptions (
        user_id, 
        plan_id, 
        status, 
        trial_ends_at,
        current_period_start,
        current_period_end
      ) VALUES (
        NEW.id,
        publisher_plan_id,
        'trialing',
        NOW() + INTERVAL '30 days',
        NOW(),
        NOW() + INTERVAL '30 days'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;