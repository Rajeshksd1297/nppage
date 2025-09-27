import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, TrendingUp, Globe, Star, ArrowRight, CheckCircle, CreditCard, Eye, Activity, Book, BarChart3, Palette, Rocket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HomeSection {
  id: string;
  type: string;
  title: string;
  enabled: boolean;
  order_index: number;
  config: {
    title?: string;
    subtitle?: string;
    description?: string;
    backgroundColor?: string;
    textColor?: string;
    image?: string;
    animation?: string;
    size?: string;
    alignment?: string;
    padding?: string;
    textSize?: string;
    borderRadius?: string;
    shadow?: string;
    customClasses?: string;
    buttons?: Array<{ text: string; url: string; variant: 'primary' | 'secondary' }>;
    items?: Array<any>;
    autoPlay?: boolean;
    interval?: number;
    showDots?: boolean;
    showArrows?: boolean;
  };
}

interface Package {
  id: string;
  name: string;
  price_monthly?: number;
  price_yearly?: number;
  features: string[];
  max_books?: number;
  custom_domain: boolean;
  premium_themes: boolean;
  no_watermark: boolean;
}

interface Stats {
  totalUsers: number;
  totalBooks: number;
  totalViews: number;
  activeUsers: number;
}

const Home = () => {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalBooks: 0,
    totalViews: 0,
    activeUsers: 0
  });
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchSections();
    fetchPackages();
    fetchStats();
  }, []);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('home_page_sections')
        .select('*')
        .eq('enabled', true)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      if (data) {
        const transformedData = data.map(section => ({
          ...section,
          config: typeof section.config === 'object' ? section.config : {}
        }));
        setSections(transformedData as HomeSection[]);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true });
      
      if (error) throw error;
      if (data) {
        const transformedPackages: Package[] = data.map(plan => ({
          id: plan.id,
          name: plan.name,
          price_monthly: plan.price_monthly,
          price_yearly: plan.price_yearly,
          features: Array.isArray(plan.features) ? 
            plan.features.filter((f): f is string => typeof f === 'string') : 
            [],
          max_books: plan.max_books,
          custom_domain: plan.custom_domain,
          premium_themes: plan.premium_themes,
          no_watermark: plan.no_watermark
        }));
        setPackages(transformedPackages);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: booksCount } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      const { count: viewsCount } = await supabase
        .from('page_analytics')
        .select('*', { count: 'exact', head: true });

      const { count: activeCount } = await supabase
        .from('page_analytics')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      setStats({
        totalUsers: usersCount || 0,
        totalBooks: booksCount || 0,
        totalViews: viewsCount || 0,
        activeUsers: activeCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const renderSection = (section: HomeSection) => {
    const getAnimationClass = (animation: string) => {
      switch (animation) {
        case 'fade-in': return 'animate-fade-in';
        case 'slide-in-right': return 'animate-slide-in-right';
        case 'scale-in': return 'animate-scale-in';
        default: return '';
      }
    };

    const getBgClass = (bg: string) => {
      switch (bg) {
        case 'muted/50': return 'bg-muted/50';
        case 'muted/30': return 'bg-muted/30';
        case 'primary/5': return 'bg-primary/5';
        case 'gradient-to-br from-primary/5 to-primary/10': return 'bg-gradient-to-br from-primary/5 to-primary/10';
        case 'gradient-to-br from-primary/10 via-primary/5 to-accent/10': return 'bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10';
        case 'gradient-to-br from-background via-muted/20 to-background': return 'bg-gradient-to-br from-background via-muted/20 to-background';
        case 'gradient-to-r from-blue-50 to-indigo-50': return 'bg-gradient-to-r from-blue-50 to-indigo-50';
        case 'gradient-to-br from-purple-50 to-pink-50': return 'bg-gradient-to-br from-purple-50 to-pink-50';
        case 'dark': return 'bg-dark text-white';
        default: return 'bg-background';
      }
    };

    const getIcon = (iconName: string) => {
      switch (iconName) {
        case 'users': return <Users className="h-8 w-8 text-primary" />;
        case 'book': return <Book className="h-8 w-8 text-primary" />;
        case 'eye': return <Eye className="h-8 w-8 text-primary" />;
        case 'activity': return <Activity className="h-8 w-8 text-primary" />;
        case 'user': return <Users className="h-8 w-8 text-primary" />;
        case 'globe': return <Globe className="h-8 w-8 text-primary" />;
        case 'star': return <Star className="h-8 w-8 text-primary" />;
        case 'palette': return <Palette className="h-8 w-8 text-primary" />;
        case 'rocket': return <Rocket className="h-8 w-8 text-primary" />;
        case 'chart': 
        case 'barchart3': 
        case 'Chart3':
          return <BarChart3 className="h-8 w-8 text-primary" />;
        default: return <BookOpen className="h-8 w-8 text-primary" />;
      }
    };

    const getValue = (valueKey: string) => {
      switch (valueKey) {
        case 'dynamic_users': return stats.totalUsers.toLocaleString();
        case 'dynamic_books': return stats.totalBooks.toLocaleString();
        case 'dynamic_views': return stats.totalViews.toLocaleString();
        case 'dynamic_active': return stats.activeUsers.toLocaleString();
        default: return valueKey;
      }
    };

    switch (section.type) {
      case 'hero':
        const heroSize = section.config.size || 'medium';
        const heroPadding = section.config.padding === 'extra' ? 'py-24' : section.config.padding === 'standard' ? 'py-16' : 'py-12';
        const heroTextSize = section.config.textSize === 'large' ? 'text-6xl' : section.config.textSize === 'medium' ? 'text-4xl' : 'text-5xl';
        
        return (
          <section key={section.id} className={`${heroPadding} ${getBgClass(section.config.backgroundColor || 'background')} ${getAnimationClass(section.config.animation || '')} relative overflow-hidden`}>
            <div className="container mx-auto px-6">
              <div className={`text-center space-y-8 ${heroSize === 'large' ? 'max-w-6xl' : 'max-w-4xl'} mx-auto`}>
                <h1 className={`${heroTextSize} font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent`}>
                  {section.config.title || 'Welcome to NP Page'}
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  {section.config.subtitle || 'Create professional author profiles, showcase your books, and grow your readership.'}
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  {section.config.buttons?.map((button: any, index: number) => (
                    <Button 
                      key={index}
                      size="lg" 
                      variant={button.variant === 'primary' ? 'default' : 'outline'}
                      onClick={() => navigate(button.url)}
                      className="hover:scale-105 transition-all duration-200"
                    >
                      {button.text}
                      {button.variant === 'primary' && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );

      case 'stats':
        return (
          <section key={section.id} className={`py-16 ${getBgClass(section.config.backgroundColor || 'background')} ${getAnimationClass(section.config.animation || '')}`}>
            <div className="container mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">{section.config.title}</h2>
                {section.config.subtitle && (
                  <p className="text-xl text-muted-foreground">{section.config.subtitle}</p>
                )}
              </div>
              <div className="grid md:grid-cols-4 gap-8">
                {section.config.items?.map((item: any, index: number) => (
                  <div key={index} className="text-center p-6 rounded-xl bg-card/50 hover:bg-card/80 transition-all duration-300 hover:shadow-lg border border-border/50">
                    {item.icon && (
                      <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                          {getIcon(item.icon)}
                        </div>
                      </div>
                    )}
                    <div className="text-4xl font-bold text-primary mb-2">{getValue(item.value)}</div>
                    <div className="text-muted-foreground font-medium">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'features':
        return (
          <section key={section.id} className={`py-20 ${getBgClass(section.config.backgroundColor || 'background')} ${getAnimationClass(section.config.animation || '')}`}>
            <div className="container mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-6">{section.config.title}</h2>
                {section.config.subtitle && (
                  <p className="text-xl text-muted-foreground max-w-3xl mx-auto">{section.config.subtitle}</p>
                )}
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {section.config.items?.map((item: any, index: number) => (
                  <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-card/50 hover:bg-card backdrop-blur-sm hover:scale-105">
                    <CardHeader className="text-center space-y-6 p-8">
                      <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                        {getIcon(item.icon)}
                      </div>
                      <CardTitle className="text-xl font-bold">{item.title}</CardTitle>
                      <CardDescription className="text-muted-foreground leading-relaxed text-base">{item.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  const handleNewsletterSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert([{
          email,
          name: '',
          user_id: '00000000-0000-0000-0000-000000000000',
          source: 'homepage'
        }]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "You've been subscribed to our newsletter.",
      });
      setEmail('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to subscribe to newsletter.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">NP Page</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/auth')} className="hover:bg-primary/5">
                Sign In
              </Button>
              <Button onClick={() => navigate('/auth')} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Dynamic Sections */}
      {sections.map(section => renderSection(section))}

      {/* Pricing Section */}
      {packages.length > 0 && (
        <section className="py-20 bg-gradient-to-br from-muted/30 via-background to-muted/20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Choose Your Plan</h2>
              <p className="text-xl text-muted-foreground">Start free and upgrade as you grow your author brand</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {packages.slice(0, 3).map((pkg) => (
                <Card key={pkg.id} className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105 ${pkg.name === 'Pro' ? 'border-primary/50 shadow-xl bg-gradient-to-br from-primary/5 to-primary/10' : 'bg-card/50 backdrop-blur-sm'}`}>
                  {pkg.name === 'Pro' && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-primary/80 text-white text-center py-2 text-sm font-medium">
                      Most Popular
                    </div>
                  )}
                  <CardHeader className={pkg.name === 'Pro' ? 'pt-12' : ''}>
                    <CardTitle className="text-2xl font-bold">{pkg.name}</CardTitle>
                    <div className="text-4xl font-bold">
                      {pkg.price_monthly ? `$${pkg.price_monthly}` : 'Free'}
                      {pkg.price_monthly && <span className="text-lg font-normal text-muted-foreground">/month</span>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4 mb-8">
                      {pkg.features.slice(0, 6).map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full" 
                      variant={pkg.name === 'Pro' ? 'default' : 'outline'}
                      onClick={() => navigate('/auth')}
                      size="lg"
                    >
                      {pkg.name === 'Free' ? 'Get Started Free' : 'Start Free Trial'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter & CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl font-bold">Ready to Build Your Author Brand?</h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of authors who trust our platform to showcase their work and connect with readers worldwide.
            </p>
            
            <form onSubmit={handleNewsletterSignup} className="flex gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1"
              />
              <Button type="submit" disabled={loading} className="px-8">
                {loading ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </form>
            
            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth')} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                Create Your Profile Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">NP Page</span>
            </div>
            <p className="text-muted-foreground text-center md:text-right">
              © 2024 NP Page. Empowering authors worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;