-- Fix security issues by updating functions with proper search_path

-- Update the blog post stats function with proper search path
CREATE OR REPLACE FUNCTION public.update_blog_post_stats()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Calculate word count (rough estimate)
  NEW.word_count = array_length(string_to_array(regexp_replace(NEW.content, '<[^>]*>', '', 'g'), ' '), 1);
  
  -- Calculate reading time (assuming 200 words per minute)
  NEW.reading_time = GREATEST(1, ROUND(NEW.word_count::numeric / 200));
  
  RETURN NEW;
END;
$$;