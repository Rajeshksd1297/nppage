import { Clock, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';

export function TrialBanner() {
  const { isOnTrial, trialDaysLeft } = useSubscription();
  const navigate = useNavigate();

  if (!isOnTrial()) return null;

  return (
    <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-900">
                Pro Trial Active - {trialDaysLeft} days left
              </p>
              <p className="text-sm text-amber-700">
                Enjoy unlimited access to all Pro features
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <Button 
              size="sm" 
              onClick={() => navigate('/subscription')}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Upgrade Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}