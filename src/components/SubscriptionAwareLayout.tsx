import { useEffect, useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SubscriptionAwareLayoutProps {
  children: React.ReactNode;
  requiredFeature?: string;
  fallbackMessage?: string;
}

export function SubscriptionAwareLayout({ 
  children, 
  requiredFeature, 
  fallbackMessage 
}: SubscriptionAwareLayoutProps) {
  const { hasFeature, subscription, isOnTrial, trialDaysLeft, loading } = useSubscription();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If a required feature is specified and user doesn't have it, show upgrade prompt
  if (requiredFeature && !hasFeature(requiredFeature as any)) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="p-8 text-center">
            <Crown className="w-16 h-16 text-amber-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Premium Feature</h2>
            <p className="text-muted-foreground mb-6">
              {fallbackMessage || `This feature requires a Pro subscription.`}
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/subscription')}>
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="subscription-aware-layout">
      {/* Trial Warning */}
      {isOnTrial() && (
        <div className="border-b bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <div className="container mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-900">
                  Trial expires in {trialDaysLeft} days
                </span>
              </div>
              <Button size="sm" onClick={() => navigate('/subscription')}>
                Upgrade Now
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Subscription Status Bar */}
      {subscription && (
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-6 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant={subscription.subscription_plans.name === 'Pro' ? 'default' : 'secondary'}>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {subscription.subscription_plans.name} Plan
                </Badge>
                {subscription.subscription_plans.max_books && (
                  <span className="text-xs text-muted-foreground">
                    Books: {subscription.subscription_plans.max_books === -1 ? 'Unlimited' : subscription.subscription_plans.max_books}
                  </span>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/subscription')}>
                Manage
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
}