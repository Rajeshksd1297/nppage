import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, TrendingUp, Globe, Star, ArrowRight, CheckCircle, CreditCard, Eye, Activity, Book, BarChart3 } from 'lucide-react';
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
    size?: 'small' | 'medium' | 'large';
    alignment?: 'left' | 'center' | 'right';
    padding?: 'small' | 'standard' | 'extra';
    textSize?: 'small' | 'medium' | 'large';
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
        // Transform the data to match our Package interface
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
      // Get total users with profiles
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('public_profile', true);

      // Get total published books
      const { count: booksCount } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      // Get total page views
      const { count: viewsCount } = await supabase
        .from('page_analytics')
        .select('*', { count: 'exact', head: true });

      // Get active users this month (last 30 days)
      const { count: activeCount } = await supabase
        .from('page_analytics')
        .select('visitor_id', { count: 'exact', head: true })
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
        case 'users': return <Users className="h-6 w-6 text-primary" />;
        case 'book': return <Book className="h-6 w-6 text-primary" />;
        case 'eye': return <Eye className="h-6 w-6 text-primary" />;
        case 'activity': return <Activity className="h-6 w-6 text-primary" />;
        case 'user': return <Users className="h-8 w-8 text-primary" />;
        case 'globe': return <Globe className="h-8 w-8 text-primary" />;
        case 'palette': return <Star className="h-8 w-8 text-primary" />;
        case 'rocket': return <TrendingUp className="h-8 w-8 text-primary" />;
        case 'chart': 
        case 'barchart3': 
        case 'Chart3':
          return <BarChart3 className="h-8 w-8 text-primary" />;
        default: return <BookOpen className="h-6 w-6 text-primary" />;
      }
    };

    const sectionClasses = `py-16 ${getBgClass(section.config.backgroundColor || 'background')} ${getAnimationClass(section.config.animation || '')}`;

    switch (section.type) {
      case 'hero':
        const sizeClass = section.config.size === 'large' ? 'py-24' : section.config.size === 'medium' ? 'py-16' : 'py-12';
        const paddingClass = section.config.padding === 'extra' ? 'px-8' : section.config.padding === 'standard' ? 'px-6' : 'px-4';
        const textSizeClass = section.config.textSize === 'large' ? 'text-6xl' : section.config.textSize === 'medium' ? 'text-4xl' : 'text-5xl';
        
        return (
          <section key={section.id} className={`${sizeClass} ${getBgClass(section.config.backgroundColor || 'background')} ${getAnimationClass(section.config.animation || '')}`}>
            <div className={`container mx-auto ${paddingClass}`}>
              <div className={`text-center space-y-6 ${section.config.customClasses || ''}`}>
                <h1 className={`${textSizeClass} font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent`}>
                  {section.config.title || 'Welcome to NP Page'}
                </h1>
                <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                  {section.config.subtitle || 'Create professional author profiles, showcase your books, and grow your readership.'}
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  {section.config.buttons?.map((button: any, index: number) => (
                    <Button 
                      key={index}
                      size="lg" 
                      variant={button.variant === 'primary' ? 'default' : 'outline'}
                      onClick={() => navigate(button.url)}
                      className="hover-scale"
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
          <section key={section.id} className={sectionClasses}>
            <div className="container mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">{section.config.title}</h2>
                {section.config.subtitle && (
                  <p className="text-muted-foreground">{section.config.subtitle}</p>
                )}
              </div>
              <div className="grid md:grid-cols-4 gap-8">
                {section.config.items?.map((item: any, index: number) => {
                  // Handle dynamic values that sync with portal data
                  let displayValue = item.value;
                  if (item.value === 'dynamic_users') displayValue = stats.totalUsers.toLocaleString();
                  else if (item.value === 'dynamic_books') displayValue = stats.totalBooks.toLocaleString();
                  else if (item.value === 'dynamic_views') displayValue = stats.totalViews.toLocaleString();
                  else if (item.value === 'dynamic_active') displayValue = stats.activeUsers.toLocaleString();
                  
                  return (
                    <div key={index} className="text-center">
                      {item.icon && (
                        <div className="flex justify-center mb-4">
                          {getIcon(item.icon)}
                        </div>
                      )}
                      <div className="text-4xl font-bold text-primary mb-2">{displayValue}</div>
                      <div className="text-muted-foreground">{item.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );

      case 'features':
        return (
          <section key={section.id} className={sectionClasses}>
            <div className="container mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">{section.config.title}</h2>
                {section.config.subtitle && (
                  <p className="text-muted-foreground">{section.config.subtitle}</p>
                )}
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {section.config.items?.map((item: any, index: number) => (
                  <Card key={index} className="hover-scale transition-all duration-300 hover:shadow-lg border-0 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="text-center space-y-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                        {getIcon(item.icon)}
                      </div>
                      <CardTitle className="text-xl">{item.title}</CardTitle>
                      <CardDescription className="text-base leading-relaxed">{item.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        );

      case 'slider':
        return (
          <section key={section.id} className={sectionClasses}>
            <div className="container mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">{section.config.title}</h2>
                {section.config.subtitle && (
                  <p className="text-muted-foreground">{section.config.subtitle}</p>
                )}
              </div>
              <div className="max-w-4xl mx-auto">
                {section.config.items?.map((item: any, index: number) => (
                  <div key={index} className="text-center p-8 border rounded-lg mb-4">
                    {item.image && (
                      <img src={item.image} alt={item.title} className="w-full h-64 object-cover rounded-lg mb-4" />
                    )}
                    <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
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
          user_id: '00000000-0000-0000-0000-000000000000', // Anonymous signup
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
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">NP Page</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/auth')}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Dynamic Sections */}
      {sections.map(section => renderSection(section))}

      
      {/* Fallback sections if no dynamic sections */}
      {sections.length === 0 && (
        <>
          {/* Default Hero */}
          <section className="py-16 bg-gradient-to-br from-primary/5 to-primary/10 animate-fade-in">
            <div className="container mx-auto px-6">
              <div className="text-center space-y-6">
                <h1 className="text-5xl font-bold tracking-tight">Welcome to NP Page</h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Create professional author profiles, showcase your books, and grow your readership with our powerful platform.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button size="lg" onClick={() => navigate('/auth')}>
                    Start Your Journey
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="lg">
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Default Stats */}
          <section className="py-16 bg-muted/50 animate-slide-in-right">
            <div className="container mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Trusted by Authors Worldwide</h2>
                <p className="text-muted-foreground">Join thousands of authors who have chosen NP Page</p>
              </div>
              <div className="grid md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">{stats.totalUsers.toLocaleString()}</div>
                  <div className="text-muted-foreground">Authors</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">{stats.totalBooks.toLocaleString()}</div>
                  <div className="text-muted-foreground">Books Published</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">{stats.totalViews.toLocaleString()}</div>
                  <div className="text-muted-foreground">Page Views</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">{stats.activeUsers.toLocaleString()}</div>
                  <div className="text-muted-foreground">Active This Week</div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Pricing Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-muted-foreground">Start free and upgrade as you grow</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {packages.map((pkg) => (
              <Card key={pkg.id} className={pkg.name === 'Pro' ? 'border-primary shadow-lg' : ''}>
                <CardHeader>
                  {pkg.name === 'Pro' && (
                    <Badge className="w-fit mb-2">Most Popular</Badge>
                  )}
                  <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    {pkg.price_monthly ? `$${pkg.price_monthly}` : 'Free'}
                    {pkg.price_monthly && <span className="text-base font-normal text-muted-foreground">/month</span>}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full mt-6" 
                    variant={pkg.name === 'Pro' ? 'default' : 'outline'}
                    onClick={() => navigate('/auth')}
                  >
                    {pkg.name === 'Free' ? 'Get Started' : 'Start Free Trial'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Stay Updated</CardTitle>
              <CardDescription>
                Get the latest updates, tips, and author success stories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNewsletterSignup} className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="email" className="sr-only">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Subscribing...' : 'Subscribe'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">NP Page</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 NP Page. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;