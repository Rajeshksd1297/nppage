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
  Trash2,
  Monitor,
  Tablet,
  Smartphone,
  Wand2,
  Download,
  Upload,
  Sparkles,
  Layers,
  Zap
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
  });

  const [history, setHistory] = useState<Theme[]>([currentTheme]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewContent, setPreviewContent] = useState<'simple' | 'detailed' | 'interactive'>('detailed');

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
    { 
      name: 'Ocean Blue', 
      colors: { primary: '#0ea5e9', secondary: '#64748b', accent: '#06b6d4', success: '#10b981', warning: '#f59e0b', error: '#ef4444' }
    },
    { 
      name: 'Purple Magic', 
      colors: { primary: '#8b5cf6', secondary: '#64748b', accent: '#c084fc', success: '#10b981', warning: '#f59e0b', error: '#ef4444' }
    },
    { 
      name: 'Forest Green', 
      colors: { primary: '#10b981', secondary: '#64748b', accent: '#34d399', success: '#059669', warning: '#f59e0b', error: '#ef4444' }
    },
    { 
      name: 'Sunset Rose', 
      colors: { primary: '#f43f5e', secondary: '#64748b', accent: '#fb7185', success: '#10b981', warning: '#f59e0b', error: '#dc2626' }
    },
    { 
      name: 'Warm Orange', 
      colors: { primary: '#f97316', secondary: '#64748b', accent: '#fb923c', success: '#10b981', warning: '#ea580c', error: '#ef4444' }
    },
    { 
      name: 'Dark Mode', 
      colors: { primary: '#3b82f6', secondary: '#1f2937', accent: '#60a5fa', success: '#10b981', warning: '#f59e0b', error: '#ef4444' }
    },
  ];

  const fontOptions = [
    { name: 'Inter', value: 'Inter', category: 'Sans Serif' },
    { name: 'Roboto', value: 'Roboto', category: 'Sans Serif' },
    { name: 'Open Sans', value: 'Open Sans', category: 'Sans Serif' },
    { name: 'Lato', value: 'Lato', category: 'Sans Serif' },
    { name: 'Montserrat', value: 'Montserrat', category: 'Sans Serif' },
    { name: 'Poppins', value: 'Poppins', category: 'Sans Serif' },
    { name: 'Playfair Display', value: 'Playfair Display', category: 'Serif' },
    { name: 'Merriweather', value: 'Merriweather', category: 'Serif' },
    { name: 'Crimson Text', value: 'Crimson Text', category: 'Serif' },
    { name: 'JetBrains Mono', value: 'JetBrains Mono', category: 'Monospace' },
    { name: 'Fira Code', value: 'Fira Code', category: 'Monospace' },
    { name: 'Source Code Pro', value: 'Source Code Pro', category: 'Monospace' },
  ];

  const backgroundPatterns = [
    { name: 'None', value: 'none' },
    { name: 'Dots', value: 'dots' },
    { name: 'Grid', value: 'grid' },
    { name: 'Diagonal Lines', value: 'diagonal' },
    { name: 'Waves', value: 'waves' },
    { name: 'Geometric', value: 'geometric' },
  ];

  const generateColorHarmony = (baseColor: string, type: 'monochromatic' | 'analogous' | 'complementary' | 'triadic') => {
    // Simple color harmony generator (in a real app, you'd use a proper color library)
    const hsl = hexToHsl(baseColor);
    const harmonies = {
      monochromatic: [
        hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 20, 0)),
        baseColor,
        hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 20, 100))
      ],
      analogous: [
        hslToHex((hsl.h - 30 + 360) % 360, hsl.s, hsl.l),
        baseColor,
        hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l)
      ],
      complementary: [
        baseColor,
        hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l)
      ],
      triadic: [
        baseColor,
        hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l),
        hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l)
      ]
    };
    return harmonies[type];
  };

  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const applyColorPalette = (palette: any) => {
    updateConfig('colors', palette.colors);
  };

  const exportTheme = () => {
    const themeCSS = generateThemeCSS(currentTheme);
    const blob = new Blob([themeCSS], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentTheme.name.toLowerCase().replace(/\s+/g, '-')}-theme.css`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateThemeCSS = (theme: Theme) => {
    return `
/* ${theme.name} Theme */
:root {
  /* Colors */
  --color-primary: ${theme.config.colors.primary};
  --color-secondary: ${theme.config.colors.secondary};
  --color-accent: ${theme.config.colors.accent};
  --color-success: ${theme.config.colors.success};
  --color-warning: ${theme.config.colors.warning};
  --color-error: ${theme.config.colors.error};
  --color-background: ${theme.config.colors.background};
  --color-surface: ${theme.config.colors.surface};
  --color-text: ${theme.config.colors.text};
  --color-text-secondary: ${theme.config.colors.textSecondary};
  --color-muted: ${theme.config.colors.muted};
  --color-border: ${theme.config.colors.border};
  
  /* Typography */
  --font-heading: ${theme.config.typography.headingFont};
  --font-body: ${theme.config.typography.bodyFont};
  --font-mono: ${theme.config.typography.monoFont};
  
  /* Layout */
  --container-width: ${theme.config.layout.containerWidth};
  --border-radius: ${theme.config.layout.borderRadius.replace('rounded-', '')};
  --shadow: ${theme.config.layout.shadowStyle.replace('shadow-', '')};
  
  /* Effects */
  --transition-speed: ${theme.config.layout.animationSpeed === 'fast' ? '150ms' : theme.config.layout.animationSpeed === 'slow' ? '500ms' : '300ms'};
}
`;
  };

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
          <Button variant="outline" size="sm" onClick={exportTheme}>
            <Download className="h-4 w-4" />
            Export CSS
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
            <TabsList className="grid w-full grid-cols-5">
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
              <TabsTrigger value="effects" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Effects
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
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {colorPalettes.map((palette) => (
                        <button
                          key={palette.name}
                          onClick={() => applyColorPalette(palette)}
                          className="flex flex-col items-center p-3 border rounded-lg hover:shadow-md transition-all hover:scale-105"
                        >
                          <div className="flex gap-1 mb-2">
                            <div 
                              className="w-3 h-3 rounded-full border"
                              style={{ backgroundColor: palette.colors.primary }}
                            />
                            <div 
                              className="w-3 h-3 rounded-full border"
                              style={{ backgroundColor: palette.colors.accent }}
                            />
                            <div 
                              className="w-3 h-3 rounded-full border"
                              style={{ backgroundColor: palette.colors.success }}
                            />
                          </div>
                          <span className="text-xs font-medium">{palette.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Gradient Settings */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium">Gradient Background</Label>
                      <Switch
                        checked={currentTheme.config.colors.gradient?.enabled || false}
                        onCheckedChange={(checked) => updateConfig('colors', {
                          gradient: { ...currentTheme.config.colors.gradient, enabled: checked }
                        })}
                      />
                    </div>
                    {currentTheme.config.colors.gradient?.enabled && (
                      <div className="grid gap-3 md:grid-cols-3">
                        <div>
                          <Label className="text-xs">From</Label>
                          <div className="flex gap-2 items-center">
                            <Input
                              type="color"
                              value={currentTheme.config.colors.gradient?.from || '#3b82f6'}
                              onChange={(e) => updateConfig('colors', {
                                gradient: { ...currentTheme.config.colors.gradient, from: e.target.value }
                              })}
                              className="w-12 h-8 p-1"
                            />
                            <Input
                              value={currentTheme.config.colors.gradient?.from || '#3b82f6'}
                              onChange={(e) => updateConfig('colors', {
                                gradient: { ...currentTheme.config.colors.gradient, from: e.target.value }
                              })}
                              className="text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">To</Label>
                          <div className="flex gap-2 items-center">
                            <Input
                              type="color"
                              value={currentTheme.config.colors.gradient?.to || '#8b5cf6'}
                              onChange={(e) => updateConfig('colors', {
                                gradient: { ...currentTheme.config.colors.gradient, to: e.target.value }
                              })}
                              className="w-12 h-8 p-1"
                            />
                            <Input
                              value={currentTheme.config.colors.gradient?.to || '#8b5cf6'}
                              onChange={(e) => updateConfig('colors', {
                                gradient: { ...currentTheme.config.colors.gradient, to: e.target.value }
                              })}
                              className="text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Direction</Label>
                          <select
                            value={currentTheme.config.colors.gradient?.direction || 'to-r'}
                            onChange={(e) => updateConfig('colors', {
                              gradient: { ...currentTheme.config.colors.gradient, direction: e.target.value }
                            })}
                            className="w-full p-1 text-xs border rounded"
                          >
                            <option value="to-r">Left to Right</option>
                            <option value="to-l">Right to Left</option>
                            <option value="to-t">Bottom to Top</option>
                            <option value="to-b">Top to Bottom</option>
                            <option value="to-br">Top-Left to Bottom-Right</option>
                            <option value="to-bl">Top-Right to Bottom-Left</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Individual Color Controls */}
                  <div className="grid gap-3 md:grid-cols-2">
                    {Object.entries(currentTheme.config.colors)
                      .filter(([key]) => key !== 'gradient')
                      .map(([key, value]) => (
                      <div key={key}>
                        <Label className="text-sm capitalize">
                          {key === 'textSecondary' ? 'Text Secondary' : key}
                        </Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="color"
                            value={value as string}
                            onChange={(e) => updateConfig('colors', { [key]: e.target.value })}
                            className="w-12 h-8 p-1 border"
                          />
                          <Input
                            value={value as string}
                            onChange={(e) => updateConfig('colors', { [key]: e.target.value })}
                            className="flex-1 text-sm"
                            placeholder="#000000"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Color Harmony Generator */}
                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium mb-2 block">Color Harmony Generator</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={currentTheme.config.colors.primary}
                        onChange={(e) => {
                          const harmonies = generateColorHarmony(e.target.value, 'analogous');
                          updateConfig('colors', {
                            primary: harmonies[1],
                            accent: harmonies[0],
                            secondary: harmonies[2]
                          });
                        }}
                        className="w-12 h-8 p-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const harmonies = generateColorHarmony(currentTheme.config.colors.primary, 'complementary');
                          updateConfig('colors', { accent: harmonies[1] });
                        }}
                      >
                        <Wand2 className="h-3 w-3 mr-1" />
                        Complementary
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const harmonies = generateColorHarmony(currentTheme.config.colors.primary, 'triadic');
                          updateConfig('colors', { 
                            accent: harmonies[1],
                            success: harmonies[2]
                          });
                        }}
                      >
                        <Wand2 className="h-3 w-3 mr-1" />
                        Triadic
                      </Button>
                    </div>
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
              <div className="flex items-center gap-2">
                <Button
                  variant={previewMode === 'desktop' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('desktop')}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewMode === 'tablet' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('tablet')}
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewMode === 'mobile' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('mobile')}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
                <select
                  value={previewContent}
                  onChange={(e) => setPreviewContent(e.target.value as any)}
                  className="ml-2 text-sm border rounded px-2 py-1"
                >
                  <option value="simple">Simple</option>
                  <option value="detailed">Detailed</option>
                  <option value="interactive">Interactive</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`
                border rounded-lg overflow-hidden transition-all
                ${previewMode === 'mobile' ? 'max-w-sm' : 
                  previewMode === 'tablet' ? 'max-w-md' : 'w-full'}
                mx-auto
              `}>
                <div 
                  className="p-4 min-h-64"
                  style={{
                    background: currentTheme.config.colors.gradient?.enabled 
                      ? `linear-gradient(${currentTheme.config.colors.gradient.direction}, ${currentTheme.config.colors.gradient.from}, ${currentTheme.config.colors.gradient.to})`
                      : currentTheme.config.colors.background,
                    color: currentTheme.config.colors.text,
                    fontFamily: currentTheme.config.typography.bodyFont,
                    fontSize: currentTheme.config.typography.bodySize === 'sm' ? '14px' : 
                             currentTheme.config.typography.bodySize === 'lg' ? '18px' : '16px',
                  }}
                >
                  {previewContent === 'simple' && (
                    <div className="space-y-4">
                      <h1 
                        className={`font-${currentTheme.config.typography.headingWeight}`}
                        style={{
                          color: currentTheme.config.colors.primary,
                          fontFamily: currentTheme.config.typography.headingFont,
                          fontSize: currentTheme.config.typography.headingSize === '2xl' ? '24px' : 
                                   currentTheme.config.typography.headingSize === '3xl' ? '30px' : '20px',
                        }}
                      >
                        Sample Heading
                      </h1>
                      <p style={{ color: currentTheme.config.colors.text }}>
                        This is sample body text to show how your theme will look.
                      </p>
                      <button
                        className={`px-4 py-2 ${currentTheme.config.layout.borderRadius} font-medium transition-colors hover:opacity-90`}
                        style={{
                          backgroundColor: currentTheme.config.colors.primary,
                          color: currentTheme.config.colors.background,
                        }}
                      >
                        Sample Button
                      </button>
                    </div>
                  )}

                  {previewContent === 'detailed' && (
                    <div className="space-y-6">
                      {/* Header */}
                      <header className="pb-4 border-b" style={{ borderColor: currentTheme.config.colors.border }}>
                        <h1 
                          className={`font-${currentTheme.config.typography.headingWeight} mb-2`}
                          style={{
                            color: currentTheme.config.colors.primary,
                            fontFamily: currentTheme.config.typography.headingFont,
                          }}
                        >
                          Author Name
                        </h1>
                        <p style={{ color: currentTheme.config.colors.textSecondary }}>
                          Professional author and storyteller
                        </p>
                      </header>

                      {/* Navigation */}
                      <nav className="flex gap-4">
                        {['Home', 'Books', 'About', 'Contact'].map((item) => (
                          <a
                            key={item}
                            href="#"
                            className={`px-3 py-1 ${currentTheme.config.layout.borderRadius} transition-colors`}
                            style={{
                              color: currentTheme.config.colors.text,
                              backgroundColor: currentTheme.config.colors.surface,
                            }}
                          >
                            {item}
                          </a>
                        ))}
                      </nav>

                      {/* Content Cards */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <div 
                          className={`p-4 ${currentTheme.config.layout.borderRadius} ${currentTheme.config.layout.shadowStyle}`}
                          style={{
                            backgroundColor: currentTheme.config.colors.surface,
                            borderColor: currentTheme.config.colors.border,
                            borderWidth: currentTheme.config.layout.borderWidth + 'px',
                          }}
                        >
                          <h3 className="font-semibold mb-2" style={{ color: currentTheme.config.colors.primary }}>
                            Latest Book
                          </h3>
                          <p className="text-sm" style={{ color: currentTheme.config.colors.textSecondary }}>
                            A thrilling adventure that will keep you on the edge of your seat.
                          </p>
                          <span 
                            className={`inline-block px-2 py-1 text-xs ${currentTheme.config.layout.borderRadius} mt-2`}
                            style={{
                              backgroundColor: currentTheme.config.colors.accent,
                              color: currentTheme.config.colors.background,
                            }}
                          >
                            Fiction
                          </span>
                        </div>

                        <div 
                          className={`p-4 ${currentTheme.config.layout.borderRadius} ${currentTheme.config.layout.shadowStyle}`}
                          style={{
                            backgroundColor: currentTheme.config.colors.surface,
                            borderColor: currentTheme.config.colors.border,
                            borderWidth: currentTheme.config.layout.borderWidth + 'px',
                          }}
                        >
                          <h3 className="font-semibold mb-2" style={{ color: currentTheme.config.colors.primary }}>
                            About Me
                          </h3>
                          <p className="text-sm" style={{ color: currentTheme.config.colors.textSecondary }}>
                            I've been writing stories for over a decade, crafting worlds that readers love to explore.
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button
                          className={`px-4 py-2 ${currentTheme.config.layout.borderRadius} font-medium transition-all hover:scale-105`}
                          style={{
                            backgroundColor: currentTheme.config.colors.primary,
                            color: currentTheme.config.colors.background,
                          }}
                        >
                          View Books
                        </button>
                        <button
                          className={`px-4 py-2 ${currentTheme.config.layout.borderRadius} font-medium border transition-all hover:scale-105`}
                          style={{
                            borderColor: currentTheme.config.colors.primary,
                            color: currentTheme.config.colors.primary,
                            backgroundColor: 'transparent',
                          }}
                        >
                          Contact
                        </button>
                      </div>
                    </div>
                  )}

                  {previewContent === 'interactive' && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-bold" style={{ color: currentTheme.config.colors.primary }}>
                        Interactive Elements
                      </h2>
                      
                      {/* Color States */}
                      <div className="grid grid-cols-2 gap-4">
                        <div 
                          className="p-3 rounded"
                          style={{ backgroundColor: currentTheme.config.colors.success + '20', borderColor: currentTheme.config.colors.success }}
                        >
                          <span style={{ color: currentTheme.config.colors.success }}>✓ Success</span>
                        </div>
                        <div 
                          className="p-3 rounded"
                          style={{ backgroundColor: currentTheme.config.colors.warning + '20', borderColor: currentTheme.config.colors.warning }}
                        >
                          <span style={{ color: currentTheme.config.colors.warning }}>⚠ Warning</span>
                        </div>
                        <div 
                          className="p-3 rounded"
                          style={{ backgroundColor: currentTheme.config.colors.error + '20', borderColor: currentTheme.config.colors.error }}
                        >
                          <span style={{ color: currentTheme.config.colors.error }}>✗ Error</span>
                        </div>
                        <div 
                          className="p-3 rounded"
                          style={{ backgroundColor: currentTheme.config.colors.accent + '20', borderColor: currentTheme.config.colors.accent }}
                        >
                          <span style={{ color: currentTheme.config.colors.accent }}>★ Featured</span>
                        </div>
                      </div>

                      {/* Typography Showcase */}
                      <div className="space-y-2">
                        <h1 style={{ fontFamily: currentTheme.config.typography.headingFont, color: currentTheme.config.colors.primary }}>
                          Heading 1
                        </h1>
                        <h2 style={{ fontFamily: currentTheme.config.typography.headingFont, color: currentTheme.config.colors.primary }}>
                          Heading 2
                        </h2>
                        <p style={{ fontFamily: currentTheme.config.typography.bodyFont, color: currentTheme.config.colors.text }}>
                          Body text with {currentTheme.config.typography.bodyFont} font
                        </p>
                        <p style={{ fontFamily: currentTheme.config.typography.monoFont, color: currentTheme.config.colors.textSecondary }}>
                          Code text with {currentTheme.config.typography.monoFont}
                        </p>
                      </div>
                    </div>
                  )}
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