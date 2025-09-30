-- Add max_support_tickets column to subscription_plans table
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS max_support_tickets INTEGER DEFAULT 3;

-- Update existing plans to have default helpdesk limits
UPDATE public.subscription_plans 
SET max_support_tickets = 3 
WHERE max_support_tickets IS NULL;

-- Add constraint to ensure reasonable ticket limits
ALTER TABLE public.subscription_plans 
ADD CONSTRAINT check_support_tickets_range 
CHECK (max_support_tickets >= 1 AND max_support_tickets <= 100);