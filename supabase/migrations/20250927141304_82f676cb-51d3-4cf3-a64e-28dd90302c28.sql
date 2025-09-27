-- Fix missing profile for admin user
INSERT INTO public.profiles (
  id, 
  email, 
  full_name, 
  slug, 
  public_profile,
  created_at,
  updated_at
) VALUES (
  '6b0afc13-ed88-4ff4-be11-da56f1ebd768',
  'rajeshksd1297@gmail.com',
  'Rajesh Admin',
  'rajesh-admin',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  updated_at = NOW();