import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function PlanSync() {
  const { toast } = useToast();

  useEffect(() => {
    // Listen for changes in subscription plans that might affect the user
    const channel = supabase
      .channel('user-plan-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscription_plans'
        },
        (payload) => {
          console.log('Subscription plan updated:', payload);
          toast({
            title: "Plan Updated",
            description: "Your subscription features have been refreshed.",
          });
          
          // Refresh the page to ensure all components get the latest data
          window.location.reload();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions'
        },
        (payload) => {
          console.log('User subscription updated:', payload);
          toast({
            title: "Subscription Updated",
            description: "Your subscription status has been updated.",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return null; // This component doesn't render anything
}