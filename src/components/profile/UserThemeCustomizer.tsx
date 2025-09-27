import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { 
  Palette,
  Move,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Save,
  RotateCcw,
  Sparkles,
  Monitor,
  Tablet,
  Smartphone
} from 'lucide-react';
import { useRealtimeThemes } from '@/hooks/useRealtimeThemes';
import { useSubscription } from '@/hooks/useSubscription';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface Theme {
  id: string;
  name: string;
  description: string;
  premium: boolean;
  config: any;
}

interface HeroBlock {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  order: number;
  config: any;
}

interface UserThemeCustomizerProps {
  selectedTheme: Theme;
  onSave: (customConfig: any) => void;
  onCancel: () => void;
}

export function UserThemeCustomizer({ selectedTheme, onSave, onCancel }: UserThemeCustomizerProps) {
  const { applyTheme, trackThemeUsage } = useRealtimeThemes();
  const { subscription, hasFeature } = useSubscription();
  const isPremium = hasFeature('premium_themes');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [customConfig, setCustomConfig] = useState<any>({
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#f59e0b',
      background: '#ffffff',
      text: '#1f2937'
    },
    typography: {
      fontFamily: 'Inter',
      fontSize: 'base',
      lineHeight: 'normal'
    },
    layout: {
      containerWidth: 'max-w-6xl',
      spacing: 'normal',
      borderRadius: 'rounded-lg'
    },
    animations: {
      enabled: true,
      speed: 'normal',
      effects: ['fade', 'slide']
    },
    heroBlocks: []
  });

  const [heroBlocks, setHeroBlocks] = useState<HeroBlock[]>([
    {
      id: '1',
      name: 'Main Header',
      type: 'header',
      enabled: true,
      order: 0,
      config: { showAvatar: true, showBio: true }
    },
    {
      id: '2',
      name: 'Featured Books',
      type: 'books',
      enabled: true,
      order: 1,
      config: { limit: 3, layout: 'grid' }
    },
    {
      id: '3',
      name: 'About Section',
      type: 'about',
      enabled: true,
      order: 2,
      config: { showSocial: true, showContact: true }
    },
    {
      id: '4',
      name: 'Recent Blog Posts',
      type: 'blog',
      enabled: false,
      order: 3,
      config: { limit: 2 }
    },
    {
      id: '5',
      name: 'Newsletter Signup',
      type: 'newsletter',
      enabled: isPremium,
      order: 4,
      config: { style: 'card' }
    }
  ]);

  useEffect(() => {
    if (selectedTheme?.config) {
      setCustomConfig(prev => ({
        ...prev,
        ...selectedTheme.config
      }));
    }
  }, [selectedTheme?.id]); // Only depend on theme ID

  useEffect(() => {
    if (selectedTheme?.id) {
      // Track theme viewing
      trackThemeUsage(selectedTheme.id, 'viewed', {
        timestamp: new Date().toISOString(),
        context: 'customizer'
      });
    }
  }, [selectedTheme?.id, trackThemeUsage]);

  const updateConfig = (section: string, key: string, value: any) => {
    setCustomConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));

    // Track customization
    trackThemeUsage(selectedTheme.id, 'customized', {
      section,
      key,
      value,
      timestamp: new Date().toISOString()
    });
  };

  const toggleHeroBlock = (blockId: string) => {
    setHeroBlocks(prev => 
      prev.map(block => 
        block.id === blockId 
          ? { ...block, enabled: !block.enabled }
          : block
      )
    );
  };

  const moveHeroBlock = (blockId: string, direction: 'up' | 'down') => {
    setHeroBlocks(prev => {
      const blocks = [...prev];
      const index = blocks.findIndex(b => b.id === blockId);
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (newIndex >= 0 && newIndex < blocks.length) {
        [blocks[index], blocks[newIndex]] = [blocks[newIndex], blocks[index]];
        // Update order values
        blocks.forEach((block, i) => {
          block.order = i;
        });
      }
      
      return blocks;
    });
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(heroBlocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order values
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    setHeroBlocks(updatedItems);
  };

  const handleSave = async () => {
    const finalConfig = {
      ...customConfig,
      heroBlocks: heroBlocks.filter(block => block.enabled)
    };

    try {
      await applyTheme(selectedTheme.id, finalConfig);
      onSave(finalConfig);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const resetToDefaults = () => {
    setCustomConfig({
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        accent: '#f59e0b',
        background: '#ffffff',
        text: '#1f2937'
      },
      typography: {
        fontFamily: 'Inter',
        fontSize: 'base',
        lineHeight: 'normal'
      },
      layout: {
        containerWidth: 'max-w-6xl',
        spacing: 'normal',
        borderRadius: 'rounded-lg'
      },
      animations: {
        enabled: true,
        speed: 'normal',
        effects: ['fade', 'slide']
      }
    });
  };

  const isPremiumFeature = (feature: string) => {
    const premiumFeatures = ['custom-fonts', 'advanced-animations', 'newsletter-block', 'analytics-widget'];
    return premiumFeatures.includes(feature) && !isPremium;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onCancel}>
              ← Back
            </Button>
            <div>
              <h1 className="text-xl font-bold">Customize {selectedTheme.name}</h1>
              <p className="text-sm text-muted-foreground">
                Personalize your theme settings and hero blocks
              </p>
            </div>
            {selectedTheme.premium && (
              <Badge variant="secondary">
                <Sparkles className="w-3 h-3 mr-1" />
                Premium Theme
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={resetToDefaults}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Apply Theme
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Customization Panel */}
        <div className="w-80 border-r bg-card h-screen overflow-y-auto">
          <Tabs defaultValue="colors" className="p-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
              <TabsTrigger value="blocks">Blocks</TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Color Scheme</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={customConfig.colors?.primary || '#3b82f6'}
                        onChange={(e) => updateConfig('colors', 'primary', e.target.value)}
                        className="w-12 h-8 p-0 border-0"
                      />
                      <Input
                        value={customConfig.colors?.primary || '#3b82f6'}
                        onChange={(e) => updateConfig('colors', 'primary', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={customConfig.colors?.secondary || '#64748b'}
                        onChange={(e) => updateConfig('colors', 'secondary', e.target.value)}
                        className="w-12 h-8 p-0 border-0"
                      />
                      <Input
                        value={customConfig.colors?.secondary || '#64748b'}
                        onChange={(e) => updateConfig('colors', 'secondary', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={customConfig.colors?.accent || '#f59e0b'}
                        onChange={(e) => updateConfig('colors', 'accent', e.target.value)}
                        className="w-12 h-8 p-0 border-0"
                      />
                      <Input
                        value={customConfig.colors?.accent || '#f59e0b'}
                        onChange={(e) => updateConfig('colors', 'accent', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={customConfig.colors?.background || '#ffffff'}
                        onChange={(e) => updateConfig('colors', 'background', e.target.value)}
                        className="w-12 h-8 p-0 border-0"
                      />
                      <Input
                        value={customConfig.colors?.background || '#ffffff'}
                        onChange={(e) => updateConfig('colors', 'background', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Typography</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Font Family {isPremiumFeature('custom-fonts') && <Badge variant="outline" className="ml-1 text-xs">Premium</Badge>}</Label>
                    <select 
                      className="w-full p-2 border rounded"
                      value={customConfig.typography?.fontFamily || 'Inter'}
                      onChange={(e) => updateConfig('typography', 'fontFamily', e.target.value)}
                      disabled={isPremiumFeature('custom-fonts')}
                    >
                      <option value="Inter">Inter</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Open Sans">Open Sans</option>
                      <option value="Playfair Display">Playfair Display</option>
                      <option value="Georgia">Georgia</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Font Size</Label>
                    <select 
                      className="w-full p-2 border rounded"
                      value={customConfig.typography?.fontSize || 'base'}
                      onChange={(e) => updateConfig('typography', 'fontSize', e.target.value)}
                    >
                      <option value="sm">Small</option>
                      <option value="base">Base</option>
                      <option value="lg">Large</option>
                      <option value="xl">Extra Large</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layout" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Layout Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Container Width</Label>
                    <select 
                      className="w-full p-2 border rounded"
                      value={customConfig.layout?.containerWidth || 'max-w-6xl'}
                      onChange={(e) => updateConfig('layout', 'containerWidth', e.target.value)}
                    >
                      <option value="max-w-4xl">Narrow</option>
                      <option value="max-w-6xl">Normal</option>
                      <option value="max-w-7xl">Wide</option>
                      <option value="max-w-full">Full Width</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Spacing</Label>
                    <select 
                      className="w-full p-2 border rounded"
                      value={customConfig.layout?.spacing || 'normal'}
                      onChange={(e) => updateConfig('layout', 'spacing', e.target.value)}
                    >
                      <option value="tight">Tight</option>
                      <option value="normal">Normal</option>
                      <option value="relaxed">Relaxed</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Border Radius</Label>
                    <select 
                      className="w-full p-2 border rounded"
                      value={customConfig.layout?.borderRadius || 'rounded-lg'}
                      onChange={(e) => updateConfig('layout', 'borderRadius', e.target.value)}
                    >
                      <option value="rounded-none">None</option>
                      <option value="rounded">Small</option>
                      <option value="rounded-lg">Medium</option>
                      <option value="rounded-xl">Large</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Animations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={customConfig.animations?.enabled || true}
                      onCheckedChange={(checked) => updateConfig('animations', 'enabled', checked)}
                    />
                    <Label>Enable Animations</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Animation Speed</Label>
                    <select 
                      className="w-full p-2 border rounded"
                      value={customConfig.animations?.speed || 'normal'}
                      onChange={(e) => updateConfig('animations', 'speed', e.target.value)}
                      disabled={!customConfig.animations?.enabled}
                    >
                      <option value="slow">Slow</option>
                      <option value="normal">Normal</option>
                      <option value="fast">Fast</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="blocks" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Hero Blocks</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Drag to reorder, toggle to show/hide
                  </p>
                </CardHeader>
                <CardContent>
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="hero-blocks">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                          {heroBlocks.map((block, index) => (
                            <Draggable key={block.id} draggableId={block.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="flex items-center justify-between p-3 border rounded-lg bg-background"
                                >
                                  <div className="flex items-center gap-3">
                                    <div {...provided.dragHandleProps}>
                                      <Move className="w-4 h-4 text-muted-foreground cursor-grab" />
                                    </div>
                                    <div>
                                      <p className="font-medium">{block.name}</p>
                                      <p className="text-xs text-muted-foreground">{block.type}</p>
                                    </div>
                                    {block.type === 'newsletter' && !isPremium && (
                                      <Badge variant="outline" className="text-xs">Premium</Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => moveHeroBlock(block.id, 'up')}
                                      disabled={index === 0}
                                    >
                                      <ArrowUp className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => moveHeroBlock(block.id, 'down')}
                                      disabled={index === heroBlocks.length - 1}
                                    >
                                      <ArrowDown className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleHeroBlock(block.id)}
                                      disabled={block.type === 'newsletter' && !isPremium}
                                    >
                                      {block.enabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        <div className="flex-1 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Live Preview</h2>
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

          <div 
            className={`border rounded-lg overflow-hidden bg-white transition-all duration-300 mx-auto ${
              previewMode === 'mobile' ? 'max-w-sm' :
              previewMode === 'tablet' ? 'max-w-md' : 'w-full'
            }`}
            style={{
              height: previewMode === 'mobile' ? '600px' : 
                     previewMode === 'tablet' ? '500px' : '700px'
            }}
          >
            {/* Theme Preview Content */}
            <div 
              className="h-full overflow-y-auto"
              style={{
                backgroundColor: customConfig.colors?.background || '#ffffff',
                color: customConfig.colors?.text || '#1f2937',
                fontFamily: customConfig.typography?.fontFamily || 'Inter'
              }}
            >
              {/* Preview content based on enabled hero blocks */}
              {heroBlocks
                .filter(block => block.enabled)
                .sort((a, b) => a.order - b.order)
                .map(block => (
                  <div key={block.id} className="p-6 border-b">
                    <h3 className="font-bold mb-2" style={{ color: customConfig.colors?.primary }}>
                      {block.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      This is a preview of the {block.name.toLowerCase()} section.
                    </p>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}