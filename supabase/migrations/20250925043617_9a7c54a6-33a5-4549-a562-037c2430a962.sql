-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  max_books INTEGER,
  max_publications INTEGER,
  custom_domain BOOLEAN NOT NULL DEFAULT false,
  advanced_analytics BOOLEAN NOT NULL DEFAULT false,
  premium_themes BOOLEAN NOT NULL DEFAULT false,
  no_watermark BOOLEAN NOT NULL DEFAULT false,
  contact_form BOOLEAN NOT NULL DEFAULT false,
  newsletter_integration BOOLEAN NOT NULL DEFAULT false,
  media_kit BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trialing')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create custom domains table
CREATE TABLE public.custom_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  verified BOOLEAN NOT NULL DEFAULT false,
  dns_configured BOOLEAN NOT NULL DEFAULT false,
  ssl_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create themes table
CREATE TABLE public.themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  premium BOOLEAN NOT NULL DEFAULT false,
  preview_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Subscription plans are viewable by everyone" ON public.subscription_plans FOR SELECT USING (true);
CREATE POLICY "Admins can manage subscription plans" ON public.subscription_plans FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all subscriptions" ON public.user_subscriptions FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage their own domains" ON public.custom_domains FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all domains" ON public.custom_domains FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Themes are viewable by everyone" ON public.themes FOR SELECT USING (true);
CREATE POLICY "Admins can manage themes" ON public.themes FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_custom_domains_updated_at BEFORE UPDATE ON public.custom_domains FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_themes_updated_at BEFORE UPDATE ON public.themes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, price_monthly, price_yearly, features, max_books, max_publications, custom_domain, advanced_analytics, premium_themes, no_watermark, contact_form, newsletter_integration, media_kit) VALUES
('Free', 0, 0, '["1-2 books for authors", "5-10 publications for academics", "Standard subdomain", "Basic analytics (30 days)", "Powered by Namyapage watermark"]'::jsonb, 2, 10, false, false, false, false, false, false, false),
('Pro', 9.99, 99.99, '["Unlimited publications", "Custom domain support", "No watermark", "Premium themes", "Advanced analytics", "Contact form", "Newsletter integration", "Media kit page", "Exportable reports"]'::jsonb, -1, -1, true, true, true, true, true, true, true);

-- Insert default themes
INSERT INTO public.themes (name, description, config, premium, preview_image_url) VALUES
('Classic', 'Clean and professional theme', '{"primaryColor": "hsl(221, 39%, 11%)", "accentColor": "hsl(210, 40%, 98%)", "fontFamily": "Inter"}', false, null),
('Modern', 'Sleek modern design', '{"primaryColor": "hsl(222, 84%, 5%)", "accentColor": "hsl(210, 40%, 98%)", "fontFamily": "Inter"}', false, null),
('Academic', 'Traditional academic styling', '{"primaryColor": "hsl(215, 28%, 17%)", "accentColor": "hsl(210, 40%, 98%)", "fontFamily": "Georgia"}', false, null),
('Creative', 'Bold and artistic theme', '{"primaryColor": "hsl(262, 83%, 58%)", "accentColor": "hsl(210, 40%, 98%)", "fontFamily": "Inter"}', true, null),
('Minimalist Pro', 'Ultra-clean premium design', '{"primaryColor": "hsl(0, 0%, 9%)", "accentColor": "hsl(0, 0%, 98%)", "fontFamily": "Inter"}', true, null);

-- Add subscription fields to profiles
ALTER TABLE public.profiles ADD COLUMN subscription_plan_id UUID REFERENCES public.subscription_plans(id);
ALTER TABLE public.profiles ADD COLUMN theme_id UUID REFERENCES public.themes(id);
ALTER TABLE public.profiles ADD COLUMN custom_domain_id UUID REFERENCES public.custom_domains(id);

-- Update existing profiles to use free plan
UPDATE public.profiles SET subscription_plan_id = (SELECT id FROM public.subscription_plans WHERE name = 'Free' LIMIT 1);
UPDATE public.profiles SET theme_id = (SELECT id FROM public.themes WHERE name = 'Classic' LIMIT 1);