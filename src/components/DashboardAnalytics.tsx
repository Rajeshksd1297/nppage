import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Users, Eye, Calendar, BookOpen, Target, Globe, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function DashboardAnalytics() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '1y'>('30d');

  // Fetch analytics data based on time range
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const now = new Date();
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 365;
      const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      // Get user's books for filtering analytics
      const { data: userBooks } = await supabase
        .from('books')
        .select('slug, title')
        .eq('user_id', user.id);

      // Get analytics data
      const { data: analytics } = await supabase
        .from('page_analytics')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .or(`and(page_type.eq.profile,page_id.eq.${user.id}),and(page_type.eq.book,page_id.in.(${userBooks?.map(b => b.slug).join(',') || 'none'}))`);

      // Process data for charts
      const dailyViews = processDailyViews(analytics || [], daysAgo);
      const countryStats = processCountryStats(analytics || []);
      const deviceStats = processDeviceStats(analytics || []);
      const topBooks = processTopBooks(analytics || [], userBooks || []);
      const totalStats = processTotalStats(analytics || []);

      return {
        dailyViews,
        countryStats,
        deviceStats,
        topBooks,
        totalStats
      };
    },
  });

  const processDailyViews = (analytics: any[], days: number) => {
    const dailyData: { [key: string]: number } = {};
    const now = new Date();
    
    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      dailyData[dateKey] = 0;
    }

    // Count views per day
    analytics.forEach(item => {
      const dateKey = item.created_at.split('T')[0];
      if (dailyData.hasOwnProperty(dateKey)) {
        dailyData[dateKey]++;
      }
    });

    return Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, views]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        views
      }));
  };

  const processCountryStats = (analytics: any[]) => {
    const countryCount: { [key: string]: number } = {};
    analytics.forEach(item => {
      if (item.country) {
        countryCount[item.country] = (countryCount[item.country] || 0) + 1;
      }
    });

    return Object.entries(countryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([country, views]) => ({ country, views }));
  };

  const processDeviceStats = (analytics: any[]) => {
    const deviceCount: { [key: string]: number } = {};
    analytics.forEach(item => {
      const device = item.device_type || 'Unknown';
      deviceCount[device] = (deviceCount[device] || 0) + 1;
    });

    const colors = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8b5cf6'];
    return Object.entries(deviceCount).map(([name, value], index) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: colors[index % colors.length]
    }));
  };

  const processTopBooks = (analytics: any[], books: any[]) => {
    const bookViews: { [key: string]: number } = {};
    analytics.forEach(item => {
      if (item.page_type === 'book') {
        bookViews[item.page_id] = (bookViews[item.page_id] || 0) + 1;
      }
    });

    return Object.entries(bookViews)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([slug, views]) => {
        const book = books.find(b => b.slug === slug);
        return {
          book: book?.title || slug,
          views
        };
      });
  };

  const processTotalStats = (analytics: any[]) => {
    const totalViews = analytics.length;
    const uniqueVisitors = new Set(analytics.map(a => a.visitor_id)).size;
    
    return {
      totalViews,
      uniqueVisitors,
      avgSessionTime: '2m 34s', // Placeholder - would need session tracking
      bounceRate: 45 // Placeholder - would need session tracking
    };
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }
  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as '7d' | '30d' | '1y')}>
        <TabsList>
          <TabsTrigger value="7d">Last 7 Days</TabsTrigger>
          <TabsTrigger value="30d">Last 30 Days</TabsTrigger>
          <TabsTrigger value="1y">Last Year</TabsTrigger>
        </TabsList>

        <TabsContent value={timeRange} className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData?.totalStats.totalViews.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  In the selected period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData?.totalStats.uniqueVisitors.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">Unique users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData?.totalStats.avgSessionTime || '0s'}</div>
                <p className="text-xs text-muted-foreground">Time on site</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData?.totalStats.bounceRate || 0}%</div>
                <p className="text-xs text-muted-foreground">Single page visits</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Daily Views</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData?.dailyViews || []}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="views" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Views"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Types</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData?.deviceStats || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {(analyticsData?.deviceStats || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
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
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData?.countryStats || []}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="country" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="views" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Books</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData?.topBooks || []} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis type="number" />
                    <YAxis dataKey="book" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="views" fill="hsl(var(--accent))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}