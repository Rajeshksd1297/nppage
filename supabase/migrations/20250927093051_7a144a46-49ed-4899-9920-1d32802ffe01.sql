-- Create gallery_settings table
CREATE TABLE public.gallery_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  categories TEXT[] DEFAULT '{"nature", "portrait", "landscape", "architecture", "street", "wildlife", "macro", "abstract"}',
  max_title_length INTEGER DEFAULT 100,
  max_description_length INTEGER DEFAULT 500,
  max_image_size_mb INTEGER DEFAULT 10,
  allowed_image_types TEXT[] DEFAULT '{"jpg", "jpeg", "png", "webp", "gif"}',
  require_approval BOOLEAN DEFAULT false,
  allow_user_uploads BOOLEAN DEFAULT true,
  max_images_per_user INTEGER DEFAULT 50,
  image_compression_quality INTEGER DEFAULT 85,
  enable_watermark BOOLEAN DEFAULT false,
  auto_generate_thumbnails BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.gallery_settings ENABLE ROW LEVEL SECURITY;

-- Admin access policies
CREATE POLICY "Admins can view gallery settings" 
ON public.gallery_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can modify gallery settings" 
ON public.gallery_settings 
FOR ALL 
USING (auth.uid() IN (
  SELECT user_id FROM user_roles WHERE role = 'admin'
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_gallery_settings_updated_at
BEFORE UPDATE ON public.gallery_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.gallery_settings (id) VALUES (gen_random_uuid());