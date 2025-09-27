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
  const {
    data: analyticsData,
    isLoading
  } = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return null;
      const now = new Date();
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 365;
      const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      // Get user's books for filtering analytics
      const {
        data: userBooks
      } = await supabase.from('books').select('slug, title').eq('user_id', user.id);

      // Get analytics data
      const {
        data: analytics
      } = await supabase.from('page_analytics').select('*').gte('created_at', startDate.toISOString()).or(`and(page_type.eq.profile,page_id.eq.${user.id}),and(page_type.eq.book,page_id.in.(${userBooks?.map(b => b.slug).join(',') || 'none'}))`);

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
    }
  });
  const processDailyViews = (analytics: any[], days: number) => {
    const dailyData: {
      [key: string]: number;
    } = {};
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
    return Object.entries(dailyData).sort(([a], [b]) => a.localeCompare(b)).map(([date, views]) => ({
      date: new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      views
    }));
  };
  const processCountryStats = (analytics: any[]) => {
    const countryCount: {
      [key: string]: number;
    } = {};
    analytics.forEach(item => {
      if (item.country) {
        countryCount[item.country] = (countryCount[item.country] || 0) + 1;
      }
    });
    return Object.entries(countryCount).sort(([, a], [, b]) => b - a).slice(0, 10).map(([country, views]) => ({
      country,
      views
    }));
  };
  const processDeviceStats = (analytics: any[]) => {
    const deviceCount: {
      [key: string]: number;
    } = {};
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
    const bookViews: {
      [key: string]: number;
    } = {};
    analytics.forEach(item => {
      if (item.page_type === 'book') {
        bookViews[item.page_id] = (bookViews[item.page_id] || 0) + 1;
      }
    });
    return Object.entries(bookViews).sort(([, a], [, b]) => b - a).slice(0, 5).map(([slug, views]) => {
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
      avgSessionTime: '2m 34s',
      // Placeholder - would need session tracking
      bounceRate: 45 // Placeholder - would need session tracking
    };
  };
  if (isLoading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }
  return <div className="space-y-6">
      {/* Time Range Selector */}
      
    </div>;
}