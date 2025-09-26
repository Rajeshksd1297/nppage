import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Download, Eye, Globe, TrendingUp, Users } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeBanner } from '@/components/UpgradeBanner';

interface AnalyticsData {
  total_views: number;
  unique_visitors: number;
  top_referrers: Array<{ referrer: string; count: number }>;
  daily_views: Array<{ date: string; views: number }>;
  device_breakdown: Array<{ device: string; count: number }>;
  country_breakdown: Array<{ country: string; count: number }>;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function AdvancedAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('30');
  const [loading, setLoading] = useState(true);
  const { hasFeature, loading: subscriptionLoading } = useSubscription();

  const canUseAdvancedAnalytics = hasFeature('advanced_analytics');

  useEffect(() => {
    if (canUseAdvancedAnalytics) {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [timeRange, canUseAdvancedAnalytics]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      // Fetch analytics data for user's content
      const { data: analyticsData, error } = await supabase
        .from('page_analytics')
        .select('*')
        .or(`page_id.eq.${user.id},page_id.in.(${await getUserBookSlugs()})`)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      // Process the data
      const processedData = processAnalyticsData(analyticsData || []);
      setAnalytics(processedData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserBookSlugs = async (): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return '';

    const { data: books } = await supabase
      .from('books')
      .select('slug')
      .eq('user_id', user.id);

    return books?.map(book => book.slug).filter(Boolean).join(',') || '';
  };

  const processAnalyticsData = (data: any[]): AnalyticsData => {
    const totalViews = data.length;
    const uniqueVisitors = new Set(data.map(d => d.visitor_id)).size;

    // Group by referrer
    const referrerCounts = data.reduce((acc, item) => {
      const referrer = item.referrer || 'Direct';
      acc[referrer] = (acc[referrer] || 0) + 1;
      return acc;
    }, {});

    const topReferrers = Object.entries(referrerCounts)
      .map(([referrer, count]) => ({ referrer, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Group by date
    const dailyCounts = data.reduce((acc, item) => {
      const date = new Date(item.created_at).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const dailyViews = Object.entries(dailyCounts)
      .map(([date, views]) => ({ date, views: views as number }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Device breakdown
    const deviceCounts = data.reduce((acc, item) => {
      const device = item.device_type || 'Unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {});

    const deviceBreakdown = Object.entries(deviceCounts)
      .map(([device, count]) => ({ device, count: count as number }));

    // Country breakdown
    const countryCounts = data.reduce((acc, item) => {
      const country = item.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {});

    const countryBreakdown = Object.entries(countryCounts)
      .map(([country, count]) => ({ country, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      total_views: totalViews,
      unique_visitors: uniqueVisitors,
      top_referrers: topReferrers,
      daily_views: dailyViews,
      device_breakdown: deviceBreakdown,
      country_breakdown: countryBreakdown,
    };
  };

  const exportData = () => {
    if (!analytics) return;

    const csvData = [
      ['Metric', 'Value'],
      ['Total Views', analytics.total_views],
      ['Unique Visitors', analytics.unique_visitors],
      ['', ''],
      ['Top Referrers', ''],
      ...analytics.top_referrers.map(r => [r.referrer, r.count]),
      ['', ''],
      ['Daily Views', ''],
      ...analytics.daily_views.map(d => [d.date, d.views]),
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${timeRange}days.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (subscriptionLoading || loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (!canUseAdvancedAnalytics) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            Get detailed insights into your audience and content performance
          </p>
        </div>

        <UpgradeBanner 
          message="Advanced analytics are a Pro feature"
          feature="detailed analytics, referral tracking, and exportable reports"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          <Card className="opacity-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold">---</p>
                </div>
                <Eye className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="opacity-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unique Visitors</p>
                  <p className="text-2xl font-bold">---</p>
                </div>
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="opacity-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Countries</p>
                  <p className="text-2xl font-bold">---</p>
                </div>
                <Globe className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="opacity-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Growth</p>
                  <p className="text-2xl font-bold">---</p>
                </div>
                <TrendingUp className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            Detailed insights into your audience and content performance
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={exportData} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {analytics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Views</p>
                    <p className="text-2xl font-bold">{analytics.total_views.toLocaleString()}</p>
                  </div>
                  <Eye className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Unique Visitors</p>
                    <p className="text-2xl font-bold">{analytics.unique_visitors.toLocaleString()}</p>
                  </div>
                  <Users className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Countries</p>
                    <p className="text-2xl font-bold">{analytics.country_breakdown.length}</p>
                  </div>
                  <Globe className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Conversion Rate</p>
                    <p className="text-2xl font-bold">
                      {((analytics.unique_visitors / analytics.total_views) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Views Over Time</CardTitle>
                <CardDescription>Daily page views trend</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.daily_views}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Referrers</CardTitle>
                <CardDescription>Where your visitors come from</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.top_referrers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="referrer" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Device Types</CardTitle>
                <CardDescription>How visitors access your content</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.device_breakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ device, percent }) => `${device} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.device_breakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Countries</CardTitle>
                <CardDescription>Geographic distribution of visitors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.country_breakdown.slice(0, 8).map((country, index) => (
                    <div key={country.country} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span>{country.country}</span>
                      </div>
                      <span className="font-medium">{country.count} views</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}