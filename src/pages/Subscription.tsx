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
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch subscription plans (only Free and Pro)
      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('*')
        .in('name', ['Free', 'Pro'])
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
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-muted-foreground text-lg mb-6">
          Start with a 15-day Pro trial, then choose the plan that works best for you
        </p>
        
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className={billingCycle === 'monthly' ? 'font-semibold' : 'text-muted-foreground'}>
            Monthly
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className="relative"
          >
            <div className={`absolute inset-0 rounded-md transition-all ${
              billingCycle === 'yearly' ? 'bg-primary' : 'bg-muted'
            }`} />
            <div className="relative z-10 px-2">
              {billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}
            </div>
          </Button>
          <span className={billingCycle === 'yearly' ? 'font-semibold' : 'text-muted-foreground'}>
            Yearly
            <Badge variant="secondary" className="ml-2">Save 17%</Badge>
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {plans.map((plan) => {
          const isCurrentPlan = subscription?.subscription_plans.id === plan.id && subscription?.status === 'active';
          const isOnTrialForPlan = subscription?.subscription_plans.id === plan.id && subscription?.status === 'trialing';
          const isPro = plan.name === 'Pro';
          const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
          const priceLabel = billingCycle === 'monthly' ? '/month' : '/year';

          return (
            <Card key={plan.id} className={`relative ${isPro ? 'border-primary shadow-lg' : ''}`}>
              {isPro && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Crown className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  {isPro && <Zap className="w-5 h-5 text-primary" />}
                  {plan.name}
                </CardTitle>
                <CardDescription>
                  {plan.name === 'Free' ? 'Perfect for getting started' : 'Everything you need to grow'}
                </CardDescription>
                <div className="text-3xl font-bold">
                  ${price}
                  <span className="text-lg text-muted-foreground font-normal">{priceLabel}</span>
                </div>
                {isOnTrialForPlan && (
                  <Badge variant="outline" className="mt-2">
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
                  variant={isPro ? "default" : "outline"}
                  disabled={isCurrentPlan || isOnTrialForPlan}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {isCurrentPlan ? 'Current Plan' : 
                   isOnTrialForPlan ? 'On Trial' :
                   plan.name === 'Free' ? 'Downgrade to Free' : 
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