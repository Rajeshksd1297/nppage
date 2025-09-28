import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, AlertCircle } from 'lucide-react';
import { useAdminSettings } from '@/hooks/useAdminSettings';

interface FeatureAccessGuardProps {
  feature: 'newsletter' | 'blog' | 'events' | 'awards' | 'faq';
  children: ReactNode;
  fallback?: ReactNode;
  fallbackMessage?: string;
}

export const FeatureAccessGuard = ({ feature, children, fallback, fallbackMessage }: FeatureAccessGuardProps) => {
  const { hasFeatureAccess, loading, error } = useAdminSettings();

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

  if (!hasFeatureAccess(feature)) {
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