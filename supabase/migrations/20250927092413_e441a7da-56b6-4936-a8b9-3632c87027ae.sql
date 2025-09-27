-- Create event_settings table
CREATE TABLE public.event_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  categories TEXT[] DEFAULT '{"conference", "workshop", "meetup", "webinar", "seminar"}',
  max_title_length INTEGER DEFAULT 100,
  max_content_length INTEGER DEFAULT 2000,
  max_image_size INTEGER DEFAULT 5,
  allowed_image_types TEXT[] DEFAULT '{"jpg", "jpeg", "png", "webp"}',
  require_approval BOOLEAN DEFAULT false,
  allow_user_events BOOLEAN DEFAULT true,
  default_event_duration INTEGER DEFAULT 60,
  max_attendees_default INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.event_settings ENABLE ROW LEVEL SECURITY;

-- Admin access policies
CREATE POLICY "Admins can view event settings" 
ON public.event_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can modify event settings" 
ON public.event_settings 
FOR ALL 
USING (auth.uid() IN (
  SELECT user_id FROM user_roles WHERE role = 'admin'
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_event_settings_updated_at
BEFORE UPDATE ON public.event_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.event_settings (id) VALUES (gen_random_uuid());