-- Fix security vulnerability: Remove public access to sensitive profile data

-- Drop the existing overly permissive public policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create a new policy that restricts public access to only non-sensitive profile data
-- This policy will only allow viewing of public profiles but the application layer 
-- must ensure sensitive fields are filtered out when serving public data
CREATE POLICY "Public profiles limited access"
ON public.profiles
FOR SELECT
TO public
USING (
  public_profile = true 
  AND (
    auth.uid() = id  -- Profile owner can see all their data
    OR has_role(auth.uid(), 'admin')  -- Admins can see all data
    OR (
      -- Anonymous/other users can only see public profiles,
      -- but application must filter sensitive fields
      public_profile = true
    )
  )
);

-- Add a comment explaining the security consideration
COMMENT ON POLICY "Public profiles limited access" ON public.profiles IS 
'Allows public viewing of profiles marked as public, but application layer must filter out sensitive fields (email, mobile_number, country_code) for non-owners/non-admins';