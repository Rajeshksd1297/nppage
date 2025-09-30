-- Add new configuration columns to publishers table for feature management
ALTER TABLE public.publishers 
ADD COLUMN IF NOT EXISTS feature_config jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS tools_config jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS branding_config jsonb DEFAULT '{}'::jsonb;

-- Add helpful comments
COMMENT ON COLUMN public.publishers.feature_config IS 'Feature access configuration for the publisher';
COMMENT ON COLUMN public.publishers.tools_config IS 'Tools and integrations access configuration';
COMMENT ON COLUMN public.publishers.branding_config IS 'Branding customization settings (colors, logos, fonts)';