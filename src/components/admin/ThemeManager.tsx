import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  List
} from 'lucide-react';
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

  const filteredThemes = themes.filter(theme => {
    const matchesSearch = theme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         theme.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'premium' && theme.premium) ||
                         (filterType === 'free' && !theme.premium);
    return matchesSearch && matchesFilter;
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
  };

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
        <Button onClick={handleCreateTheme}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Theme
        </Button>
      </div>

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
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Themes</option>
                <option value="free">Free Themes</option>
                <option value="premium">Premium Themes</option>
              </select>
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
        </CardContent>
      </Card>

      {/* Theme List */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {filteredThemes.map((theme) => (
          <Card key={theme.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {theme.name}
                    {theme.premium && <Badge variant="default">Premium</Badge>}
                    {!theme.active && <Badge variant="secondary">Inactive</Badge>}
                  </CardTitle>
                  <CardDescription className="mt-1">{theme.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Theme Preview */}
              <div 
                className="h-24 rounded-md border p-3 text-xs"
                style={{
                  backgroundColor: theme.config.colors.background,
                  color: theme.config.colors.text,
                  fontFamily: theme.config.typography.bodyFont,
                }}
              >
                <div className="space-y-1">
                  <div 
                    className="font-semibold"
                    style={{ 
                      color: theme.config.colors.primary,
                      fontFamily: theme.config.typography.headingFont 
                    }}
                  >
                    Sample Heading
                  </div>
                  <div className="text-xs opacity-75">Sample content with theme colors</div>
                  <div 
                    className="inline-block px-2 py-1 rounded text-xs"
                    style={{
                      backgroundColor: theme.config.colors.primary,
                      color: theme.config.colors.background,
                    }}
                  >
                    Button
                  </div>
                </div>
              </div>

              {/* Color Palette */}
              <div>
                 <div className="text-sm font-medium mb-2">Color Palette</div>
                 <div className="flex gap-1">
                   {Object.entries(theme.config.colors)
                     .filter(([key, color]) => typeof color === 'string')
                     .slice(0, 4)
                     .map(([key, color]) => (
                     <div
                       key={key}
                       className="w-6 h-6 rounded border"
                       style={{ backgroundColor: color as string }}
                       title={key}
                     />
                   ))}
                 </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{theme.usage_count} users</span>
                <span>Updated {new Date(theme.updated_at).toLocaleDateString()}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditTheme(theme)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicateTheme(theme)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTheme(theme.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleActive(theme.id)}
                >
                  {theme.active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredThemes.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No themes found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Create your first theme to get started'
              }
            </p>
            {!searchTerm && filterType === 'all' && (
              <Button onClick={handleCreateTheme}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Theme
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}