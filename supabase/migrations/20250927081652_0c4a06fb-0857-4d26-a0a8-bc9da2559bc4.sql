-- Update home page sections for seamless author signup experience

-- Clear existing and add enhanced sections focused on Pro features and seamless signup
DELETE FROM home_page_sections;

-- Enhanced Hero with 30-day trial focus
INSERT INTO home_page_sections (id, type, title, enabled, order_index, config) VALUES 
(
  gen_random_uuid(),
  'interactive_hero',
  'Hero with 30-Day Trial Focus',
  true,
  1,
  '{
    "title": "Your Author Success Story Starts Here",
    "subtitle": "Join 15,000+ authors who transformed their careers with our platform. Start your FREE 30-day Pro trial - no credit card required!",
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
      "✓ 30-day free trial",
      "✓ No credit card required",
      "✓ Cancel anytime"
    ],
    "features": [
      {
        "icon": "crown",
        "title": "30-Day Pro Trial",
        "description": "Full access to all premium features"
      },
      {
        "icon": "users",
        "title": "Join 15K+ Authors",
        "description": "Trusted by bestselling authors"
      },
      {
        "icon": "zap",
        "title": "Instant Setup",
        "description": "Profile ready in 2 minutes"
      }
    ],
    "buttons": [
      {
        "text": "Start FREE 30-Day Pro Trial",
        "url": "/auth",
        "variant": "primary",
        "effect": "glow",
        "size": "extra-large"
      },
      {
        "text": "See Success Stories",
        "url": "#success-stories",
        "variant": "secondary",
        "effect": "hover-lift"
      }
    ]
  }'
);

-- Pro Features Showcase (only actual Pro features)
INSERT INTO home_page_sections (id, type, title, enabled, order_index, config) VALUES 
(
  gen_random_uuid(),
  'premium_showcase',
  'Pro Features That Set You Apart',
  true,
  2,
  '{
    "title": "Pro Features That Set You Apart",
    "subtitle": "Everything included in your 30-day free trial - these are the tools that transform authors into bestsellers",
    "backgroundColor": "gradient-to-br from-background via-muted/10 to-background",
    "animation": "slide-in-right",
    "interactive": true,
    "gallery": true,
    "premiumOnly": true,
    "trialCallout": true,
    "items": [
      {
        "id": "unlimited-books",
        "icon": "book",
        "title": "Unlimited Books",
        "description": "Showcase your entire catalog with unlimited book listings, covers, and detailed pages",
        "image": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=400&fit=crop",
        "premium": true,
        "proFeature": true,
        "features": ["Unlimited book uploads", "Rich book pages", "Purchase link integration"],
        "color": "primary"
      },
      {
        "id": "custom-domain",
        "icon": "globe",
        "title": "Custom Domain",
        "description": "Professional branded URLs like yourname.com that build credibility with readers",
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
        "description": "Deep insights into reader behavior, popular content, and conversion metrics",
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
        "description": "50+ designer themes that make your profile stand out from the crowd",
        "image": "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=600&h=400&fit=crop",
        "premium": true,
        "proFeature": true,
        "features": ["50+ premium designs", "Mobile responsive", "Customizable colors"],
        "color": "primary"
      },
      {
        "id": "no-watermark",
        "icon": "crown",
        "title": "No Watermark",
        "description": "Clean, professional profiles without any platform branding",
        "image": "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600&h=400&fit=crop",
        "premium": true,
        "proFeature": true,
        "features": ["100% your brand", "Professional appearance", "No platform logos"],
        "color": "secondary"
      },
      {
        "id": "newsletter-integration",
        "icon": "mail",
        "title": "Newsletter Integration",
        "description": "Build and engage your author mailing list with powerful email tools",
        "image": "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop",
        "premium": true,
        "proFeature": true,
        "features": ["Email campaigns", "Subscriber management", "Automation tools"],
        "color": "accent"
      }
    ]
  }'
);

-- FAQ Section for common author questions
INSERT INTO home_page_sections (id, type, title, enabled, order_index, config) VALUES 
(
  gen_random_uuid(),
  'faq',
  'Frequently Asked Questions',
  true,
  3,
  '{
    "title": "Everything Authors Want to Know",
    "subtitle": "Get instant answers to the most common questions about building your author platform",
    "backgroundColor": "muted/20",
    "animation": "fade-in",
    "categories": [
      {
        "name": "Getting Started",
        "questions": [
          {
            "question": "How quickly can I set up my author profile?",
            "answer": "Most authors have their professional profile live within 2-3 minutes. Our smart setup wizard guides you through adding your bio, books, and social links step by step."
          },
          {
            "question": "Do I need technical skills to use this platform?",
            "answer": "Not at all! Our platform is designed for authors, not developers. Everything is point-and-click, with intuitive tools that make professional profile creation effortless."
          },
          {
            "question": "Can I import my existing book information?",
            "answer": "Yes! You can easily add books manually or import from major platforms. Our system automatically formats everything for maximum visual impact."
          }
        ]
      },
      {
        "name": "30-Day Pro Trial",
        "questions": [
          {
            "question": "What exactly is included in the 30-day Pro trial?",
            "answer": "Everything! Unlimited books, custom domain, premium themes, advanced analytics, newsletter tools, and priority support. No restrictions, no hidden fees."
          },
          {
            "question": "Do I need to enter a credit card for the trial?",
            "answer": "Absolutely not. Start your 30-day Pro trial immediately with just your email. We only ask for payment details if you choose to continue after the trial."
          },
          {
            "question": "What happens after my 30-day trial ends?",
            "answer": "You can choose to upgrade to Pro for $19.99/month, or continue with our free plan. Your profile stays live either way - you never lose your content."
          }
        ]
      },
      {
        "name": "Features & Pricing",
        "questions": [
          {
            "question": "How does the custom domain work?",
            "answer": "Connect your own domain (like johnsmith.com) to your profile. We provide simple instructions, and most authors have it working within 15 minutes."
          },
          {
            "question": "Can I track how my profile is performing?",
            "answer": "Yes! Pro members get detailed analytics showing visitor numbers, popular content, reader demographics, and conversion rates from browsers to book buyers."
          },
          {
            "question": "Is there a limit to how many books I can showcase?",
            "answer": "Free accounts can showcase up to 5 books. Pro members have unlimited book listings with rich detail pages and purchase integrations."
          }
        ]
      },
      {
        "name": "Success & Support",
        "questions": [
          {
            "question": "How do other authors use this to grow their readership?",
            "answer": "Authors use their profiles as their central hub - sharing the link in email signatures, social media bios, business cards, and book descriptions. It becomes their professional author homepage."
          },
          {
            "question": "What kind of support do you provide?",
            "answer": "Free users get community support and help articles. Pro members receive priority email support with responses within 24 hours, plus one-on-one profile optimization advice."
          },
          {
            "question": "Can I cancel anytime?",
            "answer": "Of course! Cancel your Pro subscription anytime with one click. Your profile remains active on the free plan, so you never lose your author presence."
          }
        ]
      }
    ]
  }'
);

-- 30-Day Trial CTA Section
INSERT INTO home_page_sections (id, type, title, enabled, order_index, config) VALUES 
(
  gen_random_uuid(),
  'trial_cta',
  '30-Day Pro Trial',
  true,
  4,
  '{
    "title": "Try Pro Features FREE for 30 Days",
    "subtitle": "Experience everything that makes authors successful - premium themes, analytics, custom domains, and more. No credit card required.",
    "backgroundColor": "gradient-to-br from-primary/10 via-accent/5 to-primary/10",
    "animation": "scale-in",
    "fullWidth": true,
    "urgency": false,
    "benefits": [
      {
        "icon": "crown",
        "title": "All Pro Features",
        "description": "Unlock every premium tool and feature"
      },
      {
        "icon": "calendar",
        "title": "Full 30 Days",
        "description": "Plenty of time to see real results"
      },
      {
        "icon": "credit-card-off",
        "title": "No Credit Card",
        "description": "Start immediately with just your email"
      },
      {
        "icon": "shield-check",
        "title": "Cancel Anytime",
        "description": "No commitments, no hidden fees"
      }
    ],
    "testimonial": {
      "quote": "The 30-day trial let me test everything. By day 15, I had my first book sale directly from my profile!",
      "author": "Sarah Mitchell",
      "role": "Romance Author",
      "image": "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop"
    },
    "ctaButton": {
      "text": "Start Your FREE 30-Day Pro Trial",
      "url": "/auth",
      "variant": "primary",
      "size": "extra-large",
      "effect": "glow"
    }
  }'
);

-- Success Stories with Real Results
INSERT INTO home_page_sections (id, type, title, enabled, order_index, config) VALUES 
(
  gen_random_uuid(),
  'success_stories',
  'Author Success Stories',
  true,
  5,
  '{
    "title": "Authors Who Transformed Their Careers",
    "subtitle": "Real stories from authors who built their audience and increased sales with our platform",
    "backgroundColor": "muted/30",
    "animation": "fade-in",
    "interactive": true,
    "carousel": true,
    "autoPlay": true,
    "interval": 8000,
    "stories": [
      {
        "id": "sarah-romance",
        "name": "Sarah Mitchell",
        "genre": "Romance Author",
        "image": "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop",
        "achievement": "300% Increase in Book Sales",
        "quote": "Within 2 months of using my professional profile, my book sales tripled. Readers started finding me through Google, and my email list grew from 50 to 2,000 subscribers.",
        "timeToResults": "2 months",
        "stats": {
          "before": "127 books sold monthly",
          "after": "412 books sold monthly",
          "timeframe": "2 months",
          "followers": "2,000 new subscribers"
        },
        "bookCover": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=300&fit=crop",
        "profileUrl": "/author/sarah-mitchell"
      },
      {
        "id": "marcus-scifi",
        "name": "Marcus Chen",
        "genre": "Sci-Fi Author",
        "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
        "achievement": "First Bestseller in 6 Months",
        "quote": "My professional profile became my author hub. When my latest sci-fi novel launched, the traffic from my profile helped it hit Amazon bestseller lists within a week!",
        "timeToResults": "6 months",
        "stats": {
          "before": "Unknown indie author",
          "after": "#1 Amazon Bestseller",
          "timeframe": "6 months",
          "followers": "5,000 new readers"
        },
        "bookCover": "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=300&fit=crop",
        "profileUrl": "/author/marcus-chen"
      },
      {
        "id": "elena-fantasy",
        "name": "Elena Rodriguez",
        "genre": "Fantasy Author", 
        "image": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
        "achievement": "Traditional Publishing Deal",
        "quote": "My agent found me through my professional profile! Having everything in one polished place made all the difference when negotiating my 3-book deal.",
        "timeToResults": "4 months",
        "stats": {
          "before": "Self-published only",
          "after": "3-book traditional deal",
          "timeframe": "4 months",
          "followers": "Publishing contract"
        },
        "bookCover": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=300&fit=crop",
        "profileUrl": "/author/elena-rodriguez"
      }
    ]
  }'
);

-- Final CTA with urgency and social proof
INSERT INTO home_page_sections (id, type, title, enabled, order_index, config) VALUES 
(
  gen_random_uuid(),
  'final_cta',
  'Join Thousands of Successful Authors',
  true,
  6,
  '{
    "title": "Your Author Success Story Starts Today",
    "subtitle": "Join 15,000+ authors who have transformed their careers. Start your FREE 30-day Pro trial now!",
    "backgroundColor": "gradient-to-br from-primary/5 via-background to-accent/5",
    "animation": "fade-in",
    "socialProof": {
      "authorCount": "15,000+",
      "booksPublished": "45,000+",
      "successRate": "94%"
    },
    "guarantees": [
      "✓ 30-day free trial",
      "✓ No credit card required", 
      "✓ Cancel anytime",
      "✓ Keep your profile forever"
    ],
    "urgency": {
      "enabled": false,
      "message": "Join authors who are building their platforms today"
    },
    "buttons": [
      {
        "text": "Start FREE 30-Day Pro Trial",
        "url": "/auth",
        "variant": "primary",
        "size": "extra-large",
        "effect": "glow"
      },
      {
        "text": "See All Features",
        "url": "#premium-showcase",
        "variant": "secondary"
      }
    ]
  }'
);