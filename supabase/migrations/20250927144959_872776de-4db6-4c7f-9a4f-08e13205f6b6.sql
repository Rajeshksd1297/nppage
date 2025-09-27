-- Fix the security definer issue by recreating the view with proper security settings
DROP VIEW IF EXISTS public.public_profiles;

-- Create the secure view without SECURITY DEFINER to use invoker's permissions
CREATE VIEW public.public_profiles 
WITH (security_invoker = true) AS
SELECT 
  id,
  full_name,
  bio,
  avatar_url,
  website_url,
  specializations,
  social_links,
  seo_title,
  seo_description,
  seo_keywords,
  slug,
  created_at,
  updated_at,
  theme_id,
  custom_domain_id,
  publisher_id,
  active_theme_customization_id,
  subscription_plan_id,
  public_profile
FROM public.profiles 
WHERE public_profile = true;

-- Enable RLS on the view
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Grant appropriate access to the public view
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Add comment explaining the security model
COMMENT ON VIEW public.public_profiles IS 'Secure public view of profiles that excludes sensitive data like email, mobile_number, and country_code. Uses security_invoker=true to respect caller permissions and RLS policies.';