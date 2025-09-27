import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Users, ArrowRight, CheckCircle, Eye, Activity, Book, BarChart3, 
  Palette, Rocket, Globe, Star, Sparkles, Trophy, TrendingUp, Bot, Camera, 
  Share, Mail, Play, ChevronLeft, ChevronRight, Crown, Zap
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
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalBooks: 0,
    totalViews: 0,
    activeUsers: 0
  });
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [selectedDemo, setSelectedDemo] = useState('profile-builder');
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
        totalUsers: usersCount || 1250,
        totalBooks: booksCount || 3500,
        totalViews: viewsCount || 85000,
        activeUsers: activeCount || 650
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getIcon = (iconName: string) => {
    const iconMap: { [key: string]: JSX.Element } = {
      users: <Users className="h-8 w-8" />,
      book: <Book className="h-8 w-8" />,
      eye: <Eye className="h-8 w-8" />,
      activity: <Activity className="h-8 w-8" />,
      user: <Users className="h-8 w-8" />,
      globe: <Globe className="h-8 w-8" />,
      star: <Star className="h-8 w-8" />,
      palette: <Palette className="h-8 w-8" />,
      rocket: <Rocket className="h-8 w-8" />,
      sparkles: <Sparkles className="h-8 w-8" />,
      trophy: <Trophy className="h-8 w-8" />,
      'trending-up': <TrendingUp className="h-8 w-8" />,
      bot: <Bot className="h-8 w-8" />,
      camera: <Camera className="h-8 w-8" />,
      share: <Share className="h-8 w-8" />,
      mail: <Mail className="h-8 w-8" />,
      chart: <BarChart3 className="h-8 w-8" />,
      barchart3: <BarChart3 className="h-8 w-8" />,
      Chart3: <BarChart3 className="h-8 w-8" />
    };
    
    return iconMap[iconName] || <BookOpen className="h-8 w-8" />;
  };

  const getBgClass = (bg: string) => {
    switch (bg) {
      case 'muted/50': return 'bg-muted/50';
      case 'muted/30': return 'bg-muted/30';
      case 'primary/5': return 'bg-primary/5';
      case 'gradient-to-br from-primary/5 to-primary/10': return 'bg-gradient-to-br from-primary/5 to-primary/10';
      case 'gradient-to-br from-primary/15 via-accent/10 to-secondary/15': return 'bg-gradient-to-br from-primary/15 via-accent/10 to-secondary/15';
      case 'gradient-to-br from-background via-muted/10 to-background': return 'bg-gradient-to-br from-background via-muted/10 to-background';
      case 'gradient-to-br from-primary/5 via-background to-accent/5': return 'bg-gradient-to-br from-primary/5 via-background to-accent/5';
      case 'gradient-to-br from-muted/20 via-background to-muted/30': return 'bg-gradient-to-br from-muted/20 via-background to-muted/30';
      default: return 'bg-background';
    }
  };

  const getAnimationClass = (animation: string) => {
    switch (animation) {
      case 'fade-in': return 'animate-fade-in';
      case 'slide-in-right': return 'animate-slide-in-right';
      case 'scale-in': return 'animate-scale-in';
      default: return '';
    }
  };

  const renderInteractiveHero = (section: HomeSection) => (
    <section className={`py-32 ${getBgClass(section.config.backgroundColor)} ${getAnimationClass(section.config.animation)} relative overflow-hidden`}>
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={section.config.premiumImage} 
          alt="Premium background"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20"></div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center space-y-8 max-w-6xl mx-auto">
          <div className="inline-flex items-center bg-primary/10 backdrop-blur-sm rounded-full px-6 py-3 mb-6">
            <Crown className="h-5 w-5 text-primary mr-2" />
            <span className="text-sm font-semibold text-primary">Premium Author Platform</span>
          </div>
          
          <h1 className="text-7xl font-bold tracking-tight bg-gradient-to-br from-foreground via-primary to-accent bg-clip-text text-transparent">
            {section.config.title}
          </h1>
          <p className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            {section.config.subtitle}
          </p>
          
          {/* Feature highlights */}
          <div className="flex justify-center gap-8 my-12">
            {section.config.features?.map((feature: any, index: number) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <div className="text-primary">
                    {getIcon(feature.icon)}
                  </div>
                </div>
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
          
          <div className="flex gap-6 justify-center flex-wrap">
            {section.config.buttons?.map((button: any, index: number) => (
              <Button 
                key={index}
                size="lg" 
                variant={button.variant === 'primary' ? 'default' : 'outline'}
                onClick={() => navigate(button.url)}
                className={`
                  text-lg px-8 py-4 h-14 
                  ${button.effect === 'glow' ? 'shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35' : ''}
                  ${button.effect === 'hover-lift' ? 'hover:scale-105' : ''}
                  transition-all duration-300
                `}
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

  const renderPremiumShowcase = (section: HomeSection) => (
    <section className={`py-24 ${getBgClass(section.config.backgroundColor)} ${getAnimationClass(section.config.animation)}`}>
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-gradient-to-r from-primary/10 to-accent/10 rounded-full px-6 py-3 mb-6">
            <Zap className="h-5 w-5 text-primary mr-2" />
            <span className="text-sm font-semibold text-primary">Premium Features</span>
          </div>
          <h2 className="text-5xl font-bold mb-6">{section.config.title}</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">{section.config.subtitle}</p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {section.config.items?.map((item: any, index: number) => (
            <Card key={index} className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-card/50 to-card/80 backdrop-blur-sm hover:scale-105 overflow-hidden">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-gradient-to-r from-primary to-accent text-white">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                </div>
              </div>
              
              <CardHeader className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <div className="text-primary">
                    {getIcon(item.icon)}
                  </div>
                </div>
                <CardTitle className="text-xl font-bold">{item.title}</CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed">{item.description}</CardDescription>
                
                <div className="space-y-2">
                  {item.features?.map((feature: string, fIndex: number) => (
                    <div key={fIndex} className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white transition-colors">
                  Try Interactive Demo
                  <Play className="ml-2 h-4 w-4" />
                </Button>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );

  const renderSuccessStories = (section: HomeSection) => {
    const stories = section.config.stories || [];
    const currentStory = stories[currentStoryIndex];

    if (!currentStory) return null;

    return (
      <section className={`py-24 ${getBgClass(section.config.backgroundColor)} ${getAnimationClass(section.config.animation)}`}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">{section.config.title}</h2>
            <p className="text-xl text-muted-foreground">{section.config.subtitle}</p>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <Card className="overflow-hidden bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border-0 shadow-2xl">
              <div className="grid lg:grid-cols-2 gap-0">
                <div className="p-12 flex flex-col justify-center">
                  <div className="mb-8">
                    <div className="flex items-center mb-6">
                      <img 
                        src={currentStory.image} 
                        alt={currentStory.name}
                        className="w-16 h-16 rounded-full object-cover mr-6"
                      />
                      <div>
                        <h3 className="text-2xl font-bold">{currentStory.name}</h3>
                        <p className="text-primary font-semibold">{currentStory.genre}</p>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-lg px-4 py-2">
                        {currentStory.achievement}
                      </Badge>
                    </div>
                    
                    <blockquote className="text-xl italic text-muted-foreground mb-8 leading-relaxed">
                      "{currentStory.quote}"
                    </blockquote>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center p-4 bg-primary/5 rounded-lg">
                        <div className="text-2xl font-bold text-primary">Before</div>
                        <div className="text-sm text-muted-foreground">{currentStory.stats.before}</div>
                      </div>
                      <div className="text-center p-4 bg-green-500/10 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">After</div>
                        <div className="text-sm text-muted-foreground">{currentStory.stats.after}</div>
                      </div>
                    </div>
                    
                    <div className="text-center mt-4 text-sm text-muted-foreground">
                      Transformation time: {currentStory.stats.timeframe}
                    </div>
                  </div>
                </div>
                
                <div className="relative bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-12">
                  <img 
                    src={currentStory.bookCover} 
                    alt="Book cover"
                    className="max-w-48 rounded-lg shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300"
                  />
                </div>
              </div>
              
              <div className="flex justify-center items-center p-6 border-t bg-muted/30">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCurrentStoryIndex((prev) => prev === 0 ? stories.length - 1 : prev - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex space-x-2 mx-6">
                  {stories.map((_: any, index: number) => (
                    <button
                      key={index}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === currentStoryIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                      onClick={() => setCurrentStoryIndex(index)}
                    />
                  ))}
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCurrentStoryIndex((prev) => prev === stories.length - 1 ? 0 : prev + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>
    );
  };

  const renderLiveDemo = (section: HomeSection) => (
    <section className={`py-24 ${getBgClass(section.config.backgroundColor)} ${getAnimationClass(section.config.animation)}`}>
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">{section.config.title}</h2>
          <p className="text-xl text-muted-foreground">{section.config.subtitle}</p>
        </div>
        
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {section.config.demos?.map((demo: any) => (
              <Button
                key={demo.id}
                variant={selectedDemo === demo.id ? 'default' : 'outline'}
                className="h-auto p-6 text-left justify-start"
                onClick={() => setSelectedDemo(demo.id)}
              >
                <div>
                  <div className="flex items-center mb-2">
                    <div className="text-lg font-semibold">{demo.title}</div>
                    {demo.premium && <Crown className="h-4 w-4 ml-2 text-primary" />}
                  </div>
                  <div className="text-sm text-muted-foreground">{demo.description}</div>
                </div>
              </Button>
            ))}
          </div>
          
          <Card className="overflow-hidden bg-gradient-to-br from-card/50 to-card/80 backdrop-blur-sm border-0 shadow-2xl">
            <div className="h-96 bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center">
              {section.config.demos?.find((d: any) => d.id === selectedDemo) && (
                <div className="text-center">
                  <img 
                    src={section.config.demos.find((d: any) => d.id === selectedDemo)?.image}
                    alt="Demo preview"
                    className="max-w-md rounded-lg shadow-lg mb-6"
                  />
                  <Button size="lg" className="bg-gradient-to-r from-primary to-accent">
                    <Play className="mr-2 h-5 w-5" />
                    Try Interactive Demo
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );

  const renderPremiumPricing = (section: HomeSection) => (
    <section className={`py-24 ${getBgClass(section.config.backgroundColor)} ${getAnimationClass(section.config.animation)}`}>
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">{section.config.title}</h2>
          <p className="text-xl text-muted-foreground">{section.config.subtitle}</p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {section.config.plans?.map((plan: any) => (
            <Card key={plan.id} className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
              plan.popular ? 'border-primary/50 shadow-xl bg-gradient-to-br from-primary/5 to-primary/10' : 'bg-card/50 backdrop-blur-sm'
            }`}>
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-accent text-white text-center py-3 text-sm font-medium">
                  <Crown className="inline h-4 w-4 mr-2" />
                  Most Popular Choice
                </div>
              )}
              
              <CardHeader className={plan.popular ? 'pt-16' : 'pt-8'}>
                <div className="text-center">
                  <img 
                    src={plan.image} 
                    alt={plan.name}
                    className="w-20 h-20 rounded-full object-cover mx-auto mb-6"
                  />
                  <CardTitle className="text-3xl font-bold">{plan.name}</CardTitle>
                  <div className="text-5xl font-bold my-4">
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                    {plan.price > 0 && <span className="text-lg font-normal text-muted-foreground">/{plan.period}</span>}
                  </div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Included Features:</h4>
                  <ul className="space-y-3">
                    {plan.features?.map((feature: string, index: number) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {plan.premiumFeatures && (
                  <div>
                    <h4 className="font-semibold mb-3 text-primary">Premium Features:</h4>
                    <ul className="space-y-3">
                      {plan.premiumFeatures.map((feature: string, index: number) => (
                        <li key={index} className="flex items-center">
                          <Crown className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                          <span className="text-sm font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {plan.limitations && (
                  <div>
                    <h4 className="font-semibold mb-3 text-muted-foreground">Limitations:</h4>
                    <ul className="space-y-2">
                      {plan.limitations.map((limitation: string, index: number) => (
                        <li key={index} className="text-sm text-muted-foreground">
                          • {limitation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <Button 
                  className="w-full text-lg py-6" 
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => navigate('/auth')}
                  size="lg"
                >
                  {plan.name === 'Free' ? 'Get Started Free' : 'Start Free Trial'}
                  {plan.popular && <Crown className="ml-2 h-4 w-4" />}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );

  const renderSection = (section: HomeSection) => {
    switch (section.type) {
      case 'interactive_hero':
        return renderInteractiveHero(section);
      case 'premium_showcase':
        return renderPremiumShowcase(section);
      case 'success_stories':
        return renderSuccessStories(section);
      case 'live_demo':
        return renderLiveDemo(section);
      case 'premium_pricing':
        return renderPremiumPricing(section);
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
      {/* Premium Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary via-accent to-secondary rounded-xl flex items-center justify-center">
                <BookOpen className="h-7 w-7 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">NP Page</span>
                <div className="text-xs text-muted-foreground">Premium Author Platform</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/auth')} className="hover:bg-primary/5">
                Sign In
              </Button>
              <Button onClick={() => navigate('/auth')} className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                <Crown className="mr-2 h-4 w-4" />
                Start Premium
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Dynamic Interactive Sections */}
      {sections.map(section => (
        <div key={section.id}>
          {renderSection(section)}
        </div>
      ))}

      {/* Enhanced Footer */}
      <footer className="border-t bg-gradient-to-br from-muted/40 via-background to-muted/20 py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center bg-gradient-to-r from-primary/10 to-accent/10 rounded-full px-6 py-3 mb-6">
              <Sparkles className="h-5 w-5 text-primary mr-2" />
              <span className="text-sm font-semibold text-primary">Join the Premium Experience</span>
            </div>
            
            <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Author Career?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of authors who trust our premium platform to showcase their work and connect with readers worldwide.
            </p>
            
            <form onSubmit={handleNewsletterSignup} className="flex gap-4 max-w-md mx-auto mb-8">
              <Input
                type="email"
                placeholder="Enter your email for premium updates"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1"
              />
              <Button type="submit" disabled={loading} className="px-8 bg-gradient-to-r from-primary to-accent">
                {loading ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </form>
            
            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth')} className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                <Crown className="mr-2 h-5 w-5" />
                Start Your Premium Journey
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold">NP Page</span>
                <div className="text-xs text-muted-foreground">Premium Author Platform</div>
              </div>
            </div>
            <p className="text-muted-foreground text-center md:text-right">
              © 2024 NP Page. Empowering authors with premium tools worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;