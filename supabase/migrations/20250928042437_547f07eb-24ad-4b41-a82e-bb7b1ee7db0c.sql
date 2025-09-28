-- Extend existing trial users to 30 days from their start date
UPDATE user_subscriptions 
SET 
  trial_ends_at = current_period_start + INTERVAL '30 days',
  current_period_end = current_period_start + INTERVAL '30 days'
WHERE status = 'trialing';