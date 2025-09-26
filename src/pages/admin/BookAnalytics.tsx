import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  BookOpen, 
  Users, 
  DollarSign, 
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function BookAnalytics() {
  const [stats, setStats] = useState({
    totalBooks: 0,
    publishedBooks: 0,
    draftBooks: 0,
    thisMonthBooks: 0,
    popularGenres: [] as Array<{genre: string, count: number}>,
    recentActivity: [] as Array<{action: string, book: string, date: string}>
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data: books, error } = await supabase
        .from('books')
        .select('*');

      if (error) throw error;

      const now = new Date();
      const thisMonth = books?.filter(book => {
        const bookDate = new Date(book.created_at);
        return bookDate.getMonth() === now.getMonth() && 
               bookDate.getFullYear() === now.getFullYear();
      }) || [];

      // Calculate genre popularity
      const genreCount = new Map();
      books?.forEach(book => {
        book.genres?.forEach((genre: string) => {
          genreCount.set(genre, (genreCount.get(genre) || 0) + 1);
        });
      });

      const popularGenres = Array.from(genreCount.entries())
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({
        totalBooks: books?.length || 0,
        publishedBooks: books?.filter(b => b.status === 'published').length || 0,
        draftBooks: books?.filter(b => b.status === 'draft').length || 0,
        thisMonthBooks: thisMonth.length,
        popularGenres,
        recentActivity: books?.slice(0, 5).map(book => ({
          action: 'Created',
          book: book.title,
          date: new Date(book.created_at).toLocaleDateString()
        })) || []
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          Book Analytics
        </h1>
        <p className="text-muted-foreground">
          Insights and statistics about your book collection
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Books</p>
                <p className="text-2xl font-bold">{stats.totalBooks}</p>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </div>
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Published</p>
                <p className="text-2xl font-bold text-green-600">{stats.publishedBooks}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalBooks > 0 ? Math.round((stats.publishedBooks / stats.totalBooks) * 100) : 0}% of total
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Draft</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.draftBooks}</p>
                <p className="text-xs text-muted-foreground mt-1">Work in progress</p>
              </div>
              <Activity className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-blue-600">{stats.thisMonthBooks}</p>
                <p className="text-xs text-muted-foreground mt-1">New additions</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Popular Genres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Popular Genres
            </CardTitle>
            <CardDescription>
              Most common genres in your collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.popularGenres.length === 0 ? (
              <p className="text-muted-foreground">No genre data available</p>
            ) : (
              <div className="space-y-3">
                {stats.popularGenres.map(({ genre, count }, index) => (
                  <div key={genre} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-medium">{genre}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ 
                            width: `${(count / Math.max(...stats.popularGenres.map(g => g.count))) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest changes to your book collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <p className="text-muted-foreground">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">
                        {activity.action}: {activity.book}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activity.date}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Publication Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Publication Timeline</CardTitle>
          <CardDescription>
            Track your publishing progress over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Publication timeline chart will be implemented here</p>
            <p className="text-sm">This will show publishing trends over months/years</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}