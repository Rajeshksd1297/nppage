import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
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
  BarChart3
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
import ThemeDesigner from './ThemeDesigner';
import { useToast } from '@/hooks/use-toast';

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
  config: {
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      success: string;
      warning: string;
      error: string;
      background: string;
      surface: string;
      text: string;
      textSecondary: string;
      muted: string;
      border: string;
      gradient?: {
        enabled: boolean;
        from: string;
        to: string;
        direction: string;
      };
    };
    typography: {
      headingFont: string;
      bodyFont: string;
      monoFont: string;
      headingSize: string;
      bodySize: string;
      smallSize: string;
      lineHeight: string;
      headingWeight: string;
      bodyWeight: string;
      letterSpacing: string;
      textTransform: string;
    };
    layout: {
      containerWidth: string;
      spacing: string;
      borderRadius: string;
      borderWidth: string;
      shadowStyle: string;
      animationSpeed: string;
      gridColumns: string;
      breakpoints: {
        mobile: string;
        tablet: string;
        desktop: string;
      };
    };
    components: {
      buttonStyle: string;
      buttonSize: string;
      cardStyle: string;
      cardPadding: string;
      navigationStyle: string;
      footerStyle: string;
      inputStyle: string;
      linkStyle: string;
      badgeStyle: string;
      hoverEffects: boolean;
      focusRings: boolean;
    };
    effects: {
      animations: boolean;
      transitions: boolean;
      backgroundPattern: string;
      overlays: boolean;
      blurEffects: boolean;
    };
  };
}

export default function ThemeManager() {
  const { toast } = useToast();
  const [themes, setThemes] = useState<Theme[]>([
    {
      id: '1',
      name: 'Classic',
      description: 'Clean and professional theme with minimal design',
      premium: false,
      active: true,
      preview_image_url: '',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      usage_count: 45,
      config: {
        colors: {
          primary: '#3b82f6',
          secondary: '#64748b',
          accent: '#f59e0b',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          background: '#ffffff',
          surface: '#f8fafc',
          text: '#1f2937',
          textSecondary: '#6b7280',
          muted: '#9ca3af',
          border: '#e5e7eb',
          gradient: {
            enabled: false,
            from: '#3b82f6',
            to: '#8b5cf6',
            direction: 'to-r'
          }
        },
        typography: {
          headingFont: 'Inter',
          bodyFont: 'Inter',
          monoFont: 'JetBrains Mono',
          headingSize: '2xl',
          bodySize: 'base',
          smallSize: 'sm',
          lineHeight: 'relaxed',
          headingWeight: 'bold',
          bodyWeight: 'normal',
          letterSpacing: 'normal',
          textTransform: 'none'
        },
        layout: {
          containerWidth: 'max-w-6xl',
          spacing: 'normal',
          borderRadius: 'rounded-lg',
          borderWidth: '1',
          shadowStyle: 'shadow-lg',
          animationSpeed: 'normal',
          gridColumns: '12',
          breakpoints: {
            mobile: '640px',
            tablet: '768px',
            desktop: '1024px'
          }
        },
        components: {
          buttonStyle: 'modern',
          buttonSize: 'md',
          cardStyle: 'elevated',
          cardPadding: 'normal',
          navigationStyle: 'clean',
          footerStyle: 'minimal',
          inputStyle: 'outlined',
          linkStyle: 'underline',
          badgeStyle: 'rounded',
          hoverEffects: true,
          focusRings: true
        },
        effects: {
          animations: true,
          transitions: true,
          backgroundPattern: 'none',
          overlays: false,
          blurEffects: false
        }
      }
    },
    {
      id: '2',
      name: 'Modern',
      description: 'Contemporary design with bold colors and gradients',
      premium: true,
      active: true,
      preview_image_url: '',
      created_at: '2024-01-15',
      updated_at: '2024-01-15',
      usage_count: 23,
      config: {
        colors: {
          primary: '#8b5cf6',
          secondary: '#64748b',
          accent: '#c084fc',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          background: '#ffffff',
          surface: '#f8fafc',
          text: '#1f2937',
          textSecondary: '#6b7280',
          muted: '#9ca3af',
          border: '#e5e7eb',
          gradient: {
            enabled: true,
            from: '#8b5cf6',
            to: '#c084fc',
            direction: 'to-br'
          }
        },
        typography: {
          headingFont: 'Montserrat',
          bodyFont: 'Inter',
          monoFont: 'JetBrains Mono',
          headingSize: '3xl',
          bodySize: 'base',
          smallSize: 'sm',
          lineHeight: 'relaxed',
          headingWeight: 'bold',
          bodyWeight: 'normal',
          letterSpacing: 'wide',
          textTransform: 'none'
        },
        layout: {
          containerWidth: 'max-w-5xl',
          spacing: 'relaxed',
          borderRadius: 'rounded-xl',
          borderWidth: '2',
          shadowStyle: 'shadow-xl',
          animationSpeed: 'fast',
          gridColumns: '12',
          breakpoints: {
            mobile: '640px',
            tablet: '768px',
            desktop: '1024px'
          }
        },
        components: {
          buttonStyle: 'bold',
          buttonSize: 'lg',
          cardStyle: 'glass',
          cardPadding: 'relaxed',
          navigationStyle: 'pill',
          footerStyle: 'detailed',
          inputStyle: 'filled',
          linkStyle: 'animated',
          badgeStyle: 'pill',
          hoverEffects: true,
          focusRings: true
        },
        effects: {
          animations: true,
          transitions: true,
          backgroundPattern: 'geometric',
          overlays: true,
          blurEffects: true
        }
      }
    },
  ]);

  const [currentView, setCurrentView] = useState<'list' | 'designer'>('list');
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'free' | 'premium'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'updated' | 'usage'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState('overview');

  const filteredThemes = themes.filter(theme => {
    const matchesSearch = theme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         theme.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'premium' && theme.premium) ||
                         (filterType === 'free' && !theme.premium);
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    let aValue, bValue;
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'created':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      case 'updated':
        aValue = new Date(a.updated_at).getTime();
        bValue = new Date(b.updated_at).getTime();
        break;
      case 'usage':
        aValue = a.usage_count;
        bValue = b.usage_count;
        break;
      default:
        aValue = a.name;
        bValue = b.name;
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const handleCreateTheme = () => {
    setSelectedTheme(null);
    setCurrentView('designer');
  };

  const handleEditTheme = (theme: Theme) => {
    setSelectedTheme(theme);
    setCurrentView('designer');
  };

  const handleDeleteTheme = (themeId: string) => {
    if (window.confirm('Are you sure you want to delete this theme? This action cannot be undone.')) {
      setThemes(themes.filter(t => t.id !== themeId));
      toast({
        title: "Success",
        description: "Theme deleted successfully",
      });
    }
  };

  const handleDuplicateTheme = (theme: Theme) => {
    const duplicated = {
      ...theme,
      id: Date.now().toString(),
      name: `${theme.name} Copy`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      usage_count: 0,
    };
    setThemes([...themes, duplicated]);
    toast({
      title: "Success",
      description: "Theme duplicated successfully",
    });
  };

  const handleSaveTheme = (theme: Theme) => {
    if (selectedTheme) {
      // Update existing theme
      setThemes(themes.map(t => t.id === theme.id ? { ...theme, updated_at: new Date().toISOString() } : t));
    } else {
      // Create new theme
      const newTheme = {
        ...theme,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        usage_count: 0,
      };
      setThemes([...themes, newTheme]);
    }
    setCurrentView('list');
    setSelectedTheme(null);
  };

  const handleToggleActive = (themeId: string) => {
    setThemes(themes.map(t => 
      t.id === themeId ? { ...t, active: !t.active } : t
    ));
    toast({
      title: "Theme Updated",
      description: "Theme status updated successfully",
    });
  };

  const handleBulkDelete = () => {
    if (selectedThemes.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedThemes.length} theme(s)? This action cannot be undone.`)) {
      setThemes(themes.filter(t => !selectedThemes.includes(t.id)));
      setSelectedThemes([]);
      toast({
        title: "Success",
        description: `${selectedThemes.length} theme(s) deleted successfully`,
      });
    }
  };

  const handleBulkToggleActive = () => {
    if (selectedThemes.length === 0) return;
    setThemes(themes.map(t => 
      selectedThemes.includes(t.id) ? { ...t, active: !t.active } : t
    ));
    setSelectedThemes([]);
    toast({
      title: "Success",
      description: `${selectedThemes.length} theme(s) updated successfully`,
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedThemes(filteredThemes.map(t => t.id));
    } else {
      setSelectedThemes([]);
    }
  };

  const handleSelectTheme = (themeId: string, checked: boolean) => {
    if (checked) {
      setSelectedThemes([...selectedThemes, themeId]);
    } else {
      setSelectedThemes(selectedThemes.filter(id => id !== themeId));
    }
  };

  const getThemeStats = () => {
    const totalThemes = themes.length;
    const activeThemes = themes.filter(t => t.active).length;
    const premiumThemes = themes.filter(t => t.premium).length;
    const totalUsage = themes.reduce((sum, theme) => sum + theme.usage_count, 0);
    return { totalThemes, activeThemes, premiumThemes, totalUsage };
  };

  const stats = getThemeStats();

  if (currentView === 'designer') {
    return (
      <ThemeDesigner
        theme={selectedTheme}
        onSave={handleSaveTheme}
        onCancel={() => {
          setCurrentView('list');
          setSelectedTheme(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Theme Management</h2>
          <p className="text-muted-foreground">Create, edit, and manage themes for author pages</p>
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="themes">Themes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Themes</CardTitle>
                <Palette className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalThemes}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.premiumThemes} premium themes
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Themes</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeThemes}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((stats.activeThemes / stats.totalThemes) * 100)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsage}</div>
                <p className="text-xs text-muted-foreground">
                  Across all themes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Usage</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalThemes > 0 ? Math.round(stats.totalUsage / stats.totalThemes) : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Per theme
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common theme management tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" onClick={handleCreateTheme} className="h-20 flex-col">
                <Plus className="h-6 w-6 mb-2" />
                Create New Theme
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Download className="h-6 w-6 mb-2" />
                Export Themes
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Settings2 className="h-6 w-6 mb-2" />
                Theme Settings
              </Button>
            </CardContent>
          </Card>

          {/* Recent Themes */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Themes</CardTitle>
              <CardDescription>Recently created or updated themes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {themes
                  .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                  .slice(0, 5)
                  .map((theme) => (
                    <div key={theme.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: theme.config.colors.primary }}
                        />
                        <div>
                          <div className="font-medium">{theme.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Updated {new Date(theme.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {theme.premium && <Badge variant="default">Premium</Badge>}
                        {theme.active && <Badge variant="outline">Active</Badge>}
                        <Button variant="ghost" size="sm" onClick={() => handleEditTheme(theme)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="themes" className="space-y-4">
          {/* Bulk Actions */}
          {selectedThemes.length > 0 && (
            <Alert>
              <AlertDescription className="flex items-center justify-between">
                <span>{selectedThemes.length} theme(s) selected</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleBulkToggleActive}>
                    Toggle Active
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Filters and Search */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
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
                  
                  <Select value={filterType} onValueChange={(value) => setFilterType(value as any)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Themes</SelectItem>
                      <SelectItem value="free">Free Themes</SelectItem>
                      <SelectItem value="premium">Premium Themes</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="updated">Last Updated</SelectItem>
                      <SelectItem value="created">Date Created</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="usage">Usage Count</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </Button>
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
            </CardContent>
          </Card>

          {/* Theme List */}
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredThemes.map((theme) => (
              <Card key={theme.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Checkbox
                        checked={selectedThemes.includes(theme.id)}
                        onCheckedChange={(checked) => handleSelectTheme(theme.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {theme.name}
                          {theme.premium && <Badge variant="default">Premium</Badge>}
                          {theme.active ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">{theme.description}</CardDescription>
                      </div>
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
                          Edit Theme
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateTheme(theme)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(theme.id)}>
                          {theme.active ? <XCircle className="h-4 w-4 mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                          {theme.active ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteTheme(theme.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Theme
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Enhanced Theme Preview */}
                  <div 
                    className="h-32 rounded-lg border p-4 text-xs relative overflow-hidden"
                    style={{
                      backgroundColor: theme.config.colors.background,
                      color: theme.config.colors.text,
                      fontFamily: theme.config.typography.bodyFont,
                    }}
                  >
                    {theme.config.effects.backgroundPattern !== 'none' && (
                      <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-transparent via-primary to-transparent" />
                    )}
                    <div className="relative space-y-2">
                      <div 
                        className="font-semibold text-sm"
                        style={{ 
                          color: theme.config.colors.primary,
                          fontFamily: theme.config.typography.headingFont 
                        }}
                      >
                        Sample Book Title
                      </div>
                      <div className="text-xs opacity-75">Author biography excerpt with theme styling...</div>
                      <div className="flex items-center gap-2 mt-3">
                        <div 
                          className="px-3 py-1 rounded text-xs font-medium"
                          style={{
                            backgroundColor: theme.config.colors.primary,
                            color: theme.config.colors.background,
                          }}
                        >
                          Read More
                        </div>
                        <div 
                          className="px-2 py-1 rounded text-xs"
                          style={{
                            backgroundColor: theme.config.colors.accent + '20',
                            color: theme.config.colors.accent,
                          }}
                        >
                          ${Math.floor(Math.random() * 20 + 10)}.99
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Color Palette */}
                  <div>
                     <div className="text-sm font-medium mb-2 flex items-center gap-2">
                       <Palette className="w-4 h-4" />
                       Color Palette
                     </div>
                     <div className="flex gap-1 flex-wrap">
                       {Object.entries(theme.config.colors)
                         .filter(([key, color]) => typeof color === 'string' && key !== 'gradient')
                         .slice(0, 6)
                         .map(([key, color]) => (
                         <div
                           key={key}
                           className="w-8 h-8 rounded border shadow-sm"
                           style={{ backgroundColor: color as string }}
                           title={key}
                         />
                       ))}
                     </div>
                  </div>

                  {/* Enhanced Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{theme.usage_count}</span>
                      <span className="text-muted-foreground">users</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {new Date(theme.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Usage Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Usage Popularity</span>
                      <span>{Math.min(100, (theme.usage_count / Math.max(...themes.map(t => t.usage_count))) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={Math.min(100, (theme.usage_count / Math.max(...themes.map(t => t.usage_count))) * 100)} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Select All Checkbox */}
          {filteredThemes.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedThemes.length === filteredThemes.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  Select all ({filteredThemes.length} themes)
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Showing {filteredThemes.length} of {themes.length} themes
              </div>
            </div>
          )}

          {filteredThemes.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Palette className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm || filterType !== 'all' ? 'No matching themes found' : 'No Themes Available'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterType !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Get started by creating your first theme'
                  }
                </p>
                <Button onClick={handleCreateTheme}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Theme
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Theme Usage Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Theme Usage Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {themes
                    .sort((a, b) => b.usage_count - a.usage_count)
                    .slice(0, 5)
                    .map((theme) => (
                      <div key={theme.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: theme.config.colors.primary }}
                          />
                          <span className="font-medium">{theme.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={(theme.usage_count / Math.max(...themes.map(t => t.usage_count))) * 100} 
                            className="w-20 h-2"
                          />
                          <span className="text-sm text-muted-foreground w-8">{theme.usage_count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Theme Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round((stats.activeThemes / stats.totalThemes) * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Active Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round((stats.premiumThemes / stats.totalThemes) * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Premium Rate</div>
                    </div>
                  </div>
                  <div className="text-center pt-4 border-t">
                    <div className="text-lg font-semibold">{stats.totalUsage}</div>
                    <div className="text-sm text-muted-foreground">Total Theme Adoptions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Theme Creation Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Theme Creation Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {themes
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((theme) => (
                    <div key={theme.id} className="flex items-center gap-4 p-3 rounded-lg border">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: theme.config.colors.primary }}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{theme.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Created {new Date(theme.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {theme.premium && <Badge variant="default">Premium</Badge>}
                        <Badge variant={theme.active ? "outline" : "secondary"}>
                          {theme.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}