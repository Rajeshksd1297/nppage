import { ReactNode, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, AlertCircle } from 'lucide-react';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { supabase } from '@/integrations/supabase/client';
import { useModeratorPermissions } from '@/hooks/useModeratorPermissions';

interface FeatureAccessGuardProps {
  feature: 'newsletter' | 'blog' | 'events' | 'awards' | 'faq';
  children: ReactNode;
  fallback?: ReactNode;
  fallbackMessage?: string;
}

export const FeatureAccessGuard = ({ feature, children, fallback, fallbackMessage }: FeatureAccessGuardProps) => {
  const { hasFeatureAccess, loading, error } = useAdminSettings();
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { hasPermission } = useModeratorPermissions(userId || undefined);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Check user role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        setUserRole(roleData?.role || 'user');
      }
    };
    checkUser();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-md mt-8">
        <CardHeader className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
          <CardTitle>Error Loading Settings</CardTitle>
          <CardDescription>
            Failed to check feature access. Please try again later.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Allow access if:
  // 1. Admin settings allow the feature
  // 2. User is admin (already handled by hasFeatureAccess)
  // 3. User is moderator with view permission for this feature
  const canAccess = hasFeatureAccess(feature) || 
    (userRole === 'moderator' && hasPermission(feature, 'view'));

  if (!canAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card className="mx-auto max-w-md mt-8">
        <CardHeader className="text-center">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <CardTitle>Feature Not Available</CardTitle>
          <CardDescription>
            {fallbackMessage || `The ${feature} feature has been disabled by your administrator.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};