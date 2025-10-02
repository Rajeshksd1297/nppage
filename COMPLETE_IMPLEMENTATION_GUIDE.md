# Complete Author Platform Implementation Guide

## Project Overview
A comprehensive full-stack author platform with publisher management, subscription system, and advanced features for book authors and publishers.

---

## PHASE 1: Core Infrastructure & Authentication

### 1.1 Database Foundation
**Tables to create:**
```sql
-- User Roles (CRITICAL - Security Foundation)
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security Definer Function (Prevents RLS Recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- User Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT,
  full_name TEXT,
  slug TEXT UNIQUE NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  website TEXT,
  public_profile BOOLEAN DEFAULT true,
  theme_id UUID,
  active_theme_customization_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Profiles
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (public_profile = true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);
```

### 1.2 Authentication System
**Implementation:**
- Email/password authentication via Supabase Auth
- Auto-create profile on signup with trigger
- Auto-assign 'user' role on signup
- Generate unique slug from email prefix

```sql
-- Trigger for new user setup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_prefix TEXT;
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Generate unique slug
  email_prefix := split_part(NEW.email, '@', 1);
  base_slug := lower(regexp_replace(email_prefix, '[^a-z0-9]+', '-', 'g'));
  base_slug := trim(both '-' FROM base_slug);
  
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'user';
  END IF;
  
  final_slug := base_slug;
  
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  -- Create profile
  INSERT INTO public.profiles (user_id, email, full_name, slug, public_profile)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name', final_slug, true);
  
  -- Assign default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 1.3 Route Protection Components
**Files to create:**

**src/components/AdminAccessGuard.tsx**
- Checks if user has 'admin' role using `has_role` function
- Shows loading state while checking
- Shows "Access Denied" card if not admin
- Renders children if admin

**src/components/FeatureAccessGuard.tsx**
- Checks admin settings for feature enablement
- Checks moderator permissions for view access
- Shows loading/error states
- Renders children if access granted

**Key Points:**
- ❌ NO localStorage role checks
- ✅ Always use `supabase.rpc('get_current_user_role')`
- ✅ Always use database-backed role verification

---

## PHASE 2: Subscription System

### 2.1 Subscription Plans Table
```sql
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  price_yearly NUMERIC,
  is_active BOOLEAN DEFAULT true,
  is_publisher_plan BOOLEAN DEFAULT false,
  max_books INTEGER,
  max_publications INTEGER,
  premium_themes BOOLEAN DEFAULT false,
  custom_domain BOOLEAN DEFAULT false,
  priority_support BOOLEAN DEFAULT false,
  ai_seo_tools BOOLEAN DEFAULT false,
  advanced_analytics BOOLEAN DEFAULT false,
  features JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create 30-day trial for new users
CREATE OR REPLACE FUNCTION public.setup_user_trial()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pro_plan_id UUID;
BEGIN
  SELECT id INTO pro_plan_id 
  FROM subscription_plans 
  WHERE name = 'Pro' 
  LIMIT 1;
  
  IF pro_plan_id IS NOT NULL THEN
    INSERT INTO user_subscriptions (
      user_id, 
      plan_id, 
      status, 
      trial_ends_at,
      current_period_start,
      current_period_end
    ) VALUES (
      NEW.id,
      pro_plan_id,
      'trialing',
      NOW() + INTERVAL '30 days',
      NOW(),
      NOW() + INTERVAL '30 days'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_trial_setup
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.setup_user_trial();
```

### 2.2 Subscription Hook
**src/hooks/useSubscription.tsx**
- Fetches user subscription with plan details
- Real-time updates via Supabase channels
- Feature checking: `hasFeature(feature)`
- Plan checking: `isPro()`, `isFree()`, `isOnTrial()`
- Limit checking: `getLimit(feature)`

### 2.3 Feature Gating
**src/components/FeatureGate.tsx**
- Wraps premium features
- Shows upgrade prompt if no access
- Inline or card fallback modes

---

## PHASE 3: Core Content Management

### 3.1 Books Module
**Database:**
```sql
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  isbn TEXT,
  slug TEXT,
  status TEXT DEFAULT 'draft',
  cover_image_url TEXT,
  publication_date DATE,
  publisher TEXT,
  language TEXT DEFAULT 'en',
  page_count INTEGER,
  category TEXT,
  genres TEXT[] DEFAULT ARRAY[]::TEXT[],
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  purchase_links JSONB DEFAULT '[]'::jsonb,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own books"
ON public.books FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Published books are public"
ON public.books FOR SELECT
USING (status = 'published');
```

**Admin Pages:**
- `/admin/books-management` - List all books
- `/admin/book-field-settings` - Configure book fields
- `/admin/isbn-lookup` - ISBN lookup tool

**User Pages:**
- `/books` - User's book list
- `/book-entry-method` - Choose manual/ISBN entry
- `/book-edit/:id` - Edit book
- `/book-view/:id` - View book details

### 3.2 Blog Module
**Database:**
```sql
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  status TEXT DEFAULT 'draft',
  category TEXT DEFAULT 'General',
  tags TEXT[] DEFAULT '{}'::TEXT[],
  featured BOOLEAN DEFAULT false,
  meta_title TEXT,
  meta_description TEXT,
  word_count INTEGER DEFAULT 0,
  reading_time INTEGER DEFAULT 1,
  published_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-calculate word count and reading time
CREATE OR REPLACE FUNCTION public.update_blog_post_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.word_count = array_length(
    string_to_array(
      regexp_replace(NEW.content, '<[^>]*>', '', 'g'), 
      ' '
    ), 
    1
  );
  NEW.reading_time = GREATEST(1, ROUND(NEW.word_count::numeric / 200));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_blog_post_update
BEFORE INSERT OR UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.update_blog_post_stats();
```

**Admin Pages:**
- `/admin/blog-management` - Manage all blog posts
- `/admin/blog-settings` - Configure blog settings

**User Pages:**
- `/user-blog-management` - User's blog posts
- `/user-blog-create` - Create new post
- `/user-blog-edit/:id` - Edit post

### 3.3 Events Module
**Database:**
```sql
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  meeting_link TEXT,
  is_virtual BOOLEAN DEFAULT false,
  event_type TEXT DEFAULT 'general',
  status TEXT DEFAULT 'upcoming',
  featured_image_url TEXT,
  registration_required BOOLEAN DEFAULT false,
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Admin Pages:**
- `/admin/events-management` - Manage all events
- `/admin/event-settings` - Configure event settings

**User Pages:**
- `/user-events-management` - User's events
- `/user-event-create` - Create event
- `/user-event-edit/:id` - Edit event

### 3.4 Awards Module
**Database:**
```sql
CREATE TABLE public.awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  organization TEXT,
  award_date DATE,
  category TEXT,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  award_image_url TEXT,
  certificate_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.5 FAQ Module
**Database:**
```sql
CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.6 Newsletter Module
**Database:**
```sql
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  status TEXT DEFAULT 'active',
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}'::TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, email)
);

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_newsletter_subscriber()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RAISE EXCEPTION 'Email address is required';
  END IF;
  
  IF NOT NEW.email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email address format';
  END IF;
  
  IF TG_OP = 'INSERT' AND NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot create subscriber for another user';
  END IF;
  
  RETURN NEW;
END;
$$;
```

---

## PHASE 4: Publisher System

### 4.1 Publisher Structure
**Database:**
```sql
CREATE TABLE public.publishers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  founded_year INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.publisher_authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id UUID REFERENCES public.publishers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'author',
  joined_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(publisher_id, user_id)
);

CREATE TABLE public.publisher_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id UUID REFERENCES public.publishers(id) ON DELETE CASCADE UNIQUE NOT NULL,
  primary_color TEXT,
  secondary_color TEXT,
  logo_url TEXT,
  banner_url TEXT,
  custom_css TEXT,
  theme_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Admin Pages:**
- `/admin/publisher-management` - Manage publishers
- `/admin/publisher-user-assignment` - Assign users to publishers
- `/admin/publisher-field-edit` - Configure publisher fields

**User Pages (Publisher Access):**
- `/publisher-dashboard` - Publisher dashboard
- `/publisher-settings` - Publisher settings
- `/publisher-profile-editor` - Edit publisher profile
- `/publisher-author-management` - Manage authors
- `/publisher-branding` - Branding settings
- `/publisher-public/:slug` - Public publisher page

---

## PHASE 5: Contact & Communication

### 5.1 Contact Form System
**Database:**
```sql
CREATE TABLE public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  priority TEXT DEFAULT 'medium',
  source TEXT DEFAULT 'contact_form',
  contacted_user_id UUID,
  submitted_by UUID,
  assigned_to UUID,
  user_ip INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  replied_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.contact_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_submission_id UUID REFERENCES public.contact_submissions(id) ON DELETE CASCADE NOT NULL,
  replied_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reply_message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.admin_contact_form_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  max_submissions_per_hour INTEGER DEFAULT 5,
  max_message_length INTEGER DEFAULT 2000,
  required_fields JSONB DEFAULT '["name", "email", "message"]'::jsonb,
  enable_honeypot BOOLEAN DEFAULT true,
  auto_moderation BOOLEAN DEFAULT true,
  blocked_domains JSONB DEFAULT '[]'::jsonb,
  allow_attachments BOOLEAN DEFAULT false,
  max_attachment_size_mb INTEGER DEFAULT 5,
  retention_days INTEGER DEFAULT 365,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Pages:**
- `/admin/contact-management` - Admin view of all submissions
- `/user-contact-management` - User's received messages
- `/contact-submission-detail/:id` - View submission details
- `/contact-form-settings` - User contact form settings
- `/admin/contact-form-settings` - Global contact settings

**Components:**
- `ContactFormSecure.tsx` - Secure contact form with validation
- `ContactFormWidget.tsx` - Embeddable contact widget

### 5.2 Email Edge Functions (TO BE CREATED)
**Required Edge Functions:**

**supabase/functions/send-contact-email/index.ts**
```typescript
import { Resend } from 'npm:resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

// Handle contact form submissions
// - Validate input
// - Store in database
// - Send email to contacted user
// - Send auto-reply to submitter
```

**supabase/functions/send-reply-email/index.ts**
```typescript
// Handle reply to contact submission
// - Fetch submission details
// - Fetch admin/user details
// - Send reply email via Resend
```

**supabase/functions/send-newsletter/index.ts**
```typescript
// Send newsletter to subscribers
// - Fetch user's newsletter settings
// - Validate Resend configuration
// - Send to all active subscribers
// - Log results
```

**supabase/functions/send-auth-email/index.ts**
```typescript
// Send authentication emails
// - Signup confirmation
// - Password recovery
// - Magic link
// - Email change confirmation
```

---

## PHASE 6: Theme System

### 6.1 Theme Architecture
**Database:**
```sql
CREATE TABLE public.themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  preview_image_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_theme_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  theme_id UUID REFERENCES public.themes(id) ON DELETE CASCADE NOT NULL,
  custom_config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, theme_id)
);

CREATE TABLE public.theme_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  theme_id UUID REFERENCES public.themes(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Function to apply theme
CREATE OR REPLACE FUNCTION public.apply_user_theme(
  p_theme_id UUID,
  p_custom_config JSONB DEFAULT '{}'::jsonb
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

  INSERT INTO public.user_theme_customizations (user_id, theme_id, custom_config)
  VALUES (current_user_id, p_theme_id, p_custom_config)
  ON CONFLICT (user_id, theme_id)
  DO UPDATE SET 
    custom_config = p_custom_config,
    is_active = true,
    updated_at = now()
  RETURNING id INTO customization_id;

  UPDATE public.profiles 
  SET 
    active_theme_customization_id = customization_id,
    theme_id = p_theme_id,
    updated_at = now()
  WHERE user_id = current_user_id;

  INSERT INTO public.theme_usage_analytics (user_id, theme_id, action, metadata)
  VALUES (current_user_id, p_theme_id, 'applied', jsonb_build_object('customization_id', customization_id));

  RETURN customization_id;
END;
$$;
```

**Admin Pages:**
- `/admin/theme-management` - Manage all themes
- `/themes` - User theme selection

**Hooks:**
- `useUserThemes.tsx` - Fetch user themes
- `useRealtimeThemes.tsx` - Real-time theme updates
- `useProfileThemeSync.tsx` - Sync theme with profile

---

## PHASE 7: Dynamic Homepage & Page Editor

### 7.1 Homepage System
**Database:**
```sql
CREATE TABLE public.home_page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.hero_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  preview_image_url TEXT,
  enabled BOOLEAN DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.additional_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT DEFAULT ''::text,
  meta_title TEXT,
  meta_description TEXT,
  show_in_footer BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Admin Pages:**
- `/admin/home-page-management` - Manage homepage sections
- `/admin/home-page-editor` - Visual homepage editor

**Components:**
- `DynamicHomePage.tsx` - Render dynamic homepage
- `DynamicSection.tsx` - Render section types
- `DynamicHeroBlock.tsx` - Render hero block
- `SectionRenderer.tsx` - Section type renderer
- `HeroBlockManager.tsx` - Manage hero blocks

### 7.2 Header & Footer Management
**Database:**
```sql
CREATE TABLE public.header_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url TEXT,
  site_name TEXT,
  navigation_items JSONB DEFAULT '[]'::jsonb,
  show_search BOOLEAN DEFAULT false,
  show_social_links BOOLEAN DEFAULT true,
  social_links JSONB DEFAULT '{}'::jsonb,
  sticky BOOLEAN DEFAULT true,
  background_color TEXT,
  text_color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.footer_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  columns JSONB DEFAULT '[]'::jsonb,
  show_social_links BOOLEAN DEFAULT true,
  social_links JSONB DEFAULT '{}'::jsonb,
  copyright_text TEXT,
  background_color TEXT,
  text_color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Components:**
- `DynamicHeader.tsx` - Dynamic header
- `DynamicFooter.tsx` - Dynamic footer
- `HeaderEditor.tsx` - Edit header settings
- `FooterEditor.tsx` - Edit footer settings
- `HeaderEditorVisual.tsx` - Visual header editor
- `FooterEditorVisual.tsx` - Visual footer editor

---

## PHASE 8: SEO System

### 8.1 SEO Infrastructure
**Database:**
```sql
CREATE TABLE public.global_seo_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_title TEXT,
  site_description TEXT,
  site_keywords TEXT,
  default_og_image TEXT,
  twitter_handle TEXT,
  facebook_app_id TEXT,
  google_site_verification TEXT,
  bing_site_verification TEXT,
  enable_schema BOOLEAN DEFAULT true,
  enable_sitemap BOOLEAN DEFAULT true,
  enable_robots BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Admin Pages:**
- `/admin/seo-settings` - Global SEO settings

**Components:**
- `SEOHead.tsx` - Dynamic SEO meta tags
- `SEOEditor.tsx` - Edit page SEO
- `SEOPreview.tsx` - Preview SEO appearance
- `SEOAnalyzer.tsx` - Analyze SEO score
- `AISEOAssistant.tsx` - AI-powered SEO suggestions
- `SchemaGenerator.tsx` - Generate structured data

### 8.2 AI SEO Edge Functions (TO BE CREATED)
**supabase/functions/ai-seo-suggestions/index.ts**
```typescript
// Generate SEO suggestions using AI
// - Analyze content
// - Generate optimized title, description, keywords
// - Provide improvement recommendations
```

**supabase/functions/ai-seo-suggestions-multi/index.ts**
```typescript
// Batch AI SEO suggestions for multiple pages
```

---

## PHASE 9: Analytics & Monitoring

### 9.1 Analytics System
**Database:**
```sql
CREATE TABLE public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL,
  user_id UUID,
  session_id TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.book_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  user_id UUID,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Admin Pages:**
- `/admin/book-analytics` - Book analytics dashboard
- `/advanced-analytics` - Advanced analytics

**User Pages:**
- `/analytics` - User analytics dashboard

**Hooks:**
- `useAnalytics.tsx` - Track analytics events

### 9.2 Support Ticket System
**Database:**
```sql
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  category TEXT,
  assigned_to UUID,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ticket_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-track status changes
CREATE OR REPLACE FUNCTION public.create_ticket_status_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO public.ticket_status_history (
      ticket_id,
      old_status,
      new_status,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid()
    );
  END IF;
  
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = now();
  END IF;
  
  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    NEW.closed_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_ticket_status_change
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.create_ticket_status_history();
```

**Admin Pages:**
- `/admin/help-desk` - View all tickets
- `/admin/ticket-details/:id` - Ticket details
- `/admin/help-desk-settings` - Helpdesk settings

**User Pages:**
- `/support-tickets` - User's tickets

---

## PHASE 10: Cookie Consent System

### 10.1 Cookie Management
**Database:**
```sql
CREATE TABLE public.cookie_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_banner BOOLEAN DEFAULT true,
  theme TEXT DEFAULT 'default',
  banner_position TEXT DEFAULT 'bottom',
  consent_mode TEXT DEFAULT 'opt-in',
  banner_title TEXT DEFAULT 'Cookie Consent',
  banner_message TEXT DEFAULT 'We use cookies to enhance your browsing experience.',
  accept_all_button_text TEXT DEFAULT 'Accept All',
  reject_all_button_text TEXT DEFAULT 'Reject All',
  settings_button_text TEXT DEFAULT 'Cookie Settings',
  save_preferences_text TEXT DEFAULT 'Save Preferences',
  privacy_policy_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  auto_hide_after INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.cookie_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  is_required BOOLEAN DEFAULT false,
  is_enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.cookie_consent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id TEXT,
  consent_action TEXT NOT NULL,
  accepted_categories JSONB DEFAULT '[]'::jsonb,
  rejected_categories JSONB DEFAULT '[]'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Admin Pages:**
- `/admin/cookie-consent-settings` - Cookie settings

**User Pages:**
- `/cookie-consent-settings` - User cookie preferences

**Components:**
- `CookieConsentBanner.tsx` - Cookie consent banner
- `EnhancedCookieManagement.tsx` - Advanced cookie management

---

## PHASE 11: Deployment & Backup

### 11.1 AWS Deployment
**Database:**
```sql
CREATE TABLE public.aws_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aws_access_key_id TEXT,
  aws_secret_access_key TEXT,
  default_region TEXT DEFAULT 'ap-south-1',
  instance_type TEXT DEFAULT 't2.micro',
  ami_id TEXT,
  key_pair_name TEXT,
  security_group_id TEXT,
  subnet_id TEXT,
  auto_deploy_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.aws_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  deployment_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  region TEXT DEFAULT 'us-east-1',
  ec2_instance_id TEXT,
  ec2_public_ip TEXT,
  deployment_log TEXT,
  last_deployed_at TIMESTAMPTZ,
  auto_deploy BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Admin Pages:**
- `/admin/aws-deployment` - AWS deployment dashboard

**Edge Functions (EXIST):**
- `aws-deploy` - Deploy to AWS EC2
- `aws-instance-status` - Check instance status
- `aws-unblock-http` - Unblock HTTP ports
- `aws-instance-details` - Get instance details (TO BE CREATED)

### 11.2 GoDaddy Deployment
**Database:**
```sql
CREATE TABLE public.godaddy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domain TEXT NOT NULL,
  ftp_host TEXT NOT NULL,
  ftp_username TEXT NOT NULL,
  ftp_password TEXT NOT NULL,
  ftp_port INTEGER DEFAULT 21,
  deployment_path TEXT DEFAULT '/public_html',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.godaddy_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  deployment_name TEXT NOT NULL,
  domain TEXT,
  status TEXT DEFAULT 'pending',
  build_log TEXT,
  deployment_log TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Admin Pages:**
- `/admin/godaddy-deployment` - GoDaddy deployment
- `/admin/godaddy-settings` - GoDaddy settings

**Edge Functions (TO BE CREATED):**
- `godaddy-deploy` - Deploy to GoDaddy via FTP

### 11.3 Backup System
**Database:**
```sql
CREATE TABLE public.backup_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN DEFAULT true,
  frequency TEXT DEFAULT 'daily',
  custom_schedule TEXT,
  retention_days INTEGER DEFAULT 30,
  backup_types JSONB DEFAULT '["database", "files"]'::jsonb,
  storage_locations JSONB DEFAULT '["server", "cloud"]'::jsonb,
  encryption_enabled BOOLEAN DEFAULT true,
  compression_enabled BOOLEAN DEFAULT true,
  versioning_enabled BOOLEAN DEFAULT true,
  max_versions INTEGER DEFAULT 10,
  auto_cleanup_enabled BOOLEAN DEFAULT true,
  last_backup_at TIMESTAMPTZ,
  next_backup_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.backup_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  file_path TEXT,
  file_size BIGINT,
  checksum TEXT,
  error_message TEXT,
  backup_duration INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
```

**Admin Pages:**
- `/admin/backup-security-center` - Backup management

**Edge Functions (TO BE CREATED):**
- `backup-manager` - Handle backups
- `security-monitor` - Monitor security

---

## PHASE 12: Moderator System

### 12.1 Moderator Permissions
**Database:**
```sql
CREATE TABLE public.moderator_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature TEXT NOT NULL,
  can_view BOOLEAN DEFAULT true,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_approve BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, feature)
);

-- Check moderator permission
CREATE OR REPLACE FUNCTION public.has_moderator_permission(
  _user_id UUID,
  _feature TEXT,
  _permission TEXT
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE _permission
    WHEN 'view' THEN can_view
    WHEN 'create' THEN can_create
    WHEN 'edit' THEN can_edit
    WHEN 'delete' THEN can_delete
    WHEN 'approve' THEN can_approve
    ELSE false
  END
  FROM public.moderator_permissions
  WHERE user_id = _user_id AND feature = _feature
  LIMIT 1
$$;
```

**Admin Pages:**
- `/admin/role-management` - Manage user roles and moderator permissions

**Hooks:**
- `useModeratorPermissions.tsx` - Check moderator permissions

---

## PHASE 13: User Management

### 13.1 Admin User Management
**Admin Pages:**
- `/admin/users` - List all users
- `/admin/user-edit/:id` - Edit user details

**Components:**
- `UserManagement/UserFilters.tsx` - Filter users
- `UserManagement/SortableTable.tsx` - Sortable user table
- `UserManagement/UserActions.tsx` - User action buttons
- `UserManagement/UserEditDialog.tsx` - Edit user dialog
- `UserManagement/UserProfileDialog.tsx` - View user profile
- `UserManagement/UserPublisherAssignment.tsx` - Assign to publisher

---

## PHASE 14: Profile System

### 14.1 User Profile Pages
**Pages:**
- `/profile-settings` - User profile settings
- `/author-profile/:slug` - Public author profile

**Components:**
- `ProfileBasicInfo.tsx` - Edit basic info
- `ProfileSocialLinks.tsx` - Edit social links
- `ProfileSEOSettings.tsx` - Edit SEO settings
- `ProfileThemeSettings.tsx` - Theme settings
- `UserThemeCustomizer.tsx` - Customize theme
- `DragDropProfileDesigner.tsx` - Drag-drop profile builder

---

## CRITICAL IMPLEMENTATION RULES

### 🔒 Security Rules (NON-NEGOTIABLE)

1. **Role-Based Access Control**
   - ❌ NEVER use localStorage for role checks
   - ❌ NEVER hardcode admin credentials
   - ✅ ALWAYS use database-backed `has_role()` function
   - ✅ ALWAYS use RLS policies for data access
   - ✅ ALWAYS use `SECURITY DEFINER` functions to prevent RLS recursion

2. **Input Validation**
   - ✅ Validate all user inputs server-side
   - ✅ Use triggers for complex validation
   - ✅ Sanitize all HTML content
   - ✅ Use parameterized queries (Supabase client handles this)

3. **Authentication**
   - ✅ Use Supabase Auth exclusively
   - ✅ Check `auth.uid()` in RLS policies
   - ✅ Never expose service role keys client-side
   - ✅ Use proper password requirements

### 🚫 UI/UX Rules (NON-NEGOTIABLE)

1. **No Pop-ups**
   - ❌ NO modal dialogs for confirmations
   - ❌ NO alert() or confirm() dialogs
   - ✅ Use inline notifications (toasts)
   - ✅ Use inline forms
   - ✅ Use sheets/drawers for forms if needed

2. **Toast Notifications**
   - ✅ Success: Green toast, brief message
   - ✅ Error: Red toast with clear error message
   - ✅ Info: Blue toast for informational messages
   - ✅ Warning: Yellow toast for warnings

3. **Loading States**
   - ✅ Show skeleton loaders for content
   - ✅ Show spinner for actions
   - ✅ Disable buttons during actions
   - ✅ Show progress for long operations

### 📦 Module Separation Rules

1. **Admin vs User Separation**
   - Admin pages in `/admin/*` routes
   - User pages in `/` routes
   - Shared components in `/components/*`
   - Admin components in `/components/admin/*`

2. **Feature Modules**
   - Each feature has its own database tables
   - Each feature has its own settings table
   - Each feature has its own admin and user pages
   - Each feature is independently toggleable

3. **Component Organization**
   ```
   src/
   ├── components/
   │   ├── admin/           # Admin-only components
   │   ├── forms/           # Form components
   │   ├── layout/          # Layout components
   │   ├── profile/         # Profile components
   │   ├── publisher/       # Publisher components
   │   ├── sections/        # Homepage sections
   │   ├── seo/             # SEO components
   │   ├── social/          # Social components
   │   └── ui/              # shadcn UI components
   ├── hooks/               # Custom hooks
   ├── pages/               # User pages
   │   └── admin/           # Admin pages
   └── utils/               # Utility functions
   ```

### 🔄 Real-time Sync Rules

1. **Supabase Real-time**
   - ✅ Use `.on('postgres_changes')` for table updates
   - ✅ Subscribe in useEffect hooks
   - ✅ Unsubscribe on component unmount
   - ✅ Handle reconnection gracefully

2. **State Management**
   - ✅ Use React Query for server state
   - ✅ Use local state for UI state
   - ✅ Sync critical data with database
   - ✅ Optimistic updates for better UX

### 📧 Email System Rules

1. **Edge Functions**
   - ✅ Use Resend for email sending
   - ✅ Store email settings per user
   - ✅ Handle rate limiting
   - ✅ Log all email attempts

2. **Email Templates**
   - ✅ Use plain HTML templates
   - ✅ Include unsubscribe links
   - ✅ Mobile-responsive design
   - ✅ Clear subject lines

### 🎨 Theme System Rules

1. **Theme Structure**
   - ✅ Store theme config in JSONB
   - ✅ Allow user customization
   - ✅ Real-time theme updates
   - ✅ Preview before applying

2. **CSS Variables**
   - ✅ Use CSS custom properties
   - ✅ Support light/dark modes
   - ✅ Allow per-component overrides

### 📊 Analytics Rules

1. **Privacy**
   - ✅ Anonymous tracking by default
   - ✅ No PII in analytics
   - ✅ User opt-out support
   - ✅ GDPR compliant

2. **Data Collection**
   - ✅ Page views
   - ✅ User actions
   - ✅ Performance metrics
   - ✅ Error tracking

### 🚀 Performance Rules

1. **Database Queries**
   - ✅ Use proper indexes
   - ✅ Limit result sets
   - ✅ Use pagination
   - ✅ Cache frequently accessed data

2. **Frontend Performance**
   - ✅ Lazy load routes
   - ✅ Code splitting
   - ✅ Image optimization
   - ✅ Debounce user inputs

---

## DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All database migrations applied
- [ ] All RLS policies enabled
- [ ] All edge functions deployed
- [ ] Environment variables set
- [ ] Email service configured (Resend)
- [ ] Storage buckets created
- [ ] Default admin user created
- [ ] Default subscription plans created
- [ ] Default themes created

### Post-Deployment
- [ ] Test authentication flow
- [ ] Test admin access
- [ ] Test user access
- [ ] Test publisher access
- [ ] Test email sending
- [ ] Test payment processing (if Stripe enabled)
- [ ] Test file uploads
- [ ] Test real-time updates
- [ ] Test analytics tracking
- [ ] Test backup system

### Security Audit
- [ ] All tables have RLS enabled
- [ ] No service role keys exposed
- [ ] Input validation in place
- [ ] Rate limiting configured
- [ ] Error messages don't leak sensitive info
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] API keys stored securely

---

## KNOWN ISSUES & SOLUTIONS

### Issue: RLS Recursion Error
**Solution:** Always use `SECURITY DEFINER` functions with `set search_path = public`

### Issue: Slow Queries
**Solution:** Add indexes on frequently queried columns

### Issue: Email Not Sending
**Solution:** 
1. Check Resend API key is set
2. Verify domain is validated in Resend
3. Check edge function logs

### Issue: Theme Not Updating
**Solution:** Clear browser cache, check real-time subscription

### Issue: Role Check Failing
**Solution:** Verify `user_roles` table has entry, check `has_role()` function

---

## MAINTENANCE TASKS

### Daily
- Monitor error logs
- Check backup status
- Review support tickets

### Weekly
- Review analytics
- Check storage usage
- Review performance metrics
- Update content moderation

### Monthly
- Database maintenance
- Security audit
- User feedback review
- Feature usage analysis

---

## FUTURE ENHANCEMENTS

### Phase 15: Advanced Features
- [ ] Multi-language support
- [ ] Advanced search with filters
- [ ] User recommendations
- [ ] Social media integration
- [ ] Mobile app
- [ ] API for third-party integrations
- [ ] White-label options
- [ ] Advanced reporting
- [ ] A/B testing
- [ ] Marketing automation

### Phase 16: AI Features
- [ ] AI content generation
- [ ] AI image generation
- [ ] AI-powered recommendations
- [ ] AI chatbot support
- [ ] AI content moderation
- [ ] AI SEO optimization

---

## SUPPORT & DOCUMENTATION

### For Users
- User guide for authors
- User guide for publishers
- FAQ section
- Video tutorials
- Support ticket system

### For Developers
- API documentation
- Database schema documentation
- Component documentation
- Hook documentation
- Edge function documentation

---

## CREDITS & ACKNOWLEDGMENTS

This platform is built using:
- **Supabase** - Backend and authentication
- **React** - Frontend framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Resend** - Email service
- **Stripe** - Payment processing (optional)

---

## VERSION HISTORY

### v1.0.0 - Initial Release
- Complete author platform
- Publisher management
- Subscription system
- All core modules implemented

---

## CONTACT

For issues, questions, or contributions:
- GitHub: [Your Repository]
- Email: [Your Email]
- Discord: [Your Discord Server]

---

**END OF IMPLEMENTATION GUIDE**

*This guide should be used as a knowledge base for rebuilding or extending the platform. Follow phases sequentially for best results.*
