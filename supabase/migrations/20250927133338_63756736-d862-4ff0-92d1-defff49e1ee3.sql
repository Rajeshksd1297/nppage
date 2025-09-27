-- Harden database functions with explicit search_path settings for security

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- Update setup_user_trial function
CREATE OR REPLACE FUNCTION public.setup_user_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  pro_plan_id uuid;
BEGIN
  -- Get Pro plan ID
  SELECT id INTO pro_plan_id FROM subscription_plans WHERE name = 'Pro' LIMIT 1;
  
  -- Create 15-day Pro trial for new user
  IF pro_plan_id IS NOT NULL THEN
    INSERT INTO user_subscriptions (
      user_id, 
      plan_id, 
      status, 
      trial_ends_at,
      current_period_start,
      current_period_end
    ) VALUES (
      NEW.id,
      pro_plan_id,
      'trialing',
      NOW() + INTERVAL '15 days',
      NOW(),
      NOW() + INTERVAL '15 days'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update is_slug_available function
CREATE OR REPLACE FUNCTION public.is_slug_available(slug_text text, user_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Check if slug exists for a different user
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE slug = slug_text 
    AND (user_id IS NULL OR id != user_id)
  );
END;
$function$;

-- Update apply_user_theme function
CREATE OR REPLACE FUNCTION public.apply_user_theme(p_theme_id uuid, p_custom_config jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  customization_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Insert or update theme customization
  INSERT INTO public.user_theme_customizations (user_id, theme_id, custom_config)
  VALUES (current_user_id, p_theme_id, p_custom_config)
  ON CONFLICT (user_id, theme_id)
  DO UPDATE SET 
    custom_config = p_custom_config,
    is_active = true,
    updated_at = now()
  RETURNING id INTO customization_id;

  -- Update profile to use this customization
  UPDATE public.profiles 
  SET 
    active_theme_customization_id = customization_id,
    theme_id = p_theme_id,
    updated_at = now()
  WHERE id = current_user_id;

  -- Track usage
  INSERT INTO public.theme_usage_analytics (user_id, theme_id, action, metadata)
  VALUES (current_user_id, p_theme_id, 'applied', jsonb_build_object('customization_id', customization_id));

  RETURN customization_id;
END;
$function$;

-- Update create_ticket_status_history function
CREATE OR REPLACE FUNCTION public.create_ticket_status_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO public.ticket_status_history (
      ticket_id,
      old_status,
      new_status,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid()
    );
  END IF;
  
  -- Set resolved_at when status changes to resolved
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = now();
  END IF;
  
  -- Set closed_at when status changes to closed
  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    NEW.closed_at = now();
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update update_blog_post_stats function
CREATE OR REPLACE FUNCTION public.update_blog_post_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Calculate word count (rough estimate)
  NEW.word_count = array_length(string_to_array(regexp_replace(NEW.content, '<[^>]*>', '', 'g'), ' '), 1);
  
  -- Calculate reading time (assuming 200 words per minute)
  NEW.reading_time = GREATEST(1, ROUND(NEW.word_count::numeric / 200));
  
  RETURN NEW;
END;
$function$;