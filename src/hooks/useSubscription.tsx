import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionPlan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  max_books: number;
  max_publications: number;
  max_support_tickets: number; // Monthly helpdesk ticket limit
  custom_domain: boolean;
  advanced_analytics: boolean;
  premium_themes: boolean;
  contact_form: boolean;
  newsletter_integration: boolean;
  blog: boolean;
  events: boolean;
  awards: boolean;
  faq: boolean;
  helpdesk?: boolean; // Core feature
  features: {
    contact_form?: boolean;
    newsletter_integration?: boolean;
    blog?: boolean;
    events?: boolean;
    awards?: boolean;
    faq?: boolean;
    gallery?: boolean;
    helpdesk?: boolean;
  };
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
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const subscriptionChannel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions'
        },
        (payload) => {
          console.log('User subscription changed:', payload);
          fetchSubscription();
        }
      )
      .subscribe();

    // Also listen for subscription plan changes to update features
    const plansChannel = supabase
      .channel('subscription-plans-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscription_plans'
        },
        (payload) => {
          console.log('Subscription plans changed:', payload);
          fetchSubscription();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscriptionChannel);
      supabase.removeChannel(plansChannel);
    };
  };

  const fetchSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      console.log('Fetching subscription for user:', user.id);
      const { data: subscriptionData, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans(*)
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        return;
      }

      console.log('Subscription data fetched:', subscriptionData);
      
      if (subscriptionData) {
        setSubscription(subscriptionData as UserSubscription);
        
        // Check trial status
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
        } else {
          setIsTrialActive(false);
          setTrialDaysLeft(0);
        }
      } else {
        console.log('No subscription found for user');
        setSubscription(null);
        setIsTrialActive(false);
        setTrialDaysLeft(0);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSubscription = () => {
    console.log('Manual subscription refresh triggered');
    fetchSubscription();
  };

  const hasFeature = (feature: keyof SubscriptionPlan | keyof SubscriptionPlan['features']): boolean => {
    if (!subscription?.subscription_plans) return false;
    
    const plan = subscription.subscription_plans;
    
    // Check if feature exists directly on plan
    if (feature in plan && typeof plan[feature as keyof SubscriptionPlan] === 'boolean') {
      return plan[feature as keyof SubscriptionPlan] as boolean;
    }
    
    // Check in features object
    if (plan.features && feature in plan.features) {
      return plan.features[feature as keyof SubscriptionPlan['features']] === true;
    }
    
    // Default feature mapping for compatibility
    switch (feature) {
      case 'contact_form':
        return plan.contact_form;
      case 'newsletter_integration':
        return plan.newsletter_integration;
      case 'blog':
      case 'events':
      case 'awards':
      case 'faq':
      case 'gallery':
        return plan.name !== 'Free'; // These features available on paid plans
      default:
        return false;
    }
  };

  const isPro = () => subscription?.subscription_plans?.name === 'Pro';
  const isFree = () => subscription?.subscription_plans?.name === 'Free' || !subscription;
  const isOnTrial = () => isTrialActive && subscription?.status === 'trialing';

  const getLimit = (feature: string) => {
    if (!subscription?.subscription_plans) return 0;
    
    const plan = subscription.subscription_plans;
    switch (feature) {
      case 'books':
        return plan.max_books === -1 ? Infinity : plan.max_books;
      case 'publications':
        return plan.max_publications === -1 ? Infinity : plan.max_publications;
      case 'support_tickets':
      case 'helpdesk':
        return plan.max_support_tickets || 3;
      default:
        return 0;
    }
  };

  const getSupportTicketsUsed = async () => {
    if (!subscription) return 0;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('id')
        .eq('created_by', user.id)
        .gte('created_at', currentMonth.toISOString());

      if (error) {
        console.error('Error fetching ticket usage:', error);
        return 0;
      }

      return tickets?.length || 0;
    } catch (error) {
      console.error('Error getting support tickets used:', error);
      return 0;
    }
  };

  const getCurrentPlanName = () => {
    return subscription?.subscription_plans?.name || 'Free';
  };

  return {
    subscription,
    loading,
    hasFeature,
    isPro,
    isFree,
    isOnTrial,
    trialDaysLeft,
    isTrialActive,
    getLimit,
    getSupportTicketsUsed,
    getCurrentPlanName,
    refreshSubscription
  };
}