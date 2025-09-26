import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DollarSign, Users, TrendingUp, Crown, Globe, BookOpen } from 'lucide-react';

interface AdminStats {
  total_users: number;
  active_subscriptions: number;
  monthly_revenue: number;
  total_books: number;
  total_domains: number;
  churn_rate: number;
}

interface ChartData {
  month: string;
  revenue: number;
  users: number;
  subscriptions: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    total_users: 0,
    active_subscriptions: 0,
    monthly_revenue: 0,
    total_books: 0,
    total_domains: 0,
    churn_rate: 0
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
    fetchChartData();
  }, []);

  const fetchAdminStats = async () => {
    try {
      // Get total users
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get active subscriptions
      const { count: subscriptionCount } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get total books
      const { count: bookCount } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true });

      // Get total custom domains
      const { count: domainCount } = await supabase
        .from('custom_domains')
        .select('*', { count: 'exact', head: true });

      // Calculate revenue (mock calculation)
      const { data: subscriptions } = await supabase
        .from('user_subscriptions')
        .select(`
          plan_id,
          subscription_plans (price_monthly)
        `)
        .eq('status', 'active');

      const monthlyRevenue = subscriptions?.reduce((total, sub) => {
        return total + (sub.subscription_plans?.price_monthly || 0);
      }, 0) || 0;

      setStats({
        total_users: userCount || 0,
        active_subscriptions: subscriptionCount || 0,
        monthly_revenue: monthlyRevenue,
        total_books: bookCount || 0,
        total_domains: domainCount || 0,
        churn_rate: 2.5 // Mock data
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = () => {
    // Mock chart data - in real app, this would come from analytics
    const mockData: ChartData[] = [
      { month: 'Jan', revenue: 4500, users: 120, subscriptions: 15 },
      { month: 'Feb', revenue: 5200, users: 145, subscriptions: 22 },
      { month: 'Mar', revenue: 6100, users: 170, subscriptions: 28 },
      { month: 'Apr', revenue: 7300, users: 195, subscriptions: 35 },
      { month: 'May', revenue: 8900, users: 225, subscriptions: 42 },
      { month: 'Jun', revenue: 10200, users: 260, subscriptions: 48 },
    ];
    setChartData(mockData);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading admin dashboard...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of platform metrics and business performance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats.total_users.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Subs</p>
                <p className="text-2xl font-bold">{stats.active_subscriptions}</p>
              </div>
              <Crown className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold">${stats.monthly_revenue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Books</p>
                <p className="text-2xl font-bold">{stats.total_books.toLocaleString()}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Custom Domains</p>
                <p className="text-2xl font-bold">{stats.total_domains}</p>
              </div>
              <Globe className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Churn Rate</p>
                <p className="text-2xl font-bold">{stats.churn_rate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Growth</CardTitle>
            <CardDescription>Monthly recurring revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>New users and subscription growth</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="hsl(var(--primary))" name="Total Users" />
                <Bar dataKey="subscriptions" fill="hsl(var(--secondary))" name="Pro Subscriptions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Subscriptions</CardTitle>
            <CardDescription>Latest Pro plan upgrades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">User {item}</p>
                    <p className="text-sm text-muted-foreground">Upgraded to Pro</p>
                  </div>
                  <Badge variant="default">Pro</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Health</CardTitle>
            <CardDescription>System status and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Database Performance</span>
                <Badge variant="default">Excellent</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>API Response Time</span>
                <Badge variant="default">Fast</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Storage Usage</span>
                <Badge variant="secondary">75%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>CDN Performance</span>
                <Badge variant="default">Optimal</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Error Rate</span>
                <Badge variant="default">0.01%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}