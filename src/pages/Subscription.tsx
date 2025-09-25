import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
}

export default function Subscription() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch subscription plans
      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly');

      // Fetch current subscription
      const { data: subscriptionData } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      setPlans(plansData || []);
      setCurrentSubscription(subscriptionData);
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
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-muted-foreground text-lg mb-6">
          Unlock premium features to enhance your author presence
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
          const isCurrentPlan = currentSubscription?.subscription_plans.id === plan.id;
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
                  disabled={isCurrentPlan}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {isCurrentPlan ? 'Current Plan' : 
                   plan.name === 'Free' ? 'Get Started' : 
                   'Upgrade Now'}
                </Button>

                {isCurrentPlan && (
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    Your current active plan
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {currentSubscription && (
        <Card className="mt-8 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>Manage your subscription details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-semibold">{currentSubscription.subscription_plans.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={currentSubscription.status === 'active' ? 'default' : 'secondary'}>
                  {currentSubscription.status}
                </Badge>
              </div>
              {currentSubscription.current_period_end && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Next billing date</p>
                  <p className="font-semibold">
                    {new Date(currentSubscription.current_period_end).toLocaleDateString()}
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