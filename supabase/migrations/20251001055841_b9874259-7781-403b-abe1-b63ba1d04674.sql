-- CRITICAL SECURITY FIXES FOR PRODUCTION (Fixed)

-- 1. Fix profiles table - Remove public read access for PII
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view public profile info only" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view public profiles"
  ON public.profiles FOR SELECT
  USING (
    public_profile = true 
    AND auth.uid() IS NOT NULL
  );

-- 2. Fix contact_submissions RLS
DROP POLICY IF EXISTS "Anyone can insert contact submissions" ON public.contact_submissions;

CREATE POLICY "Authenticated users can insert contact submissions"
  ON public.contact_submissions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Add indexes for scalability (1M users)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON public.profiles(slug);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_contacted_user ON public.contact_submissions(contacted_user_id);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON public.contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON public.contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_user_id ON public.blog_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_faqs_user_id ON public.faqs(user_id);
CREATE INDEX IF NOT EXISTS idx_awards_user_id ON public.awards(user_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_user_id ON public.newsletter_subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_user_id ON public.newsletter_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_books_user_status ON public.books(user_id, status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_user_status ON public.blog_posts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_profiles_public_slug ON public.profiles(public_profile, slug) WHERE public_profile = true;