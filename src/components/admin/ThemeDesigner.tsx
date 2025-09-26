import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Palette, 
  Type, 
  Layout, 
  Image, 
  Save, 
  Eye,
  Undo,
  Redo,
  Copy,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Theme {
  id: string;
  name: string;
  description: string;
  premium: boolean;
  active: boolean;
  preview_image_url?: string;
  config: {
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
      muted: string;
    };
    typography: {
      headingFont: string;
      bodyFont: string;
      headingSize: string;
      bodySize: string;
      lineHeight: string;
    };
    layout: {
      containerWidth: string;
      spacing: string;
      borderRadius: string;
      shadowStyle: string;
    };
    components: {
      buttonStyle: string;
      cardStyle: string;
      navigationStyle: string;
      footerStyle: string;
    };
  };
}

interface ThemeDesignerProps {
  theme?: Theme | null;
  onSave: (theme: Theme) => void;
  onCancel: () => void;
}

export default function ThemeDesigner({ theme, onSave, onCancel }: ThemeDesignerProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>({
    id: theme?.id || Date.now().toString(),
    name: theme?.name || 'New Theme',
    description: theme?.description || 'Custom theme description',
    premium: theme?.premium || false,
    active: theme?.active || true,
    preview_image_url: theme?.preview_image_url || '',
    config: theme?.config || {
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        accent: '#f59e0b',
        background: '#ffffff',
        text: '#1f2937',
        muted: '#6b7280'
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        headingSize: '2xl',
        bodySize: 'base',
        lineHeight: 'relaxed'
      },
      layout: {
        containerWidth: 'max-w-6xl',
        spacing: 'normal',
        borderRadius: 'rounded-lg',
        shadowStyle: 'shadow-lg'
      },
      components: {
        buttonStyle: 'modern',
        cardStyle: 'elevated',
        navigationStyle: 'clean',
        footerStyle: 'minimal'
      }
    }
  });

  const [history, setHistory] = useState<Theme[]>([currentTheme]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const updateTheme = (updates: Partial<Theme>) => {
    const newTheme = { ...currentTheme, ...updates };
    setCurrentTheme(newTheme);
    
    // Add to history for undo/redo
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newTheme);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const updateConfig = (section: keyof Theme['config'], updates: any) => {
    updateTheme({
      config: {
        ...currentTheme.config,
        [section]: { ...currentTheme.config[section], ...updates }
      }
    });
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCurrentTheme(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCurrentTheme(history[historyIndex + 1]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(currentTheme);
      toast({
        title: "Success",
        description: "Theme saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save theme",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const duplicateTheme = () => {
    const duplicated = {
      ...currentTheme,
      id: Date.now().toString(),
      name: `${currentTheme.name} Copy`,
    };
    setCurrentTheme(duplicated);
  };

  const colorPalettes = [
    { name: 'Blue', primary: '#3b82f6', secondary: '#64748b', accent: '#f59e0b' },
    { name: 'Purple', primary: '#8b5cf6', secondary: '#64748b', accent: '#f59e0b' },
    { name: 'Green', primary: '#10b981', secondary: '#64748b', accent: '#f59e0b' },
    { name: 'Rose', primary: '#f43f5e', secondary: '#64748b', accent: '#f59e0b' },
    { name: 'Orange', primary: '#f97316', secondary: '#64748b', accent: '#3b82f6' },
  ];

  const fontOptions = [
    { name: 'Inter', value: 'Inter' },
    { name: 'Roboto', value: 'Roboto' },
    { name: 'Open Sans', value: 'Open Sans' },
    { name: 'Lato', value: 'Lato' },
    { name: 'Montserrat', value: 'Montserrat' },
    { name: 'Playfair Display', value: 'Playfair Display' },
    { name: 'Merriweather', value: 'Merriweather' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Theme Designer</h2>
          <p className="text-muted-foreground">Create and customize themes for author pages</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex === 0}>
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex === history.length - 1}>
            <Redo className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={duplicateTheme}>
            <Copy className="h-4 w-4" />
            Duplicate
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Theme'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Design Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="themeName">Theme Name</Label>
                  <Input
                    id="themeName"
                    value={currentTheme.name}
                    onChange={(e) => updateTheme({ name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="previewImage">Preview Image URL</Label>
                  <Input
                    id="previewImage"
                    value={currentTheme.preview_image_url || ''}
                    onChange={(e) => updateTheme({ preview_image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={currentTheme.description}
                  onChange={(e) => updateTheme({ description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={currentTheme.premium}
                    onCheckedChange={(checked) => updateTheme({ premium: checked })}
                  />
                  <Label>Premium Theme</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={currentTheme.active}
                    onCheckedChange={(checked) => updateTheme({ active: checked })}
                  />
                  <Label>Active</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="colors" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="colors" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Colors
              </TabsTrigger>
              <TabsTrigger value="typography" className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Typography
              </TabsTrigger>
              <TabsTrigger value="layout" className="flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Layout
              </TabsTrigger>
              <TabsTrigger value="components" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Components
              </TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Color Palette</CardTitle>
                  <CardDescription>Choose colors for your theme</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quick Color Palettes */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Quick Palettes</Label>
                    <div className="flex gap-2">
                      {colorPalettes.map((palette) => (
                        <button
                          key={palette.name}
                          onClick={() => updateConfig('colors', {
                            primary: palette.primary,
                            secondary: palette.secondary,
                            accent: palette.accent,
                          })}
                          className="flex flex-col items-center p-2 border rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="flex gap-1 mb-1">
                            <div 
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: palette.primary }}
                            />
                            <div 
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: palette.secondary }}
                            />
                            <div 
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: palette.accent }}
                            />
                          </div>
                          <span className="text-xs">{palette.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Individual Color Controls */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {Object.entries(currentTheme.config.colors).map(([key, value]) => (
                      <div key={key}>
                        <Label className="capitalize">{key}</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="color"
                            value={value}
                            onChange={(e) => updateConfig('colors', { [key]: e.target.value })}
                            className="w-16 h-10 p-1 border"
                          />
                          <Input
                            value={value}
                            onChange={(e) => updateConfig('colors', { [key]: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="typography" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Typography Settings</CardTitle>
                  <CardDescription>Customize fonts and text styles</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Heading Font</Label>
                      <select
                        value={currentTheme.config.typography.headingFont}
                        onChange={(e) => updateConfig('typography', { headingFont: e.target.value })}
                        className="w-full p-2 border rounded-md"
                      >
                        {fontOptions.map((font) => (
                          <option key={font.value} value={font.value}>
                            {font.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Body Font</Label>
                      <select
                        value={currentTheme.config.typography.bodyFont}
                        onChange={(e) => updateConfig('typography', { bodyFont: e.target.value })}
                        className="w-full p-2 border rounded-md"
                      >
                        {fontOptions.map((font) => (
                          <option key={font.value} value={font.value}>
                            {font.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Heading Size</Label>
                      <select
                        value={currentTheme.config.typography.headingSize}
                        onChange={(e) => updateConfig('typography', { headingSize: e.target.value })}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="xl">Extra Large</option>
                        <option value="2xl">2X Large</option>
                        <option value="3xl">3X Large</option>
                        <option value="4xl">4X Large</option>
                      </select>
                    </div>
                    <div>
                      <Label>Body Size</Label>
                      <select
                        value={currentTheme.config.typography.bodySize}
                        onChange={(e) => updateConfig('typography', { bodySize: e.target.value })}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="sm">Small</option>
                        <option value="base">Base</option>
                        <option value="lg">Large</option>
                        <option value="xl">Extra Large</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layout" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Layout Settings</CardTitle>
                  <CardDescription>Control spacing, width, and visual effects</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Container Width</Label>
                      <select
                        value={currentTheme.config.layout.containerWidth}
                        onChange={(e) => updateConfig('layout', { containerWidth: e.target.value })}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="max-w-4xl">Narrow (4xl)</option>
                        <option value="max-w-5xl">Medium (5xl)</option>
                        <option value="max-w-6xl">Wide (6xl)</option>
                        <option value="max-w-7xl">Extra Wide (7xl)</option>
                        <option value="max-w-full">Full Width</option>
                      </select>
                    </div>
                    <div>
                      <Label>Spacing</Label>
                      <select
                        value={currentTheme.config.layout.spacing}
                        onChange={(e) => updateConfig('layout', { spacing: e.target.value })}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="tight">Tight</option>
                        <option value="normal">Normal</option>
                        <option value="relaxed">Relaxed</option>
                        <option value="loose">Loose</option>
                      </select>
                    </div>
                    <div>
                      <Label>Border Radius</Label>
                      <select
                        value={currentTheme.config.layout.borderRadius}
                        onChange={(e) => updateConfig('layout', { borderRadius: e.target.value })}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="rounded-none">None</option>
                        <option value="rounded-sm">Small</option>
                        <option value="rounded-md">Medium</option>
                        <option value="rounded-lg">Large</option>
                        <option value="rounded-xl">Extra Large</option>
                      </select>
                    </div>
                    <div>
                      <Label>Shadow Style</Label>
                      <select
                        value={currentTheme.config.layout.shadowStyle}
                        onChange={(e) => updateConfig('layout', { shadowStyle: e.target.value })}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="shadow-none">None</option>
                        <option value="shadow-sm">Small</option>
                        <option value="shadow-md">Medium</option>
                        <option value="shadow-lg">Large</option>
                        <option value="shadow-xl">Extra Large</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="components" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Component Styles</CardTitle>
                  <CardDescription>Customize the appearance of UI components</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Button Style</Label>
                      <select
                        value={currentTheme.config.components.buttonStyle}
                        onChange={(e) => updateConfig('components', { buttonStyle: e.target.value })}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="classic">Classic</option>
                        <option value="modern">Modern</option>
                        <option value="minimal">Minimal</option>
                        <option value="bold">Bold</option>
                      </select>
                    </div>
                    <div>
                      <Label>Card Style</Label>
                      <select
                        value={currentTheme.config.components.cardStyle}
                        onChange={(e) => updateConfig('components', { cardStyle: e.target.value })}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="flat">Flat</option>
                        <option value="elevated">Elevated</option>
                        <option value="outlined">Outlined</option>
                        <option value="glass">Glass</option>
                      </select>
                    </div>
                    <div>
                      <Label>Navigation Style</Label>
                      <select
                        value={currentTheme.config.components.navigationStyle}
                        onChange={(e) => updateConfig('components', { navigationStyle: e.target.value })}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="clean">Clean</option>
                        <option value="rounded">Rounded</option>
                        <option value="underlined">Underlined</option>
                        <option value="pill">Pill</option>
                      </select>
                    </div>
                    <div>
                      <Label>Footer Style</Label>
                      <select
                        value={currentTheme.config.components.footerStyle}
                        onChange={(e) => updateConfig('components', { footerStyle: e.target.value })}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="minimal">Minimal</option>
                        <option value="detailed">Detailed</option>
                        <option value="centered">Centered</option>
                        <option value="split">Split</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="border rounded-lg p-4 min-h-64"
                style={{
                  backgroundColor: currentTheme.config.colors.background,
                  color: currentTheme.config.colors.text,
                  fontFamily: currentTheme.config.typography.bodyFont,
                }}
              >
                <div className="space-y-4">
                  <h1 
                    className="font-bold"
                    style={{
                      color: currentTheme.config.colors.primary,
                      fontFamily: currentTheme.config.typography.headingFont,
                    }}
                  >
                    Sample Heading
                  </h1>
                  <p style={{ color: currentTheme.config.colors.text }}>
                    This is sample body text to show how your theme will look. 
                    The typography and colors are applied as per your settings.
                  </p>
                  <button
                    className="px-4 py-2 rounded font-medium"
                    style={{
                      backgroundColor: currentTheme.config.colors.primary,
                      color: currentTheme.config.colors.background,
                      borderRadius: currentTheme.config.layout.borderRadius.replace('rounded-', ''),
                    }}
                  >
                    Sample Button
                  </button>
                  <div 
                    className="p-4 border"
                    style={{
                      backgroundColor: currentTheme.config.colors.muted + '20',
                      borderColor: currentTheme.config.colors.muted,
                      borderRadius: currentTheme.config.layout.borderRadius.replace('rounded-', ''),
                    }}
                  >
                    Sample Card Component
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Theme Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Name:</span>
                <span className="text-sm font-medium">{currentTheme.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Type:</span>
                <Badge variant={currentTheme.premium ? "default" : "secondary"}>
                  {currentTheme.premium ? "Premium" : "Free"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant={currentTheme.active ? "default" : "secondary"}>
                  {currentTheme.active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}