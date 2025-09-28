import { DemoSetup } from '@/components/DemoSetup';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, BarChart3, Globe, Crown, MessageCircle, Newspaper, CalendarDays, Award, Mail, Palette, Check, Settings, Plus } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { FeatureGate } from '@/components/FeatureGate';
import { TrialBanner } from '@/components/TrialBanner';

const Index = () => {
  const navigate = useNavigate();
  const [seoSettings, setSeoSettings] = useState<any>(null);
  
  // Real-time subscription and admin settings
  const { hasFeature, isPro, isFree, isOnTrial, getCurrentPlanName, loading: subscriptionLoading } = useSubscription();
  const { hasFeatureAccess } = useAdminSettings();

  useEffect(() => {
    fetchSeoSettings();
  }, []);

  const fetchSeoSettings = async () => {
    try {
      const { data } = await supabase
        .from('seo_settings')
        .select('*')
        .single();
      setSeoSettings(data);
    } catch (error) {
      console.error('Error fetching SEO settings:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TrialBanner />
      <SEOHead
        title={seoSettings?.site_title || "AuthorPage - Professional Author Profiles & Book Showcases"}
        description={seoSettings?.site_description || "Create stunning author profiles, showcase your books, and grow your readership with our professional author platform. Start free today!"}
        keywords="author profiles, book marketing, author website, book showcase, professional author pages, author platform, book promotion, writer portfolio"
        url="https://authorpage.com"
        type="website"
        image={seoSettings?.default_og_image || "/hero-authors-workspace.jpg"}
      />
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center space-y-6 mb-16">
          <div className="flex items-center justify-center mb-6">
            <BookOpen className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight">AuthorPage Platform</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create professional author profiles, showcase your books, and track your audience engagement with beautiful universal links.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')}>
              Get Started
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Author Profiles</h3>
            <p className="text-muted-foreground">Create beautiful, professional profiles with bio, publications, and contact information.</p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Book Pages</h3>
            <p className="text-muted-foreground">Showcase your books with detailed pages including covers, descriptions, and purchase links.</p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Universal Links</h3>
            <p className="text-muted-foreground">Share clean, professional URLs that work perfectly across social media and marketing.</p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Analytics</h3>
            <p className="text-muted-foreground">Track page views, engagement, and audience insights to grow your readership.</p>
          </div>
        </div>

        {/* Pro Features Showcase */}
        <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-accent/5 rounded-2xl mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Pro Features Available
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {isPro() ? "You're using Pro features!" : isOnTrial() ? "Currently in your Pro trial" : "Upgrade to unlock premium capabilities"}
            </p>
            {!subscriptionLoading && (
              <Badge variant={isPro() ? "default" : isOnTrial() ? "secondary" : "outline"} className="mt-4">
                Current Plan: {getCurrentPlanName()} {isOnTrial() && "(Trial)"}
              </Badge>
            )}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Contact Management */}
            <FeatureGate feature="contact_form" inline={false}>
              <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group border-primary/20">
                <div className="absolute top-0 right-0 p-3">
                  {hasFeature('contact_form') && <Badge className="bg-green-500 text-xs">Active</Badge>}
                </div>
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <MessageCircle className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Contact Management</CardTitle>
                  <CardDescription className="text-sm">
                    Professional contact forms & inquiries
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {hasFeature('contact_form') && hasFeatureAccess('newsletter') && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate('/user-contact-management')}
                    >
                      <Settings className="h-3 w-3 mr-2" />
                      Manage
                    </Button>
                  )}
                </CardContent>
              </Card>
            </FeatureGate>

            {/* Blog Management */}
            <FeatureGate feature="blog" inline={false}>
              <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group border-primary/20">
                <div className="absolute top-0 right-0 p-3">
                  {hasFeature('blog') && <Badge className="bg-green-500 text-xs">Active</Badge>}
                </div>
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Newspaper className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Blog Management</CardTitle>
                  <CardDescription className="text-sm">
                    Share thoughts & connect with readers
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {hasFeature('blog') && hasFeatureAccess('blog') && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate('/user-blog-management')}
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      Create Post
                    </Button>
                  )}
                </CardContent>
              </Card>
            </FeatureGate>

            {/* Events Management */}
            <FeatureGate feature="events" inline={false}>
              <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group border-primary/20">
                <div className="absolute top-0 right-0 p-3">
                  {hasFeature('events') && <Badge className="bg-green-500 text-xs">Active</Badge>}
                </div>
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <CalendarDays className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Event Management</CardTitle>
                  <CardDescription className="text-sm">
                    Book launches & author events
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {hasFeature('events') && hasFeatureAccess('events') && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate('/user-events-management')}
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      Create Event
                    </Button>
                  )}
                </CardContent>
              </Card>
            </FeatureGate>

            {/* Awards Management */}
            <FeatureGate feature="awards" inline={false}>
              <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group border-primary/20">
                <div className="absolute top-0 right-0 p-3">
                  {hasFeature('awards') && <Badge className="bg-green-500 text-xs">Active</Badge>}
                </div>
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Awards & Recognition</CardTitle>
                  <CardDescription className="text-sm">
                    Showcase achievements & accolades
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {hasFeature('awards') && hasFeatureAccess('awards') && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate('/user-awards-management')}
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      Add Award
                    </Button>
                  )}
                </CardContent>
              </Card>
            </FeatureGate>

            {/* Newsletter Management */}
            <FeatureGate feature="newsletter_integration" inline={false}>
              <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group border-primary/20">
                <div className="absolute top-0 right-0 p-3">
                  {hasFeature('newsletter_integration') && <Badge className="bg-green-500 text-xs">Active</Badge>}
                </div>
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Newsletter</CardTitle>
                  <CardDescription className="text-sm">
                    Build & engage reader community
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {hasFeature('newsletter_integration') && hasFeatureAccess('newsletter') && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate('/user-newsletter-management')}
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      Create Campaign
                    </Button>
                  )}
                </CardContent>
              </Card>
            </FeatureGate>

            {/* Premium Themes */}
            <FeatureGate feature="premium_themes" inline={false}>
              <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group border-primary/20">
                <div className="absolute top-0 right-0 p-3">
                  {hasFeature('premium_themes') && <Badge className="bg-green-500 text-xs">Active</Badge>}
                </div>
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Palette className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Premium Themes</CardTitle>
                  <CardDescription className="text-sm">
                    Beautiful, professional designs
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {hasFeature('premium_themes') && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate('/themes')}
                    >
                      <Palette className="h-3 w-3 mr-2" />
                      Browse Themes
                    </Button>
                  )}
                </CardContent>
              </Card>
            </FeatureGate>
          </div>

          {!isPro() && !isOnTrial() && (
            <div className="text-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/subscription')}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                <Crown className="h-5 w-5 mr-2" />
                Try Pro Free - 30 Days
              </Button>
            </div>
          )}
        </section>

        {/* Demo Setup Section */}
        <div className="max-w-2xl mx-auto">
          <DemoSetup />
        </div>
      </div>
    </div>
  );
};

export default Index;
