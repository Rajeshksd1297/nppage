import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  Eye,
  Users,
  Globe,
  TrendingUp,
  Calendar,
  ExternalLink,
  MapPin
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsData {
  totalViews: number;
  profileViews: number;
  bookViews: number;
  thisMonthViews: number;
  topCountries: { country: string; count: number }[];
  dailyViews: { date: string; views: number }[];
  topBooks: { title: string; slug: string; views: number }[];
  deviceTypes: { type: string; count: number }[];
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalViews: 0,
    profileViews: 0,
    bookViews: 0,
    thisMonthViews: 0,
    topCountries: [],
    dailyViews: [],
    topBooks: [],
    deviceTypes: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Fetch user's books to filter analytics
      const { data: books } = await supabase
        .from('books')
        .select('slug, title')
        .eq('user_id', user.id);

      const bookSlugs = books?.map(b => b.slug).filter(Boolean) || [];

      // Fetch analytics data
      const { data: analyticsData } = await supabase
        .from('page_analytics')
        .select('*')
        .or(`page_type.eq.profile,and(page_type.eq.book,page_id.in.(${bookSlugs.join(',') || 'none'}))`)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (!analyticsData) return;

      // Process analytics data
      const totalViews = analyticsData.length;
      const profileViews = analyticsData.filter(a => a.page_type === 'profile').length;
      const bookViews = analyticsData.filter(a => a.page_type === 'book').length;

      // This month views
      const thisMonthStart = new Date();
      thisMonthStart.setDate(1);
      const thisMonthViews = analyticsData.filter(a => 
        new Date(a.created_at) >= thisMonthStart
      ).length;

      // Top countries
      const countryCount = analyticsData.reduce((acc, item) => {
        const country = item.country || 'Unknown';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topCountries = Object.entries(countryCount)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Daily views for chart
      const dailyCount = analyticsData.reduce((acc, item) => {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const dailyViews = Object.entries(dailyCount)
        .map(([date, views]) => ({ date, views }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Top books
      const bookCount = analyticsData
        .filter(a => a.page_type === 'book')
        .reduce((acc, item) => {
          acc[item.page_id] = (acc[item.page_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const topBooks = Object.entries(bookCount)
        .map(([slug, views]) => {
          const book = books?.find(b => b.slug === slug);
          return {
            title: book?.title || slug,
            slug,
            views
          };
        })
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

      // Device types
      const deviceCount = analyticsData.reduce((acc, item) => {
        const type = item.device_type || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const deviceTypes = Object.entries(deviceCount)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      setAnalytics({
        totalViews,
        profileViews,
        bookViews,
        thisMonthViews,
        topCountries,
        dailyViews,
        topBooks,
        deviceTypes
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Track your audience engagement and reach</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalViews}</div>
            <p className="text-xs text-muted-foreground">
              All page visits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.profileViews}</div>
            <p className="text-xs text-muted-foreground">
              Author page visits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Book Views</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.bookViews}</div>
            <p className="text-xs text-muted-foreground">
              Book page visits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.thisMonthViews}</div>
            <p className="text-xs text-muted-foreground">
              Views this month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Books */}
        <Card>
          <CardHeader>
            <CardTitle>Top Books</CardTitle>
            <CardDescription>Most viewed book pages</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topBooks.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No book views yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analytics.topBooks.map((book, index) => (
                  <div key={book.slug} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">#{index + 1}</span>
                      <div>
                        <p className="font-medium">{book.title}</p>
                        <p className="text-sm text-muted-foreground">{book.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{book.views} views</Badge>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Countries */}
        <Card>
          <CardHeader>
            <CardTitle>Top Countries</CardTitle>
            <CardDescription>Where your readers are from</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topCountries.length === 0 ? (
              <div className="text-center py-8">
                <Globe className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No location data yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analytics.topCountries.map((country, index) => (
                  <div key={country.country} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">#{index + 1}</span>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{country.country}</span>
                      </div>
                    </div>
                    <Badge variant="outline">{country.count} views</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Types */}
        <Card>
          <CardHeader>
            <CardTitle>Device Types</CardTitle>
            <CardDescription>How readers access your content</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.deviceTypes.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No device data yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analytics.deviceTypes.map((device, index) => (
                  <div key={device.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">#{index + 1}</span>
                      <span className="capitalize">{device.type}</span>
                    </div>
                    <Badge variant="outline">{device.count} views</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Views</CardTitle>
            <CardDescription>Views over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.dailyViews.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No daily data yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {analytics.dailyViews.slice(-7).map((day) => (
                  <div key={day.date} className="flex items-center justify-between">
                    <span className="text-sm">{new Date(day.date).toLocaleDateString()}</span>
                    <Badge variant="outline">{day.views} views</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}