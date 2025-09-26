-- Update the handle_new_user function to automatically create slug from email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  email_prefix text;
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Extract email prefix (part before @)
  email_prefix := split_part(new.email, '@', 1);
  -- Clean the email prefix to create a valid slug
  base_slug := lower(regexp_replace(email_prefix, '[^a-z0-9]+', '-', 'g'));
  -- Remove leading/trailing hyphens
  base_slug := trim(both '-' from base_slug);
  -- Ensure it's not empty
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'user';
  END IF;
  
  final_slug := base_slug;
  
  -- Check if slug already exists and increment if needed
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  -- Insert profile with auto-generated slug
  INSERT INTO public.profiles (id, email, full_name, slug, public_profile)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data ->> 'full_name',
    final_slug,
    true
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;

-- Create a function to check if slug is available
CREATE OR REPLACE FUNCTION public.is_slug_available(slug_text text, user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if slug exists for a different user
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE slug = slug_text 
    AND (user_id IS NULL OR id != user_id)
  );
END;
$$;