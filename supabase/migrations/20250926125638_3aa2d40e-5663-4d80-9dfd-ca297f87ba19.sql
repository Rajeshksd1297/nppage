-- Create publishers table for white-label program
CREATE TABLE IF NOT EXISTS public.publishers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  brand_colors JSONB DEFAULT '{"primary": "#000000", "secondary": "#666666", "accent": "#0066cc"}'::jsonb,
  custom_css TEXT,
  contact_email TEXT NOT NULL,
  website_url TEXT,
  billing_address JSONB,
  revenue_share_percentage NUMERIC(5,2) DEFAULT 30.00,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create publisher_authors junction table
CREATE TABLE IF NOT EXISTS public.publisher_authors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  publisher_id UUID NOT NULL REFERENCES publishers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'author' CHECK (role IN ('author', 'editor', 'admin')),
  revenue_share_percentage NUMERIC(5,2) DEFAULT 70.00,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(publisher_id, user_id)
);

-- Create social_connections table for auto-posting
CREATE TABLE IF NOT EXISTS public.social_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'facebook', 'instagram')),
  platform_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  auto_post_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Create social_posts table to track auto-posts
CREATE TABLE IF NOT EXISTS public.social_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'facebook', 'instagram')),
  post_content TEXT NOT NULL,
  platform_post_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed', 'cancelled')),
  error_message TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  posted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create onix_jobs table for import/export tracking
CREATE TABLE IF NOT EXISTS public.onix_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  publisher_id UUID REFERENCES publishers(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('import', 'export')),
  filename TEXT NOT NULL,
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  successful_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  error_log JSONB DEFAULT '[]'::jsonb,
  result_data JSONB,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create billing_transactions table for revenue tracking
CREATE TABLE IF NOT EXISTS public.billing_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  publisher_id UUID REFERENCES publishers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('subscription', 'commission', 'refund', 'chargeback')),
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  stripe_transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add publisher_id to profiles for publisher association
DO $$ 
BEGIN
  BEGIN
    ALTER TABLE public.profiles ADD COLUMN publisher_id UUID REFERENCES publishers(id) ON DELETE SET NULL;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
END $$;

-- Enable RLS on all new tables
ALTER TABLE public.publishers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publisher_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onix_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for publishers
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'publishers' AND policyname = 'Admins can manage all publishers') THEN
    EXECUTE 'CREATE POLICY "Admins can manage all publishers" ON public.publishers FOR ALL USING (has_role(auth.uid(), ''admin''::app_role))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'publishers' AND policyname = 'Publishers are viewable by everyone') THEN
    EXECUTE 'CREATE POLICY "Publishers are viewable by everyone" ON public.publishers FOR SELECT USING (true)';
  END IF;
END $$;

-- Create RLS policies for publisher_authors
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'publisher_authors' AND policyname = 'Users can view their publisher associations') THEN
    EXECUTE 'CREATE POLICY "Users can view their publisher associations" ON public.publisher_authors FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), ''admin''::app_role))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'publisher_authors' AND policyname = 'Admins can manage publisher authors') THEN
    EXECUTE 'CREATE POLICY "Admins can manage publisher authors" ON public.publisher_authors FOR ALL USING (has_role(auth.uid(), ''admin''::app_role))';
  END IF;
END $$;

-- Create RLS policies for social_connections
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'social_connections' AND policyname = 'Users can manage their own social connections') THEN
    EXECUTE 'CREATE POLICY "Users can manage their own social connections" ON public.social_connections FOR ALL USING (auth.uid() = user_id)';
  END IF;
END $$;

-- Create RLS policies for social_posts
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'social_posts' AND policyname = 'Users can view their own social posts') THEN
    EXECUTE 'CREATE POLICY "Users can view their own social posts" ON public.social_posts FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), ''admin''::app_role))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'social_posts' AND policyname = 'System can manage social posts') THEN
    EXECUTE 'CREATE POLICY "System can manage social posts" ON public.social_posts FOR INSERT WITH CHECK (true)';
  END IF;
END $$;

-- Create RLS policies for onix_jobs
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'onix_jobs' AND policyname = 'Users can view their own ONIX jobs') THEN
    EXECUTE 'CREATE POLICY "Users can view their own ONIX jobs" ON public.onix_jobs FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), ''admin''::app_role))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'onix_jobs' AND policyname = 'Users can create their own ONIX jobs') THEN
    EXECUTE 'CREATE POLICY "Users can create their own ONIX jobs" ON public.onix_jobs FOR INSERT WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

-- Create RLS policies for billing_transactions
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'billing_transactions' AND policyname = 'Users can view their own transactions') THEN
    EXECUTE 'CREATE POLICY "Users can view their own transactions" ON public.billing_transactions FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), ''admin''::app_role))';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'billing_transactions' AND policyname = 'Admins can manage all transactions') THEN
    EXECUTE 'CREATE POLICY "Admins can manage all transactions" ON public.billing_transactions FOR ALL USING (has_role(auth.uid(), ''admin''::app_role))';
  END IF;
END $$;

-- Create triggers for updated_at columns
CREATE TRIGGER update_publishers_updated_at
BEFORE UPDATE ON public.publishers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_connections_updated_at
BEFORE UPDATE ON public.social_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_publishers_subdomain ON public.publishers(subdomain);
CREATE INDEX IF NOT EXISTS idx_publisher_authors_publisher_id ON public.publisher_authors(publisher_id);
CREATE INDEX IF NOT EXISTS idx_publisher_authors_user_id ON public.publisher_authors(user_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_user_id ON public.social_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_platform ON public.social_connections(platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON public.social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON public.social_posts(status);
CREATE INDEX IF NOT EXISTS idx_onix_jobs_user_id ON public.onix_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_onix_jobs_status ON public.onix_jobs(status);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_publisher_id ON public.billing_transactions(publisher_id);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_user_id ON public.billing_transactions(user_id);