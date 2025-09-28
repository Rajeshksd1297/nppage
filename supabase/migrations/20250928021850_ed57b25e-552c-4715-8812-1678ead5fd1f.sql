-- Create profiles for any existing users who don't have them
DO $$
DECLARE
  user_record RECORD;
  email_prefix text;
  base_slug text;
  final_slug text;
  counter integer;
  user_full_name text;
BEGIN
  -- Loop through users without profiles
  FOR user_record IN 
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u 
    LEFT JOIN public.profiles p ON u.id = p.id 
    WHERE p.id IS NULL
  LOOP
    -- Reset counter for each user
    counter := 0;
    
    -- Get full name from metadata, with fallback
    user_full_name := COALESCE(
      user_record.raw_user_meta_data ->> 'full_name',
      user_record.raw_user_meta_data ->> 'name',
      split_part(user_record.email, '@', 1)
    );
    
    -- Extract email prefix (part before @)
    email_prefix := split_part(user_record.email, '@', 1);
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

    -- Insert profile
    INSERT INTO public.profiles (
      id, 
      email, 
      full_name, 
      slug, 
      public_profile,
      created_at,
      updated_at
    )
    VALUES (
      user_record.id, 
      user_record.email, 
      user_full_name,
      final_slug,
      true,
      now(),
      now()
    );
    
    -- Assign default user role if not already assigned
    INSERT INTO public.user_roles (user_id, role)
    VALUES (user_record.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Created profile for user: % with slug: %', user_record.email, final_slug;
  END LOOP;
END $$;