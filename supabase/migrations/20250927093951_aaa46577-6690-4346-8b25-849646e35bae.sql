-- Create FAQ settings table
CREATE TABLE public.faq_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  max_question_length INTEGER DEFAULT 200,
  max_answer_length INTEGER DEFAULT 2000,
  categories TEXT[] DEFAULT ARRAY['general', 'account', 'billing', 'technical', 'support', 'features'],
  allow_user_submissions BOOLEAN DEFAULT true,
  require_approval BOOLEAN DEFAULT false,
  allow_images BOOLEAN DEFAULT false,
  max_image_size_mb INTEGER DEFAULT 5,
  allowed_image_types TEXT[] DEFAULT ARRAY['jpg', 'jpeg', 'png', 'webp'],
  max_faqs_per_user INTEGER DEFAULT 10,
  enable_public_display BOOLEAN DEFAULT true,
  sort_by_order BOOLEAN DEFAULT true,
  auto_publish BOOLEAN DEFAULT false,
  require_category BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faq_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can modify FAQ settings" 
ON public.faq_settings 
FOR ALL 
USING (auth.uid() IN (
  SELECT user_id FROM user_roles WHERE role = 'admin'::app_role
));

CREATE POLICY "Everyone can view FAQ settings" 
ON public.faq_settings 
FOR SELECT 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_faq_settings_updated_at
  BEFORE UPDATE ON public.faq_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.faq_settings (id) VALUES (gen_random_uuid());