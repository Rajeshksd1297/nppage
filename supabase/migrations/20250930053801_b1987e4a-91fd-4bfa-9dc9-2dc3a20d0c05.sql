-- Add publisher plan support columns to subscription_plans table
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS is_publisher_plan boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS max_authors integer DEFAULT NULL;

-- Update existing plans to set publisher status based on name
UPDATE public.subscription_plans 
SET is_publisher_plan = true 
WHERE LOWER(name) = 'publisher';

-- Add comment for documentation
COMMENT ON COLUMN public.subscription_plans.is_publisher_plan IS 'Indicates if this plan supports publisher features (multi-author management)';
COMMENT ON COLUMN public.subscription_plans.max_authors IS 'Maximum number of authors a publisher can manage under this plan';