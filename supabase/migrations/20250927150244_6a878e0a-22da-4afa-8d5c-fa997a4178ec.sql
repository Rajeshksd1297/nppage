-- Fix function search path security warnings
-- Update newly created functions to have proper search_path settings

-- Fix validate_newsletter_subscriber function
CREATE OR REPLACE FUNCTION public.validate_newsletter_subscriber()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate email format
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RAISE EXCEPTION 'Email address is required';
  END IF;
  
  IF NOT NEW.email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email address format';
  END IF;
  
  -- Ensure user_id is set to current user (prevent privilege escalation)
  IF TG_OP = 'INSERT' AND NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot create subscriber for another user';
  END IF;
  
  -- Prevent modification of user_id on updates
  IF TG_OP = 'UPDATE' AND NEW.user_id != OLD.user_id THEN
    RAISE EXCEPTION 'Cannot change subscriber ownership';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix audit_newsletter_subscribers function
CREATE OR REPLACE FUNCTION public.audit_newsletter_subscribers()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.newsletter_audit_log (operation, user_id, affected_email)
    VALUES ('DELETE', auth.uid(), OLD.email);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.newsletter_audit_log (operation, user_id, affected_email)
    VALUES ('UPDATE', auth.uid(), NEW.email);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.newsletter_audit_log (operation, user_id, affected_email)
    VALUES ('INSERT', auth.uid(), NEW.email);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;