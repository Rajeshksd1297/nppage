import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, BarChart3, Clock, Activity, Monitor, Smartphone, Target, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OverviewTabProps {
  onlineVisitors: number;
  realtimeStats: {
    pageViews: number;
    uniqueVisitors: number;
    bounceRate: number;
    avgSessionTime: number;
    conversionRate: number;
    pageLoadTime: number;
  };
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}

export const OverviewTab = ({ 
  onlineVisitors, 
  realtimeStats, 
  selectedPeriod, 
  onPeriodChange 
}: OverviewTabProps) => {
  const [loading, setLoading] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

  return (
    <div className="space-y-6">
      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Visitors</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onlineVisitors}</div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-xs text-muted-foreground">Live</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realtimeStats.pageViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realtimeStats.uniqueVisitors.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(realtimeStats.conversionRate)}</div>
            <p className="text-xs text-muted-foreground">
              {realtimeStats.conversionRate > 0.02 ? "↗️ +2.1%" : "↘️ -1.2%"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(realtimeStats.bounceRate)}</div>
            <p className="text-xs text-muted-foreground">
              {realtimeStats.bounceRate < 0.5 ? "✅ Good" : "⚠️ High"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Session Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(realtimeStats.avgSessionTime)}</div>
            <p className="text-xs text-muted-foreground">
              {realtimeStats.avgSessionTime > 120 ? "✅ Good" : "⚠️ Low"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Load Time</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realtimeStats.pageLoadTime.toFixed(2)}s</div>
            <p className="text-xs text-muted-foreground">
              {realtimeStats.pageLoadTime < 3 ? "✅ Fast" : "⚠️ Slow"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Time Period Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Period</CardTitle>
          <CardDescription>Select time period for detailed analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {['hours', 'day', 'month', 'year', 'lifetime'].map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPeriodChange(period)}
              >
                {period === 'hours' ? 'Last 6 Hours' : 
                 period === 'day' ? 'Last 24 Hours' :
                 period === 'month' ? 'Last Month' :
                 period === 'year' ? 'Last Year' : 'All Time'}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};