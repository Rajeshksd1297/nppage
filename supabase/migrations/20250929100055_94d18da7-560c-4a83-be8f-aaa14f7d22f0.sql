-- Create cookie categories table
CREATE TABLE public.cookie_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  is_required BOOLEAN DEFAULT false,
  is_enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cookie settings table
CREATE TABLE public.cookie_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  banner_title TEXT DEFAULT 'Cookie Consent',
  banner_message TEXT DEFAULT 'We use cookies to enhance your browsing experience and analyze our traffic.',
  consent_mode TEXT DEFAULT 'opt-in', -- 'opt-in', 'opt-out', 'necessary-only'
  show_banner BOOLEAN DEFAULT true,
  banner_position TEXT DEFAULT 'bottom', -- 'top', 'bottom', 'modal'
  auto_hide_after INTEGER DEFAULT 0, -- seconds, 0 = never auto-hide
  theme TEXT DEFAULT 'default',
  primary_color TEXT DEFAULT '#3b82f6',
  accept_all_button_text TEXT DEFAULT 'Accept All',
  reject_all_button_text TEXT DEFAULT 'Reject All',
  settings_button_text TEXT DEFAULT 'Cookie Settings',
  save_preferences_text TEXT DEFAULT 'Save Preferences',
  privacy_policy_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cookie consent log table
CREATE TABLE public.cookie_consent_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  consent_action TEXT NOT NULL, -- 'accept-all', 'reject-all', 'custom'
  accepted_categories JSONB DEFAULT '[]',
  rejected_categories JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cookie_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cookie_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cookie_consent_log ENABLE ROW LEVEL SECURITY;

-- Create policies for cookie_categories
CREATE POLICY "Everyone can view cookie categories" 
ON public.cookie_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage cookie categories" 
ON public.cookie_categories 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create policies for cookie_settings
CREATE POLICY "Everyone can view cookie settings" 
ON public.cookie_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage cookie settings" 
ON public.cookie_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create policies for cookie_consent_log
CREATE POLICY "System can insert consent logs" 
ON public.cookie_consent_log 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all consent logs" 
ON public.cookie_consent_log 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default cookie categories
INSERT INTO public.cookie_categories (name, display_name, description, is_required, sort_order) VALUES
('necessary', 'Necessary Cookies', 'Essential cookies required for basic website functionality', true, 1),
('analytics', 'Analytics Cookies', 'Help us understand how visitors interact with our website', false, 2),
('marketing', 'Marketing Cookies', 'Used to track visitors across websites for advertising purposes', false, 3),
('functional', 'Functional Cookies', 'Enable enhanced functionality and personalization', false, 4),
('social', 'Social Media Cookies', 'Allow social media features and content sharing', false, 5);

-- Insert default cookie settings
INSERT INTO public.cookie_settings (id) VALUES (gen_random_uuid());

-- Create update trigger
CREATE TRIGGER update_cookie_categories_updated_at
BEFORE UPDATE ON public.cookie_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cookie_settings_updated_at
BEFORE UPDATE ON public.cookie_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();