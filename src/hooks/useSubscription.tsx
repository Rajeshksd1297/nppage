import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionPlan {
  id: string;
  name: string;
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
  subscription_plans: SubscriptionPlan;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // First try to get from user_subscriptions
      const { data: subscriptionData } = await supabase
        .from('user_subscriptions')
        .select(`
          subscription_plans (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (subscriptionData) {
        setSubscription(subscriptionData);
      } else {
        // Fallback to free plan
        const { data: freePlan } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('name', 'Free')
          .single();

        if (freePlan) {
          setSubscription({ subscription_plans: freePlan });
        }
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      // Fallback to free plan
      const { data: freePlan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('name', 'Free')
        .single();

      if (freePlan) {
        setSubscription({ subscription_plans: freePlan });
      }
    } finally {
      setLoading(false);
    }
  };

  const hasFeature = (feature: keyof SubscriptionPlan): boolean => {
    if (!subscription) return false;
    const value = subscription.subscription_plans[feature];
    return typeof value === 'boolean' ? value : false;
  };

  const getLimit = (type: 'books' | 'publications'): number => {
    if (!subscription) return 0;
    const limit = type === 'books' 
      ? subscription.subscription_plans.max_books 
      : subscription.subscription_plans.max_publications;
    return limit === -1 ? Infinity : limit;
  };

  const isPro = () => {
    return subscription?.subscription_plans.name === 'Pro';
  };

  const isFree = () => {
    return subscription?.subscription_plans.name === 'Free';
  };

  return {
    subscription,
    loading,
    hasFeature,
    getLimit,
    isPro,
    isFree,
    refetch: fetchSubscription
  };
}