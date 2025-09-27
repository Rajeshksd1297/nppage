-- First, check what policies exist and drop the problematic one
DO $$ 
BEGIN
  -- Drop existing public profile policies that expose sensitive data
  DROP POLICY IF EXISTS "Public profiles limited access" ON public.profiles;
  DROP POLICY IF EXISTS "Users can view full profiles (secure)" ON public.profiles;
END $$;

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
  subscription_plan_id,
  public_profile
FROM public.profiles 
WHERE public_profile = true;

-- Create a new secure policy that only allows owners and admins to see sensitive profile data
CREATE POLICY "Secure profile access" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can see their own profile with all fields
  auth.uid() = id 
  OR 
  -- Admins can see all profiles with all fields  
  has_role(auth.uid(), 'admin'::app_role)
);

-- Grant appropriate access to the public view
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Add comment explaining the security model
COMMENT ON VIEW public.public_profiles IS 'Secure public view of profiles that excludes sensitive data like email, mobile_number, and country_code. Use this view for public profile access to prevent data exposure.';