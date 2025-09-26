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
  id: string;
  status: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  subscription_plans: SubscriptionPlan;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);

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

      // First try to get from user_subscriptions (including trials)
      const { data: subscriptionData } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (*)
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subscriptionData) {
        setSubscription(subscriptionData);
        
        // Check if trial is active
        if (subscriptionData.status === 'trialing' && subscriptionData.trial_ends_at) {
          const trialEnd = new Date(subscriptionData.trial_ends_at);
          const now = new Date();
          const isActive = trialEnd > now;
          setIsTrialActive(isActive);
          
          if (isActive) {
            const diffTime = trialEnd.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setTrialDaysLeft(diffDays);
          }
        }
      } else {
        // Fallback to free plan
        const { data: freePlan } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('name', 'Free')
          .single();

        if (freePlan) {
          setSubscription({ 
            id: '', 
            status: 'inactive', 
            trial_ends_at: null, 
            current_period_end: null,
            subscription_plans: freePlan 
          });
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
        setSubscription({ 
          id: '', 
          status: 'inactive', 
          trial_ends_at: null, 
          current_period_end: null,
          subscription_plans: freePlan 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const hasFeature = (feature: keyof SubscriptionPlan): boolean => {
    if (!subscription) return false;
    // If user is on trial or has active Pro subscription, they have access to Pro features
    if (subscription.status === 'trialing' || (subscription.status === 'active' && subscription.subscription_plans.name === 'Pro')) {
      return true;
    }
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
    return subscription?.subscription_plans.name === 'Pro' || subscription?.status === 'trialing';
  };

  const isFree = () => {
    return subscription?.subscription_plans.name === 'Free' && subscription?.status !== 'trialing';
  };

  const isOnTrial = () => {
    return subscription?.status === 'trialing' && isTrialActive;
  };

  return {
    subscription,
    loading,
    hasFeature,
    getLimit,
    isPro,
    isFree,
    isOnTrial,
    isTrialActive,
    trialDaysLeft,
    refetch: fetchSubscription
  };
}