import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Crown, Zap, Clock, Star, ArrowRight, Sparkles, Shield, TrendingUp, Globe, Palette, BarChart3, MessageCircle, FileText, Award, Calendar, HelpCircle, Newspaper, Eye, Users, BookOpen, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { useDynamicFeatures } from '@/hooks/useDynamicFeatures';

interface SubscriptionPlan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  features: any;
  max_books: number;
  max_publications: number;
  custom_domain: boolean;
  advanced_analytics: boolean;
  premium_themes: boolean;
  no_watermark: boolean;
  contact_form: boolean;
  newsletter_integration: boolean;
  blog: boolean;
  events: boolean;
  awards: boolean;
  faq: boolean;
}

interface UserSubscription {
  id: string;
  plan_id: string;
  status: string;
  current_period_end: string;
  subscription_plans: SubscriptionPlan;
  trial_ends_at?: string;
}

interface UserStats {
  totalBooks: number;
  publishedBooks: number;
}

export default function Subscription() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({ totalBooks: 0, publishedBooks: 0 });
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { toast } = useToast();
  const { subscription, isOnTrial, trialDaysLeft, refreshSubscription } = useSubscription();
  const { getPlanFeatures, getFeaturesByCategory, coreFeatures, premiumFeatures, loading: featuresLoading } = useDynamicFeatures();

  useEffect(() => {
    fetchData();
    
    // Set up real-time subscription to listen for changes in subscription plans
    const channel = supabase
      .channel('subscription_plans_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'subscription_plans'
        },
        (payload) => {
          console.log('Subscription plans changed, refetching...', payload);
          fetchData(); // Refetch data when plans change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getPackageDescription = (plan: SubscriptionPlan) => {
    if (plan.price_monthly === 0) return 'Perfect for getting started with essential features';
    if (plan.name.toLowerCase().includes('pro')) return 'Everything you need to build a professional author presence';
    if (plan.name.toLowerCase().includes('enterprise')) return 'Advanced tools for established authors and publishers';
    return 'Complete publishing and marketing solution';
  };

  const getFeatureIcon = (featureName: string) => {
    const iconMap: { [key: string]: any } = {
      'unlimited books': BookOpen,
      'books': BookOpen,
      'book-open': BookOpen,
      'premium themes': Palette,
      'themes': Palette,
      'palette': Palette,
      'advanced analytics': BarChart3,
      'analytics': BarChart3,
      'bar-chart': BarChart3,
      'trending-up': TrendingUp,
      'custom domain': Globe,
      'domain': Globe,
      'globe': Globe,
      'contact forms': MessageCircle,
      'contact': MessageCircle,
      'message-circle': MessageCircle,
      'newsletter': FileText,
      'file-text': FileText,
      'blog': Newspaper,
      'newspaper': Newspaper,
      'events': Calendar,
      'calendar': Calendar,
      'awards': Award,
      'award': Award,
      'faq': HelpCircle,
      'help-circle': HelpCircle,
      'support': Users,
      'users': Users,
      'watermark': Shield,
      'security': Shield,
      'shield': Shield,
      'profile': Users
    };
    
    for (const [key, icon] of Object.entries(iconMap)) {
      if (featureName.toLowerCase().includes(key)) {
        return icon;
      }
    }
    return Check;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all available subscription plans dynamically
      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly');

      // Fetch user's books stats
      const { data: booksData } = await supabase
        .from('books')
        .select('status')
        .eq('user_id', user.id);

      const totalBooks = booksData?.length || 0;
      const publishedBooks = booksData?.filter(book => book.status === 'published').length || 0;

      setPlans(plansData || []);
      setUserStats({ totalBooks, publishedBooks });
      console.log(`${plansData?.length || 0} subscription plans loaded:`, plansData);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    // This would integrate with Stripe when available
    toast({
      title: "Payment Integration Required",
      description: "Stripe integration will be added in a future update to enable plan upgrades.",
    });
  };

  const getPlanUsagePercentage = () => {
    if (!subscription?.subscription_plans.max_books || subscription.subscription_plans.max_books === -1) return 0;
    return Math.min((userStats.totalBooks / subscription.subscription_plans.max_books) * 100, 100);
  };

  if (loading || featuresLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your subscription options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Enhanced Trial Banner */}
      {isOnTrial() && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 mb-8 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-amber-100 rounded-full">
                  <Crown className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-amber-900 text-lg">
                    🎉 Pro Trial Active - {trialDaysLeft} days remaining
                  </p>
                  <p className="text-amber-700">
                    You're experiencing all Pro features during your 30-day trial
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm text-amber-600 font-medium">{trialDaysLeft}/30 days</p>
                  <Progress value={(trialDaysLeft / 30) * 100} className="w-20 h-2" />
                </div>
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">Real-time sync enabled</span>
        </div>
        
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent">
          Choose Your Author Plan
        </h1>
        <p className="text-muted-foreground text-xl mb-4 max-w-2xl mx-auto">
          Unlock powerful features to showcase your work, connect with readers, and grow your author brand
        </p>
        
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-8">
          <Shield className="w-4 h-4" />
          <span>30-day free trial • No credit card required • Cancel anytime</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="current" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Current Subscription
          </TabsTrigger>
          <TabsTrigger value="packages" className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Subscription Packages
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Compare All Features
          </TabsTrigger>
        </TabsList>

        {/* Current Subscription Tab */}
        <TabsContent value="current" className="space-y-6">
          {subscription ? (
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-600/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Crown className="w-6 h-6 text-primary" />
                      Your Current Plan
                    </CardTitle>
                    <CardDescription>
                      {subscription.status === 'trialing' ? 'You are currently on a free trial' : 'Your active subscription details'}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={refreshSubscription}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Plan</p>
                      <p className="text-2xl font-bold text-primary">{subscription.subscription_plans.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={subscription.status === 'active' ? 'default' : subscription.status === 'trialing' ? 'secondary' : 'destructive'}>
                        {subscription.status}
                      </Badge>
                    </div>
                    {subscription.trial_ends_at && (
                      <div>
                        <p className="text-sm text-muted-foreground">Trial ends</p>
                        <p className="font-semibold">
                          {new Date(subscription.trial_ends_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-muted-foreground">Book Usage</p>
                        <p className="text-sm font-medium">
                          {userStats.totalBooks}{subscription.subscription_plans.max_books === -1 ? ' (Unlimited)' : subscription.subscription_plans.max_books !== -1 ? `/${subscription.subscription_plans.max_books}` : ''}
                        </p>
                      </div>
                      {subscription.subscription_plans.max_books !== -1 && (
                        <Progress 
                          value={getPlanUsagePercentage()} 
                          className="h-2"
                        />
                      )}
                      {subscription.subscription_plans.max_books === -1 && (
                        <div className="text-center p-2 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800 font-medium">
                            ✅ Unlimited Books Available
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-primary">{userStats.totalBooks}</p>
                        <p className="text-xs text-muted-foreground">Total Books</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-primary">{userStats.publishedBooks}</p>
                        <p className="text-xs text-muted-foreground">Published</p>
                      </div>
                    </div>
                    
                    {subscription.subscription_plans.max_books !== -1 && 
                     userStats.totalBooks >= subscription.subscription_plans.max_books && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800 font-medium mb-1">
                          📚 Book limit reached
                        </p>
                        <p className="text-sm text-amber-700">
                          Upgrade to add more books to your profile
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Current Plan Features */}
                <Separator className="my-6" />
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Your Plan Features</h3>
                  
                  {/* Core Features */}
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Core Features
                    </h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      {getFeaturesByCategory(subscription.subscription_plans.id, 'core').map((feature, idx) => {
                        const IconComponent = getFeatureIcon(feature.icon);
                        return (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="p-1 bg-green-100 rounded">
                              <IconComponent className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm text-green-900">{feature.name}</p>
                              <p className="text-xs text-green-700">{feature.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Premium Features */}
                  {getFeaturesByCategory(subscription.subscription_plans.id, 'premium').length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Crown className="w-4 h-4" />
                        Premium Features
                      </h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        {getFeaturesByCategory(subscription.subscription_plans.id, 'premium').map((feature, idx) => {
                          const IconComponent = getFeatureIcon(feature.icon);
                          return (
                            <div key={idx} className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                              <div className="p-1 bg-purple-100 rounded">
                                <IconComponent className="w-4 h-4 text-purple-600" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm text-purple-900">{feature.name}</p>
                                <p className="text-xs text-purple-700">{feature.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
                <p className="text-muted-foreground mb-4">You don't have an active subscription yet. Choose a plan to get started!</p>
                <Button onClick={() => (document.querySelector('[value="packages"]') as HTMLElement)?.click()}>
                  View Packages
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Subscription Packages Tab */}
        <TabsContent value="packages" className="space-y-6">
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-6 mb-8 p-2 bg-muted/50 rounded-full w-fit mx-auto">
            <Button
              variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBillingCycle('monthly')}
              className="rounded-full px-8 transition-all duration-200"
            >
              Monthly
            </Button>
            <Button
              variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBillingCycle('yearly')}
              className="rounded-full px-8 relative transition-all duration-200"
            >
              Yearly
              <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-800">
                <TrendingUp className="w-3 h-3 mr-1" />
                Save 17%
              </Badge>
            </Button>
          </div>

          {/* Enhanced Plans Grid */}
          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => {
              const isCurrentPlan = subscription?.subscription_plans.id === plan.id && subscription?.status === 'active';
              const isOnTrialForPlan = subscription?.subscription_plans.id === plan.id && subscription?.status === 'trialing';
              const isPremium = plan.price_monthly > 0;
              const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
              const priceLabel = billingCycle === 'monthly' ? '/month' : '/year';
              const isPopular = plan.name === 'Pro';
              const planFeatures = getPlanFeatures(plan.id);
              const coreFeaturesList = planFeatures.filter(f => f.category === 'core');
              const premiumFeaturesList = planFeatures.filter(f => f.category === 'premium');

              return (
                <Card 
                  key={plan.id} 
                  className={`relative transition-all duration-300 hover:shadow-xl ${
                    isPremium ? 'border-primary shadow-lg scale-105' : 'hover:scale-102'
                  } ${isCurrentPlan || isOnTrialForPlan ? 'ring-2 ring-primary' : ''}`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white px-4 py-1 text-sm">
                        <Crown className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-6 pt-8">
                    <div className="mb-4">
                      {isPremium ? (
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Zap className="w-8 h-8 text-white" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <BookOpen className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                    <CardDescription className="text-base mb-6">
                      {getPackageDescription(plan)}
                    </CardDescription>
                    
                    <div className="mb-6">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold">${price}</span>
                        <span className="text-lg text-muted-foreground">{priceLabel}</span>
                      </div>
                      {billingCycle === 'yearly' && plan.price_monthly > 0 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          ${(plan.price_monthly * 12).toFixed(0)} billed annually
                        </p>
                      )}
                      {isOnTrialForPlan && (
                        <Badge variant="outline" className="mt-3 bg-amber-50 text-amber-700 border-amber-200">
                          <Clock className="w-3 h-3 mr-1" />
                          On Trial - {trialDaysLeft} days left
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Core Features */}
                    {coreFeaturesList.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Core Features
                        </h4>
                        <div className="space-y-3">
                          {coreFeaturesList.map((feature, idx) => {
                            const IconComponent = getFeatureIcon(feature.icon);
                            return (
                              <div key={idx} className="flex items-start gap-3">
                                <div className="p-1 bg-green-100 rounded">
                                  <IconComponent className="w-4 h-4 text-green-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{feature.name}</p>
                                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Premium Features */}
                    {premiumFeaturesList.length > 0 && (
                      <div className="mb-8">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                          <Crown className="w-4 h-4" />
                          Premium Features
                        </h4>
                        <div className="space-y-3">
                          {premiumFeaturesList.map((feature, idx) => {
                            const IconComponent = getFeatureIcon(feature.icon);
                            return (
                              <div key={idx} className="flex items-start gap-3">
                                <div className="p-1 bg-purple-100 rounded">
                                  <IconComponent className="w-4 h-4 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{feature.name}</p>
                                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <Button 
                      className={`w-full h-12 ${isPremium ? 'bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90' : ''}`}
                      variant={isPremium ? "default" : "outline"}
                      disabled={isCurrentPlan || isOnTrialForPlan}
                      onClick={() => handleUpgrade(plan.id)}
                    >
                      {isCurrentPlan ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Current Plan
                        </>
                      ) : isOnTrialForPlan ? (
                        <>
                          <Clock className="w-4 h-4 mr-2" />
                          On Trial
                        </>
                      ) : (
                        <>
                          {isPremium ? 'Upgrade Now' : 'Get Started'}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Compare All Features Tab */}
        <TabsContent value="compare" className="space-y-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <BarChart3 className="w-6 h-6" />
                Feature Comparison
              </CardTitle>
              <CardDescription>
                Compare all features across our subscription plans (synced with package management)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold">Features</th>
                      {plans.map(plan => (
                        <th key={plan.id} className="text-center p-4">
                          <div className="font-semibold">{plan.name}</div>
                          <div className="text-sm text-muted-foreground font-normal">
                            ${plan.price_monthly}/month
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Core Features Section */}
                    <tr className="bg-muted/30">
                      <td colSpan={plans.length + 1} className="p-4 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Core Features
                      </td>
                    </tr>
                    {coreFeatures.map((feature, idx) => (
                      <tr key={`core-${idx}`} className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">{feature.name}</td>
                        {plans.map(plan => {
                          const planFeatures = getPlanFeatures(plan.id);
                          const hasFeature = planFeatures.some(f => f.id === feature.id);
                          return (
                            <td key={plan.id} className="text-center p-4">
                              {hasFeature ? (
                                <Check className="w-5 h-5 text-green-500 mx-auto" />
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    
                    {/* Premium Features Section */}
                    <tr className="bg-muted/30">
                      <td colSpan={plans.length + 1} className="p-4 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                        <Crown className="w-4 h-4" />
                        Premium Features
                      </td>
                    </tr>
                    {premiumFeatures.map((feature, idx) => (
                      <tr key={`premium-${idx}`} className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">{feature.name}</td>
                        {plans.map(plan => {
                          const planFeatures = getPlanFeatures(plan.id);
                          const hasFeature = planFeatures.some(f => f.id === feature.id);
                          return (
                            <td key={plan.id} className="text-center p-4">
                              {hasFeature ? (
                                <Check className="w-5 h-5 text-green-500 mx-auto" />
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}