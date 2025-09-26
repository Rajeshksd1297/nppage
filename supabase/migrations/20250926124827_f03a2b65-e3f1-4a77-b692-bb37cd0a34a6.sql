-- Add SEO fields to profiles table (only if they don't exist)
DO $$ 
BEGIN
  BEGIN
    ALTER TABLE public.profiles ADD COLUMN seo_title TEXT;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
END $$;

DO $$ 
BEGIN
  BEGIN
    ALTER TABLE public.profiles ADD COLUMN seo_description TEXT;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
END $$;

DO $$ 
BEGIN
  BEGIN
    ALTER TABLE public.profiles ADD COLUMN seo_keywords TEXT;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
END $$;

-- Add SEO and content fields to books table (only if they don't exist)  
DO $$ 
BEGIN
  BEGIN
    ALTER TABLE public.books ADD COLUMN seo_title TEXT;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
END $$;

DO $$ 
BEGIN
  BEGIN
    ALTER TABLE public.books ADD COLUMN seo_description TEXT;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
END $$;

DO $$ 
BEGIN
  BEGIN
    ALTER TABLE public.books ADD COLUMN seo_keywords TEXT;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
END $$;

DO $$ 
BEGIN
  BEGIN
    ALTER TABLE public.books ADD COLUMN tags TEXT[] DEFAULT ARRAY[]::TEXT[];
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
END $$;

DO $$ 
BEGIN
  BEGIN
    ALTER TABLE public.books ADD COLUMN category TEXT;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
END $$;

-- Create seo_settings table for global SEO configuration
CREATE TABLE IF NOT EXISTS public.seo_settings (
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

-- Create policies for seo_settings (if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'seo_settings' AND policyname = 'Admins can manage SEO settings') THEN
    EXECUTE 'CREATE POLICY "Admins can manage SEO settings" ON public.seo_settings FOR ALL USING (has_role(auth.uid(), ''admin''::app_role))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'seo_settings' AND policyname = 'SEO settings are viewable by everyone') THEN
    EXECUTE 'CREATE POLICY "SEO settings are viewable by everyone" ON public.seo_settings FOR SELECT USING (true)';
  END IF;
END $$;

-- Insert default SEO settings
INSERT INTO public.seo_settings (site_title, site_description) 
VALUES ('AuthorPage', 'Professional author profiles and book showcases')
ON CONFLICT DO NOTHING;

-- Create search_console_data table for storing GSC data
CREATE TABLE IF NOT EXISTS public.search_console_data (
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

-- Create policies for search_console_data (if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'search_console_data' AND policyname = 'Admins can view search console data') THEN
    EXECUTE 'CREATE POLICY "Admins can view search console data" ON public.search_console_data FOR SELECT USING (has_role(auth.uid(), ''admin''::app_role))';
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_search_console_data_date ON public.search_console_data(date);
CREATE INDEX IF NOT EXISTS idx_search_console_data_query ON public.search_console_data(query);
CREATE INDEX IF NOT EXISTS idx_books_tags ON public.books USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON public.articles USING GIN(tags);