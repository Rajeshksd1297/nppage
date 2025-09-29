-- Create additional_pages table for site pages like privacy, terms, etc.
CREATE TABLE public.additional_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL DEFAULT '',
  meta_title text,
  meta_description text,
  is_published boolean NOT NULL DEFAULT true,
  show_in_footer boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.additional_pages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Additional pages are viewable by everyone" 
ON public.additional_pages 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Admins can manage additional pages" 
ON public.additional_pages 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create site_settings table for global site configuration
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_title text NOT NULL DEFAULT 'My Website',
  site_description text NOT NULL DEFAULT 'Welcome to my website',
  logo_url text,
  favicon_url text,
  primary_color text NOT NULL DEFAULT '#000000',
  secondary_color text NOT NULL DEFAULT '#666666',
  enable_dark_mode boolean NOT NULL DEFAULT true,
  header_config jsonb NOT NULL DEFAULT '{"showLogo": true, "showLogin": true, "showSearch": false, "navigation": []}',
  footer_config jsonb NOT NULL DEFAULT '{"showPages": true, "showSocial": true, "copyright": "", "customText": ""}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for site_settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for site_settings
CREATE POLICY "Site settings are viewable by everyone" 
ON public.site_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage site settings" 
ON public.site_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default site settings
INSERT INTO public.site_settings (
  site_title,
  site_description,
  primary_color,
  secondary_color,
  enable_dark_mode,
  header_config,
  footer_config
) VALUES (
  'AuthorPage',
  'Professional author profiles and book showcases',
  '#000000',
  '#666666',
  true,
  '{"showLogo": true, "showLogin": true, "showSearch": false, "showDarkMode": true, "navigation": []}',
  '{"showPages": true, "showSocial": true, "copyright": "© 2024 AuthorPage. All rights reserved.", "customText": "Built with AuthorPage"}'
);

-- Add trigger for updated_at
CREATE TRIGGER update_additional_pages_updated_at
BEFORE UPDATE ON public.additional_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();