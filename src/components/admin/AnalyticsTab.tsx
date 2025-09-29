import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { RefreshCw, Download, Calendar, TrendingUp, Users, BarChart3, Timer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsTabProps {
  analyticsData: {
    visitors: { labels: string[]; datasets: any[] };
    pageViews: { labels: string[]; datasets: any[] };
    deviceStats: { labels: string[]; datasets: any[] };
  };
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  refreshInterval: number;
  setRefreshInterval: (interval: number) => void;
  isAutoRefreshing: boolean;
  setIsAutoRefreshing: (auto: boolean) => void;
  lastRefresh: Date;
  nextRefresh: Date | null;
  onRefreshData: () => void;
}

export const AnalyticsTab = ({
  analyticsData,
  selectedPeriod,
  onPeriodChange,
  refreshInterval,
  setRefreshInterval,
  isAutoRefreshing,
  setIsAutoRefreshing,
  lastRefresh,
  nextRefresh,
  onRefreshData
}: AnalyticsTabProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [exportingData, setExportingData] = useState(false);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Website Analytics'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      }
    }
  };

  const handleExportData = async () => {
    try {
      setExportingData(true);
      
      // Fetch analytics data for export
      const { data, error } = await supabase
        .from('page_analytics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert to CSV
      const csvContent = convertToCSV(data || []);
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Analytics data exported successfully"
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Error",
        description: "Failed to export analytics data",
        variant: "destructive"
      });
    } finally {
      setExportingData(false);
    }
  };

  const convertToCSV = (data: any[]) => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');
    
    return csv;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Analytics Controls */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Website Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Monitor your website's performance and visitor behavior
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={onPeriodChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hours">Last 6 Hours</SelectItem>
              <SelectItem value="day">Last 24 Hours</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
              <SelectItem value="lifetime">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={onRefreshData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportData} disabled={exportingData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Auto-refresh Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Auto-refresh Settings
          </CardTitle>
          <CardDescription>Configure automatic data refresh</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Auto-refresh: {isAutoRefreshing ? 'Enabled' : 'Disabled'}
              </p>
              <p className="text-xs text-muted-foreground">
                Last refresh: {formatTime(lastRefresh)}
                {nextRefresh && isAutoRefreshing && (
                  <> • Next refresh: {formatTime(nextRefresh)}</>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={refreshInterval.toString()}
                onValueChange={(value) => setRefreshInterval(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 minute</SelectItem>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={isAutoRefreshing ? 'default' : 'outline'}
                onClick={() => setIsAutoRefreshing(!isAutoRefreshing)}
              >
                {isAutoRefreshing ? 'Disable' : 'Enable'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visitors Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Visitors Over Time
            </CardTitle>
            <CardDescription>Track visitor trends for the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line data={analyticsData.visitors} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Page Views Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Pages
            </CardTitle>
            <CardDescription>Most visited pages on your website</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar data={analyticsData.pageViews} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Device Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Device Types
            </CardTitle>
            <CardDescription>Visitor device distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Doughnut data={analyticsData.deviceStats} options={doughnutOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Additional Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Page Views</span>
                <span className="text-lg font-bold">
                  {analyticsData.pageViews.datasets[0]?.data?.reduce((a: number, b: number) => a + b, 0) || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Unique Visitors</span>
                <span className="text-lg font-bold">
                  {analyticsData.visitors.datasets[0]?.data?.reduce((a: number, b: number) => a + b, 0) || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Top Device</span>
                <span className="text-lg font-bold">
                  {analyticsData.deviceStats.labels?.[0] || 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};