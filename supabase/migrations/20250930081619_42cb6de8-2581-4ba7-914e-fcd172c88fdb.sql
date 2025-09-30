-- Add unique constraint on email in profiles table to ensure email uniqueness
-- This prevents duplicate emails even if somehow auth.users allows it
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_email_key UNIQUE (email);

-- Add helpful comment
COMMENT ON CONSTRAINT profiles_email_key ON public.profiles IS 'Ensures email addresses are unique across all user profiles';