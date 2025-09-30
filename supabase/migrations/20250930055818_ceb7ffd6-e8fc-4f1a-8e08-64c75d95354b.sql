-- Add additional columns to publisher_authors table for enhanced management
ALTER TABLE public.publisher_authors 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS access_level text DEFAULT 'author',
ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '["read", "write"]'::jsonb,
ADD COLUMN IF NOT EXISTS last_active timestamp with time zone DEFAULT now();

-- Update existing records to have default values
UPDATE public.publisher_authors 
SET 
  status = 'active',
  access_level = 'author',
  permissions = '["read", "write"]'::jsonb,
  last_active = now()
WHERE status IS NULL OR access_level IS NULL OR permissions IS NULL;