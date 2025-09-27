import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Globe,
  Palette,
  BarChart3,
  Shield,
  Zap,
  Users,
  BookOpen,
  Calendar,
  Image,
  Award,
  Mail,
  MessageCircle,
  Crown,
  Star,
  Rocket
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DashboardFeaturesProps {
  hasFeature: (feature: string) => boolean;
  isPro: boolean;
}

export function DashboardFeatures({ hasFeature, isPro }: DashboardFeaturesProps) {
  const navigate = useNavigate();

  const features = [
    {
      icon: Globe,
      title: "Custom Domain",
      description: "Connect your own domain for professional branding",
      path: "/custom-domains",
      feature: "custom_domain",
      premium: true
    },
    {
      icon: Palette,
      title: "Premium Themes",
      description: "Access exclusive professional theme designs",
      path: "/themes",
      feature: "premium_themes",
      premium: true
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Detailed insights into your profile performance",
      path: "/advanced-analytics",
      feature: "advanced_analytics",
      premium: true
    },
    {
      icon: BookOpen,
      title: "Blog Management",
      description: "Share your thoughts and engage with readers",
      path: "/user-blog-management",
      feature: "blog",
      premium: false
    },
    {
      icon: Calendar,
      title: "Events",
      description: "Manage and promote your events and appearances",
      path: "/user-events-management",
      feature: "events",
      premium: false
    },
    {
      icon: Image,
      title: "Photo Gallery",
      description: "Showcase your photos and visual content",
      path: "/user-gallery-management",
      feature: "gallery",
      premium: false
    },
    {
      icon: Award,
      title: "Awards & Recognition",
      description: "Display your achievements and accolades",
      path: "/user-awards-management",
      feature: "awards",
      premium: false
    },
    {
      icon: Mail,
      title: "Newsletter",
      description: "Build and manage your subscriber list",
      path: "/user-newsletter-management",
      feature: "newsletter_integration",
      premium: false
    },
    {
      icon: MessageCircle,
      title: "FAQ Section",
      description: "Answer common questions from your audience",
      path: "/user-faq-management",
      feature: "faq",
      premium: false
    }
  ];

  const quickActions = [
    {
      icon: Rocket,
      title: "Quick Start Guide",
      description: "Learn how to set up your perfect author profile",
      action: () => console.log("Open guide"),
      color: "bg-blue-500/10 text-blue-600 border-blue-200"
    },
    {
      icon: Star,
      title: "Profile Optimizer",
      description: "Get suggestions to improve your profile's impact",
      action: () => console.log("Open optimizer"),
      color: "bg-purple-500/10 text-purple-600 border-purple-200"
    },
    {
      icon: Users,
      title: "Community Forum",
      description: "Connect with other authors and share experiences",
      action: () => console.log("Open forum"),
      color: "bg-green-500/10 text-green-600 border-green-200"
    },
    {
      icon: Zap,
      title: "SEO Booster",
      description: "Optimize your profile for better search visibility",
      action: () => navigate("/seo-dashboard"),
      color: "bg-orange-500/10 text-orange-600 border-orange-200"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Available Features</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const hasAccess = hasFeature(feature.feature);
            const IconComponent = feature.icon;
            
            return (
              <Card 
                key={feature.title}
                className={`relative transition-all hover:shadow-md ${
                  !hasAccess ? 'opacity-60' : 'hover:shadow-lg'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <IconComponent className="h-5 w-5 text-primary" />
                    {feature.premium && (
                      <Badge variant={isPro ? "default" : "secondary"} className="text-xs">
                        {isPro ? <Crown className="h-3 w-3 mr-1" /> : null}
                        Pro
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-sm">{feature.title}</CardTitle>
                  <CardDescription className="text-xs">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    size="sm"
                    variant={hasAccess ? "default" : "outline"}
                    className="w-full"
                    onClick={() => hasAccess ? navigate(feature.path) : navigate('/subscription')}
                  >
                    {hasAccess ? 'Manage' : 'Upgrade to Access'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            
            return (
              <Card 
                key={action.title}
                className={`transition-all hover:shadow-md cursor-pointer ${action.color}`}
                onClick={action.action}
              >
                <CardHeader className="text-center pb-3">
                  <IconComponent className="h-6 w-6 mx-auto mb-2" />
                  <CardTitle className="text-sm">{action.title}</CardTitle>
                  <CardDescription className="text-xs">
                    {action.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}