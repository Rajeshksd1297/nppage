import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  TrendingUp, 
  Users, 
  Eye,
  PlusCircle,
  Calendar,
  Settings,
  Shield,
  BarChart3,
  Building2,
  MessageCircle,
  Crown,
  Globe,
  Palette,
  FileText,
  CreditCard,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { TrialBanner } from "@/components/TrialBanner";
import { useSubscription } from "@/hooks/useSubscription";

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
  openTickets: number;
  pendingTickets: number;
}

interface PublisherStats {
  totalAuthors: number;
  totalBooksManaged: number;
  totalRevenue: number;
  thisMonthRevenue: number;
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
    thisMonthSignups: 0,
    openTickets: 0,
    pendingTickets: 0
  });
  const [publisherStats, setPublisherStats] = useState<PublisherStats>({
    totalAuthors: 0,
    totalBooksManaged: 0,
    totalRevenue: 0,
    thisMonthRevenue: 0
  });
  const [recentBooks, setRecentBooks] = useState<any[]>([]);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { subscription, hasFeature, getLimit, isOnTrial, trialDaysLeft, isPro, isFree } = useSubscription();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user role and profile
      const [roleResult, profileResult] = await Promise.all([
        supabase.rpc('get_current_user_role'),
        supabase.from('profiles').select('*').eq('id', user.id).single()
      ]);

      const currentUserRole = roleResult.data;
      const profile = profileResult.data;
      
      setUserRole(currentUserRole);
      setUserProfile(profile);

      // Fetch user's books
      const { data: books } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch user's tickets
      const { data: tickets } = await supabase
        .from('tickets')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentTickets(tickets || []);

      // Calculate user stats
      await calculateUserStats(user.id, books || []);

      if (currentUserRole === 'admin') {
        await calculateAdminStats();
      } else if (profile?.publisher_id) {
        await calculatePublisherStats(profile.publisher_id);
      }

      setRecentBooks(books?.slice(0, 3) || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateUserStats = async (userId: string, books: any[]) => {
    try {
      // Fetch analytics
      const { data: analytics } = await supabase
        .from('page_analytics')
        .select('*')
        .or(`page_type.eq.profile,and(page_type.eq.book,page_id.in.(${books?.map(b => b.slug).join(',') || 'none'}))`);

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
    } catch (error) {
      console.error('Error calculating user stats:', error);
    }
  };

  const calculateAdminStats = async () => {
    try {
      const thisMonthStart = new Date();
      thisMonthStart.setDate(1);

      const [
        { count: totalUsers },
        { data: allBooks },
        { data: activeSubscriptions },
        { data: recentProfiles },
        { data: openTickets },
        { data: pendingTickets }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('books').select('id'),
        supabase.from('user_subscriptions').select('id').eq('status', 'active'),
        supabase.from('profiles').select('created_at').gte('created_at', thisMonthStart.toISOString()),
        supabase.from('tickets').select('id').eq('status', 'open'),
        supabase.from('tickets').select('id').eq('status', 'pending')
      ]);

      setAdminStats({
        totalUsers: totalUsers || 0,
        totalBooksGlobal: allBooks?.length || 0,
        activeSubscriptions: activeSubscriptions?.length || 0,
        thisMonthSignups: recentProfiles?.length || 0,
        openTickets: openTickets?.length || 0,
        pendingTickets: pendingTickets?.length || 0
      });
    } catch (error) {
      console.error('Error calculating admin stats:', error);
    }
  };

  const calculatePublisherStats = async (publisherId: string) => {
    try {
      const [
        { data: authors },
        { data: managedBooks },
        { data: transactions }
      ] = await Promise.all([
        supabase.from('publisher_authors').select('*').eq('publisher_id', publisherId),
        supabase.from('books').select('*').in('user_id', 
          await supabase.from('publisher_authors').select('user_id').eq('publisher_id', publisherId)
            .then(result => result.data?.map(a => a.user_id) || [])
        ),
        supabase.from('billing_transactions').select('*').eq('publisher_id', publisherId)
      ]);

      const thisMonthStart = new Date();
      thisMonthStart.setDate(1);

      const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const thisMonthRevenue = transactions?.filter(t => 
        new Date(t.created_at) >= thisMonthStart
      ).reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      setPublisherStats({
        totalAuthors: authors?.length || 0,
        totalBooksManaged: managedBooks?.length || 0,
        totalRevenue,
        thisMonthRevenue
      });
    } catch (error) {
      console.error('Error calculating publisher stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderAdminDashboard = () => (
    <div className="space-y-6">
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
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Books</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats.totalBooksGlobal}</div>
            <p className="text-xs text-muted-foreground">Platform-wide books</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats.openTickets}</div>
            <p className="text-xs text-muted-foreground">
              {adminStats.pendingTickets} pending
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
            <p className="text-xs text-muted-foreground">Paying subscribers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Button onClick={() => navigate('/admin/users')} className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Manage Users
        </Button>
        <Button onClick={() => navigate('/admin/help-desk')} variant="outline" className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Help Desk
        </Button>
        <Button onClick={() => navigate('/admin/package-management')} variant="outline" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Package Management
        </Button>
      </div>
    </div>
  );

  const renderPublisherDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Publisher Overview</h2>
        <Badge variant="secondary">Publisher Account</Badge>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Managed Authors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publisherStats.totalAuthors}</div>
            <p className="text-xs text-muted-foreground">Active authors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published Books</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publisherStats.totalBooksManaged}</div>
            <p className="text-xs text-muted-foreground">Across all authors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${publisherStats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${publisherStats.thisMonthRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Revenue this month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Button onClick={() => navigate('/admin/publishers')} className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Manage Authors
        </Button>
        <Button onClick={() => navigate('/books')} variant="outline" className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          View All Books
        </Button>
        <Button onClick={() => navigate('/analytics')} variant="outline" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Analytics
        </Button>
      </div>
    </div>
  );

  const renderUserDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Your Author Stats</h2>
          {subscription?.subscription_plans?.name && (
            <Badge variant={subscription.subscription_plans.name === 'Pro' ? 'default' : 'secondary'}>
              {subscription.subscription_plans.name}
              {subscription.subscription_plans.name === 'Pro' && <Crown className="h-3 w-3 ml-1" />}
            </Badge>
          )}
        </div>
        <Button onClick={() => navigate('/books/new')}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add New Book
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Books</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBooks}</div>
            <p className="text-xs text-muted-foreground">{stats.publishedBooks} published</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published Books</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publishedBooks}</div>
            <p className="text-xs text-muted-foreground">Live on your profile</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews}</div>
            <p className="text-xs text-muted-foreground">All time page visits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonthViews}</div>
            <p className="text-xs text-muted-foreground">Views this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Usage Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Overview
            {subscription?.subscription_plans?.name && (
              <Badge variant={isPro() ? 'default' : 'secondary'} className="ml-2">
                {subscription.subscription_plans.name}
                {isPro() && <Crown className="h-3 w-3 ml-1" />}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">{stats.totalBooks}</p>
              <p className="text-sm text-muted-foreground">
                Books ({getLimit('books') === Infinity ? 'Unlimited' : `${getLimit('books')} max`})
              </p>
              {getLimit('books') !== Infinity && stats.totalBooks >= getLimit('books') && (
                <Badge variant="destructive" className="mt-1 text-xs">Limit Reached</Badge>
              )}
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">{stats.publishedBooks}</p>
              <p className="text-sm text-muted-foreground">Published Books</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">{stats.totalViews}</p>
              <p className="text-sm text-muted-foreground">Total Views</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Premium Features Quick Access */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className={`border-dashed ${hasFeature('custom_domain') ? 'border-green-200 bg-green-50/50' : 'border-amber-200 bg-amber-50/50'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Custom Domain</p>
                <p className="text-xs text-muted-foreground">
                  {hasFeature('custom_domain') ? 'Available' : 'Pro Feature'}
                </p>
              </div>
              <Globe className={`h-6 w-6 ${hasFeature('custom_domain') ? 'text-green-600' : 'text-amber-600'}`} />
            </div>
            <Button 
              size="sm" 
              className="w-full mt-3"
              variant={hasFeature('custom_domain') ? 'default' : 'outline'}
              onClick={() => hasFeature('custom_domain') ? navigate('/custom-domains') : navigate('/subscription')}
            >
              {hasFeature('custom_domain') ? 'Manage' : 'Upgrade'}
            </Button>
          </CardContent>
        </Card>

        <Card className={`border-dashed ${hasFeature('premium_themes') ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Premium Themes</p>
                <p className="text-xs text-muted-foreground">
                  {hasFeature('premium_themes') ? 'Available' : 'Pro Feature'}
                </p>
              </div>
              <Palette className={`h-6 w-6 ${hasFeature('premium_themes') ? 'text-green-600' : 'text-amber-600'}`} />
            </div>
            <Button 
              size="sm" 
              className="w-full mt-3"
              variant={hasFeature('premium_themes') ? 'default' : 'outline'}
              onClick={() => hasFeature('premium_themes') ? navigate('/themes') : navigate('/subscription')}
            >
              {hasFeature('premium_themes') ? 'Browse' : 'Upgrade'}
            </Button>
          </CardContent>
        </Card>

        <Card className={`border-dashed ${hasFeature('media_kit') ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Media Kit</p>
                <p className="text-xs text-muted-foreground">
                  {hasFeature('media_kit') ? 'Available' : 'Pro Feature'}
                </p>
              </div>
              <FileText className={`h-6 w-6 ${hasFeature('media_kit') ? 'text-green-600' : 'text-amber-600'}`} />
            </div>
            <Button 
              size="sm" 
              className="w-full mt-3"
              variant={hasFeature('media_kit') ? 'default' : 'outline'}
              onClick={() => hasFeature('media_kit') ? navigate('/media-kit') : navigate('/subscription')}
            >
              {hasFeature('media_kit') ? 'Create' : 'Upgrade'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-dashed border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Support</p>
                <p className="text-xs text-muted-foreground">Get Help</p>
              </div>
              <MessageCircle className="h-6 w-6 text-blue-600" />
            </div>
            <Button 
              size="sm" 
              className="w-full mt-3"
              variant="outline"
              onClick={() => navigate('/support-tickets')}
            >
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderRecentBooks = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Books</h3>
        {recentBooks.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => navigate('/books')}>
            View All
          </Button>
        )}
      </div>
      
      {recentBooks.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium mb-2">No books yet</h4>
            <p className="text-muted-foreground mb-4">Start building your author profile by adding your first book.</p>
            <Button onClick={() => navigate('/books/new')}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Your First Book
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recentBooks.map((book) => (
            <Card key={book.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderRecentTickets = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Support Tickets</h3>
        <Button variant="outline" size="sm" onClick={() => navigate('/support-tickets')}>
          View All
        </Button>
      </div>
      
      {recentTickets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-6">
            <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No support tickets</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {recentTickets.slice(0, 3).map((ticket) => (
            <Card key={ticket.id} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{ticket.title}</p>
                  <p className="text-xs text-muted-foreground">{ticket.ticket_number}</p>
                </div>
                <Badge variant={
                  ticket.status === 'open' ? 'destructive' :
                  ticket.status === 'resolved' ? 'outline' : 'default'
                } className="text-xs">
                  {ticket.status}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <TrialBanner />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {userRole === 'admin' ? "Welcome to the admin dashboard." : 
             userProfile?.publisher_id ? "Welcome to your publisher dashboard." :
             "Welcome back! Here's your author overview."}
          </p>
        </div>
      </div>

      {/* Role-based Dashboard Content */}
      {userRole === 'admin' ? renderAdminDashboard() : 
       userProfile?.publisher_id ? renderPublisherDashboard() : 
       renderUserDashboard()}

      {/* Recent Content - Only for non-admin users */}
      {userRole !== 'admin' && (
        <div className="grid gap-6 md:grid-cols-2">
          <div>{renderRecentBooks()}</div>
          <div>{renderRecentTickets()}</div>
        </div>
      )}
    </div>
  );
}