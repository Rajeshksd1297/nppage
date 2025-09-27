-- Create blog settings table for admin controls
CREATE TABLE public.blog_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  max_title_length INTEGER NOT NULL DEFAULT 100,
  max_content_length INTEGER NOT NULL DEFAULT 50000,
  max_excerpt_length INTEGER NOT NULL DEFAULT 300,
  allowed_image_size_mb INTEGER NOT NULL DEFAULT 5,
  allowed_image_types TEXT[] NOT NULL DEFAULT ARRAY['image/jpeg', 'image/png', 'image/webp'],
  require_approval BOOLEAN NOT NULL DEFAULT false,
  allow_html BOOLEAN NOT NULL DEFAULT true,
  categories JSONB NOT NULL DEFAULT '["General", "Technology", "Lifestyle", "Business", "Education", "Health", "Travel", "Food"]'::jsonb,
  default_status TEXT NOT NULL DEFAULT 'draft',
  auto_generate_slug BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for blog settings
CREATE POLICY "Admins can manage blog settings" 
ON public.blog_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view blog settings" 
ON public.blog_settings 
FOR SELECT 
USING (true);

-- Insert default blog settings
INSERT INTO public.blog_settings (id) VALUES (gen_random_uuid());

-- Add new columns to blog_posts if they don't exist
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General',
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reading_time INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Create function to update word count and reading time
CREATE OR REPLACE FUNCTION public.update_blog_post_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate word count (rough estimate)
  NEW.word_count = array_length(string_to_array(regexp_replace(NEW.content, '<[^>]*>', '', 'g'), ' '), 1);
  
  -- Calculate reading time (assuming 200 words per minute)
  NEW.reading_time = GREATEST(1, ROUND(NEW.word_count::numeric / 200));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_blog_post_stats_trigger ON public.blog_posts;
CREATE TRIGGER update_blog_post_stats_trigger
  BEFORE INSERT OR UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_blog_post_stats();

-- Create trigger for blog_settings updated_at
CREATE TRIGGER update_blog_settings_updated_at
  BEFORE UPDATE ON public.blog_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();