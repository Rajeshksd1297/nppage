-- Add missing owner_id column to publishers table if it doesn't exist
ALTER TABLE public.publishers 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create publisher_settings table for admin configuration
CREATE TABLE IF NOT EXISTS public.publisher_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allow_publisher_registration BOOLEAN DEFAULT true,
  default_revenue_share INTEGER DEFAULT 30,
  max_authors_per_publisher INTEGER DEFAULT 25,
  require_publisher_approval BOOLEAN DEFAULT false,
  publisher_subdomain_prefix TEXT DEFAULT 'pub',
  enable_custom_branding BOOLEAN DEFAULT true,
  enable_white_label BOOLEAN DEFAULT false,
  commission_percentage INTEGER DEFAULT 10,
  auto_payout_threshold DECIMAL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on publisher_settings if not already enabled
ALTER TABLE public.publisher_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for publisher_settings if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'publisher_settings' AND policyname = 'Admins can manage publisher settings') THEN
    CREATE POLICY "Admins can manage publisher settings" ON public.publisher_settings
      FOR ALL USING (has_role(auth.uid(), 'admin'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'publisher_settings' AND policyname = 'Everyone can view publisher settings') THEN
    CREATE POLICY "Everyone can view publisher settings" ON public.publisher_settings
      FOR SELECT USING (true);
  END IF;
END $$;

-- Create policies for publishers with owner_id if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'publishers' AND policyname = 'Publishers can manage their own profile') THEN
    CREATE POLICY "Publishers can manage their own profile" ON public.publishers
      FOR ALL USING (auth.uid() = owner_id);
  END IF;
END $$;