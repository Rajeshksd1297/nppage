-- Create user contact form settings table
CREATE TABLE public.user_contact_form_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  form_title text DEFAULT 'Contact Me',
  form_description text DEFAULT 'Send me a message and I''ll get back to you soon!',
  custom_fields jsonb DEFAULT '[]'::jsonb,
  auto_reply_enabled boolean DEFAULT true,
  auto_reply_subject text DEFAULT 'Thank you for your message',
  auto_reply_message text DEFAULT 'Thank you for contacting me. I have received your message and will get back to you as soon as possible.',
  notification_email text, -- Will use user's signup email if null
  collect_phone boolean DEFAULT false,
  collect_company boolean DEFAULT false,
  require_subject boolean DEFAULT false,
  enabled boolean DEFAULT true,
  max_message_length integer DEFAULT 1000,
  spam_protection boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_contact_form_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own contact form settings" 
ON public.user_contact_form_settings FOR ALL 
USING (auth.uid() = user_id);

-- Create admin global contact form settings
CREATE TABLE public.admin_contact_form_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  max_submissions_per_hour integer DEFAULT 5,
  max_message_length integer DEFAULT 2000,
  required_fields jsonb DEFAULT '["name", "email", "message"]'::jsonb,
  blocked_domains jsonb DEFAULT '[]'::jsonb,
  auto_moderation boolean DEFAULT true,
  allow_attachments boolean DEFAULT false,
  max_attachment_size_mb integer DEFAULT 5,
  retention_days integer DEFAULT 365,
  enable_honeypot boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for admin settings
ALTER TABLE public.admin_contact_form_settings ENABLE ROW LEVEL SECURITY;

-- Admin can manage global settings
CREATE POLICY "Admins can manage global contact form settings" 
ON public.admin_contact_form_settings FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Everyone can view global settings (for validation)
CREATE POLICY "Everyone can view global contact form settings" 
ON public.admin_contact_form_settings FOR SELECT 
USING (true);

-- Create update triggers
CREATE TRIGGER update_user_contact_form_settings_updated_at
BEFORE UPDATE ON public.user_contact_form_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_contact_form_settings_updated_at
BEFORE UPDATE ON public.admin_contact_form_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default admin settings
INSERT INTO public.admin_contact_form_settings (id) VALUES (gen_random_uuid());