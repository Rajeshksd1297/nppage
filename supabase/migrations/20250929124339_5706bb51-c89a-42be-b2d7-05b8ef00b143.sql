-- Insert default site settings if none exist with proper values
INSERT INTO site_settings (
  site_title,
  site_description,
  primary_color,
  secondary_color,
  enable_dark_mode,
  header_config,
  footer_config
) 
SELECT 
  'AuthorPage - Professional Author Platform',
  'Create stunning author profiles, showcase your books, and grow your readership with our professional author platform.',
  '#3b82f6',
  '#64748b',
  true,
  '{"showLogo": true, "showLogin": true, "navigation": [], "showSearch": false}',
  '{"copyright": "© 2024 AuthorPage. All rights reserved.", "showPages": true, "customText": "Built with AuthorPage", "showSocial": true}'
WHERE NOT EXISTS (
  SELECT 1 FROM site_settings 
  WHERE site_title IS NOT NULL 
  AND site_title != '' 
  AND site_description IS NOT NULL 
  AND site_description != ''
);