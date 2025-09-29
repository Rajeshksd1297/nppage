import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, Activity, Users, BarChart3, Search, Eye, Save, Edit, 
  Settings, Layout, Monitor, Star, Plus, Trash2, CheckCircle, 
  Globe, Timer, RefreshCw, ExternalLink, Home
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { HeroBlockManager } from '@/components/admin/HeroBlockManager';
import EnhancedCookieManagement from '@/components/admin/EnhancedCookieManagement';
import EnhancedHomePageEditor from '@/components/admin/EnhancedHomePageEditor';
import { SEOAnalyzer } from '@/components/seo/SEOAnalyzer';
import { SchemaGenerator } from '@/components/seo/SchemaGenerator';
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
  created_at: string;
  updated_at: string;
}

interface SiteSettings {
  id: string;
  site_title: string;
  site_description: string;
  primary_color: string;
  secondary_color: string;
  enable_dark_mode: boolean;
  header_config: any;
  footer_config: any;
}

const HomePageManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  // Data states
  const [heroBlocks, setHeroBlocks] = useState<HeroBlock[]>([]);
  const [homeSections, setHomeSections] = useState<HomeSection[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [onlineVisitors, setOnlineVisitors] = useState(0);
  
  // Analytics state
  const [realtimeStats, setRealtimeStats] = useState({
    pageViews: 0,
    uniqueVisitors: 0,
    bounceRate: 0,
    avgSessionTime: 0,
    conversionRate: 0,
    pageLoadTime: 0
  });

  // Load all page data
  const loadPageData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadHeroBlocks(),
        loadHomeSections(),
        loadSiteSettings()
      ]);
      
      toast({
        title: "Data Loaded",
        description: "Page data loaded successfully"
      });
    } catch (error) {
      console.error('Error loading page data:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load page data. Please refresh and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load hero blocks
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

  // Load home page sections
  const loadHomeSections = async () => {
    const { data, error } = await supabase
      .from('home_page_sections')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (error) {
      console.error('Error loading home sections:', error);
      return;
    }
    
    setHomeSections(data || []);
  };

  // Load site settings
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
      setSiteSettings(data[0]);
    }
  };

  // Toggle section visibility
  const toggleSection = async (sectionId: string) => {
    try {
      const section = homeSections.find(s => s.id === sectionId);
      if (!section) return;

      const { error } = await supabase
        .from('home_page_sections')
        .update({ enabled: !section.enabled })
        .eq('id', sectionId);

      if (error) throw error;

      setHomeSections(prev => 
        prev.map(s => s.id === sectionId ? { ...s, enabled: !s.enabled } : s)
      );

      toast({
        title: "Section Updated",
        description: `Section ${section.enabled ? 'disabled' : 'enabled'} successfully`
      });
    } catch (error) {
      console.error('Error toggling section:', error);
      toast({
        title: "Error",
        description: "Failed to update section",
        variant: "destructive"
      });
    }
  };

  // Toggle hero block
  const toggleHeroBlock = async (blockId: string) => {
    try {
      const block = heroBlocks.find(b => b.id === blockId);
      if (!block) return;

      const { error } = await supabase
        .from('hero_blocks')
        .update({ enabled: !block.enabled })
        .eq('id', blockId);

      if (error) throw error;

      setHeroBlocks(prev => 
        prev.map(b => b.id === blockId ? { ...b, enabled: !b.enabled } : b)
      );

      toast({
        title: "Hero Block Updated",
        description: `Hero block ${block.enabled ? 'disabled' : 'enabled'}`
      });
    } catch (error) {
      console.error('Error toggling hero block:', error);
      toast({
        title: "Error",
        description: "Failed to update hero block",
        variant: "destructive"
      });
    }
  };

  // Delete hero block
  const deleteHeroBlock = async (blockId: string) => {
    if (!confirm('Are you sure you want to delete this hero block?')) return;

    try {
      const { error } = await supabase
        .from('hero_blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      setHeroBlocks(prev => prev.filter(b => b.id !== blockId));

      toast({
        title: "Hero Block Deleted",
        description: "Hero block has been permanently removed"
      });
    } catch (error) {
      console.error('Error deleting hero block:', error);
      toast({
        title: "Error",
        description: "Failed to delete hero block",
        variant: "destructive"
      });
    }
  };

  // Simulate real-time tracking
  const setupRealtimeTracking = () => {
    const interval = setInterval(() => {
      setOnlineVisitors(Math.floor(Math.random() * 50) + 1);
      setRealtimeStats(prev => ({
        ...prev,
        pageViews: prev.pageViews + Math.floor(Math.random() * 3),
        uniqueVisitors: Math.floor(Math.random() * 100) + 50,
        bounceRate: Math.floor(Math.random() * 30) + 40,
        avgSessionTime: Math.floor(Math.random() * 180) + 60,
        conversionRate: Number((Math.random() * 5).toFixed(2)),
        pageLoadTime: Number((1.0 + Math.random() * 2).toFixed(2))
      }));
    }, 5000);

    return () => clearInterval(interval);
  };

  // Force refresh home page data
  const forceRefresh = async () => {
    setLoading(true);
    await loadPageData();
    toast({
      title: "Refreshed",
      description: "Home page data has been refreshed"
    });
  };

  // Initialize component
  useEffect(() => {
    loadPageData();
    setupRealtimeTracking();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/admin')}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Home Page Management</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your home page content, hero blocks, and settings
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {onlineVisitors} online
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={forceRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.open('/', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Live
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="hero" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Hero Blocks
          </TabsTrigger>
          <TabsTrigger value="sections" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Sections
          </TabsTrigger>
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Page Editor
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Real-time Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Page Views</p>
                    <p className="text-2xl font-bold">{realtimeStats.pageViews.toLocaleString()}</p>
                  </div>
                  <Eye className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-xs text-green-500 mt-2">+12% from yesterday</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Unique Visitors</p>
                    <p className="text-2xl font-bold">{realtimeStats.uniqueVisitors.toLocaleString()}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-xs text-green-500 mt-2">+8% from yesterday</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Bounce Rate</p>
                    <p className="text-2xl font-bold">{realtimeStats.bounceRate}%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-500" />
                </div>
                <p className="text-xs text-red-500 mt-2">+2% from yesterday</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Load Time</p>
                    <p className="text-2xl font-bold">{realtimeStats.pageLoadTime}s</p>
                  </div>
                  <Timer className="h-8 w-8 text-purple-500" />
                </div>
                <p className="text-xs text-green-500 mt-2">-0.3s from yesterday</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Hero Blocks ({heroBlocks.length})
                </CardTitle>
                <CardDescription>
                  Manage hero sections and call-to-actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Active:</span>
                    <span className="font-medium text-green-600">
                      {heroBlocks.filter(b => b.enabled).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Inactive:</span>
                    <span className="font-medium text-gray-500">
                      {heroBlocks.filter(b => !b.enabled).length}
                    </span>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => setActiveTab('hero')}
                >
                  Manage Hero Blocks
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5" />
                  Page Sections ({homeSections.length})
                </CardTitle>
                <CardDescription>
                  Configure home page content sections
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Enabled:</span>
                    <span className="font-medium text-green-600">
                      {homeSections.filter(s => s.enabled).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Disabled:</span>
                    <span className="font-medium text-gray-500">
                      {homeSections.filter(s => !s.enabled).length}
                    </span>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => setActiveTab('sections')}
                >
                  Manage Sections
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Site Settings
                </CardTitle>
                <CardDescription>
                  Configure global site settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Title:</span>
                    <span className="font-medium truncate max-w-24">
                      {siteSettings?.site_title || 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Theme:</span>
                    <span className="font-medium">
                      {siteSettings?.enable_dark_mode ? 'Dark' : 'Light'}
                    </span>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => setActiveTab('settings')}
                >
                  Configure Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Hero Blocks Tab */}
        <TabsContent value="hero" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hero Block Management</CardTitle>
              <CardDescription>
                Create and manage hero sections for your home page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HeroBlockManager 
                heroBlocks={heroBlocks}
                onBack={() => setActiveTab('overview')}
                onUpdate={loadHeroBlocks}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sections Tab */}
        <TabsContent value="sections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Home Page Sections</CardTitle>
              <CardDescription>
                Configure the content sections displayed on your home page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {homeSections.length === 0 ? (
                  <div className="text-center py-8">
                    <Layout className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No sections configured</h3>
                    <p className="text-muted-foreground mb-4">
                      Start building your home page by adding content sections
                    </p>
                    <Button onClick={() => setActiveTab('editor')}>
                      Open Page Editor
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {homeSections.map((section) => (
                      <div 
                        key={section.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            section.enabled ? 'bg-green-500' : 'bg-gray-300'
                          }`} />
                          <div>
                            <h4 className="font-medium">{section.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              Type: {section.type} • Order: {section.order_index}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={section.enabled}
                            onCheckedChange={() => toggleSection(section.id)}
                          />
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Page Editor Tab */}
        <TabsContent value="editor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visual Page Editor</CardTitle>
              <CardDescription>
                Design your home page with drag-and-drop components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedHomePageEditor />
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>SEO Analysis</CardTitle>
                <CardDescription>
                  Analyze and optimize your home page for search engines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SEOAnalyzer 
                  content={`${siteSettings?.site_title || ''} ${siteSettings?.site_description || ''}`}
                  title={siteSettings?.site_title || 'Home Page'}
                  description={siteSettings?.site_description || ''}
                  keywords={[]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Schema Markup</CardTitle>
                <CardDescription>
                  Generate structured data for better search visibility
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SchemaGenerator />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI SEO Assistant</CardTitle>
                <CardDescription>
                  Get AI-powered recommendations for SEO improvements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AISEOAssistant 
                  content={`${siteSettings?.site_title || ''} ${siteSettings?.site_description || ''}`}
                  contentType="page"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cookie Management</CardTitle>
                <CardDescription>
                  Configure cookie consent and privacy settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EnhancedCookieManagement />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Backup & Security</CardTitle>
                <CardDescription>
                  Manage backups and security settings for your site
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BackupSecurityCenter />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Site Information</CardTitle>
                <CardDescription>
                  Current site configuration and settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Site Title</Label>
                      <Input 
                        value={siteSettings?.site_title || ''} 
                        readOnly 
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Primary Color</Label>
                      <Input 
                        value={siteSettings?.primary_color || ''} 
                        readOnly 
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Site Description</Label>
                    <Input 
                      value={siteSettings?.site_description || ''} 
                      readOnly 
                      className="mt-1"
                    />
                  </div>

                  <Button onClick={() => navigate('/admin/site-settings')}>
                    Edit Site Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HomePageManagement;