import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  Eye,
  Undo,
  Redo,
  Copy,
  Download,
  Monitor,
  Tablet,
  Smartphone,
  Palette,
  Type,
  Layout,
  Sparkles,
  Layers,
  ArrowLeft,
  Plus,
  Trash2,
  Move,
  Settings
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from '@/hooks/use-toast';
import { DragDropProfileDesigner } from '@/components/profile/DragDropProfileDesigner';

interface Theme {
  id: string;
  name: string;
  description: string;
  premium: boolean;
  config: any;
}

interface EnhancedThemeDesignerProps {
  theme?: Theme | null;
  onSave: (theme: Theme) => void;
  onCancel: () => void;
}

interface LayoutSection {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  config: any;
  order: number;
}

function SortableItem({ section, onUpdate, onRemove }: { 
  section: LayoutSection;
  onUpdate: (id: string, updates: Partial<LayoutSection>) => void;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border rounded-lg p-4 bg-card"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div {...attributes} {...listeners} className="cursor-grab">
            <Move className="h-4 w-4 text-muted-foreground" />
          </div>
          <h4 className="font-medium">{section.name}</h4>
          <Badge variant="outline">{section.type}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={section.enabled}
            onCheckedChange={(enabled) => onUpdate(section.id, { enabled })}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(section.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        Configure how this section appears on author profiles
      </p>
      <div className="space-y-2">
        <Button variant="outline" size="sm" className="w-full">
          <Settings className="h-4 w-4 mr-2" />
          Configure Section
        </Button>
      </div>
    </div>
  );
}

export function EnhancedThemeDesigner({ theme, onSave, onCancel }: EnhancedThemeDesignerProps) {
  const { toast } = useToast();
  
  // Helper function to ensure config has all required properties
  const getDefaultConfig = () => ({
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#f59e0b',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1f2937',
      border: '#e5e7eb'
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      headingSize: '2xl',
      bodySize: 'base'
    },
    layout: {
      containerWidth: 'max-w-6xl',
      spacing: 'normal',
      borderRadius: 'rounded-lg'
    },
    sections: []
  });

  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    const defaultConfig = getDefaultConfig();
    const themeConfig = theme?.config || {};
    
    return {
      id: theme?.id || Date.now().toString(),
      name: theme?.name || 'New Theme',
      description: theme?.description || 'Custom theme description',
      premium: theme?.premium || false,
      config: {
        colors: {
          ...defaultConfig.colors,
          ...(themeConfig.colors || {})
        },
        typography: {
          ...defaultConfig.typography,
          ...(themeConfig.typography || {})
        },
        layout: {
          ...defaultConfig.layout,
          ...(themeConfig.layout || {})
        },
        sections: themeConfig.sections || defaultConfig.sections
      }
    };
  });

  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState('layout');
  const [layoutSections, setLayoutSections] = useState<LayoutSection[]>([
    {
      id: '1',
      name: 'Hero Section',
      type: 'hero',
      enabled: true,
      config: {},
      order: 0
    },
    {
      id: '2',
      name: 'About Section',
      type: 'about',
      enabled: true,
      config: {},
      order: 1
    },
    {
      id: '3',
      name: 'Books Grid',
      type: 'books',
      enabled: true,
      config: {},
      order: 2
    },
    {
      id: '4',
      name: 'Contact Form',
      type: 'contact',
      enabled: false,
      config: {},
      order: 3
    }
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const colorPalettes = [
    { 
      name: 'Ocean Blue', 
      colors: { 
        primary: '#0ea5e9', 
        secondary: '#64748b', 
        accent: '#06b6d4',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1f2937',
        border: '#e5e7eb'
      }
    },
    { 
      name: 'Purple Magic', 
      colors: { 
        primary: '#8b5cf6', 
        secondary: '#64748b', 
        accent: '#c084fc',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1f2937',
        border: '#e5e7eb'
      }
    },
    { 
      name: 'Forest Green', 
      colors: { 
        primary: '#10b981', 
        secondary: '#64748b', 
        accent: '#34d399',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1f2937',
        border: '#e5e7eb'
      }
    }
  ];

  const fontOptions = [
    { name: 'Inter', value: 'Inter' },
    { name: 'Roboto', value: 'Roboto' },
    { name: 'Open Sans', value: 'Open Sans' },
    { name: 'Montserrat', value: 'Montserrat' },
    { name: 'Playfair Display', value: 'Playfair Display' },
    { name: 'Merriweather', value: 'Merriweather' }
  ];

  const updateTheme = (updates: Partial<Theme>) => {
    setCurrentTheme(prev => ({ ...prev, ...updates }));
  };

  const updateConfig = (section: string, updates: any) => {
    setCurrentTheme(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [section]: { ...(prev.config?.[section] || {}), ...updates }
      }
    }));
  };

  const handleSave = async () => {
    try {
      // Include layout sections in the theme config
      const themeWithSections = {
        ...currentTheme,
        config: {
          ...currentTheme.config,
          sections: layoutSections
        }
      };
      
      await onSave(themeWithSections);
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
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setLayoutSections((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const updateLayoutSection = (id: string, updates: Partial<LayoutSection>) => {
    setLayoutSections(prev => 
      prev.map(section => 
        section.id === id ? { ...section, ...updates } : section
      )
    );
  };

  const removeLayoutSection = (id: string) => {
    setLayoutSections(prev => prev.filter(section => section.id !== id));
  };

  const addLayoutSection = (type: string) => {
    const newSection: LayoutSection = {
      id: Date.now().toString(),
      name: `New ${type} Section`,
      type,
      enabled: true,
      config: {},
      order: layoutSections.length
    };
    setLayoutSections(prev => [...prev, newSection]);
  };

  const applyColorPalette = (palette: any) => {
    updateConfig('colors', palette.colors);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Enhanced Theme Designer</h1>
            <p className="text-muted-foreground">Create and customize themes with drag-and-drop layout</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Redo className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Copy className="h-4 w-4" />
            Duplicate
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Theme
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
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={currentTheme.premium}
                    onCheckedChange={(checked) => updateTheme({ premium: checked })}
                  />
                  <Label>Premium Theme</Label>
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
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="layout">
                <Layout className="h-4 w-4 mr-2" />
                Layout
              </TabsTrigger>
              <TabsTrigger value="colors">
                <Palette className="h-4 w-4 mr-2" />
                Colors
              </TabsTrigger>
              <TabsTrigger value="typography">
                <Type className="h-4 w-4 mr-2" />
                Typography
              </TabsTrigger>
              <TabsTrigger value="effects">
                <Sparkles className="h-4 w-4 mr-2" />
                Effects
              </TabsTrigger>
            </TabsList>

            <TabsContent value="layout" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Page Layout</CardTitle>
                  <CardDescription>
                    Drag and drop to reorder sections, toggle to enable/disable
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Available Sections</h4>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => addLayoutSection('hero')}>
                          <Plus className="h-4 w-4 mr-1" />
                          Hero
                        </Button>
                        <Button size="sm" onClick={() => addLayoutSection('gallery')}>
                          <Plus className="h-4 w-4 mr-1" />
                          Gallery
                        </Button>
                        <Button size="sm" onClick={() => addLayoutSection('testimonial')}>
                          <Plus className="h-4 w-4 mr-1" />
                          Testimonial
                        </Button>
                      </div>
                    </div>
                    
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={layoutSections.map(s => s.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {layoutSections.map((section) => (
                            <SortableItem
                              key={section.id}
                              section={section}
                              onUpdate={updateLayoutSection}
                              onRemove={removeLayoutSection}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="colors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Color Palette</CardTitle>
                  <CardDescription>Choose from predefined palettes or customize your own</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Quick Palettes</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {colorPalettes.map((palette) => (
                        <div
                          key={palette.name}
                          className="p-3 border rounded-lg cursor-pointer hover:border-primary transition-colors"
                          onClick={() => applyColorPalette(palette)}
                        >
                          <p className="font-medium text-sm mb-2">{palette.name}</p>
                          <div className="flex gap-1">
                            {Object.values(palette.colors).slice(0, 4).map((color, index) => (
                              <div
                                key={index}
                                className="w-6 h-6 rounded"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="primary">Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={currentTheme.config?.colors?.primary || '#3b82f6'}
                          onChange={(e) => updateConfig('colors', { primary: e.target.value })}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={currentTheme.config?.colors?.primary || '#3b82f6'}
                          onChange={(e) => updateConfig('colors', { primary: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="secondary">Secondary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={currentTheme.config?.colors?.secondary || '#64748b'}
                          onChange={(e) => updateConfig('colors', { secondary: e.target.value })}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={currentTheme.config?.colors?.secondary || '#64748b'}
                          onChange={(e) => updateConfig('colors', { secondary: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="typography" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Typography Settings</CardTitle>
                  <CardDescription>Configure fonts and text styling</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Heading Font</Label>
                      <select
                        value={currentTheme.config?.typography?.headingFont || 'Inter'}
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
                        value={currentTheme.config?.typography?.bodyFont || 'Inter'}
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
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="effects" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Visual Effects</CardTitle>
                  <CardDescription>Add animations and visual enhancements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Smooth Animations</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Hover Effects</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Gradient Backgrounds</Label>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Shadow Effects</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Live Preview</CardTitle>
                <div className="flex gap-1">
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
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div 
                className={`border rounded-lg overflow-hidden bg-white transition-all duration-300 ${
                  previewMode === 'mobile' ? 'max-w-sm mx-auto' :
                  previewMode === 'tablet' ? 'max-w-md mx-auto' : 'w-full'
                }`}
                style={{
                  height: previewMode === 'mobile' ? '600px' : 
                         previewMode === 'tablet' ? '500px' : '400px'
                }}
              >
                <DragDropProfileDesigner 
                  sections={layoutSections.filter(s => s.enabled)}
                  themeConfig={currentTheme.config}
                  preview={true}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Theme Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Name</span>
                <span className="text-sm font-medium">{currentTheme.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Type</span>
                <Badge variant={currentTheme.premium ? 'default' : 'secondary'}>
                  {currentTheme.premium ? 'Premium' : 'Free'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Sections</span>
                <span className="text-sm font-medium">
                  {layoutSections.filter(s => s.enabled).length} enabled
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Colors</span>
                <div className="flex gap-1">
                  <div
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: currentTheme.config?.colors?.primary || '#3b82f6' }}
                  />
                  <div
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: currentTheme.config?.colors?.secondary || '#64748b' }}
                  />
                  <div
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: currentTheme.config?.colors?.accent || '#f59e0b' }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}