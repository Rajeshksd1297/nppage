import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Copy, 
  Palette,
  Filter,
  Grid,
  List,
  Download,
  Upload,
  MoreVertical,
  TrendingUp,
  Users,
  Calendar,
  Star,
  Settings2,
  CheckCircle2,
  XCircle,
  BarChart3,
  Blocks,
  Layers,
  Layout
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { EnhancedThemeDesigner } from '@/components/admin/EnhancedThemeDesigner';
import { HeroBlockManager } from '@/components/admin/HeroBlockManager';
import { RealtimeThemeManager } from '@/components/admin/RealtimeThemeManager';

interface Theme {
  id: string;
  name: string;
  description: string;
  premium: boolean;
  active: boolean;
  preview_image_url?: string;
  created_at: string;
  updated_at: string;
  usage_count: number;
  config: any;
}

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

interface ThemeAnalytics {
  id: string;
  theme_name: string;
  user_count: number;
  creation_date: string;
  last_used: string;
  adoption_rate: number;
  avg_usage_duration: number;
}

export default function ThemeManagement() {
  const { toast } = useToast();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [themeAnalytics, setThemeAnalytics] = useState<ThemeAnalytics[]>([]);
  const [heroBlocks, setHeroBlocks] = useState<HeroBlock[]>([]);
  const [currentView, setCurrentView] = useState<'overview' | 'themes' | 'designer' | 'hero-blocks' | 'analytics' | 'realtime'>('overview');
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'free' | 'premium'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchThemes();
    fetchThemeAnalytics();
    fetchHeroBlocks();
  }, []);

  const fetchThemes = async () => {
    try {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setThemes((data || []).map(theme => ({
        ...theme,
        active: true, // Default value
        usage_count: 0 // Default value
      })));
    } catch (error) {
      console.error('Error fetching themes:', error);
      toast({
        title: "Error",
        description: "Failed to load themes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchThemeAnalytics = async () => {
    try {
      // Fetch theme usage analytics from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('theme_id, created_at')
        .not('theme_id', 'is', null);

      if (profileError) throw profileError;

      // Fetch themes with creation dates
      const { data: themeData, error: themeError } = await supabase
        .from('themes')
        .select('id, name, created_at');

      if (themeError) throw themeError;

      // Process analytics data
      const themeUsageMap = new Map();
      profileData?.forEach(profile => {
        if (profile.theme_id) {
          const count = themeUsageMap.get(profile.theme_id) || 0;
          themeUsageMap.set(profile.theme_id, count + 1);
        }
      });

      const analytics: ThemeAnalytics[] = themeData?.map(theme => {
        const userCount = themeUsageMap.get(theme.id) || 0;
        const totalUsers = profileData?.length || 0;
        const adoptionRate = totalUsers > 0 ? (userCount / totalUsers) * 100 : 0;

        return {
          id: theme.id,
          theme_name: theme.name,
          user_count: userCount,
          creation_date: theme.created_at,
          last_used: new Date().toISOString(), // In real app, track last usage
          adoption_rate: adoptionRate,
          avg_usage_duration: Math.floor(Math.random() * 30) + 1 // Mock data
        };
      }) || [];

      setThemeAnalytics(analytics);

      // Update themes with usage count
      setThemes(prev => prev.map(theme => ({
        ...theme,
        usage_count: themeUsageMap.get(theme.id) || 0
      })));

    } catch (error) {
      console.error('Error fetching theme analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load theme analytics",
        variant: "destructive",
      });
    }
  };

  const fetchHeroBlocks = async () => {
    // Mock hero blocks data - in real app, this would come from database
    const mockHeroBlocks: HeroBlock[] = [
      {
        id: '1',
        name: 'Minimal Hero',
        description: 'Clean and simple hero section with centered text',
        preview_image_url: '/api/placeholder/400/200',
        enabled: true,
        config: {
          layout: 'centered',
          background: 'gradient',
          textAlignment: 'center',
          showCTA: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Split Screen Hero',
        description: 'Hero with image on one side and content on the other',
        preview_image_url: '/api/placeholder/400/200',
        enabled: false,
        config: {
          layout: 'split',
          background: 'image',
          textAlignment: 'left',
          showCTA: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Video Background Hero',
        description: 'Hero section with video background and overlay text',
        preview_image_url: '/api/placeholder/400/200',
        enabled: true,
        config: {
          layout: 'fullscreen',
          background: 'video',
          textAlignment: 'center',
          showCTA: true,
          overlay: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    setHeroBlocks(mockHeroBlocks);
  };

  const handleCreateTheme = () => {
    setSelectedTheme(null);
    setCurrentView('designer');
  };

  const handleEditTheme = (theme: Theme) => {
    setSelectedTheme(theme);
    setCurrentView('designer');
  };

  const handleDeleteTheme = async (themeId: string) => {
    if (window.confirm('Are you sure you want to delete this theme? This action cannot be undone.')) {
      try {
        const { error } = await supabase
          .from('themes')
          .delete()
          .eq('id', themeId);

        if (error) throw error;

        setThemes(themes.filter(t => t.id !== themeId));
        toast({
          title: "Success",
          description: "Theme deleted successfully",
        });
      } catch (error) {
        console.error('Error deleting theme:', error);
        toast({
          title: "Error",
          description: "Failed to delete theme",
          variant: "destructive",
        });
      }
    }
  };

  const handleSaveTheme = async (theme: Theme) => {
    try {
      if (selectedTheme) {
        // Update existing theme
        const { error } = await supabase
          .from('themes')
          .update({
            name: theme.name,
            description: theme.description,
            premium: theme.premium,
            config: theme.config,
            updated_at: new Date().toISOString()
          })
          .eq('id', theme.id);

        if (error) throw error;
        setThemes(themes.map(t => t.id === theme.id ? { ...theme, updated_at: new Date().toISOString() } : t));
      } else {
        // Create new theme
        const { data, error } = await supabase
          .from('themes')
          .insert({
            name: theme.name,
            description: theme.description,
            premium: theme.premium,
            config: theme.config
          })
          .select()
          .single();

        if (error) throw error;
        setThemes([...themes, { ...data, usage_count: 0, active: true }]);
      }

      setCurrentView('themes');
      setSelectedTheme(null);
      toast({
        title: "Success",
        description: selectedTheme ? "Theme updated successfully" : "Theme created successfully",
      });
    } catch (error) {
      console.error('Error saving theme:', error);
      toast({
        title: "Error",
        description: "Failed to save theme",
        variant: "destructive",
      });
    }
  };

  const getThemeStats = () => {
    const totalThemes = themes.length;
    const activeThemes = themes.filter(t => t.active).length;
    const premiumThemes = themes.filter(t => t.premium).length;
    const totalUsage = themes.reduce((sum, theme) => sum + (theme.usage_count || 0), 0);
    return { totalThemes, activeThemes, premiumThemes, totalUsage };
  };

  const stats = getThemeStats();

  const filteredThemes = themes.filter(theme => {
    const matchesSearch = theme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         theme.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'premium' && theme.premium) ||
                         (filterType === 'free' && !theme.premium);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <div className="flex justify-center p-8">Loading theme management...</div>;
  }

  if (currentView === 'designer') {
    return (
      <EnhancedThemeDesigner
        theme={selectedTheme}
        onSave={handleSaveTheme}
        onCancel={() => {
          setCurrentView('themes');
          setSelectedTheme(null);
        }}
      />
    );
  }

  if (currentView === 'hero-blocks') {
    return (
      <HeroBlockManager
        heroBlocks={heroBlocks}
        onBack={() => setCurrentView('overview')}
        onUpdate={setHeroBlocks}
      />
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Theme Management</h1>
          <p className="text-muted-foreground">Create, edit, and manage themes and hero blocks for author pages</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleCreateTheme}>
            <Plus className="h-4 w-4 mr-2" />
            Create Theme
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as any)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="themes">Themes</TabsTrigger>
          <TabsTrigger value="hero-blocks">Hero Blocks</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Themes</CardTitle>
                <Palette className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalThemes}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeThemes} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Premium Themes</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.premiumThemes}</div>
                <p className="text-xs text-muted-foreground">
                  {((stats.premiumThemes / stats.totalThemes) * 100).toFixed(0)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hero Blocks</CardTitle>
                <Blocks className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{heroBlocks.length}</div>
                <p className="text-xs text-muted-foreground">
                  {heroBlocks.filter(h => h.enabled).length} enabled for authors
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsage}</div>
                <p className="text-xs text-muted-foreground">
                  Across all themes
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleCreateTheme}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Theme
                </CardTitle>
                <CardDescription>
                  Build a custom theme with our enhanced designer
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentView('hero-blocks')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Blocks className="h-5 w-5" />
                  Manage Hero Blocks
                </CardTitle>
                <CardDescription>
                  Create and configure hero sections for author pages
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentView('themes')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  Theme Settings
                </CardTitle>
                <CardDescription>
                  Configure theme permissions and availability
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="themes" className="space-y-6">
          {/* Filters and Search */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search themes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Themes Grid/List */}
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredThemes.map((theme) => (
              <Card key={theme.id} className="group hover:shadow-lg transition-shadow">
                {theme.preview_image_url && viewMode === 'grid' && (
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    <img
                      src={theme.preview_image_url}
                      alt={`${theme.name} preview`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{theme.name}</CardTitle>
                      {theme.premium && (
                        <Badge variant="secondary">
                          <Star className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                      {theme.active && (
                        <Badge variant="default">Active</Badge>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditTheme(theme)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteTheme(theme.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription>{theme.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Usage: {theme.usage_count || 0}</span>
                    <span>Updated: {new Date(theme.updated_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredThemes.length === 0 && (
            <div className="text-center py-12">
              <Palette className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No themes found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Create your first theme to get started'}
              </p>
              <Button onClick={handleCreateTheme}>
                <Plus className="h-4 w-4 mr-2" />
                Create Theme
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Most Popular Theme</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {themeAnalytics.sort((a, b) => b.user_count - a.user_count)[0]?.theme_name || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {themeAnalytics.sort((a, b) => b.user_count - a.user_count)[0]?.user_count || 0} users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Adoption Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {themeAnalytics.length > 0 
                    ? (themeAnalytics.reduce((sum, theme) => sum + theme.adoption_rate, 0) / themeAnalytics.length).toFixed(1)
                    : '0'
                  }%
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all themes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Themes</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {themes.filter(theme => {
                    const createdDate = new Date(theme.created_at);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return createdDate > thirtyDaysAgo;
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Usage Duration</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {themeAnalytics.length > 0 
                    ? Math.round(themeAnalytics.reduce((sum, theme) => sum + theme.avg_usage_duration, 0) / themeAnalytics.length)
                    : 0
                  } days
                </div>
                <p className="text-xs text-muted-foreground">
                  Average user retention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme Usage Distribution</CardTitle>
                <CardDescription>Detailed breakdown of theme adoption</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {themeAnalytics.sort((a, b) => b.user_count - a.user_count).slice(0, 8).map((theme) => (
                    <div key={theme.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{theme.theme_name}</span>
                          {themes.find(t => t.id === theme.id)?.premium && (
                            <Badge variant="secondary" className="text-xs">Premium</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{theme.user_count}</span>
                          <span>({theme.adoption_rate.toFixed(1)}%)</span>
                        </div>
                      </div>
                      <Progress 
                        value={theme.adoption_rate} 
                        className="h-2" 
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Creation Timeline & Performance</CardTitle>
                <CardDescription>Theme creation dates and adoption success</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {themeAnalytics.sort((a, b) => new Date(b.creation_date).getTime() - new Date(a.creation_date).getTime()).slice(0, 8).map((theme) => (
                    <div key={theme.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <div>
                          <p className="font-medium">{theme.theme_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Created {new Date(theme.creation_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Badge variant={theme.user_count > 5 ? 'default' : 'secondary'}>
                            {theme.user_count} users
                          </Badge>
                          {themes.find(t => t.id === theme.id)?.premium && (
                            <Star className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {theme.adoption_rate.toFixed(1)}% adoption
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Theme engagement and retention statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">High Performing Themes</span>
                      <span className="text-sm text-muted-foreground">
                        {themeAnalytics.filter(t => t.adoption_rate > 10).length} themes
                      </span>
                    </div>
                    <Progress value={(themeAnalytics.filter(t => t.adoption_rate > 10).length / Math.max(themeAnalytics.length, 1)) * 100} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Premium Theme Adoption</span>
                      <span className="text-sm text-muted-foreground">
                        {themeAnalytics.filter(t => themes.find(theme => theme.id === t.id)?.premium).reduce((sum, t) => sum + t.user_count, 0)} users
                      </span>
                    </div>
                    <Progress value={
                      themeAnalytics.length > 0 
                        ? (themeAnalytics.filter(t => themes.find(theme => theme.id === t.id)?.premium).reduce((sum, t) => sum + t.user_count, 0) / 
                           themeAnalytics.reduce((sum, t) => sum + t.user_count, 0)) * 100
                        : 0
                    } className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Recent Theme Success</span>
                      <span className="text-sm text-muted-foreground">
                        Last 30 days
                      </span>
                    </div>
                    <Progress value={
                      themes.filter(theme => {
                        const createdDate = new Date(theme.created_at);
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        return createdDate > thirtyDaysAgo && (theme.usage_count || 0) > 0;
                      }).length > 0 ? 75 : 0
                    } className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Theme Recommendations</CardTitle>
                <CardDescription>AI-powered insights and suggestions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">Top Performer</span>
                    </div>
                    <p className="text-sm text-green-700">
                      {themeAnalytics.sort((a, b) => b.adoption_rate - a.adoption_rate)[0]?.theme_name || 'No data'} has the highest adoption rate. Consider creating similar themes.
                    </p>
                  </div>

                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Growth Opportunity</span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      {themeAnalytics.filter(t => t.user_count === 0).length} themes have no users. Consider promoting or improving them.
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Market Insight</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Premium themes account for {
                        themeAnalytics.length > 0 
                          ? ((themeAnalytics.filter(t => themes.find(theme => theme.id === t.id)?.premium).reduce((sum, t) => sum + t.user_count, 0) / 
                             themeAnalytics.reduce((sum, t) => sum + t.user_count, 0)) * 100).toFixed(1)
                          : 0
                      }% of total usage.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          <RealtimeThemeManager 
            onThemeSelect={(theme) => {
              setSelectedTheme(theme);
              setCurrentView('designer');
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}