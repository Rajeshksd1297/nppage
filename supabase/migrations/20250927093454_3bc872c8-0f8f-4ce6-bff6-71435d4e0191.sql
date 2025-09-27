-- Create awards_settings table
CREATE TABLE public.awards_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  categories TEXT[] DEFAULT '{"achievement", "recognition", "excellence", "innovation", "leadership", "community", "academic", "professional"}',
  max_title_length INTEGER DEFAULT 100,
  max_description_length INTEGER DEFAULT 1000,
  max_image_size_mb INTEGER DEFAULT 5,
  allowed_image_types TEXT[] DEFAULT '{"jpg", "jpeg", "png", "webp"}',
  require_approval BOOLEAN DEFAULT false,
  allow_user_submissions BOOLEAN DEFAULT true,
  max_awards_per_user INTEGER DEFAULT 20,
  require_verification BOOLEAN DEFAULT false,
  auto_generate_certificates BOOLEAN DEFAULT false,
  enable_public_display BOOLEAN DEFAULT true,
  sort_by_date BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.awards_settings ENABLE ROW LEVEL SECURITY;

-- Admin access policies
CREATE POLICY "Admins can view awards settings" 
ON public.awards_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can modify awards settings" 
ON public.awards_settings 
FOR ALL 
USING (auth.uid() IN (
  SELECT user_id FROM user_roles WHERE role = 'admin'
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_awards_settings_updated_at
BEFORE UPDATE ON public.awards_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.awards_settings (id) VALUES (gen_random_uuid());