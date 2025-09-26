import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';

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
  media_kit: boolean;
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
  const { subscription, isOnTrial, trialDaysLeft } = useSubscription();

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
        () => {
          console.log('Subscription plans changed, refetching...');
          fetchData(); // Refetch data when plans change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getPackageDescription = (plan: SubscriptionPlan) => {
    if (plan.price_monthly === 0) return 'Perfect for getting started';
    if (plan.name.toLowerCase().includes('basic')) return 'Essential features for authors';
    if (plan.name.toLowerCase().includes('pro')) return 'Everything you need to grow';
    if (plan.name.toLowerCase().includes('enterprise')) return 'Advanced features for professionals';
    return 'Complete publishing solution';
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

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Trial Banner */}
      {isOnTrial() && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-900">
                    Pro Trial Active - {trialDaysLeft} days left
                  </p>
                  <p className="text-sm text-amber-700">
                    Enjoy unlimited access to all Pro features during your trial
                  </p>
                </div>
              </div>
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Choose Your Plan
        </h1>
        <p className="text-muted-foreground text-lg mb-6">
          Select the plan that best fits your publishing needs
        </p>
        
        {/* Debug info */}
        <p className="text-sm text-muted-foreground mb-4">
          {plans.length} packages available
        </p>
        
        <div className="flex items-center justify-center gap-4 mb-8 p-1 bg-muted rounded-full w-fit mx-auto">
          <Button
            variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBillingCycle('monthly')}
            className="rounded-full px-6"
          >
            Monthly
          </Button>
          <Button
            variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBillingCycle('yearly')}
            className="rounded-full px-6 relative"
          >
            Yearly
            <Badge variant="secondary" className="ml-2 text-xs">Save 17%</Badge>
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-6 max-w-7xl mx-auto">
        {plans.map((plan, index) => {
          const isCurrentPlan = subscription?.subscription_plans.id === plan.id && subscription?.status === 'active';
          const isOnTrialForPlan = subscription?.subscription_plans.id === plan.id && subscription?.status === 'trialing';
          const isPremium = plan.price_monthly > 0; // Paid plan is premium
          const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
          const priceLabel = billingCycle === 'monthly' ? '/month' : '/year';
          const isPopular = plan.name === 'Pro' || index === 1; // Mark middle plan or Pro as popular

          return (
            <Card key={plan.id} className={`relative ${isPremium ? 'border-primary shadow-lg' : ''}`}>
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Crown className="w-3 h-3 mr-1" />
                    Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="flex items-center justify-center gap-2 text-xl">
                  {isPremium && <Zap className="w-5 h-5 text-primary" />}
                  {plan.name}
                </CardTitle>
                <CardDescription className="mt-2">
                  {getPackageDescription(plan)}
                </CardDescription>
                <div className="text-3xl font-bold mt-4">
                  <span className="text-primary">${price}</span>
                  <span className="text-lg text-muted-foreground font-normal">{priceLabel}</span>
                </div>
                {billingCycle === 'yearly' && plan.price_monthly > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    ${(plan.price_monthly * 12).toFixed(0)} billed annually
                  </p>
                )}
                {isOnTrialForPlan && (
                  <Badge variant="outline" className="mt-3">
                    On Trial - {trialDaysLeft} days left
                  </Badge>
                )}
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {Array.isArray(plan.features) ? plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  )) : null}
                </ul>

                <Button 
                  className="w-full" 
                  variant={isPremium ? "default" : "outline"}
                  disabled={isCurrentPlan || isOnTrialForPlan}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {isCurrentPlan ? 'Current Plan' : 
                   isOnTrialForPlan ? 'On Trial' :
                   plan.price_monthly === 0 ? 'Downgrade to Free' : 
                   'Upgrade Now'}
                </Button>

                {(isCurrentPlan || isOnTrialForPlan) && (
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    {isOnTrialForPlan ? 'Your trial is active' : 'Your current active plan'}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {subscription && (
        <Card className="mt-8 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>Manage your subscription details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-semibold">{subscription.subscription_plans.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={subscription.status === 'active' ? 'default' : 
                              subscription.status === 'trialing' ? 'secondary' : 'secondary'}>
                  {subscription.status === 'trialing' ? 'Trial' : subscription.status}
                </Badge>
              </div>
              {subscription.trial_ends_at && subscription.status === 'trialing' && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Trial ends</p>
                  <p className="font-semibold">
                    {new Date(subscription.trial_ends_at).toLocaleDateString()}
                  </p>
                </div>
              )}
              {subscription.current_period_end && subscription.status === 'active' && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Next billing date</p>
                  <p className="font-semibold">
                    {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Book Usage Stats */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Book Usage</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{userStats.totalBooks}</p>
                  <p className="text-xs text-muted-foreground">Total Books</p>
                  {subscription.subscription_plans.max_books && (
                    <p className="text-xs text-muted-foreground">
                      of {subscription.subscription_plans.max_books} allowed
                    </p>
                  )}
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{userStats.publishedBooks}</p>
                  <p className="text-xs text-muted-foreground">Published Books</p>
                </div>
              </div>
              
              {subscription.subscription_plans.max_books && 
               userStats.totalBooks >= subscription.subscription_plans.max_books && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    You've reached your book limit. Upgrade to Pro for unlimited books.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}