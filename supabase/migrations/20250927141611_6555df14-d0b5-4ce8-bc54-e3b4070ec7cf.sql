-- Fix missing role for admin@demo.com user
INSERT INTO public.user_roles (
  user_id, 
  role
) VALUES (
  'bac401e5-5853-4b12-b642-c5ac229c265d',
  'admin'
) ON CONFLICT (user_id, role) DO NOTHING;