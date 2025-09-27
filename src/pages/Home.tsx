import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, TrendingUp, Globe, Star, ArrowRight, CheckCircle, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HeroBlock {
  id: string;
  name: string;
  description: string;
  preview_image_url?: string;
  enabled: boolean;
  config: any;
  created_at: string;
  updated_at: string;
}

interface Package {
  id: string;
  name: string;
  price_monthly?: number;
  price_yearly?: number;
  features: string[];
  max_books?: number;
  custom_domain: boolean;
  premium_themes: boolean;
  no_watermark: boolean;
}

interface Stats {
  totalUsers: number;
  totalBooks: number;
  totalViews: number;
  activeUsers: number;
}

const Home = () => {
  const [heroBlocks, setHeroBlocks] = useState<HeroBlock[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalBooks: 0,
    totalViews: 0,
    activeUsers: 0
  });
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchHeroBlocks();
    fetchPackages();
    fetchStats();
  }, []);

  const fetchHeroBlocks = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_blocks')
        .select('*')
        .eq('enabled', true)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      if (data) setHeroBlocks(data);
    } catch (error) {
      console.error('Error fetching hero blocks:', error);
    }
  };

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true });
      
      if (error) throw error;
      if (data) setPackages(data);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Get total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total books
      const { count: booksCount } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      // Get total page views
      const { count: viewsCount } = await supabase
        .from('page_analytics')
        .select('*', { count: 'exact', head: true });

      // Get active users (users with recent activity)
      const { count: activeCount } = await supabase
        .from('page_analytics')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      setStats({
        totalUsers: usersCount || 0,
        totalBooks: booksCount || 0,
        totalViews: viewsCount || 0,
        activeUsers: activeCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleNewsletterSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert([{
          email,
          name: '',
          user_id: '00000000-0000-0000-0000-000000000000', // Anonymous signup
          source: 'homepage'
        }]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "You've been subscribed to our newsletter.",
      });
      setEmail('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to subscribe to newsletter.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">NP Page</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/auth')}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Blocks */}
      {heroBlocks.map((block) => (
        <section key={block.id} className="py-16 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="container mx-auto px-6">
            <div className="text-center space-y-6">
              <h1 className="text-5xl font-bold tracking-tight">
                {block.config?.title || 'Welcome to NP Page'}
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {block.config?.subtitle || 'Create professional author profiles, showcase your books, and grow your readership with our powerful platform.'}
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg" onClick={() => navigate('/auth')}>
                  Start Your Journey
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Stats Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Trusted by Authors Worldwide</h2>
            <p className="text-muted-foreground">Join thousands of authors who have chosen NP Page</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{stats.totalUsers.toLocaleString()}</div>
              <div className="text-muted-foreground">Authors</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{stats.totalBooks.toLocaleString()}</div>
              <div className="text-muted-foreground">Books Published</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{stats.totalViews.toLocaleString()}</div>
              <div className="text-muted-foreground">Page Views</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{stats.activeUsers.toLocaleString()}</div>
              <div className="text-muted-foreground">Active This Week</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything You Need to Succeed</h2>
            <p className="text-muted-foreground">Powerful features to help you build your author brand</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-4" />
                <CardTitle>Professional Profiles</CardTitle>
                <CardDescription>
                  Create stunning author profiles with bio, photos, and social links
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <BookOpen className="h-8 w-8 text-primary mb-4" />
                <CardTitle>Book Showcase</CardTitle>
                <CardDescription>
                  Display your books with covers, descriptions, and purchase links
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-primary mb-4" />
                <CardTitle>Analytics & Insights</CardTitle>
                <CardDescription>
                  Track your audience engagement and grow your readership
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-muted-foreground">Start free and upgrade as you grow</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {packages.map((pkg) => (
              <Card key={pkg.id} className={pkg.name === 'Pro' ? 'border-primary shadow-lg' : ''}>
                <CardHeader>
                  {pkg.name === 'Pro' && (
                    <Badge className="w-fit mb-2">Most Popular</Badge>
                  )}
                  <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    {pkg.price_monthly ? `$${pkg.price_monthly}` : 'Free'}
                    {pkg.price_monthly && <span className="text-base font-normal text-muted-foreground">/month</span>}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full mt-6" 
                    variant={pkg.name === 'Pro' ? 'default' : 'outline'}
                    onClick={() => navigate('/auth')}
                  >
                    {pkg.name === 'Free' ? 'Get Started' : 'Start Free Trial'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Stay Updated</CardTitle>
              <CardDescription>
                Get the latest updates, tips, and author success stories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNewsletterSignup} className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="email" className="sr-only">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Subscribing...' : 'Subscribe'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">NP Page</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 NP Page. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;