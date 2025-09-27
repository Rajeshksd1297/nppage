-- Fix security vulnerability in newsletter_subscribers table (v2)
-- Handle existing policies properly

-- First, let's see what policies currently exist and drop them all
DO $$ 
BEGIN
    -- Drop all existing policies on newsletter_subscribers
    DROP POLICY IF EXISTS "Users can manage their own newsletter subscribers" ON public.newsletter_subscribers;
    DROP POLICY IF EXISTS "Users can view their own newsletter subscribers" ON public.newsletter_subscribers;
    DROP POLICY IF EXISTS "Users can insert their own newsletter subscribers" ON public.newsletter_subscribers;
    DROP POLICY IF EXISTS "Users can update their own newsletter subscribers" ON public.newsletter_subscribers;
    DROP POLICY IF EXISTS "Users can delete their own newsletter subscribers" ON public.newsletter_subscribers;
    DROP POLICY IF EXISTS "Admins can manage all newsletter subscribers" ON public.newsletter_subscribers;
END $$;

-- Create secure RLS policies with proper separation of concerns

-- Policy 1: Users can only view their own newsletter subscribers (READ access)
CREATE POLICY "Users can view their own newsletter subscribers" 
ON public.newsletter_subscribers 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy 2: Users can only insert subscribers for themselves (prevents impersonation)
CREATE POLICY "Users can insert their own newsletter subscribers" 
ON public.newsletter_subscribers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can only update their own newsletter subscribers
CREATE POLICY "Users can update their own newsletter subscribers" 
ON public.newsletter_subscribers 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can only delete their own newsletter subscribers
CREATE POLICY "Users can delete their own newsletter subscribers" 
ON public.newsletter_subscribers 
FOR DELETE 
USING (auth.uid() = user_id);

-- Policy 5: Admins can manage all newsletter subscribers (for administrative purposes)
CREATE POLICY "Admins can manage all newsletter subscribers" 
ON public.newsletter_subscribers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create validation function to prevent data harvesting attacks
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

-- Apply validation trigger (drop first if exists)
DROP TRIGGER IF EXISTS validate_newsletter_subscriber_trigger ON public.newsletter_subscribers;
CREATE TRIGGER validate_newsletter_subscriber_trigger
  BEFORE INSERT OR UPDATE ON public.newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.validate_newsletter_subscriber();

-- Create audit log table if not exists
CREATE TABLE IF NOT EXISTS public.newsletter_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL DEFAULT 'newsletter_subscribers',
  operation TEXT NOT NULL,
  user_id UUID NOT NULL,
  affected_email TEXT NOT NULL,
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS on audit log
ALTER TABLE public.newsletter_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop existing audit policies and recreate them
DROP POLICY IF EXISTS "Admins can view newsletter audit logs" ON public.newsletter_audit_log;
DROP POLICY IF EXISTS "System can insert newsletter audit logs" ON public.newsletter_audit_log;

-- Only admins can view audit logs
CREATE POLICY "Admins can view newsletter audit logs" 
ON public.newsletter_audit_log 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert audit logs
CREATE POLICY "System can insert newsletter audit logs" 
ON public.newsletter_audit_log 
FOR INSERT 
WITH CHECK (true);

-- Create audit function
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

-- Apply audit trigger
DROP TRIGGER IF EXISTS audit_newsletter_subscribers_trigger ON public.newsletter_subscribers;
CREATE TRIGGER audit_newsletter_subscribers_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.audit_newsletter_subscribers();

-- Add security documentation
COMMENT ON TABLE public.newsletter_subscribers IS 'Newsletter subscribers with enhanced security: RLS policies prevent unauthorized access to email addresses, validation trigger prevents data manipulation attacks, and proper admin controls are in place. All operations are audited for security monitoring.';