import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  inline?: boolean;
}

export function FeatureGate({ feature, children, fallback, inline = false }: FeatureGateProps) {
  const { hasFeature } = useSubscription();
  const navigate = useNavigate();

  if (hasFeature(feature as any)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (inline) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-dashed">
        <Lock className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Pro Feature</span>
        <Button size="sm" variant="outline" onClick={() => navigate('/subscription')}>
          <Crown className="w-3 h-3 mr-1" />
          Upgrade
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-dashed border-amber-200">
      <CardContent className="p-6 text-center">
        <Crown className="w-8 h-8 text-amber-600 mx-auto mb-3" />
        <h3 className="font-semibold mb-2">Premium Feature</h3>
        <p className="text-sm text-muted-foreground mb-4">
          This feature is available with a Pro subscription.
        </p>
        <Button size="sm" onClick={() => navigate('/subscription')}>
          <Crown className="w-4 h-4 mr-2" />
          Upgrade to Pro
        </Button>
      </CardContent>
    </Card>
  );
}