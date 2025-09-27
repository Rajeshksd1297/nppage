import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Eye, Trash2, Settings, Home, Users, BarChart3 } from 'lucide-react';
import { HeroBlockManager } from '@/components/admin/HeroBlockManager';
import { supabase } from '@/integrations/supabase/client';
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

interface HomePageStats {
  totalVisitors: number;
  signups: number;
  newsletterSignups: number;
  conversionRate: number;
}

const HomePageManagement = () => {
  const [currentView, setCurrentView] = useState<'overview' | 'hero-blocks' | 'settings'>('overview');
  const [heroBlocks, setHeroBlocks] = useState<HeroBlock[]>([]);
  const [stats, setStats] = useState<HomePageStats>({
    totalVisitors: 0,
    signups: 0,
    newsletterSignups: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchHeroBlocks();
    fetchHomePageStats();
  }, []);

  const fetchHeroBlocks = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_blocks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setHeroBlocks(data);
    } catch (error) {
      console.error('Error fetching hero blocks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch hero blocks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHomePageStats = async () => {
    try {
      // Get homepage analytics
      const { count: visitorsCount } = await supabase
        .from('page_analytics')
        .select('*', { count: 'exact', head: true })
        .eq('page_type', 'homepage');

      // Get recent signups
      const { count: signupsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Get newsletter signups
      const { count: newsletterCount } = await supabase
        .from('newsletter_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('source', 'homepage')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const conversionRate = visitorsCount ? (signupsCount || 0) / visitorsCount * 100 : 0;

      setStats({
        totalVisitors: visitorsCount || 0,
        signups: signupsCount || 0,
        newsletterSignups: newsletterCount || 0,
        conversionRate: parseFloat(conversionRate.toFixed(2))
      });
    } catch (error) {
      console.error('Error fetching homepage stats:', error);
    }
  };

  const handleCreateHeroBlock = () => {
    setCurrentView('hero-blocks');
  };

  const handleEditHeroBlock = (blockId: string) => {
    // Navigate to hero block editor
    setCurrentView('hero-blocks');
  };

  const handleToggleHeroBlock = async (blockId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('hero_blocks')
        .update({ enabled: !enabled })
        .eq('id', blockId);

      if (error) throw error;

      setHeroBlocks(blocks =>
        blocks.map(block =>
          block.id === blockId ? { ...block, enabled: !enabled } : block
        )
      );

      toast({
        title: "Success",
        description: `Hero block ${!enabled ? 'enabled' : 'disabled'} successfully`,
      });
    } catch (error) {
      console.error('Error toggling hero block:', error);
      toast({
        title: "Error",
        description: "Failed to update hero block",
        variant: "destructive",
      });
    }
  };

  const handleDeleteHeroBlock = async (blockId: string) => {
    if (!confirm('Are you sure you want to delete this hero block?')) return;

    try {
      const { error } = await supabase
        .from('hero_blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      setHeroBlocks(blocks => blocks.filter(block => block.id !== blockId));

      toast({
        title: "Success",
        description: "Hero block deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting hero block:', error);
      toast({
        title: "Error",
        description: "Failed to delete hero block",
        variant: "destructive",
      });
    }
  };

  if (currentView === 'hero-blocks') {
    return (
      <HeroBlockManager
        heroBlocks={heroBlocks}
        onNavigateBack={() => setCurrentView('overview')}
        onHeroBlocksUpdate={fetchHeroBlocks}
      />
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Home Page Management</h1>
          <p className="text-muted-foreground">
            Manage your home page content, hero blocks, and analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open('/', '_blank')}>
            <Eye className="h-4 w-4 mr-2" />
            Preview Home Page
          </Button>
          <Button onClick={handleCreateHeroBlock}>
            <Plus className="h-4 w-4 mr-2" />
            Create Hero Block
          </Button>
        </div>
      </div>

      <Tabs value={currentView} onValueChange={(value: any) => setCurrentView(value)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Homepage Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalVisitors.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Signups</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.signups.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Newsletter Signups</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.newsletterSignups.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.conversionRate}%</div>
                <p className="text-xs text-muted-foreground">Visitors to signups</p>
              </CardContent>
            </Card>
          </div>

          {/* Hero Blocks Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Hero Blocks</CardTitle>
                  <CardDescription>
                    Manage the hero sections displayed on your home page
                  </CardDescription>
                </div>
                <Button onClick={handleCreateHeroBlock}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Hero Block
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading hero blocks...</div>
              ) : heroBlocks.length === 0 ? (
                <div className="text-center py-8">
                  <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hero blocks yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first hero block to customize your home page
                  </p>
                  <Button onClick={handleCreateHeroBlock}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Hero Block
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {heroBlocks.map((block) => (
                    <div key={block.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {block.preview_image_url && (
                          <img
                            src={block.preview_image_url}
                            alt={block.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold">{block.name}</h4>
                            <Badge variant={block.enabled ? 'default' : 'secondary'}>
                              {block.enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{block.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Created {new Date(block.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditHeroBlock(block.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleHeroBlock(block.id, block.enabled)}
                        >
                          {block.enabled ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteHeroBlock(block.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Home Page Settings</CardTitle>
              <CardDescription>
                Configure global settings for your home page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Settings panel coming soon. This will include options for:
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>SEO meta tags and descriptions</li>
                  <li>Social media sharing configurations</li>
                  <li>Analytics tracking settings</li>
                  <li>Performance optimization options</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HomePageManagement;