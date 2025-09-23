-- Create books table
CREATE TABLE public.books (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  subtitle text,
  description text,
  isbn text,
  publication_date date,
  cover_image_url text,
  purchase_links jsonb DEFAULT '[]'::jsonb,
  genres text[] DEFAULT ARRAY[]::text[],
  page_count integer,
  publisher text,
  language text DEFAULT 'en',
  slug text UNIQUE,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on books
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Create policies for books
CREATE POLICY "Users can view published books" 
ON public.books 
FOR SELECT 
USING (status = 'published' OR auth.uid() = user_id);

CREATE POLICY "Authors can manage their own books" 
ON public.books 
FOR ALL 
USING (auth.uid() = user_id);

-- Create analytics table
CREATE TABLE public.page_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_type text NOT NULL CHECK (page_type IN ('profile', 'book', 'home')),
  page_id text, -- profile id or book slug
  visitor_id text,
  session_id text,
  user_agent text,
  referrer text,
  country text,
  device_type text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on analytics
ALTER TABLE public.page_analytics ENABLE ROW LEVEL SECURITY;

-- Create policy for analytics - users can only view their own analytics
CREATE POLICY "Users can view their own analytics" 
ON public.page_analytics 
FOR SELECT 
USING (
  page_type = 'profile' AND page_id = auth.uid()::text OR
  page_type = 'book' AND EXISTS (
    SELECT 1 FROM public.books 
    WHERE slug = page_id AND user_id = auth.uid()
  ) OR
  has_role(auth.uid(), 'admin')
);

-- Only system can insert analytics (via edge function)
CREATE POLICY "System can insert analytics" 
ON public.page_analytics 
FOR INSERT 
WITH CHECK (true);

-- Add triggers for updated_at
CREATE TRIGGER update_books_updated_at
BEFORE UPDATE ON public.books
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_books_user_id ON public.books(user_id);
CREATE INDEX idx_books_slug ON public.books(slug);
CREATE INDEX idx_books_status ON public.books(status);
CREATE INDEX idx_analytics_page_type_id ON public.page_analytics(page_type, page_id);
CREATE INDEX idx_analytics_created_at ON public.page_analytics(created_at);

-- Update profiles table to include author-specific fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS specializations text[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS public_profile boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS slug text UNIQUE;