import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Users, ArrowRight, CheckCircle, Eye, Activity, Book, BarChart3, 
  Palette, Rocket, Globe, Star, Sparkles, Trophy, TrendingUp, Bot, Camera, 
  Share, Mail, Play, ChevronLeft, ChevronRight, Crown, Zap, ChevronDown,
  Calendar, CreditCard, Shield, Check, Clock, Target, Award, MessageCircle,
  Newspaper, CalendarDays, Plus, Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEOHead';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { FeatureGate } from '@/components/FeatureGate';
import { TrialBanner } from '@/components/TrialBanner';
import heroAuthorsImage from '@/assets/hero-authors-workspace.jpg';
import profileShowcaseImage from '@/assets/profile-showcase.jpg';
import freePlanSuccessImage from '@/assets/free-plan-success.jpg';

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
  const [openFaqCategories, setOpenFaqCategories] = useState<Set<string>>(new Set());
  const [faqs, setFaqs] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Real-time subscription and admin settings
  const { hasFeature, isPro, isFree, isOnTrial, getCurrentPlanName, loading: subscriptionLoading } = useSubscription();
  const { hasFeatureAccess } = useAdminSettings();

  useEffect(() => {
    fetchSections();
    fetchPackages();
    fetchStats();
    fetchFaqs();
    
    // Set up real-time listeners for subscription changes
    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions'
        },
        () => {
          // Refetch data when subscription changes
          fetchPackages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('home_page_sections')
        .select('*')
        .eq('enabled', true)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      if (data && data.length > 0) {
        const transformedData = data.map(section => ({
          ...section,
          config: typeof section.config === 'object' ? section.config : {}
        }));
        setSections(transformedData as HomeSection[]);
      } else {
        // Set default sections if none exist
        setSections(getDefaultSections());
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      setSections(getDefaultSections());
    }
  };

  const fetchFaqs = async () => {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      if (data) {
        setFaqs(data);
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
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
      Chart3: <BarChart3 className="h-8 w-8" />,
      crown: <Crown className="h-8 w-8" />,
      zap: <Zap className="h-8 w-8" />,
      calendar: <Calendar className="h-8 w-8" />,
      'credit-card-off': <CreditCard className="h-8 w-8" />,
      'shield-check': <Shield className="h-8 w-8" />
    };
    
    return iconMap[iconName] || <BookOpen className="h-8 w-8" />;
  };

  const getBgClass = (bg: string) => {
    switch (bg) {
      case 'muted/50': return 'bg-muted/50';
      case 'muted/30': return 'bg-muted/30';
      case 'muted/20': return 'bg-muted/20';
      case 'primary/5': return 'bg-primary/5';
      case 'gradient-to-br from-primary/5 to-primary/10': return 'bg-gradient-to-br from-primary/5 to-primary/10';
      case 'gradient-to-br from-primary/15 via-accent/10 to-secondary/15': return 'bg-gradient-to-br from-primary/15 via-accent/10 to-secondary/15';
      case 'gradient-to-br from-background via-muted/10 to-background': return 'bg-gradient-to-br from-background via-muted/10 to-background';
      case 'gradient-to-br from-primary/5 via-background to-accent/5': return 'bg-gradient-to-br from-primary/5 via-background to-accent/5';
      case 'gradient-to-br from-muted/20 via-background to-muted/30': return 'bg-gradient-to-br from-muted/20 via-background to-muted/30';
      case 'gradient-to-br from-primary/10 via-accent/5 to-primary/10': return 'bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10';
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

  const toggleFaqCategory = (categoryName: string) => {
    const newOpenCategories = new Set(openFaqCategories);
    if (newOpenCategories.has(categoryName)) {
      newOpenCategories.delete(categoryName);
    } else {
      newOpenCategories.add(categoryName);
    }
    setOpenFaqCategories(newOpenCategories);
  };

  const getDefaultSections = (): HomeSection[] => [
    {
      id: 'hero',
      type: 'interactive_hero',
      title: 'Interactive Hero',
      enabled: true,
      order_index: 0,
      config: {
        title: 'Create Your Professional Author Profile',
        subtitle: 'Join thousands of authors who showcase their books and grow their audience with beautiful, professional profiles.',
        backgroundColor: 'gradient-to-br from-primary/5 via-background to-accent/5',
        premiumImage: heroAuthorsImage,
        trustSignals: ['No Setup Fee', 'Free Forever Plan', '30-Day Pro Trial'],
        features: [
          { icon: 'check', title: 'Free Forever', description: 'Get started completely free' },
          { icon: 'crown', title: 'Pro Features', description: '30-day trial included' },
          { icon: 'globe', title: 'Universal Links', description: 'Professional URLs' }
        ],
        buttons: [
          { text: 'Start Free', variant: 'primary', url: '/auth', effect: 'glow' },
          { text: 'Try Pro Free', variant: 'secondary', url: '/auth', effect: 'hover-lift' }
        ]
      }
    },
    {
      id: 'free-vs-pro',
      type: 'free_vs_pro',
      title: 'Free vs Pro Comparison',
      enabled: true,
      order_index: 1,
      config: {
        title: 'Choose Your Author Journey',
        subtitle: 'Start free or unlock premium features with our 30-day Pro trial.',
        backgroundColor: 'gradient-to-br from-background via-muted/10 to-background',
        plans: [
          {
            name: 'Free Plan',
            price: 0,
            period: 'forever',
            description: 'Perfect for getting started',
            image: freePlanSuccessImage,
            highlight: 'No Credit Card Required',
            popular: false,
            features: [
              'Professional author profile',
              'Showcase up to 3 books',
              'Basic analytics',
              'Universal profile link',
              'Contact form'
            ],
            ctaText: 'Start Free',
            ctaUrl: '/auth'
          },
          {
            name: 'Pro Plan',
            price: 19,
            period: 'month',
            description: 'For serious authors',
            image: profileShowcaseImage,
            highlight: '30-Day Free Trial',
            popular: true,
            features: [
              'Everything in Free',
              'Unlimited books',
              'Premium themes',
              'Advanced analytics',
              'Custom domain',
              'No watermarks',
              'Priority support'
            ],
            ctaText: 'Try Pro Free',
            ctaUrl: '/auth'
          }
        ]
      }
    }
  ];

  const renderInteractiveHero = (section: HomeSection) => (
    <section className={`py-32 ${getBgClass(section.config.backgroundColor)} ${getAnimationClass(section.config.animation)} relative overflow-hidden`}>
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={section.config.premiumImage || heroAuthorsImage} 
          alt="Authors collaborating"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20"></div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center space-y-8 max-w-6xl mx-auto">
          {/* Trust signals */}
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            {section.config.trustSignals?.map((signal: string, index: number) => (
              <div key={index} className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Check className="h-4 w-4 text-green-400 mr-2" />
                <span className="text-sm font-medium text-white">{signal}</span>
              </div>
            ))}
          </div>
          
          <h1 className="text-7xl font-bold tracking-tight bg-gradient-to-br from-white via-primary/90 to-accent bg-clip-text text-transparent">
            {section.config.title}
          </h1>
          <p className="text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed">
            {section.config.subtitle}
          </p>
          
          {/* Feature highlights */}
          <div className="flex justify-center gap-8 my-12">
            {section.config.features?.map((feature: any, index: number) => (
              <div key={index} className="text-center group">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-white/20 transition-all duration-300">
                  <div className="text-white">
                    {feature.icon === 'check' ? <Check className="h-8 w-8" /> : getIcon(feature.icon)}
                  </div>
                </div>
                <h3 className="font-bold text-white text-lg">{feature.title}</h3>
                <p className="text-sm text-white/80">{feature.description}</p>
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
                  text-xl px-12 py-6 h-16 font-bold
                  ${button.effect === 'glow' ? 'shadow-2xl shadow-primary/40 hover:shadow-3xl hover:shadow-primary/60' : ''}
                  ${button.effect === 'hover-lift' ? 'hover:scale-105' : ''}
                  ${button.variant === 'primary' ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' : ''}
                  ${button.variant === 'secondary' ? 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90' : ''}
                  transition-all duration-300
                `}
              >
                {button.variant === 'primary' && <Check className="mr-3 h-6 w-6" />}
                {button.variant === 'secondary' && <Crown className="mr-3 h-6 w-6" />}
                {button.text === 'Start Free Trial' ? 'Start Free' : button.text}
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );

  const renderFreeVsPro = (section: HomeSection) => (
    <section className={`py-24 ${getBgClass(section.config.backgroundColor)} ${getAnimationClass(section.config.animation)}`}>
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6">{section.config.title}</h2>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto">{section.config.subtitle}</p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {section.config.plans?.map((plan: any, index: number) => (
            <Card key={index} className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
              plan.popular ? 'border-primary/50 shadow-xl bg-gradient-to-br from-primary/5 to-primary/10' : 'bg-card/50 backdrop-blur-sm border-green-200'
            }`}>
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-accent text-white text-center py-3 text-sm font-medium">
                  <Crown className="inline h-4 w-4 mr-2" />
                  Most Popular Choice
                </div>
              )}
              
              {!plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-green-600 text-white text-center py-3 text-sm font-medium">
                  <Check className="inline h-4 w-4 mr-2" />
                  {plan.highlight}
                </div>
              )}
              
              <CardHeader className="pt-16">
                <div className="text-center">
                  <img 
                    src={plan.image} 
                    alt={plan.name}
                    className="w-20 h-20 rounded-full object-cover mx-auto mb-6"
                  />
                  <CardTitle className="text-3xl font-bold">{plan.name}</CardTitle>
                  <div className="text-5xl font-bold my-4">
                    {plan.price === 0 ? 'FREE' : `$${plan.price}`}
                    <span className="text-lg font-normal text-muted-foreground">/{plan.period}</span>
                  </div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features?.map((feature: string, fIndex: number) => (
                    <li key={fIndex} className="flex items-center">
                      <CheckCircle className={`h-5 w-5 mr-3 flex-shrink-0 ${plan.popular ? 'text-primary' : 'text-green-500'}`} />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full text-lg py-6" 
                  variant={plan.popular ? 'default' : 'default'}
                  onClick={() => navigate(plan.ctaUrl)}
                  size="lg"
                >
                  {plan.popular ? <Crown className="mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
                  {plan.ctaText}
                </Button>
                
                {plan.highlight && plan.popular && (
                  <p className="text-center text-sm text-muted-foreground">
                    {plan.highlight}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );

  const renderPremiumShowcase = (section: HomeSection) => (
    <section className={`py-24 ${getBgClass(section.config.backgroundColor)} ${getAnimationClass(section.config.animation)}`}>
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6">{section.config.title}</h2>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto">{section.config.subtitle}</p>
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
                  {item.premium ? (
                    <Badge className="bg-gradient-to-r from-primary to-accent text-white">
                      <Crown className="h-3 w-3 mr-1" />
                      Pro Feature
                    </Badge>
                  ) : (
                    <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                      <Check className="h-3 w-3 mr-1" />
                      Free Feature
                    </Badge>
                  )}
                </div>
              </div>
              
              <CardHeader className="space-y-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${
                  item.premium ? 'bg-gradient-to-br from-primary/20 to-accent/20' : 'bg-gradient-to-br from-green-500/20 to-green-600/20'
                }`}>
                  <div className={item.premium ? 'text-primary' : 'text-green-600'}>
                    {getIcon(item.icon)}
                  </div>
                </div>
                <CardTitle className="text-xl font-bold">{item.title}</CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed">{item.description}</CardDescription>
                
                <div className="space-y-2">
                  {item.features?.map((feature: string, fIndex: number) => (
                    <div key={fIndex} className="flex items-center text-sm">
                      <CheckCircle className={`h-4 w-4 mr-2 flex-shrink-0 ${item.premium ? 'text-primary' : 'text-green-500'}`} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button variant="outline" className={`w-full transition-colors ${
                  item.premium ? 'group-hover:bg-primary group-hover:text-white' : 'group-hover:bg-green-500 group-hover:text-white'
                }`}>
                  {item.premium ? (
                    <>
                      <Crown className="mr-2 h-4 w-4" />
                      Pro Feature
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Free Feature
                    </>
                  )}
                </Button>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );

  const renderFAQ = (section: HomeSection) => {
    // Group FAQs by category
    const faqsByCategory = faqs.reduce((acc: any, faq) => {
      const category = faq.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(faq);
      return acc;
    }, {});

    return (
      <section className={`py-24 ${getBgClass(section.config.backgroundColor)} ${getAnimationClass(section.config.animation)}`}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">{section.config.title || 'Frequently Asked Questions'}</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">{section.config.subtitle || 'Find answers to common questions about our platform.'}</p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            {Object.entries(faqsByCategory).length > 0 ? (
              <div className="grid md:grid-cols-2 gap-8">
                {Object.entries(faqsByCategory).map(([categoryName, categoryFaqs]: [string, any]) => (
                  <div key={categoryName} className="space-y-4">
                    <h3 className="text-2xl font-bold text-center mb-6 pb-3 border-b border-primary/20">
                      {categoryName}
                    </h3>
                    
                    <div className="space-y-4">
                      {categoryFaqs.map((faq: any, faqIndex: number) => {
                        const faqId = `${categoryName}-${faqIndex}`;
                        const isOpen = openFaqCategories.has(faqId);
                        
                        return (
                          <Collapsible key={faqIndex} open={isOpen} onOpenChange={() => toggleFaqCategory(faqId)}>
                            <CollapsibleTrigger asChild>
                              <Button 
                                variant="ghost" 
                                className="w-full text-left p-4 h-auto justify-between bg-card/50 hover:bg-card border border-border/50 rounded-lg"
                              >
                                <span className="font-semibold text-sm leading-relaxed pr-4">{faq.question}</span>
                                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="px-4 pb-4">
                              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                                {faq.answer}
                              </p>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Fallback to section config if no FAQs in database
              <div className="grid md:grid-cols-2 gap-8">
                {section.config.categories?.map((category: any, categoryIndex: number) => (
                  <div key={categoryIndex} className="space-y-4">
                    <h3 className="text-2xl font-bold text-center mb-6 pb-3 border-b border-primary/20">
                      {category.name}
                    </h3>
                    
                    <div className="space-y-4">
                      {category.questions?.map((qa: any, qaIndex: number) => {
                        const faqId = `${category.name}-${qaIndex}`;
                        const isOpen = openFaqCategories.has(faqId);
                        
                        return (
                          <Collapsible key={qaIndex} open={isOpen} onOpenChange={() => toggleFaqCategory(faqId)}>
                            <CollapsibleTrigger asChild>
                              <Button 
                                variant="ghost" 
                                className="w-full text-left p-4 h-auto justify-between bg-card/50 hover:bg-card border border-border/50 rounded-lg"
                              >
                                <span className="font-semibold text-sm leading-relaxed pr-4">{qa.question}</span>
                                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="px-4 pb-4">
                              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                                {qa.answer}
                              </p>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  };

  const renderTrialCTA = (section: HomeSection) => (
    <section className={`py-24 ${getBgClass(section.config.backgroundColor)} ${getAnimationClass(section.config.animation)}`}>
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">{section.config.title}</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">{section.config.subtitle}</p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Benefits */}
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                {section.config.benefits?.map((benefit: any, index: number) => (
                  <Card key={index} className="p-6 text-center bg-gradient-to-br from-card/50 to-card/80 backdrop-blur-sm border-0 hover:shadow-lg transition-shadow">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <div className="text-primary">
                        {getIcon(benefit.icon)}
                      </div>
                    </div>
                    <h3 className="font-bold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </Card>
                ))}
              </div>
              
              {/* Testimonial */}
              {section.config.testimonial && (
                <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                  <div className="flex items-center mb-4">
                    <img 
                      src={section.config.testimonial.image} 
                      alt={section.config.testimonial.author}
                      className="w-12 h-12 rounded-full object-cover mr-4"
                    />
                    <div>
                      <div className="font-semibold">{section.config.testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">{section.config.testimonial.role}</div>
                    </div>
                  </div>
                  <blockquote className="text-muted-foreground italic">
                    "{section.config.testimonial.quote}"
                  </blockquote>
                </Card>
              )}
            </div>
            
            {/* CTA */}
            <div className="text-center lg:text-left">
              <div className="p-8 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 rounded-2xl">
                <div className="mb-8">
                  <div className="text-6xl font-bold text-primary mb-2">30</div>
                  <div className="text-xl text-muted-foreground">Days Free Access</div>
                </div>
                
                <Button 
                  size="lg"
                  onClick={() => navigate(section.config.ctaButton.url)}
                  className="w-full text-lg py-6 h-16 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Crown className="mr-3 h-6 w-6" />
                  {section.config.ctaButton.text}
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
                
                <p className="text-sm text-muted-foreground mt-4">
                  No credit card required • Cancel anytime • Keep your profile forever
                </p>
              </div>
            </div>
          </div>
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
                        <p className="text-sm text-muted-foreground">Results in {currentStory.timeToResults}</p>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-lg px-4 py-2">
                        <Award className="h-4 w-4 mr-2" />
                        {currentStory.achievement}
                      </Badge>
                    </div>
                    
                    <blockquote className="text-xl italic text-muted-foreground mb-8 leading-relaxed">
                      "{currentStory.quote}"
                    </blockquote>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center p-4 bg-muted/20 rounded-lg">
                        <div className="text-lg font-bold text-muted-foreground">Before</div>
                        <div className="text-sm text-muted-foreground">{currentStory.stats.before}</div>
                      </div>
                      <div className="text-center p-4 bg-green-500/10 rounded-lg">
                        <div className="text-lg font-bold text-green-600">After</div>
                        <div className="text-sm text-muted-foreground">{currentStory.stats.after}</div>
                      </div>
                    </div>
                    
                    <div className="text-center mt-6">
                      <div className="text-sm text-muted-foreground mb-4">
                        {currentStory.stats.followers}
                      </div>
                      <Button variant="outline" className="hover:bg-primary hover:text-white">
                        <Target className="h-4 w-4 mr-2" />
                        See Their Profile
                      </Button>
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

  const renderFreeSuccess = (section: HomeSection) => (
    <section className={`py-24 ${getBgClass(section.config.backgroundColor)} ${getAnimationClass(section.config.animation)}`}>
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-green-500/10 rounded-full px-6 py-3 mb-6">
            <Check className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-sm font-semibold text-green-600">100% Free Success Stories</span>
          </div>
          <h2 className="text-4xl font-bold mb-6">{section.config.title}</h2>
          <p className="text-xl text-muted-foreground">{section.config.subtitle}</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {section.config.stories?.map((story: any, index: number) => (
            <Card key={index} className="text-center p-6 bg-gradient-to-br from-green-50/50 to-card/50 border border-green-200/50 hover:shadow-lg transition-shadow">
              <img 
                src={story.image} 
                alt={story.name}
                className="w-20 h-20 rounded-full object-cover mx-auto mb-4"
              />
              <h3 className="text-xl font-bold mb-2">{story.name}</h3>
              <p className="text-green-600 font-semibold mb-2">{story.genre}</p>
              <Badge className="bg-green-500 text-white mb-4">
                {story.achievement}
              </Badge>
              <blockquote className="text-sm text-muted-foreground italic mb-4 leading-relaxed">
                "{story.quote}"
              </blockquote>
              <div className="text-xs text-muted-foreground space-y-1">
                <div><strong>Plan:</strong> {story.plan}</div>
                <div><strong>Timeline:</strong> {story.timeline}</div>
                <div><strong>Result:</strong> {story.result}</div>
              </div>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button onClick={() => navigate('/auth')} className="bg-green-500 hover:bg-green-600 text-white">
            <Check className="mr-2 h-4 w-4" />
            Start Your Free Success Story
          </Button>
        </div>
      </div>
    </section>
  );

  const renderFinalCTA = (section: HomeSection) => (
    <section className={`py-24 ${getBgClass(section.config.backgroundColor)} ${getAnimationClass(section.config.animation)}`}>
      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Social Proof Numbers */}
          <div className="grid grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{section.config.socialProof.authorCount}</div>
              <div className="text-muted-foreground">Total Authors</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-500 mb-2">{section.config.socialProof.freeUsers}</div>
              <div className="text-muted-foreground">Started Free</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{section.config.socialProof.successRate}</div>
              <div className="text-muted-foreground">Success Rate</div>
            </div>
          </div>
          
          <h2 className="text-5xl font-bold">{section.config.title}</h2>
          <p className="text-xl text-muted-foreground">
            {section.config.subtitle}
          </p>
          
          {/* Guarantees */}
          <div className="flex flex-wrap justify-center gap-6 my-8">
            {section.config.guarantees?.map((guarantee: string, index: number) => (
              <div key={index} className="inline-flex items-center bg-green-500/10 rounded-full px-4 py-2">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm font-medium">{guarantee}</span>
              </div>
            ))}
          </div>
          
          {/* Dual CTA */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {section.config.buttons?.map((button: any, index: number) => (
              <Card key={index} className="p-6 text-center hover:shadow-xl transition-shadow">
                <Button 
                  size="lg" 
                  onClick={() => navigate(button.url)}
                  className={`w-full text-lg py-6 h-16 mb-4 ${
                    button.variant === 'primary' 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' 
                      : 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90'
                  }`}
                >
                  {button.variant === 'primary' && <Check className="mr-3 h-6 w-6" />}
                  {button.variant === 'secondary' && <Crown className="mr-3 h-6 w-6" />}
                  {button.text}
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
                <p className="text-sm text-muted-foreground">{button.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );

  const renderSection = (section: HomeSection) => {
    switch (section.type) {
      case 'interactive_hero':
        return renderInteractiveHero(section);
      case 'free_vs_pro':
        return renderFreeVsPro(section);
      case 'premium_showcase':
        return renderPremiumShowcase(section);
      case 'free_success':
        return renderFreeSuccess(section);
      case 'faq':
        return renderFAQ(section);
      case 'trial_cta':
        return renderTrialCTA(section);
      case 'success_stories':
        return renderSuccessStories(section);
      case 'final_cta':
        return renderFinalCTA(section);
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

  // Pro features showcase component
  const renderProFeaturesShowcase = () => (
    <section className="py-24 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Pro Features Available
          </h2>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
            {isPro() ? "You're using Pro features!" : isOnTrial() ? "Currently in your Pro trial" : "Upgrade to unlock premium capabilities"}
          </p>
          {!subscriptionLoading && (
            <Badge variant={isPro() ? "default" : isOnTrial() ? "secondary" : "outline"} className="mt-4">
              Current Plan: {getCurrentPlanName()} {isOnTrial() && "(Trial)"}
            </Badge>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Contact Management */}
          <FeatureGate feature="contact_form" inline={false}>
            <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 group">
              <div className="absolute top-0 right-0 p-4">
                {hasFeature('contact_form') && <Badge className="bg-green-500">Active</Badge>}
              </div>
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MessageCircle className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Contact Management</CardTitle>
                <CardDescription>
                  Manage reader inquiries and fan mail professionally
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Professional contact forms
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Email notifications
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Response tracking
                  </li>
                </ul>
                {hasFeature('contact_form') && hasFeatureAccess('newsletter') && (
                  <Button 
                    className="mt-4 w-full" 
                    variant="outline"
                    onClick={() => navigate('/user-contact-management')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Contacts
                  </Button>
                )}
              </CardContent>
            </Card>
          </FeatureGate>

          {/* Blog Management */}
          <FeatureGate feature="blog" inline={false}>
            <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 group">
              <div className="absolute top-0 right-0 p-4">
                {hasFeature('blog') && <Badge className="bg-green-500">Active</Badge>}
              </div>
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Newspaper className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Blog Management</CardTitle>
                <CardDescription>
                  Share your thoughts and connect with readers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Rich text editor
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    SEO optimization
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Categories & tags
                  </li>
                </ul>
                {hasFeature('blog') && hasFeatureAccess('blog') && (
                  <Button 
                    className="mt-4 w-full" 
                    variant="outline"
                    onClick={() => navigate('/user-blog-management')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Post
                  </Button>
                )}
              </CardContent>
            </Card>
          </FeatureGate>

          {/* Events Management */}
          <FeatureGate feature="events" inline={false}>
            <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 group">
              <div className="absolute top-0 right-0 p-4">
                {hasFeature('events') && <Badge className="bg-green-500">Active</Badge>}
              </div>
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <CalendarDays className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Event Management</CardTitle>
                <CardDescription>
                  Promote book launches and author events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Event calendar
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    RSVP tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Virtual & in-person
                  </li>
                </ul>
                {hasFeature('events') && hasFeatureAccess('events') && (
                  <Button 
                    className="mt-4 w-full" 
                    variant="outline"
                    onClick={() => navigate('/user-events-management')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                )}
              </CardContent>
            </Card>
          </FeatureGate>

          {/* Awards Management */}
          <FeatureGate feature="awards" inline={false}>
            <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 group">
              <div className="absolute top-0 right-0 p-4">
                {hasFeature('awards') && <Badge className="bg-green-500">Active</Badge>}
              </div>
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Awards & Recognition</CardTitle>
                <CardDescription>
                  Showcase your achievements and accolades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Award galleries
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Certificate uploads
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Featured highlights
                  </li>
                </ul>
                {hasFeature('awards') && hasFeatureAccess('awards') && (
                  <Button 
                    className="mt-4 w-full" 
                    variant="outline"
                    onClick={() => navigate('/user-awards-management')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Award
                  </Button>
                )}
              </CardContent>
            </Card>
          </FeatureGate>

          {/* Newsletter Management */}
          <FeatureGate feature="newsletter_integration" inline={false}>
            <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 group">
              <div className="absolute top-0 right-0 p-4">
                {hasFeature('newsletter_integration') && <Badge className="bg-green-500">Active</Badge>}
              </div>
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Newsletter</CardTitle>
                <CardDescription>
                  Build and engage your reader community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Subscriber management
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Campaign creation
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Analytics tracking
                  </li>
                </ul>
                {hasFeature('newsletter_integration') && hasFeatureAccess('newsletter') && (
                  <Button 
                    className="mt-4 w-full" 
                    variant="outline"
                    onClick={() => navigate('/user-newsletter-management')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Campaign
                  </Button>
                )}
              </CardContent>
            </Card>
          </FeatureGate>

          {/* Premium Themes */}
          <FeatureGate feature="premium_themes" inline={false}>
            <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 group">
              <div className="absolute top-0 right-0 p-4">
                {hasFeature('premium_themes') && <Badge className="bg-green-500">Active</Badge>}
              </div>
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Palette className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Premium Themes</CardTitle>
                <CardDescription>
                  Beautiful, professional theme designs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    50+ premium themes
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Custom styling
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Mobile optimized
                  </li>
                </ul>
                {hasFeature('premium_themes') && (
                  <Button 
                    className="mt-4 w-full" 
                    variant="outline"
                    onClick={() => navigate('/themes')}
                  >
                    <Palette className="h-4 w-4 mr-2" />
                    Browse Themes
                  </Button>
                )}
              </CardContent>
            </Card>
          </FeatureGate>
        </div>

        {!isPro() && !isOnTrial() && (
          <div className="text-center mt-16">
            <Button 
              size="lg" 
              onClick={() => navigate('/subscription')}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              <Crown className="h-5 w-5 mr-2" />
              Upgrade to Pro
            </Button>
          </div>
        )}
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-background">
      <TrialBanner />
      <SEOHead 
        title="AuthorPage - Professional Author Profiles & Book Showcases"
        description="Create professional author profiles, showcase your books, and grow your audience with beautiful universal links. Start free today!"
        keywords="author profile, book showcase, author website, book marketing, author platform, book promotion, author portfolio"
        image={heroAuthorsImage}
        url="https://authorpage.io"
        type="website"
      />
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
              <Button onClick={() => navigate('/auth')} className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                <Check className="mr-2 h-4 w-4" />
                Start Free
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
              <span className="text-sm font-semibold text-primary">Ready to Transform Your Author Career?</span>
            </div>
            
            <h2 className="text-3xl font-bold mb-6">Join 15,000+ Successful Authors Today</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start completely FREE and experience the difference a professional author platform makes.
            </p>
            
            <form onSubmit={handleNewsletterSignup} className="flex gap-4 max-w-md mx-auto mb-8">
              <Input
                type="email"
                placeholder="Enter your email to get started"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1"
              />
              <Button type="submit" disabled={loading} className="px-8 bg-gradient-to-r from-green-500 to-green-600">
                {loading ? 'Starting...' : 'Start Free'}
              </Button>
            </form>
            
            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth')} className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                <Check className="mr-2 h-5 w-5" />
                Start Free
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
              © 2024 NP Page. Empowering 15,000+ authors worldwide with premium tools.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;