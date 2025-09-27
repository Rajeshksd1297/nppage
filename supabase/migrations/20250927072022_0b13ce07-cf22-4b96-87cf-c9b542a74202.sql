-- Create hero_blocks table for home page management
CREATE TABLE public.hero_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  preview_image_url TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.hero_blocks ENABLE ROW LEVEL SECURITY;

-- Create policies for hero blocks
CREATE POLICY "Admins can manage hero blocks" 
ON public.hero_blocks 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Hero blocks are viewable by everyone" 
ON public.hero_blocks 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_hero_blocks_updated_at
BEFORE UPDATE ON public.hero_blocks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();