-- Enable real-time for subscription_plans table
ALTER TABLE subscription_plans REPLICA IDENTITY FULL;

-- Add the subscription_plans table to the realtime publication
SELECT 'ALTER PUBLICATION supabase_realtime ADD TABLE subscription_plans;';