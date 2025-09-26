import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  TrendingUp, 
  Users, 
  Eye,
  PlusCircle,
  Calendar,
  Settings,
  Shield,
  BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { TrialBanner } from "@/components/TrialBanner";

interface DashboardStats {
  totalBooks: number;
  publishedBooks: number;
  totalViews: number;
  thisMonthViews: number;
}

interface AdminStats {
  totalUsers: number;
  totalBooksGlobal: number;
  activeSubscriptions: number;
  thisMonthSignups: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBooks: 0,
    publishedBooks: 0,
    totalViews: 0,
    thisMonthViews: 0
  });
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalUsers: 0,
    totalBooksGlobal: 0,
    activeSubscriptions: 0,
    thisMonthSignups: 0
  });
  const [recentBooks, setRecentBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if user is admin
        const { data: roleData } = await supabase.rpc('get_current_user_role');
        const userIsAdmin = roleData === 'admin';
        setIsAdmin(userIsAdmin);

        // Fetch regular user stats
        const { data: books } = await supabase
          .from('books')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        // Fetch analytics
        const { data: analytics } = await supabase
          .from('page_analytics')
          .select('*')
          .or(`page_type.eq.profile,and(page_type.eq.book,page_id.in.(${books?.map(b => b.slug).join(',') || 'none'}))`);

        // Calculate user stats
        const totalBooks = books?.length || 0;
        const publishedBooks = books?.filter(b => b.status === 'published').length || 0;
        const totalViews = analytics?.length || 0;
        
        const thisMonthStart = new Date();
        thisMonthStart.setDate(1);
        const thisMonthViews = analytics?.filter(a => 
          new Date(a.created_at) >= thisMonthStart
        ).length || 0;

        setStats({
          totalBooks,
          publishedBooks,
          totalViews,
          thisMonthViews
        });

        setRecentBooks(books?.slice(0, 3) || []);

        // Fetch admin stats if user is admin
        if (userIsAdmin) {
          const [
            { count: totalUsers },
            { data: allBooks },
            { data: activeSubscriptions },
            { data: recentProfiles }
          ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('books').select('id'),
            supabase.from('user_subscriptions').select('id').eq('status', 'active'),
            supabase.from('profiles').select('created_at').gte('created_at', thisMonthStart.toISOString())
          ]);

          setAdminStats({
            totalUsers: totalUsers || 0,
            totalBooksGlobal: allBooks?.length || 0,
            activeSubscriptions: activeSubscriptions?.length || 0,
            thisMonthSignups: recentProfiles?.length || 0
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TrialBanner />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Welcome to the admin dashboard." : "Welcome back! Here's your author overview."}
          </p>
        </div>
        {!isAdmin && (
          <Button onClick={() => navigate('/books/new')}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New Book
          </Button>
        )}
      </div>

      {/* Admin Stats Section - Only show if user is admin */}
      {isAdmin ? (
        <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Admin Overview</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminStats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    Registered authors
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Books</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminStats.totalBooksGlobal}</div>
                  <p className="text-xs text-muted-foreground">
                    Platform-wide books
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminStats.activeSubscriptions}</div>
                  <p className="text-xs text-muted-foreground">
                    Paying subscribers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">New This Month</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminStats.thisMonthSignups}</div>
                  <p className="text-xs text-muted-foreground">
                    New user signups
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/admin/users')}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Manage Access
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/subscription')}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Manage Packages
              </Button>
            </div>
        </div>
      ) : (
        /* User Stats Section - Only show if not admin */
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Author Stats</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Books</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBooks}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.publishedBooks} published
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Published Books</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.publishedBooks}</div>
                <p className="text-xs text-muted-foreground">
                  Live on your profile
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalViews}</div>
                <p className="text-xs text-muted-foreground">
                  All time page visits
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.thisMonthViews}</div>
                <p className="text-xs text-muted-foreground">
                  Views this month
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Recent Books Section - Only show for regular users */}
      {!isAdmin && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Books</h2>
          <Card>
            <CardHeader>
              <CardTitle>Your Latest Books</CardTitle>
              <CardDescription>Your latest book additions</CardDescription>
            </CardHeader>
            <CardContent>
            {recentBooks.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No books yet</h3>
                <p className="text-muted-foreground mb-4">Start building your author profile by adding your first book.</p>
                <Button onClick={() => navigate('/books/new')}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Your First Book
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentBooks.map((book) => (
                  <div key={book.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium">{book.title}</h4>
                        {book.subtitle && (
                          <p className="text-sm text-muted-foreground">{book.subtitle}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={book.status === 'published' ? 'default' : 'secondary'}>
                            {book.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(book.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/books/${book.id}`)}
                    >
                      Edit
                    </Button>
                  </div>
                ))}
                {recentBooks.length >= 3 && (
                  <div className="text-center pt-4">
                    <Button variant="outline" onClick={() => navigate('/books')}>
                      View All Books
                    </Button>
                  </div>
                )}
              </div>
            )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}