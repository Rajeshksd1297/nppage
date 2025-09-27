-- Update home page sections to prominently feature FREE plan alongside Pro trial

-- Update Hero section to emphasize free option
UPDATE home_page_sections 
SET config = '{
  "title": "Your Author Success Story Starts Here",
  "subtitle": "Join 15,000+ authors who transformed their careers with our platform. Start FREE today or try Pro for 30 days - no credit card required!",
  "backgroundColor": "gradient-to-br from-primary/15 via-accent/10 to-secondary/15",
  "animation": "fade-in",
  "size": "extra-large",
  "alignment": "center",
  "padding": "extra",
  "textSize": "large",
  "borderRadius": "rounded-xl",
  "shadow": "extra-large",
  "customClasses": "relative overflow-hidden",
  "interactive": true,
  "premiumImage": "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=1200&h=800&fit=crop",
  "trustSignals": [
    "✓ 15,000+ successful authors",
    "✓ Start 100% FREE forever",
    "✓ No credit card required",
    "✓ Upgrade anytime"
  ],
  "features": [
    {
      "icon": "check",
      "title": "Free Forever Plan",
      "description": "Professional profiles at no cost"
    },
    {
      "icon": "crown",
      "title": "30-Day Pro Trial",
      "description": "Try premium features free"
    },
    {
      "icon": "zap",
      "title": "Instant Setup",
      "description": "Profile ready in 2 minutes"
    }
  ],
  "buttons": [
    {
      "text": "Start FREE Now",
      "url": "/auth",
      "variant": "primary",
      "effect": "glow",
      "size": "extra-large"
    },
    {
      "text": "Try Pro FREE for 30 Days",
      "url": "/auth?plan=pro-trial",
      "variant": "secondary",
      "effect": "hover-lift"
    }
  ]
}'
WHERE type = 'interactive_hero';

-- Add Free vs Pro comparison section
INSERT INTO home_page_sections (id, type, title, enabled, order_index, config) VALUES 
(
  gen_random_uuid(),
  'free_vs_pro',
  'Start Free or Go Pro',
  true,
  2,
  '{
    "title": "Choose Your Author Journey",
    "subtitle": "Start with our powerful free plan, or unlock everything with Pro. No pressure, no credit card required.",
    "backgroundColor": "gradient-to-br from-background via-muted/5 to-background",
    "animation": "fade-in",
    "comparison": true,
    "plans": [
      {
        "id": "free",
        "name": "Free Plan",
        "price": 0,
        "period": "forever",
        "description": "Perfect for getting started - build your professional presence",
        "image": "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&h=300&fit=crop",
        "popular": false,
        "features": [
          "Professional author profile",
          "Up to 5 books showcase",
          "Basic themes & layouts",
          "Social media links",
          "Contact form",
          "Basic analytics",
          "Mobile responsive design"
        ],
        "ctaText": "Start Free Now",
        "ctaUrl": "/auth",
        "highlight": "100% Free Forever"
      },
      {
        "id": "pro-trial",
        "name": "Pro Trial",
        "price": 0,
        "period": "30 days",
        "description": "Experience everything Pro offers - upgrade the free way",
        "image": "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&h=300&fit=crop",
        "popular": true,
        "features": [
          "Everything in Free, PLUS:",
          "Unlimited books showcase",
          "Custom domain (yourname.com)",
          "50+ premium themes",
          "Advanced analytics & insights",
          "No watermark/branding",
          "Newsletter integration",
          "Priority support",
          "Media kit generator"
        ],
        "ctaText": "Try Pro FREE for 30 Days",
        "ctaUrl": "/auth?plan=pro-trial",
        "highlight": "Then $19.99/month"
      }
    ]
  }'
);

-- Update Premium Showcase to include Free features
UPDATE home_page_sections 
SET config = '{
  "title": "Free Features vs Pro Features",
  "subtitle": "See what you get for free, and what premium features can unlock for your author career",
  "backgroundColor": "gradient-to-br from-background via-muted/10 to-background",
  "animation": "slide-in-right",
  "interactive": true,
  "gallery": true,
  "showFreePlan": true,
  "items": [
    {
      "id": "basic-profile",
      "icon": "user",
      "title": "Professional Profile",
      "description": "Beautiful author profile with bio, photo, and social links",
      "image": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop",
      "premium": false,
      "freeFeature": true,
      "features": ["Professional bio section", "Author photo display", "Social media integration"],
      "color": "primary"
    },
    {
      "id": "basic-books",
      "icon": "book",
      "title": "Book Showcase (5 Books)",
      "description": "Display up to 5 of your books with covers and descriptions",
      "image": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=400&fit=crop",
      "premium": false,
      "freeFeature": true,
      "features": ["Book covers display", "Descriptions & details", "Purchase links"],
      "color": "secondary"
    },
    {
      "id": "unlimited-books",
      "icon": "book",
      "title": "Unlimited Books",
      "description": "Showcase your entire catalog with unlimited book listings",
      "image": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=400&fit=crop",
      "premium": true,
      "proFeature": true,
      "features": ["Unlimited book uploads", "Rich book pages", "Advanced book management"],
      "color": "primary"
    },
    {
      "id": "custom-domain",
      "icon": "globe",
      "title": "Custom Domain",
      "description": "Professional branded URLs like yourname.com",
      "image": "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop",
      "premium": true,
      "proFeature": true,
      "features": ["Professional URLs", "Brand recognition", "SEO benefits"],
      "color": "secondary"
    },
    {
      "id": "advanced-analytics",
      "icon": "chart",
      "title": "Advanced Analytics",
      "description": "Deep insights into reader behavior and conversion metrics",
      "image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
      "premium": true,
      "proFeature": true,
      "features": ["Reader insights", "Traffic analytics", "Conversion tracking"],
      "color": "accent"
    },
    {
      "id": "premium-themes",
      "icon": "palette",
      "title": "Premium Themes",
      "description": "50+ designer themes vs 5 basic themes in free plan",
      "image": "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=600&h=400&fit=crop",
      "premium": true,
      "proFeature": true,
      "features": ["50+ premium designs", "Advanced customization", "Professional layouts"],
      "color": "primary"
    }
  ]
}'
WHERE type = 'premium_showcase';

-- Add Free Plan Success Stories section
INSERT INTO home_page_sections (id, type, title, enabled, order_index, config) VALUES 
(
  gen_random_uuid(),
  'free_success',
  'Free Plan Success Stories',
  true,
  3,
  '{
    "title": "Authors Who Started Free & Succeeded",
    "subtitle": "See how authors built their careers starting with our free plan - you can too!",
    "backgroundColor": "gradient-to-br from-green-50/50 via-background to-green-50/30",
    "animation": "fade-in",
    "stories": [
      {
        "name": "Lisa Thompson",
        "genre": "Mystery Author",
        "image": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop",
        "achievement": "First Book Deal from Free Profile",
        "quote": "I started with the free plan just to test it out. Within 3 months, a publisher found my profile and offered me a book deal!",
        "plan": "Started Free",
        "timeline": "3 months",
        "result": "Traditional publishing contract"
      },
      {
        "name": "David Kim",
        "genre": "Self-Help Author",
        "image": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
        "achievement": "Built 5K Following on Free Plan",
        "quote": "The free plan gave me everything I needed to build my author presence. I gained 5,000 followers before upgrading to Pro.",
        "plan": "Free for 6 months",
        "timeline": "6 months",
        "result": "5,000 new followers"
      },
      {
        "name": "Maria Santos",
        "genre": "Romance Author",
        "image": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop",
        "achievement": "Sold 1000+ Books via Free Profile",
        "quote": "Even on the free plan, I was able to showcase my books professionally. Sold over 1,000 copies through my profile links!",
        "plan": "Free Plan",
        "timeline": "4 months",
        "result": "1,000+ book sales"
      }
    ]
  }'
);

-- Update Final CTA to emphasize both free and pro options
UPDATE home_page_sections 
SET config = '{
  "title": "Start Your Author Journey Today",
  "subtitle": "Choose your path: Start FREE forever or try Pro for 30 days. Either way, you are building your author presence today!",
  "backgroundColor": "gradient-to-br from-primary/5 via-background to-accent/5",
  "animation": "fade-in",
  "socialProof": {
    "authorCount": "15,000+",
    "freeUsers": "12,000+",
    "successRate": "94%"
  },
  "guarantees": [
    "✓ Start 100% free forever",
    "✓ No credit card required", 
    "✓ Upgrade anytime",
    "✓ Cancel Pro trial anytime"
  ],
  "dualCta": true,
  "buttons": [
    {
      "text": "Start FREE Forever",
      "url": "/auth",
      "variant": "primary",
      "size": "extra-large",
      "effect": "glow",
      "description": "Professional profile, 5 books, basic themes"
    },
    {
      "text": "Try Pro FREE for 30 Days",
      "url": "/auth?plan=pro-trial",
      "variant": "secondary",
      "size": "extra-large", 
      "description": "Everything + unlimited books, custom domain, premium themes"
    }
  ]
}'
WHERE type = 'final_cta';