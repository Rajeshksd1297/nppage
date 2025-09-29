-- Create AI platform settings table
CREATE TABLE public.ai_platform_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform_name TEXT NOT NULL, -- 'openai', 'google_gemini', 'anthropic', etc.
  display_name TEXT NOT NULL, -- 'OpenAI', 'Google Gemini', 'Anthropic Claude'
  api_key_encrypted TEXT, -- Store encrypted API key
  model_name TEXT DEFAULT NULL, -- Default model to use
  is_active BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false, -- Which provider to use by default
  rate_limit_per_minute INTEGER DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(platform_name)
);

-- Enable RLS
ALTER TABLE public.ai_platform_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage AI platform settings" 
ON public.ai_platform_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view active AI platform settings" 
ON public.ai_platform_settings 
FOR SELECT 
USING (is_active = true);

-- Create function to update timestamps
CREATE TRIGGER update_ai_platform_settings_updated_at
BEFORE UPDATE ON public.ai_platform_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default platforms
INSERT INTO public.ai_platform_settings (platform_name, display_name, model_name, is_active) VALUES
('openai', 'OpenAI', 'gpt-4o-mini', false),
('google_gemini', 'Google Gemini', 'gemini-1.5-flash', false),
('anthropic', 'Anthropic Claude', 'claude-3-haiku-20240307', false),
('perplexity', 'Perplexity AI', 'llama-3.1-sonar-small-128k-online', false);