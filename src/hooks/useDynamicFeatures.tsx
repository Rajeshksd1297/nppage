import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FeatureDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'core' | 'premium';
  enabled: boolean;
  required_plan_level: number; // 0 = free, 1 = basic, 2 = pro, 3 = enterprise
}

interface PlanFeatures {
  [planId: string]: FeatureDefinition[];
}

export function useDynamicFeatures() {
  const [features, setFeatures] = useState<PlanFeatures>({});
  const [coreFeatures, setCoreFeatures] = useState<FeatureDefinition[]>([]);
  const [premiumFeatures, setPremiumFeatures] = useState<FeatureDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDynamicFeatures();
    
    // Set up real-time subscription for plan changes
    const channel = supabase
      .channel('dynamic_features_sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscription_plans'
        },
        (payload) => {
          console.log('Plan features changed, reloading...', payload);
          loadDynamicFeatures();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadDynamicFeatures = async () => {
    try {
      setLoading(true);
      
      const { data: plans, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly');

      if (error) {
        console.error('Error loading plans for features:', error);
        return;
      }

      const allFeatures: PlanFeatures = {};
      const coreFeaturesList: FeatureDefinition[] = [];
      const premiumFeaturesList: FeatureDefinition[] = [];

      plans?.forEach((plan: any) => {
        const planFeatures = generatePlanFeatures(plan);
        allFeatures[plan.id] = planFeatures;

        // Categorize features
        planFeatures.forEach(feature => {
          if (feature.category === 'core' && !coreFeaturesList.find(f => f.id === feature.id)) {
            coreFeaturesList.push(feature);
          } else if (feature.category === 'premium' && !premiumFeaturesList.find(f => f.id === feature.id)) {
            premiumFeaturesList.push(feature);
          }
        });
      });

      setFeatures(allFeatures);
      setCoreFeatures(coreFeaturesList);
      setPremiumFeatures(premiumFeaturesList);
      
      console.log('Dynamic features loaded:', { 
        core: coreFeaturesList.length, 
        premium: premiumFeaturesList.length 
      });
    } catch (error) {
      console.error('Error in loadDynamicFeatures:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePlanFeatures = (plan: any): FeatureDefinition[] => {
    const features: FeatureDefinition[] = [];
    const planLevel = getPlanLevel(plan.price_monthly);

    // Core features (available to all plans)
    features.push({
      id: 'profile',
      name: 'Professional Profile',
      description: 'Showcase your bio, photo, and author information',
      icon: 'users',
      category: 'core',
      enabled: true,
      required_plan_level: 0
    });

    features.push({
      id: 'basic_themes',
      name: 'Basic Themes',
      description: 'Standard theme collection',
      icon: 'palette',
      category: 'core',
      enabled: true,
      required_plan_level: 0
    });

    features.push({
      id: 'basic_analytics',
      name: 'Basic Analytics',
      description: 'View basic page statistics',
      icon: 'bar-chart',
      category: 'core',
      enabled: true,
      required_plan_level: 0
    });

    // Core helpdesk feature with configurable limits
    const ticketLimit = plan.max_support_tickets || 3;
    features.push({
      id: 'helpdesk',
      name: `Help Desk (${ticketLimit}/month)`,
      description: `Submit support tickets with monthly limit of ${ticketLimit}`,
      icon: 'help-circle',
      category: 'core',
      enabled: true,
      required_plan_level: 0
    });

    // Books feature (dynamic based on plan)
    if (plan.max_books === -1) {
      features.push({
        id: 'unlimited_books',
        name: 'Unlimited Books',
        description: 'Add as many books as you want to your profile',
        icon: 'book-open',
        category: planLevel > 0 ? 'premium' : 'core',
        enabled: true,
        required_plan_level: planLevel
      });
    } else if (plan.max_books > 0) {
      features.push({
        id: 'limited_books',
        name: `Up to ${plan.max_books} Books`,
        description: `Limited book showcase (${plan.max_books} books)`,
        icon: 'book-open',
        category: 'core',
        enabled: true,
        required_plan_level: 0
      });
    }

    // Premium features (based on plan configuration)
    if (plan.premium_themes) {
      features.push({
        id: 'premium_themes',
        name: 'Premium Themes',
        description: 'Access to exclusive, professionally designed themes',
        icon: 'palette',
        category: 'premium',
        enabled: true,
        required_plan_level: 1
      });
    }

    if (plan.advanced_analytics) {
      features.push({
        id: 'advanced_analytics',
        name: 'Advanced Analytics',
        description: 'Detailed visitor insights, conversion tracking, and performance metrics',
        icon: 'trending-up',
        category: 'premium',
        enabled: true,
        required_plan_level: 1
      });
    }

    if (plan.custom_domain) {
      features.push({
        id: 'custom_domain',
        name: 'Custom Domain',
        description: 'Use your own domain (e.g., yourname.com)',
        icon: 'globe',
        category: 'premium',
        enabled: true,
        required_plan_level: 2
      });
    }

    // Feature removed: No Watermark

    if (plan.contact_form) {
      features.push({
        id: 'contact_forms',
        name: 'Contact Forms',
        description: 'Let readers reach out to you directly',
        icon: 'message-circle',
        category: 'premium',
        enabled: true,
        required_plan_level: 1
      });
    }

    if (plan.newsletter_integration) {
      features.push({
        id: 'newsletter',
        name: 'Newsletter Integration',
        description: 'Build and manage your email subscriber list',
        icon: 'file-text',
        category: 'premium',
        enabled: true,
        required_plan_level: 1
      });
    }

    if (plan.blog) {
      features.push({
        id: 'blog',
        name: 'Blog Features',
        description: 'Share articles, updates, and behind-the-scenes content',
        icon: 'newspaper',
        category: 'premium',
        enabled: true,
        required_plan_level: 1
      });
    }

    if (plan.events) {
      features.push({
        id: 'events',
        name: 'Events Management',
        description: 'Promote book launches, readings, and signings',
        icon: 'calendar',
        category: 'premium',
        enabled: true,
        required_plan_level: 1
      });
    }

    if (plan.awards) {
      features.push({
        id: 'awards',
        name: 'Awards Showcase',
        description: 'Highlight your achievements and recognition',
        icon: 'award',
        category: 'premium',
        enabled: true,
        required_plan_level: 1
      });
    }

    if (plan.faq) {
      features.push({
        id: 'faq',
        name: 'FAQ Section',
        description: 'Answer common reader questions',
        icon: 'help-circle',
        category: 'premium',
        enabled: true,
        required_plan_level: 1
      });
    }

    // Publisher features
    if (plan.is_publisher_plan && plan.max_authors) {
      features.push({
        id: 'multi_author_management',
        name: `Multi-Author Management (${plan.max_authors} authors)`,
        description: `Manage up to ${plan.max_authors} authors under this publisher account`,
        icon: 'users',
        category: 'premium',
        enabled: true,
        required_plan_level: 2
      });
    }

    // Support feature
    features.push({
      id: 'support',
      name: planLevel > 0 ? 'Priority Support' : 'Community Support',
      description: planLevel > 0 
        ? 'Fast, dedicated support via email and chat'
        : 'Access to community forums and documentation',
      icon: 'users',
      category: planLevel > 0 ? 'premium' : 'core',
      enabled: true,
      required_plan_level: planLevel
    });

    return features;
  };

  const getPlanLevel = (priceMonthly: number): number => {
    if (priceMonthly === 0) return 0; // Free
    if (priceMonthly <= 10) return 1; // Basic/Pro
    if (priceMonthly <= 50) return 2; // Pro Plus
    return 3; // Enterprise
  };

  const getPlanFeatures = (planId: string) => {
    return features[planId] || [];
  };

  const getFeaturesByCategory = (planId: string, category: 'core' | 'premium') => {
    const planFeatures = getPlanFeatures(planId);
    return planFeatures.filter(feature => feature.category === category);
  };

  return {
    features,
    coreFeatures,
    premiumFeatures,
    loading,
    getPlanFeatures,
    getFeaturesByCategory,
    refreshFeatures: loadDynamicFeatures
  };
}