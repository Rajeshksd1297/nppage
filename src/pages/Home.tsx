import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Users, TrendingUp, Globe, Star, ArrowRight, CheckCircle, 
  Eye, Activity, Book, BarChart3, Palette, Rocket, Sparkles, Trophy, 
  Bot, Camera, Share, Mail, Play, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HomeSection {
  id: string;
  type: string;
  title: string;
  enabled: boolean;
  order_index: number;
  config: any;
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
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
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

  // Auto-advance success stories carousel
  useEffect(() => {
    const successSection = sections.find(s => s.type === 'success_stories');
    if (successSection?.config.autoPlay) {
      const interval = setInterval(() => {
        const stories = successSection.config.stories || [];
        setCurrentStoryIndex(prev => (prev + 1) % stories.length);
      }, successSection.config.interval || 6000);
      return () => clearInterval(interval);
    }
  }, [sections]);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('home_page_sections')
        .select('*')
        .eq('enabled', true)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      if (data) {
        setSections(data as HomeSection[]);
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

  const getIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      users: Users, book: Book, eye: Eye, activity: Activity, 
      globe: Globe, star: Star, palette: Palette, rocket: Rocket,
      sparkles: Sparkles, trophy: Trophy, bot: Bot, camera: Camera,
      share: Share, mail: Mail, chart: BarChart3, barchart3: BarChart3
    };
    const IconComponent = iconMap[iconName] || BookOpen;
    return <IconComponent className="h-8 w-8 text-primary" />;
  };

  const getBgClass = (bg: string) => {
    const bgMap: { [key: string]: string } = {
      'muted/50': 'bg-muted/50',
      'muted/30': 'bg-muted/30',
      'primary/5': 'bg-primary/5',
      'gradient-to-br from-primary/15 via-accent/10 to-secondary/15': 'bg-gradient-to-br from-primary/15 via-accent/10 to-secondary/15',
      'gradient-to-br from-background via-muted/10 to-background': 'bg-gradient-to-br from-background via-muted/10 to-background',
      'gradient-to-br from-primary/5 via-background to-accent/5': 'bg-gradient-to-br from-primary/5 via-background to-accent/5',
      'gradient-to-br from-muted/20 via-background to-muted/30': 'bg-gradient-to-br from-muted/20 via-background to-muted/30'
    };
    return bgMap[bg] || 'bg-background';
  };

  const renderSection = (section: HomeSection) => {
    switch (section.type) {
      case 'interactive_hero':
        return (
          <section 
            key={section.id} 
            className={`py-24 ${getBgClass(section.config.backgroundColor)} relative overflow-hidden animate-fade-in`}
          >
            {/* Background Image/Video */}
            {section.config.premiumImage && (
              <div className="absolute inset-0 opacity-10">
                <img 
                  src={section.config.premiumImage} 
                  alt="Background" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="container mx-auto px-6 relative z-10">
              <div className="text-center space-y-8 max-w-6xl mx-auto">
                <h1 className="text-7xl font-bold tracking-tight bg-gradient-to-br from-foreground via-primary to-foreground/70 bg-clip-text text-transparent">
                  {section.config.title}
                </h1>
                <p className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                  {section.config.subtitle}
                </p>
                
                {/* Interactive Feature Cards */}
                <div className="grid md:grid-cols-3 gap-6 mt-12">
                  {section.config.features?.map((feature: any, index: number) => (
                    <Card key={index} className="group hover:shadow-2xl transition-all duration-500 hover:scale-105 bg-card/80 backdrop-blur-sm border-0">
                      <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                          {getIcon(feature.icon)}
                        </div>
                        <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground">{feature.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="flex gap-6 justify-center flex-wrap mt-12">
                  {section.config.buttons?.map((button: any, index: number) => (
                    <Button 
                      key={index}
                      size="lg" 
                      variant={button.variant === 'primary' ? 'default' : 'outline'}
                      onClick={() => navigate(button.url)}
                      className={`px-8 py-6 text-lg hover:scale-105 transition-all duration-300 ${
                        button.effect === 'glow' ? 'shadow-2xl shadow-primary/25' : ''
                      }`}
                    >
                      {button.text}
                      {button.variant === 'primary' && <ArrowRight className="ml-2 h-5 w-5" />}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );

      case 'premium_showcase':
        return (
          <section key={section.id} className={`py-20 ${getBgClass(section.config.backgroundColor)} animate-slide-in-right`}>
            <div className="container mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-5xl font-bold mb-6">{section.config.title}</h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">{section.config.subtitle}</p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {section.config.items?.map((item: any, index: number) => (
                  <Card 
                    key={index} 
                    className={`group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:scale-105 border-0 bg-card/60 backdrop-blur-sm overflow-hidden ${
                      selectedFeature === item.id ? 'ring-2 ring-primary shadow-2xl scale-105' : ''
                    }`}
                    onClick={() => setSelectedFeature(selectedFeature === item.id ? null : item.id)}
                  >
                    <div className="relative overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white">
                          Premium
                        </Badge>
                      </div>
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
                          {getIcon(item.icon)}
                        </div>
                        <h3 className="text-xl font-bold">{item.title}</h3>
                      </div>
                      
                      <p className="text-muted-foreground mb-4">{item.description}</p>
                      
                      {selectedFeature === item.id && (
                        <div className="space-y-3 animate-fade-in">
                          <h4 className="font-semibold text-sm text-primary">Features:</h4>
                          <ul className="space-y-1">
                            {item.features?.map((feature: string, idx: number) => (
                              <li key={idx} className="flex items-center text-sm">
                                <CheckCircle className="h-4 w-4 text-primary mr-2" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-4"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(item.demoUrl);
                            }}
                          >
                            Try Demo
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        );

      case 'success_stories':
        const stories = section.config.stories || [];
        const currentStory = stories[currentStoryIndex];
        
        return (
          <section key={section.id} className={`py-20 ${getBgClass(section.config.backgroundColor)} animate-fade-in`}>
            <div className="container mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-6">{section.config.title}</h2>
                <p className="text-xl text-muted-foreground">{section.config.subtitle}</p>
              </div>
              
              {currentStory && (
                <div className="max-w-6xl mx-auto">
                  <Card className="overflow-hidden bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border-0 shadow-2xl">
                    <div className="grid md:grid-cols-2 gap-0">
                      <div className="relative">
                        <img 
                          src={currentStory.image} 
                          alt={currentStory.name}
                          className="w-full h-full object-cover min-h-[400px]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-6 left-6 text-white">
                          <h3 className="text-2xl font-bold">{currentStory.name}</h3>
                          <p className="text-lg opacity-90">{currentStory.genre}</p>
                        </div>
                      </div>
                      
                      <CardContent className="p-8 flex flex-col justify-center">
                        <div className="mb-6">
                          <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white mb-4">
                            {currentStory.achievement}
                          </Badge>
                          <blockquote className="text-xl italic text-muted-foreground mb-6">
                            "{currentStory.quote}"
                          </blockquote>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <div className="text-sm text-muted-foreground">Before</div>
                            <div className="font-bold">{currentStory.stats.before}</div>
                          </div>
                          <div className="text-center p-4 bg-primary/10 rounded-lg">
                            <div className="text-sm text-muted-foreground">After</div>
                            <div className="font-bold text-primary">{currentStory.stats.after}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img 
                              src={currentStory.bookCover} 
                              alt="Book cover"
                              className="w-12 h-16 object-cover rounded"
                            />
                            <div className="text-sm text-muted-foreground">
                              Timeframe: {currentStory.stats.timeframe}
                            </div>
                          </div>
                          <Button variant="outline" onClick={() => navigate(currentStory.profileUrl)}>
                            View Profile
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                  
                  {/* Story Navigation */}
                  <div className="flex justify-center items-center gap-4 mt-8">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setCurrentStoryIndex(prev => 
                        prev === 0 ? stories.length - 1 : prev - 1
                      )}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex gap-2">
                      {stories.map((_: any, index: number) => (
                        <button
                          key={index}
                          className={`w-3 h-3 rounded-full transition-colors ${
                            index === currentStoryIndex ? 'bg-primary' : 'bg-muted'
                          }`}
                          onClick={() => setCurrentStoryIndex(index)}
                        />
                      ))}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setCurrentStoryIndex(prev => 
                        (prev + 1) % stories.length
                      )}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>
        );

      case 'live_demo':
        return (
          <section key={section.id} className={`py-20 ${getBgClass(section.config.backgroundColor)} animate-scale-in`}>
            <div className="container mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-6">{section.config.title}</h2>
                <p className="text-xl text-muted-foreground">{section.config.subtitle}</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                {section.config.demos?.map((demo: any, index: number) => (
                  <Card key={index} className="group overflow-hidden hover:shadow-2xl transition-all duration-500 border-0 bg-card/60 backdrop-blur-sm">
                    <div className="relative">
                      <img 
                        src={demo.image} 
                        alt={demo.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Button size="lg" className="bg-white text-black hover:bg-white/90">
                          <Play className="h-5 w-5 mr-2" />
                          Try Demo
                        </Button>
                      </div>
                      {demo.premium && (
                        <Badge className="absolute top-4 right-4 bg-gradient-to-r from-primary to-primary/80">
                          Premium
                        </Badge>
                      )}
                    </div>
                    
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-2">{demo.title}</h3>
                      <p className="text-muted-foreground">{demo.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        );

      case 'premium_pricing':
        return (
          <section key={section.id} className={`py-20 ${getBgClass(section.config.backgroundColor)} animate-fade-in`}>
            <div className="container mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-6">{section.config.title}</h2>
                <p className="text-xl text-muted-foreground">{section.config.subtitle}</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {section.config.plans?.map((plan: any, index: number) => (
                  <Card 
                    key={index} 
                    className={`relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-105 ${
                      plan.popular ? 'border-primary/50 shadow-xl bg-gradient-to-br from-primary/5 to-primary/10' : 'bg-card/60 backdrop-blur-sm'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-primary/80 text-white text-center py-2 text-sm font-medium">
                        Most Popular
                      </div>
                    )}
                    
                    <div className="relative">
                      <img 
                        src={plan.image} 
                        alt={plan.name}
                        className="w-full h-32 object-cover opacity-50"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                    </div>
                    
                    <CardContent className={`p-8 ${plan.popular ? 'pt-12' : ''}`}>
                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                        <div className="text-4xl font-bold mb-2">
                          {plan.price > 0 ? `$${plan.price}` : 'Free'}
                          {plan.price > 0 && <span className="text-lg font-normal text-muted-foreground">/{plan.period}</span>}
                        </div>
                        <p className="text-muted-foreground">{plan.description}</p>
                      </div>
                      
                      <ul className="space-y-3 mb-8">
                        {plan.features?.map((feature: string, idx: number) => (
                          <li key={idx} className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      {plan.premiumFeatures && (
                        <div className="mb-8 p-4 bg-primary/5 rounded-lg border border-primary/20">
                          <h4 className="font-semibold text-primary mb-3">Premium Features:</h4>
                          <ul className="space-y-2">
                            {plan.premiumFeatures.map((feature: string, idx: number) => (
                              <li key={idx} className="flex items-center text-sm">
                                <Star className="h-4 w-4 text-primary mr-2" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <Button 
                        className={`w-full ${plan.popular ? 'bg-gradient-to-r from-primary to-primary/80' : ''}`}
                        variant={plan.popular ? 'default' : 'outline'}
                        onClick={() => navigate('/auth')}
                        size="lg"
                      >
                        {plan.price === 0 ? 'Get Started Free' : 'Start Free Trial'}
                      </Button>
                    </CardContent>
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

      {/* Dynamic Interactive Sections */}
      {sections.map(section => renderSection(section))}

      {/* Enhanced CTA & Newsletter */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl font-bold">Ready to Transform Your Author Journey?</h2>
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