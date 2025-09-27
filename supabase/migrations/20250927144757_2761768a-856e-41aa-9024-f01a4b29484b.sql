-- Fix the security definer view issue by using security_invoker = true
-- This ensures the view uses the permissions of the querying user, not the view creator
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Also need to enable RLS on the view since it now uses the querying user's permissions
-- But views can't have RLS directly, so we rely on the underlying table's RLS policies

-- Update the comment to reflect the corrected security model
COMMENT ON VIEW public.public_profiles IS 'Public view of profiles that excludes sensitive data like email and mobile_number. Uses security_invoker=true to respect RLS policies of the underlying profiles table.';