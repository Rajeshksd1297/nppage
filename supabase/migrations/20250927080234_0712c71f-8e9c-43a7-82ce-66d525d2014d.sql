-- Insert attractive home page sections for profile creation

-- Clear existing sections first
DELETE FROM home_page_sections;

-- Hero section encouraging profile creation
INSERT INTO home_page_sections (id, type, title, enabled, order_index, config) VALUES 
(
  gen_random_uuid(),
  'hero',
  'Create Your Author Profile',
  true,
  1,
  '{
    "title": "Turn Your Passion Into Your Platform",
    "subtitle": "Join thousands of authors who showcase their work with professional profiles. Create, connect, and grow your readership today.",
    "backgroundColor": "gradient-to-br from-primary/10 via-primary/5 to-accent/10",
    "animation": "fade-in",
    "size": "large",
    "alignment": "center",
    "padding": "extra",
    "textSize": "large",
    "borderRadius": "rounded",
    "shadow": "large",
    "customClasses": "relative overflow-hidden",
    "buttons": [
      {
        "text": "Create Your Profile",
        "url": "/auth",
        "variant": "primary"
      },
      {
        "text": "View Examples",
        "url": "#examples",
        "variant": "secondary"
      }
    ]
  }'
);

-- Live stats section
INSERT INTO home_page_sections (id, type, title, enabled, order_index, config) VALUES 
(
  gen_random_uuid(),
  'stats',
  'Join Our Growing Community',
  true,
  2,
  '{
    "title": "Join Our Growing Community",
    "subtitle": "Real numbers from real authors building their brands",
    "backgroundColor": "muted/30",
    "animation": "slide-in-right",
    "items": [
      {
        "icon": "users",
        "label": "Active Authors",
        "value": "dynamic_users",
        "color": "primary"
      },
      {
        "icon": "book",
        "label": "Books Showcased",
        "value": "dynamic_books",
        "color": "secondary"
      },
      {
        "icon": "eye", 
        "label": "Profile Views",
        "value": "dynamic_views",
        "color": "accent"
      },
      {
        "icon": "activity",
        "label": "Active This Month",
        "value": "dynamic_active",
        "color": "primary"
      }
    ]
  }'
);

-- Features section focused on profile benefits
INSERT INTO home_page_sections (id, type, title, enabled, order_index, config) VALUES 
(
  gen_random_uuid(),
  'features',
  'Why Authors Choose Our Platform',
  true,
  3,
  '{
    "title": "Why Authors Choose Our Platform",
    "subtitle": "Everything you need to build your author brand in one place",
    "backgroundColor": "gradient-to-br from-background via-muted/20 to-background",
    "animation": "fade-in",
    "items": [
      {
        "icon": "user",
        "title": "Professional Profiles",
        "description": "Create stunning author profiles with photos, bio, achievements, and social links. Sync all your data seamlessly.",
        "color": "primary"
      },
      {
        "icon": "book",
        "title": "Book Gallery",
        "description": "Showcase your entire catalog with covers, descriptions, reviews, and direct purchase links. All managed from your portal.",
        "color": "secondary"
      },
      {
        "icon": "chart",
        "title": "Real-time Analytics",
        "description": "Track visitor engagement, popular content, and audience insights. Data synced instantly across all platforms.",
        "color": "accent"
      },
      {
        "icon": "globe",
        "title": "Universal Sharing",
        "description": "One beautiful link for all your content. Perfect for social media, email signatures, and marketing campaigns.",
        "color": "primary"
      },
      {
        "icon": "palette",
        "title": "Custom Branding",
        "description": "Personalize your profile with themes, colors, and layouts that match your brand. All settings sync from your portal.",
        "color": "secondary"
      },
      {
        "icon": "rocket",
        "title": "SEO Optimized",
        "description": "Built for discovery with SEO best practices, meta tags, and search engine optimization built in.",
        "color": "accent"
      }
    ]
  }'
);

-- Call-to-action section
INSERT INTO home_page_sections (id, type, title, enabled, order_index, config) VALUES 
(
  gen_random_uuid(),
  'hero',
  'Ready to Get Started?',
  true,
  4,
  '{
    "title": "Ready to Showcase Your Work?",
    "subtitle": "Join our community of successful authors. Create your professional profile in minutes and start growing your audience today.",
    "backgroundColor": "primary/5",
    "animation": "scale-in",
    "size": "medium",
    "alignment": "center",
    "padding": "standard",
    "textSize": "medium",
    "borderRadius": "rounded",
    "shadow": "medium",
    "buttons": [
      {
        "text": "Start Free Today",
        "url": "/auth",
        "variant": "primary"
      },
      {
        "text": "Contact Support",
        "url": "/contact",
        "variant": "secondary"
      }
    ]
  }'
);