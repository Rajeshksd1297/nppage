import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const DemoSetup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const setupDemoUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-demo-users');
      
      if (error) {
        throw error;
      }

      toast({
        title: "Demo Users Created!",
        description: "admin@demo.com (admin role) and user@demo.com (user role) - password: demo123",
      });

      console.log('Demo setup result:', data);
    } catch (error) {
      console.error('Setup error:', error);
      toast({
        title: "Setup Error",
        description: "Failed to create demo users. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-2">Demo Setup</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Create demo users for testing:
      </p>
      <ul className="text-sm mb-4 space-y-1">
        <li>• admin@demo.com (admin role)</li>
        <li>• user@demo.com (user role)</li>
        <li>• Password for both: demo123</li>
      </ul>
      <Button onClick={setupDemoUsers} disabled={isLoading}>
        {isLoading ? 'Setting up...' : 'Setup Demo Users'}
      </Button>
    </div>
  );
};