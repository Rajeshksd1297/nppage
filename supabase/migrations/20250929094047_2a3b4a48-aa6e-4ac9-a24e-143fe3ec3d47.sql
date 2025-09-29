-- Create table to log SEO suggestions for analytics
CREATE TABLE public.seo_suggestions_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('book', 'blog', 'profile', 'page')),
  record_id TEXT,
  suggestions JSONB NOT NULL,
  applied BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  applied_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.seo_suggestions_log ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own SEO suggestions log" 
ON public.seo_suggestions_log 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert SEO suggestions log" 
ON public.seo_suggestions_log 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own SEO suggestions log" 
ON public.seo_suggestions_log 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_seo_suggestions_log_user_id ON public.seo_suggestions_log(user_id);
CREATE INDEX idx_seo_suggestions_log_content_type ON public.seo_suggestions_log(content_type);
CREATE INDEX idx_seo_suggestions_log_created_at ON public.seo_suggestions_log(created_at DESC);