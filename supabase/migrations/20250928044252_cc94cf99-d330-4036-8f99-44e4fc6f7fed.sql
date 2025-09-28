-- Ensure proper replica identity for real-time updates
ALTER TABLE public.user_subscriptions REPLICA IDENTITY FULL;