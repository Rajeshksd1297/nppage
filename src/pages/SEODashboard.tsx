import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  MousePointer, 
  Globe,
  FileText,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeBanner } from '@/components/UpgradeBanner';

interface SearchConsoleData {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  date: string;
}

interface SEOMetrics {
  totalClicks: number;
  totalImpressions: number;
  averageCTR: number;
  averagePosition: number;
  topQueries: Array<{ query: string; clicks: number; impressions: number }>;
  topPages: Array<{ page: string; clicks: number; impressions: number }>;
  dailyMetrics: Array<{ date: string; clicks: number; impressions: number }>;
}

export default function SEODashboard() {
  const [loading, setLoading] = useState(true);
  const [seoData, setSeoData] = useState<SEOMetrics>({
    totalClicks: 0,
    totalImpressions: 0,
    averageCTR: 0,
    averagePosition: 0,
    topQueries: [],
    topPages: [],
    dailyMetrics: [],
  });
  const { toast } = useToast();
  const { hasFeature, loading: subscriptionLoading } = useSubscription();

  const canUseSEOAnalytics = hasFeature('advanced_analytics');

  useEffect(() => {
    if (canUseSEOAnalytics) {
      fetchSEOData();
    } else {
      setLoading(false);
    }
  }, [canUseSEOAnalytics]);

  const fetchSEOData = async () => {
    try {
      const { data, error } = await supabase
        .from('search_console_data')
        .select('*')
        .order('date', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const processedData = processSEOData(data || []);
      setSeoData(processedData);
    } catch (error) {
      console.error('Error fetching SEO data:', error);
      toast({
        title: 'Info',
        description: 'SEO data will appear here once Google Search Console is connected',
      });
    } finally {
      setLoading(false);
    }
  };

  const processSEOData = (data: SearchConsoleData[]): SEOMetrics => {
    const totalClicks = data.reduce((sum, item) => sum + item.clicks, 0);
    const totalImpressions = data.reduce((sum, item) => sum + item.impressions, 0);
    const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const averagePosition = data.length > 0 
      ? data.reduce((sum, item) => sum + item.position, 0) / data.length 
      : 0;

    // Group by query
    const queryMap = new Map();
    data.forEach(item => {
      if (queryMap.has(item.query)) {
        const existing = queryMap.get(item.query);
        queryMap.set(item.query, {
          query: item.query,
          clicks: existing.clicks + item.clicks,
          impressions: existing.impressions + item.impressions,
        });
      } else {
        queryMap.set(item.query, {
          query: item.query,
          clicks: item.clicks,
          impressions: item.impressions,
        });
      }
    });

    // Group by page
    const pageMap = new Map();
    data.forEach(item => {
      if (pageMap.has(item.page)) {
        const existing = pageMap.get(item.page);
        pageMap.set(item.page, {
          page: item.page,
          clicks: existing.clicks + item.clicks,
          impressions: existing.impressions + item.impressions,
        });
      } else {
        pageMap.set(item.page, {
          page: item.page,
          clicks: item.clicks,
          impressions: item.impressions,
        });
      }
    });

    // Group by date
    const dateMap = new Map();
    data.forEach(item => {
      if (dateMap.has(item.date)) {
        const existing = dateMap.get(item.date);
        dateMap.set(item.date, {
          date: item.date,
          clicks: existing.clicks + item.clicks,
          impressions: existing.impressions + item.impressions,
        });
      } else {
        dateMap.set(item.date, {
          date: item.date,
          clicks: item.clicks,
          impressions: item.impressions,
        });
      }
    });

    const topQueries = Array.from(queryMap.values())
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    const topPages = Array.from(pageMap.values())
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    const dailyMetrics = Array.from(dateMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      totalClicks,
      totalImpressions,
      averageCTR,
      averagePosition,
      topQueries,
      topPages,
      dailyMetrics,
    };
  };

  if (subscriptionLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!canUseSEOAnalytics) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">SEO Analytics</h1>
          <p className="text-muted-foreground">
            Monitor your search performance and optimize for better rankings
          </p>
        </div>

        <UpgradeBanner 
          message="SEO Analytics are a Pro feature"
          feature="Google Search Console integration, keyword tracking, and performance insights"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          <Card className="opacity-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Clicks</p>
                  <p className="text-2xl font-bold">---</p>
                </div>
                <MousePointer className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="opacity-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Impressions</p>
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
                  <p className="text-sm text-muted-foreground">Avg. CTR</p>
                  <p className="text-2xl font-bold">---%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="opacity-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Position</p>
                  <p className="text-2xl font-bold">---</p>
                </div>
                <Search className="w-8 h-8 text-muted-foreground" />
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
          <h1 className="text-3xl font-bold mb-2">SEO Analytics</h1>
          <p className="text-muted-foreground">
            Monitor your search performance and optimize for better rankings
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Google Search Console
          </a>
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Clicks</p>
                <p className="text-2xl font-bold">{seoData.totalClicks.toLocaleString()}</p>
              </div>
              <MousePointer className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Impressions</p>
                <p className="text-2xl font-bold">{seoData.totalImpressions.toLocaleString()}</p>
              </div>
              <Eye className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average CTR</p>
                <p className="text-2xl font-bold">{seoData.averageCTR.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Position</p>
                <p className="text-2xl font-bold">{seoData.averagePosition.toFixed(1)}</p>
              </div>
              <Search className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Search Performance Over Time</CardTitle>
          <CardDescription>Daily clicks and impressions from Google Search</CardDescription>
        </CardHeader>
        <CardContent>
          {seoData.dailyMetrics.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={seoData.dailyMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="clicks" stroke="hsl(var(--primary))" strokeWidth={2} name="Clicks" />
                <Line type="monotone" dataKey="impressions" stroke="hsl(var(--accent))" strokeWidth={2} name="Impressions" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No search data available</h3>
              <p className="text-muted-foreground">
                Connect Google Search Console to start tracking your SEO performance
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="queries" className="space-y-6">
        <TabsList>
          <TabsTrigger value="queries">Top Queries</TabsTrigger>
          <TabsTrigger value="pages">Top Pages</TabsTrigger>
        </TabsList>

        <TabsContent value="queries">
          <Card>
            <CardHeader>
              <CardTitle>Top Search Queries</CardTitle>
              <CardDescription>Keywords that bring visitors to your site</CardDescription>
            </CardHeader>
            <CardContent>
              {seoData.topQueries.length > 0 ? (
                <div className="space-y-4">
                  {seoData.topQueries.map((query, index) => (
                    <div key={query.query} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <div>
                          <p className="font-medium">{query.query}</p>
                          <p className="text-sm text-muted-foreground">
                            {query.impressions} impressions
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{query.clicks} clicks</p>
                        <p className="text-sm text-muted-foreground">
                          {((query.clicks / query.impressions) * 100).toFixed(1)}% CTR
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No query data</h3>
                  <p className="text-muted-foreground">
                    Search query data will appear here once available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Pages</CardTitle>
              <CardDescription>Pages that receive the most search traffic</CardDescription>
            </CardHeader>
            <CardContent>
              {seoData.topPages.length > 0 ? (
                <div className="space-y-4">
                  {seoData.topPages.map((page, index) => (
                    <div key={page.page} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <div>
                          <p className="font-medium">{page.page}</p>
                          <p className="text-sm text-muted-foreground">
                            {page.impressions} impressions
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{page.clicks} clicks</p>
                        <p className="text-sm text-muted-foreground">
                          {((page.clicks / page.impressions) * 100).toFixed(1)}% CTR
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No page data</h3>
                  <p className="text-muted-foreground">
                    Page performance data will appear here once available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}