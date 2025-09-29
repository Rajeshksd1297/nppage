-- Create global SEO settings table
CREATE TABLE IF NOT EXISTS public.global_seo_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_title TEXT,
  site_description TEXT,
  site_keywords TEXT,
  default_og_image TEXT,
  enable_schema BOOLEAN DEFAULT true,
  enable_sitemap BOOLEAN DEFAULT true,
  enable_robots BOOLEAN DEFAULT true,
  google_site_verification TEXT,
  bing_site_verification TEXT,
  facebook_app_id TEXT,
  twitter_handle TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.global_seo_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage global SEO settings"
ON public.global_seo_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view global SEO settings"
ON public.global_seo_settings
FOR SELECT
USING (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_global_seo_settings_updated_at
  BEFORE UPDATE ON public.global_seo_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();