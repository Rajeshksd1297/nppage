-- Insert default site settings if none exist with proper values
INSERT INTO public.site_settings (
  site_title,
  site_description,
  primary_color,
  secondary_color,
  enable_dark_mode,
  header_config,
  footer_config
)
SELECT 
  'AuthorPage',
  'Professional author profiles and book showcases for the modern writer',
  '#3b82f6',
  '#64748b',
  true,
  '{"showLogo": true, "showLogin": true, "navigation": [], "showSearch": false}'::jsonb,
  '{"copyright": "© 2024 AuthorPage. All rights reserved.", "showPages": true, "customText": "Built with AuthorPage", "showSocial": true}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_settings 
  WHERE site_title IS NOT NULL 
  AND site_title != '' 
  AND site_description IS NOT NULL 
  AND site_description != ''
);