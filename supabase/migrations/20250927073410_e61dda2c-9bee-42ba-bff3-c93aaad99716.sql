-- Create home_page_sections table for storing dynamic sections
CREATE TABLE public.home_page_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.home_page_sections ENABLE ROW LEVEL SECURITY;

-- Create policies for home page sections
CREATE POLICY "Admins can manage home page sections" 
ON public.home_page_sections 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Home page sections are viewable by everyone" 
ON public.home_page_sections 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_home_page_sections_updated_at
BEFORE UPDATE ON public.home_page_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default sections
INSERT INTO public.home_page_sections (type, title, enabled, order_index, config) VALUES
('hero', 'Hero Section', true, 1, '{
  "title": "Welcome to NP Page",
  "subtitle": "Create professional author profiles, showcase your books, and grow your readership with our powerful platform.",
  "backgroundColor": "gradient-to-br from-primary/5 to-primary/10",
  "animation": "fade-in",
  "buttons": [
    {"text": "Start Your Journey", "url": "/auth", "variant": "primary"},
    {"text": "Learn More", "url": "#features", "variant": "secondary"}
  ]
}'),
('stats', 'Statistics Section', true, 2, '{
  "title": "Trusted by Authors Worldwide",
  "subtitle": "Join thousands of authors who have chosen NP Page",
  "backgroundColor": "muted/50",
  "animation": "slide-in-right",
  "items": [
    {"label": "Authors", "value": "1,000+", "icon": "users"},
    {"label": "Books Published", "value": "5,000+", "icon": "book"},
    {"label": "Page Views", "value": "100K+", "icon": "eye"},
    {"label": "Active Users", "value": "500+", "icon": "activity"}
  ]
}'),
('features', 'Features Section', true, 3, '{
  "title": "Everything You Need to Succeed",
  "subtitle": "Powerful features to help you build your author brand",
  "backgroundColor": "background",
  "animation": "fade-in",
  "items": [
    {
      "title": "Professional Profiles",
      "description": "Create stunning author profiles with bio, photos, and social links",
      "icon": "user",
      "color": "primary"
    },
    {
      "title": "Book Showcase",
      "description": "Display your books with covers, descriptions, and purchase links",
      "icon": "book",
      "color": "secondary"
    },
    {
      "title": "Analytics & Insights",
      "description": "Track your audience engagement and grow your readership",
      "icon": "chart",
      "color": "accent"
    }
  ]
}');