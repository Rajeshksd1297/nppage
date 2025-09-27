-- Create user theme customizations table
CREATE TABLE public.user_theme_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
  custom_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, theme_id)
);

-- Enable RLS
ALTER TABLE public.user_theme_customizations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage their own theme customizations"
ON public.user_theme_customizations
FOR ALL
USING (auth.uid() = user_id);

-- Add realtime publication
ALTER publication supabase_realtime ADD TABLE public.user_theme_customizations;
ALTER TABLE public.user_theme_customizations REPLICA IDENTITY FULL;

-- Add theme usage tracking
CREATE TABLE public.theme_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('applied', 'customized', 'shared', 'viewed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for analytics
ALTER TABLE public.theme_usage_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for analytics
CREATE POLICY "Users can view their own theme analytics"
ON public.theme_usage_analytics
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert theme analytics"
ON public.theme_usage_analytics
FOR INSERT
WITH CHECK (true);

-- Add realtime for analytics
ALTER publication supabase_realtime ADD TABLE public.theme_usage_analytics;
ALTER TABLE public.theme_usage_analytics REPLICA IDENTITY FULL;

-- Update profiles table to include current theme customization
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_theme_customization_id UUID REFERENCES public.user_theme_customizations(id);

-- Add realtime for profiles updates
ALTER publication supabase_realtime ADD TABLE public.profiles;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Create function to apply theme to profile
CREATE OR REPLACE FUNCTION public.apply_user_theme(
  p_theme_id UUID,
  p_custom_config JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  customization_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Insert or update theme customization
  INSERT INTO public.user_theme_customizations (user_id, theme_id, custom_config)
  VALUES (current_user_id, p_theme_id, p_custom_config)
  ON CONFLICT (user_id, theme_id)
  DO UPDATE SET 
    custom_config = p_custom_config,
    is_active = true,
    updated_at = now()
  RETURNING id INTO customization_id;

  -- Update profile to use this customization
  UPDATE public.profiles 
  SET 
    active_theme_customization_id = customization_id,
    theme_id = p_theme_id,
    updated_at = now()
  WHERE id = current_user_id;

  -- Track usage
  INSERT INTO public.theme_usage_analytics (user_id, theme_id, action, metadata)
  VALUES (current_user_id, p_theme_id, 'applied', jsonb_build_object('customization_id', customization_id));

  RETURN customization_id;
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_user_theme_customizations_updated_at
  BEFORE UPDATE ON public.user_theme_customizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();