import { Crown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface UpgradeBannerProps {
  message: string;
  feature?: string;
}

export function UpgradeBanner({ message, feature }: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  if (dismissed) return null;

  return (
    <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-900">{message}</p>
              {feature && (
                <p className="text-sm text-amber-700">
                  Upgrade to Pro to unlock {feature}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={() => navigate('/subscription')}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Upgrade Now
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setDismissed(true)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}