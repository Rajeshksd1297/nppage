-- Add branding_options column to publisher_settings table
ALTER TABLE public.publisher_settings 
ADD COLUMN IF NOT EXISTS branding_options jsonb DEFAULT '{}'::jsonb;

-- Add helpful comment
COMMENT ON COLUMN public.publisher_settings.branding_options IS 'Configuration for which branding options are available to publishers';