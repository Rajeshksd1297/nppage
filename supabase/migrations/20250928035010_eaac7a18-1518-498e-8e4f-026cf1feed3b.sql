-- Create user email settings table
CREATE TABLE public.user_email_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resend_api_key TEXT,
  resend_from_email TEXT,
  resend_from_name TEXT DEFAULT 'Contact Form',
  enabled BOOLEAN DEFAULT false,
  test_email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_email_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own email settings"
ON public.user_email_settings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_email_settings_updated_at
BEFORE UPDATE ON public.user_email_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();