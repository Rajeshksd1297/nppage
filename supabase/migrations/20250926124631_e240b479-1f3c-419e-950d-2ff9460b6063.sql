-- Add SEO fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS seo_keywords TEXT;

-- Add SEO and content fields to books table
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS seo_keywords TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS category TEXT;

-- Create articles table for content marketing
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on articles
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Create policies for articles
CREATE POLICY "Users can view published articles" 
ON public.articles 
FOR SELECT 
USING (status = 'published' OR auth.uid() = user_id);

CREATE POLICY "Authors can manage their own articles" 
ON public.articles 
FOR ALL 
USING (auth.uid() = user_id);

-- Create trigger for articles updated_at
CREATE TRIGGER update_articles_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create seo_settings table for global SEO configuration
CREATE TABLE public.seo_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_title TEXT NOT NULL DEFAULT 'AuthorPage',
  site_description TEXT NOT NULL DEFAULT 'Professional author profiles and book showcases',
  site_keywords TEXT,
  robots_txt TEXT DEFAULT 'User-agent: *\nAllow: /\n\nSitemap: /sitemap.xml',
  google_analytics_id TEXT,
  google_search_console_id TEXT,
  facebook_pixel_id TEXT,
  twitter_handle TEXT,
  default_og_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on seo_settings
ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for seo_settings
CREATE POLICY "Admins can manage SEO settings" 
ON public.seo_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "SEO settings are viewable by everyone" 
ON public.seo_settings 
FOR SELECT 
USING (true);

-- Insert default SEO settings
INSERT INTO public.seo_settings (site_title, site_description) 
VALUES ('AuthorPage', 'Professional author profiles and book showcases')
ON CONFLICT DO NOTHING;

-- Create search_console_data table for storing GSC data
CREATE TABLE public.search_console_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  page TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  ctr NUMERIC(5,4) NOT NULL DEFAULT 0,
  position NUMERIC(6,2) NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on search_console_data
ALTER TABLE public.search_console_data ENABLE ROW LEVEL SECURITY;

-- Create policies for search_console_data
CREATE POLICY "Admins can view search console data" 
ON public.search_console_data 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for performance
CREATE INDEX idx_search_console_data_date ON public.search_console_data(date);
CREATE INDEX idx_search_console_data_query ON public.search_console_data(query);
CREATE INDEX idx_articles_slug ON public.articles(slug);
CREATE INDEX idx_articles_status_published_at ON public.articles(status, published_at);
CREATE INDEX idx_books_tags ON public.books USING GIN(tags);
CREATE INDEX idx_articles_tags ON public.articles USING GIN(tags);