-- Update home page sections with more interactive premium features

-- Clear existing and add enhanced interactive sections
DELETE FROM home_page_sections;

-- Hero section with premium interactive elements
INSERT INTO home_page_sections (id, type, title, enabled, order_index, config) VALUES 
(
  gen_random_uuid(),
  'interactive_hero',
  'Interactive Hero with Premium Features',
  true,
  1,
  '{
    "title": "Transform Your Author Journey",
    "subtitle": "Experience the power of professional author profiles with interactive previews, premium templates, and advanced analytics.",
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
    "premiumImage": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=800&fit=crop",
    "videoBackground": "https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-heights-in-a-sunset-26070-large.mp4",
    "features": [
      {
        "icon": "sparkles",
        "title": "AI-Powered Profiles",
        "description": "Smart content suggestions"
      },
      {
        "icon": "trophy",
        "title": "Award-Winning Templates",
        "description": "Premium designer themes"
      },
      {
        "icon": "trending-up",
        "title": "Advanced Analytics",
        "description": "Real-time insights"
      }
    ],
    "buttons": [
      {
        "text": "Start Your Premium Journey",
        "url": "/auth",
        "variant": "primary",
        "effect": "glow"
      },
      {
        "text": "Explore Premium Features",
        "url": "#premium-showcase",
        "variant": "secondary",
        "effect": "hover-lift"
      }
    ]
  }'
);

-- Premium Features Showcase with Interactive Gallery
INSERT INTO home_page_sections (id, type, title, enabled, order_index, config) VALUES 
(
  gen_random_uuid(),
  'premium_showcase',
  'Premium Features Interactive Gallery',
  true,
  2,
  '{
    "title": "Premium Features That Set You Apart",
    "subtitle": "Explore our advanced tools designed for professional authors",
    "backgroundColor": "gradient-to-br from-background via-muted/10 to-background",
    "animation": "slide-in-right",
    "interactive": true,
    "gallery": true,
    "premiumOnly": true,
    "items": [
      {
        "id": "custom-themes",
        "icon": "palette",
        "title": "Custom Designer Themes",
        "description": "Choose from 50+ premium themes designed by professionals",
        "image": "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=600&h=400&fit=crop",
        "demoUrl": "/theme-preview",
        "premium": true,
        "features": ["Unlimited customization", "Mobile responsive", "SEO optimized"],
        "color": "primary"
      },
      {
        "id": "ai-content",
        "icon": "bot",
        "title": "AI Content Assistant",
        "description": "Generate compelling author bios and book descriptions with AI",
        "image": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop",
        "demoUrl": "/ai-demo",
        "premium": true,
        "features": ["Smart writing suggestions", "SEO optimization", "Multi-language support"],
        "color": "secondary"
      },
      {
        "id": "advanced-analytics",
        "icon": "chart",
        "title": "Advanced Analytics Suite",
        "description": "Deep insights into your audience and engagement metrics",
        "image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
        "demoUrl": "/analytics-demo",
        "premium": true,
        "features": ["Real-time tracking", "Audience insights", "Conversion metrics"],
        "color": "accent"
      },
      {
        "id": "media-kit",
        "icon": "camera",
        "title": "Professional Media Kit",
        "description": "Auto-generated press kits with high-quality assets",
        "image": "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600&h=400&fit=crop",
        "demoUrl": "/media-kit-demo",
        "premium": true,
        "features": ["HD photos", "Press releases", "Brand assets"],
        "color": "primary"
      },
      {
        "id": "social-automation",
        "icon": "share",
        "title": "Social Media Automation",
        "description": "Automatically share your content across all platforms",
        "image": "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&h=400&fit=crop",
        "demoUrl": "/social-demo",
        "premium": true,
        "features": ["Multi-platform posting", "Smart scheduling", "Engagement tracking"],
        "color": "secondary"
      },
      {
        "id": "email-campaigns",
        "icon": "mail",
        "title": "Email Marketing Suite",
        "description": "Build and manage your author newsletter with advanced tools",
        "image": "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop",
        "demoUrl": "/email-demo",
        "premium": true,
        "features": ["Drag-drop editor", "Automation flows", "A/B testing"],
        "color": "accent"
      }
    ]
  }'
);

-- Interactive Success Stories with Real Author Profiles
INSERT INTO home_page_sections (id, type, title, enabled, order_index, config) VALUES 
(
  gen_random_uuid(),
  'success_stories',
  'Author Success Stories',
  true,
  3,
  '{
    "title": "Authors Who Transformed Their Careers",
    "subtitle": "Real stories from authors who grew their audience with our platform",
    "backgroundColor": "muted/30",
    "animation": "fade-in",
    "interactive": true,
    "carousel": true,
    "autoPlay": true,
    "interval": 6000,
    "stories": [
      {
        "id": "sarah-romance",
        "name": "Sarah Mitchell",
        "genre": "Romance Author",
        "image": "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop",
        "achievement": "10x Increase in Book Sales",
        "quote": "The premium analytics helped me understand my readers better. My latest release became a bestseller!",
        "stats": {
          "before": "500 monthly readers",
          "after": "15,000 monthly readers",
          "timeframe": "6 months"
        },
        "bookCover": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=300&fit=crop",
        "profileUrl": "/author/sarah-mitchell"
      },
      {
        "id": "marcus-scifi",
        "name": "Marcus Chen",
        "genre": "Sci-Fi Author",
        "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
        "achievement": "100K Newsletter Subscribers",
        "quote": "The email marketing tools transformed how I connect with readers. Building my community has never been easier.",
        "stats": {
          "before": "200 subscribers",
          "after": "100,000 subscribers",
          "timeframe": "12 months"
        },
        "bookCover": "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=300&fit=crop",
        "profileUrl": "/author/marcus-chen"
      },
      {
        "id": "elena-fantasy",
        "name": "Elena Rodriguez",
        "genre": "Fantasy Author", 
        "image": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
        "achievement": "Publishing Contract",
        "quote": "My professional profile caught the attention of publishers. The media kit made all the difference!",
        "stats": {
          "before": "Self-published",
          "after": "Major publisher deal",
          "timeframe": "8 months"
        },
        "bookCover": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=300&fit=crop",
        "profileUrl": "/author/elena-rodriguez"
      }
    ]
  }'
);

-- Live Demo Interactive Section
INSERT INTO home_page_sections (id, type, title, enabled, order_index, config) VALUES 
(
  gen_random_uuid(),
  'live_demo',
  'Interactive Platform Demo',
  true,
  4,
  '{
    "title": "See It In Action",
    "subtitle": "Try our platform features with this interactive demo",
    "backgroundColor": "gradient-to-br from-primary/5 via-background to-accent/5",
    "animation": "scale-in",
    "interactive": true,
    "fullWidth": true,
    "demos": [
      {
        "id": "profile-builder",
        "title": "Profile Builder",
        "description": "Create your author profile in real-time",
        "image": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop",
        "demoType": "interactive_form",
        "premium": false
      },
      {
        "id": "theme-customizer",
        "title": "Theme Customizer",
        "description": "Customize colors, fonts, and layouts instantly",
        "image": "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop",
        "demoType": "theme_preview",
        "premium": true
      },
      {
        "id": "analytics-dashboard",
        "title": "Analytics Dashboard",
        "description": "Explore real-time metrics and insights",
        "image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop",
        "demoType": "live_charts",
        "premium": true
      }
    ]
  }'
);

-- Premium Pricing with Interactive Comparison
INSERT INTO home_page_sections (id, type, title, enabled, order_index, config) VALUES 
(
  gen_random_uuid(),
  'premium_pricing',
  'Choose Your Premium Plan',
  true,
  5,
  '{
    "title": "Unlock Your Author Potential",
    "subtitle": "Compare plans and see the difference premium features make",
    "backgroundColor": "gradient-to-br from-muted/20 via-background to-muted/30",
    "animation": "fade-in",
    "interactive": true,
    "comparison": true,
    "highlightPremium": true,
    "plans": [
      {
        "id": "free",
        "name": "Free",
        "price": 0,
        "period": "forever",
        "description": "Perfect for getting started",
        "image": "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&h=300&fit=crop",
        "features": [
          "Basic profile",
          "5 book showcase",
          "Standard themes",
          "Basic analytics"
        ],
        "limitations": [
          "Limited customization",
          "Basic support",
          "Watermark included"
        ]
      },
      {
        "id": "pro",
        "name": "Pro", 
        "price": 19.99,
        "period": "month",
        "description": "For serious authors",
        "image": "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&h=300&fit=crop",
        "popular": true,
        "features": [
          "Everything in Free",
          "Unlimited books",
          "Premium themes",
          "Advanced analytics",
          "AI content assistant",
          "Custom domain",
          "Email marketing",
          "Priority support"
        ],
        "premiumFeatures": [
          "50+ designer themes",
          "AI-powered content",
          "Advanced analytics",
          "Media kit generator",
          "Social automation"
        ]
      }
    ]
  }'
);