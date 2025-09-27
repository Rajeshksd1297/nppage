-- Create a secure view for public profiles that excludes sensitive data
CREATE OR REPLACE VIEW public.public_profiles AS
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
  subscription_plan_id
FROM public.profiles 
WHERE public_profile = true;

-- Grant SELECT access to the public view
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Drop the problematic public profiles policy
DROP POLICY IF EXISTS "Public profiles limited access" ON public.profiles;

-- Create a new, more secure policy that only allows owners and admins to see full profiles
CREATE POLICY "Users can view full profiles (secure)" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can see their own profile with all fields
  auth.uid() = id 
  OR 
  -- Admins can see all profiles with all fields
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create RLS policy for the public view
ALTER VIEW public.public_profiles SET (security_invoker = false);

-- Add comment explaining the security model
COMMENT ON VIEW public.public_profiles IS 'Public view of profiles that excludes sensitive data like email and mobile_number. Use this view for public profile access instead of the profiles table directly.';