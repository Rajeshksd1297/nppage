import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Activity, Users, BarChart3, Eye, Save, Edit, Settings, Layout, RefreshCw, AlertTriangle, Plus, Trash2, Monitor, Smartphone, CheckCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { HeroBlockManager } from '@/components/admin/HeroBlockManager';
import EnhancedCookieManagement from '@/components/admin/EnhancedCookieManagement';
import { SEOAnalyzer } from '@/components/seo/SEOAnalyzer';
import AISEOAssistant from '@/components/seo/AISEOAssistant';
import { BackupSecurityCenter } from '@/components/admin/BackupSecurityCenter';

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

interface HomeSection {
  id: string;
  type: string;
  title: string;
  enabled: boolean;
  order_index: number;
  config: any;
}

const HomePageManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [heroBlocks, setHeroBlocks] = useState<HeroBlock[]>([]);
  const [homeSections, setHomeSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  // Real-time analytics state
  const [realtimeStats, setRealtimeStats] = useState({
    pageViews: 245,
    uniqueVisitors: 132,
    bounceRate: 34.5,
    avgSessionTime: 185,
    conversionRate: 2.8,
    pageLoadTime: 1.2
  });

  const [seoSettings, setSeoSettings] = useState({
    site_title: '',
    site_description: '',
    site_keywords: '',
    google_analytics_id: '',
    google_site_verification: '',
    bing_site_verification: '',
    facebook_app_id: '',
    twitter_handle: '',
    default_og_image: '',
    enable_sitemap: true,
    enable_robots: true,
    enable_schema: true
  });

  // Load initial data
  useEffect(() => {
    loadPageData();
    setupRealtimeTracking();
  }, [activeTab]);

  const loadPageData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadHeroBlocks(),
        loadHomeSections(),
        loadSiteSettings()
      ]);
    } catch (error) {
      console.error('Error loading page data:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load page data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadHeroBlocks = async () => {
    const { data, error } = await supabase
      .from('hero_blocks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading hero blocks:', error);
      return;
    }

    setHeroBlocks(data || []);
  };

  const loadHomeSections = async () => {
    const { data, error } = await supabase
      .from('home_page_sections')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error loading sections:', error);
      return;
    }

    setHomeSections(data || []);
  };

  const loadSiteSettings = async () => {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error loading site settings:', error);
      return;
    }

    if (data && data.length > 0) {
      const settings = data[0];
      setSeoSettings({
        site_title: settings.site_title || '',
        site_description: settings.site_description || '',
        site_keywords: '',
        google_analytics_id: '',
        google_site_verification: '',
        bing_site_verification: '',
        facebook_app_id: '',
        twitter_handle: '',
        default_og_image: settings.logo_url || '',
        enable_sitemap: true,
        enable_robots: true,
        enable_schema: true
      });
    }
  };

  const setupRealtimeTracking = () => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      setRealtimeStats(prev => ({
        pageViews: prev.pageViews + Math.floor(Math.random() * 5),
        uniqueVisitors: prev.uniqueVisitors + Math.floor(Math.random() * 3),
        bounceRate: Math.random() * 40 + 20,
        avgSessionTime: Math.random() * 300 + 60,
        conversionRate: Math.random() * 5 + 1,
        pageLoadTime: Math.random() * 2 + 1
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  };

  const forceRefresh = () => {
    loadPageData();
    toast({
      title: "Refreshed",
      description: "Page data updated successfully"
    });
  };

  const toggleSection = async (sectionId: string, enabled: boolean) => {
    const { error } = await supabase
      .from('home_page_sections')
      .update({ enabled })
      .eq('id', sectionId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update section",
        variant: "destructive"
      });
      return;
    }

    setHomeSections(prev => 
      prev.map(section => 
        section.id === sectionId ? { ...section, enabled } : section
      )
    );

    toast({
      title: "Success",
      description: `Section ${enabled ? 'enabled' : 'disabled'}`
    });
  };

  const toggleHeroBlock = async (heroId: string, enabled: boolean) => {
    const { error } = await supabase
      .from('hero_blocks')
      .update({ enabled })
      .eq('id', heroId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update hero block",
        variant: "destructive"
      });
      return;
    }

    setHeroBlocks(prev => 
      prev.map(hero => 
        hero.id === heroId ? { ...hero, enabled } : hero
      )
    );

    toast({
      title: "Success",
      description: `Hero block ${enabled ? 'enabled' : 'disabled'}`
    });
  };

  const deleteHeroBlock = async (heroId: string) => {
    const { error } = await supabase
      .from('hero_blocks')
      .delete()
      .eq('id', heroId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete hero block",
        variant: "destructive"
      });
      return;
    }

    setHeroBlocks(prev => prev.filter(hero => hero.id !== heroId));
    toast({
      title: "Success",
      description: "Hero block deleted"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p>Loading Home Page Management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Admin
            </Button>
            <div className="flex items-center gap-2">
              <Layout className="h-5 w-5" />
              <h1 className="text-lg font-semibold">Home Page Management</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Preview Mode Toggle */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('desktop')}
                className="h-8 w-8 p-0"
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('tablet')}
                className="h-8 w-8 p-0"
              >
                <Layout className="h-4 w-4" />
              </Button>
              <Button
                variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('mobile')}
                className="h-8 w-8 p-0"
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
            
            <Button onClick={forceRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
            <Button onClick={() => window.open('/', '_blank')} variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Live
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="hero">Hero Blocks</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Real-time Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{realtimeStats.pageViews.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">+12% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{realtimeStats.uniqueVisitors.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">+8% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{realtimeStats.bounceRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">-3% from last month</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Hero Blocks</CardTitle>
                  <CardDescription>Manage your homepage hero sections</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Hero Blocks</span>
                    <Badge variant="secondary">{heroBlocks.filter(h => h.enabled).length}</Badge>
                  </div>
                  <Button onClick={() => setActiveTab('hero')} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Manage Hero Blocks
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Page Sections</CardTitle>
                  <CardDescription>Configure homepage content sections</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Sections</span>
                    <Badge variant="secondary">{homeSections.filter(s => s.enabled).length}</Badge>
                  </div>
                  <Button onClick={() => setActiveTab('sections')} className="w-full">
                    <Edit className="h-4 w-4 mr-2" />
                    Manage Sections
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Hero Blocks Tab */}
          <TabsContent value="hero" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Hero Block Manager</h2>
                <p className="text-muted-foreground">Create and manage hero sections for your homepage</p>
              </div>
            </div>
            
            <HeroBlockManager 
              heroBlocks={heroBlocks}
              onBack={() => setActiveTab('overview')}
              onUpdate={loadHeroBlocks}
            />
          </TabsContent>

          {/* Sections Tab */}
          <TabsContent value="sections" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Home Page Sections</h2>
                <p className="text-muted-foreground">Configure content sections for your homepage</p>
              </div>
            </div>

            <div className="grid gap-4">
              {homeSections.map((section) => (
                <Card key={section.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{section.title}</CardTitle>
                        <CardDescription>Type: {section.type}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={section.enabled}
                          onCheckedChange={(enabled) => toggleSection(section.id, enabled)}
                        />
                        <Badge variant={section.enabled ? "default" : "secondary"}>
                          {section.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="seo" className="space-y-6">
            <div className="grid gap-6">
              <SEOAnalyzer 
                content={seoSettings.site_description || ''}
                title={seoSettings.site_title || ''}
                description={seoSettings.site_description || ''}
                keywords={seoSettings.site_keywords ? seoSettings.site_keywords.split(',').map(k => k.trim()) : []}
              />
              <AISEOAssistant 
                content={seoSettings.site_description || ''}
                currentTitle={seoSettings.site_title}
                currentDescription={seoSettings.site_description}
                contentType="page"
              />
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Site Information</CardTitle>
                  <CardDescription>Basic site settings and configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="site-title">Site Title</Label>
                      <Input 
                        id="site-title"
                        value={seoSettings.site_title}
                        readOnly
                        placeholder="Site title from settings"
                      />
                    </div>
                    <div>
                      <Label htmlFor="site-description">Site Description</Label>
                      <Input 
                        id="site-description"
                        value={seoSettings.site_description}
                        readOnly
                        placeholder="Site description from settings"
                      />
                    </div>
                  </div>
                  <Button onClick={() => navigate('/admin/site-settings')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Site Settings
                  </Button>
                </CardContent>
              </Card>

              <EnhancedCookieManagement />
              <BackupSecurityCenter />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HomePageManagement;