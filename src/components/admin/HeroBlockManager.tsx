import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Copy,
  Settings,
  Image,
  Video,
  Layout,
  Blocks,
  Monitor,
  Tablet,
  Smartphone,
  Palette,
  Type,
  Move,
  Save
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

interface HeroBlockManagerProps {
  heroBlocks: HeroBlock[];
  selectedBlock?: HeroBlock | null;
  onBack: () => void;
  onUpdate: (blocks: HeroBlock[]) => void;
}

interface HeroElement {
  id: string;
  type: 'text' | 'image' | 'button' | 'video' | 'spacer';
  content: string;
  styles: any;
  order: number;
}

function SortableHeroElement({ element, onUpdate, onRemove }: { 
  element: HeroElement;
  onUpdate: (id: string, updates: Partial<HeroElement>) => void;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'button': return <Blocks className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      default: return <Layout className="h-4 w-4" />;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border rounded-lg p-3 bg-card"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div {...attributes} {...listeners} className="cursor-grab">
            <Move className="h-4 w-4 text-muted-foreground" />
          </div>
          {getElementIcon(element.type)}
          <span className="font-medium capitalize">{element.type}</span>
          <Badge variant="outline" className="text-xs">
            {element.type}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm">
            <Settings className="h-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(element.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        {element.content.substring(0, 50)}...
      </div>
    </div>
  );
}

export function HeroBlockManager({ heroBlocks, selectedBlock, onBack, onUpdate }: HeroBlockManagerProps) {
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<'list' | 'designer'>(selectedBlock ? 'designer' : 'list');
  const [selectedBlockState, setSelectedBlockState] = useState<HeroBlock | null>(selectedBlock || null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  const [heroElements, setHeroElements] = useState<HeroElement[]>([
    {
      id: '1',
      type: 'text',
      content: 'Welcome to My Author Page',
      styles: { fontSize: '3xl', fontWeight: 'bold', textAlign: 'center' },
      order: 0
    },
    {
      id: '2',
      type: 'text',
      content: 'Discover my latest books and writing journey',
      styles: { fontSize: 'lg', textAlign: 'center', color: 'muted' },
      order: 1
    },
    {
      id: '3',
      type: 'button',
      content: 'Explore My Books',
      styles: { variant: 'default', size: 'lg' },
      order: 2
    }
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleCreateBlock = () => {
    setSelectedBlockState(null);
    setCurrentView('designer');
  };

  const handleEditBlock = (block: HeroBlock) => {
    setSelectedBlockState(block);
    setCurrentView('designer');
  };

  const handleDeleteBlock = (blockId: string) => {
    if (window.confirm('Are you sure you want to delete this hero block?')) {
      const updatedBlocks = heroBlocks.filter(b => b.id !== blockId);
      onUpdate(updatedBlocks);
      toast({
        title: "Success",
        description: "Hero block deleted successfully",
      });
    }
  };

  const handleToggleEnabled = (blockId: string) => {
    const updatedBlocks = heroBlocks.map(block =>
      block.id === blockId
        ? { ...block, enabled: !block.enabled }
        : block
    );
    onUpdate(updatedBlocks);
    toast({
      title: "Success",
      description: "Hero block settings updated",
    });
  };

  const handleSaveBlock = () => {
    const blockData = {
      id: selectedBlockState?.id || Date.now().toString(),
      name: selectedBlockState?.name || 'New Hero Block',
      description: selectedBlockState?.description || 'Custom hero block',
      preview_image_url: '/api/placeholder/400/200',
      enabled: selectedBlockState?.enabled ?? true,
      config: { elements: heroElements },
      created_at: selectedBlockState?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let updatedBlocks;
    if (selectedBlockState) {
      updatedBlocks = heroBlocks.map(b => b.id === blockData.id ? blockData : b);
    } else {
      updatedBlocks = [...heroBlocks, blockData];
    }

    onUpdate(updatedBlocks);
    setCurrentView('list');
    toast({
      title: "Success",
      description: "Hero block saved successfully",
    });
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setHeroElements((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const updateHeroElement = (id: string, updates: Partial<HeroElement>) => {
    setHeroElements(prev => 
      prev.map(element => 
        element.id === id ? { ...element, ...updates } : element
      )
    );
  };

  const removeHeroElement = (id: string) => {
    setHeroElements(prev => prev.filter(element => element.id !== id));
  };

  const addHeroElement = (type: HeroElement['type']) => {
    const newElement: HeroElement = {
      id: Date.now().toString(),
      type,
      content: getDefaultContent(type),
      styles: getDefaultStyles(type),
      order: heroElements.length
    };
    setHeroElements(prev => [...prev, newElement]);
  };

  const getDefaultContent = (type: HeroElement['type']): string => {
    switch (type) {
      case 'text': return 'New text element';
      case 'image': return '/api/placeholder/400/300';
      case 'button': return 'Click Me';
      case 'video': return 'https://example.com/video.mp4';
      case 'spacer': return '';
      default: return '';
    }
  };

  const getDefaultStyles = (type: HeroElement['type']): any => {
    switch (type) {
      case 'text': return { fontSize: 'base', textAlign: 'left', fontWeight: 'normal' };
      case 'image': return { width: '100%', height: 'auto', borderRadius: 'rounded' };
      case 'button': return { variant: 'default', size: 'md' };
      case 'video': return { width: '100%', height: 'auto', controls: true };
      case 'spacer': return { height: '2rem' };
      default: return {};
    }
  };

  if (currentView === 'designer') {
    return (
      <div className="container mx-auto p-6 max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setCurrentView('list')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blocks
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Hero Block Designer</h1>
              <p className="text-muted-foreground">
                {selectedBlockState ? `Editing: ${selectedBlockState.name}` : 'Create a new hero block'}
              </p>
            </div>
          </div>
          <Button onClick={handleSaveBlock}>
            <Save className="h-4 w-4 mr-2" />
            Save Block
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Design Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Block Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="blockName">Block Name</Label>
                  <Input
                    id="blockName"
                    value={selectedBlockState?.name || ''}
                    onChange={(e) => setSelectedBlockState(prev => prev ? { ...prev, name: e.target.value } : null)}
                    placeholder="Enter block name"
                  />
                </div>
                <div>
                  <Label htmlFor="blockDescription">Description</Label>
                  <Textarea
                    id="blockDescription"
                    value={selectedBlockState?.description || ''}
                    onChange={(e) => setSelectedBlockState(prev => prev ? { ...prev, description: e.target.value } : null)}
                    placeholder="Enter block description"
                    rows={2}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={selectedBlockState?.enabled ?? true}
                    onCheckedChange={(checked) => setSelectedBlockState(prev => prev ? { ...prev, enabled: checked } : null)}
                  />
                  <Label>Enable for authors</Label>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="elements" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="elements">Elements</TabsTrigger>
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="animation">Animation</TabsTrigger>
                <TabsTrigger value="background">Background</TabsTrigger>
              </TabsList>

              <TabsContent value="elements" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Hero Elements</CardTitle>
                    <CardDescription>
                      Drag and drop elements to build your hero section
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" onClick={() => addHeroElement('text')}>
                          <Type className="h-4 w-4 mr-1" />
                          Text
                        </Button>
                        <Button size="sm" onClick={() => addHeroElement('image')}>
                          <Image className="h-4 w-4 mr-1" />
                          Image
                        </Button>
                        <Button size="sm" onClick={() => addHeroElement('button')}>
                          <Blocks className="h-4 w-4 mr-1" />
                          Button
                        </Button>
                        <Button size="sm" onClick={() => addHeroElement('video')}>
                          <Video className="h-4 w-4 mr-1" />
                          Video
                        </Button>
                        <Button size="sm" onClick={() => addHeroElement('spacer')}>
                          <Layout className="h-4 w-4 mr-1" />
                          Spacer
                        </Button>
                      </div>
                      
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={heroElements.map(e => e.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-3">
                            {heroElements.map((element) => (
                              <SortableHeroElement
                                key={element.id}
                                element={element}
                                onUpdate={updateHeroElement}
                                onRemove={removeHeroElement}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="design" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Typography & Colors</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Font Family</Label>
                        <select className="w-full p-2 border rounded">
                          <option>Inter</option>
                          <option>Playfair Display</option>
                          <option>Roboto</option>
                          <option>Georgia</option>
                          <option>Times New Roman</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Text Size</Label>
                        <select className="w-full p-2 border rounded">
                          <option>Small</option>
                          <option>Medium</option>
                          <option>Large</option>
                          <option>Extra Large</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Primary Color</Label>
                        <input type="color" className="w-full h-10 border rounded" defaultValue="#3b82f6" />
                      </div>
                      <div className="space-y-2">
                        <Label>Secondary Color</Label>
                        <input type="color" className="w-full h-10 border rounded" defaultValue="#64748b" />
                      </div>
                      <div className="space-y-2">
                        <Label>Accent Color</Label>
                        <input type="color" className="w-full h-10 border rounded" defaultValue="#f59e0b" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Text Shadow</Label>
                      <div className="flex items-center space-x-2">
                        <Switch />
                        <span className="text-sm">Enable text shadow</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Layout Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Text Alignment</Label>
                        <select className="w-full p-2 border rounded">
                          <option>Left</option>
                          <option>Center</option>
                          <option>Right</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Vertical Alignment</Label>
                        <select className="w-full p-2 border rounded">
                          <option>Top</option>
                          <option>Center</option>
                          <option>Bottom</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Padding</Label>
                        <input type="range" min="0" max="100" defaultValue="50" className="w-full" />
                      </div>
                      <div className="space-y-2">
                        <Label>Margin</Label>
                        <input type="range" min="0" max="100" defaultValue="25" className="w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="animation" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Entrance Animations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Animation Type</Label>
                        <select className="w-full p-2 border rounded">
                          <option>Fade In</option>
                          <option>Slide In Left</option>
                          <option>Slide In Right</option>
                          <option>Slide In Up</option>
                          <option>Slide In Down</option>
                          <option>Scale In</option>
                          <option>Bounce In</option>
                          <option>Rotate In</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Animation Duration</Label>
                        <select className="w-full p-2 border rounded">
                          <option>0.3s (Fast)</option>
                          <option>0.6s (Normal)</option>
                          <option>1s (Slow)</option>
                          <option>1.5s (Very Slow)</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Animation Delay</Label>
                      <input type="range" min="0" max="2" step="0.1" defaultValue="0" className="w-full" />
                      <div className="text-sm text-muted-foreground">0s delay</div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch />
                        <Label>Stagger child animations</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch />
                        <Label>Repeat animation on scroll</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Hover Effects</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Hover Animation</Label>
                        <select className="w-full p-2 border rounded">
                          <option>None</option>
                          <option>Scale</option>
                          <option>Tilt</option>
                          <option>Glow</option>
                          <option>Bounce</option>
                          <option>Pulse</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Transition Speed</Label>
                        <select className="w-full p-2 border rounded">
                          <option>0.2s (Fast)</option>
                          <option>0.3s (Normal)</option>
                          <option>0.5s (Slow)</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="background" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Background Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Background Type</Label>
                        <select className="w-full p-2 border rounded">
                          <option>Solid Color</option>
                          <option>Gradient</option>
                          <option>Image</option>
                          <option>Video</option>
                          <option>Pattern</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Background Color 1</Label>
                          <input type="color" className="w-full h-10 border rounded" defaultValue="#3b82f6" />
                        </div>
                        <div className="space-y-2">
                          <Label>Background Color 2</Label>
                          <input type="color" className="w-full h-10 border rounded" defaultValue="#8b5cf6" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Gradient Direction</Label>
                        <select className="w-full p-2 border rounded">
                          <option>Left to Right</option>
                          <option>Top to Bottom</option>
                          <option>Diagonal (↘)</option>
                          <option>Diagonal (↙)</option>
                          <option>Radial</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Background Image URL</Label>
                        <Input placeholder="https://example.com/image.jpg" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Image Position</Label>
                          <select className="w-full p-2 border rounded">
                            <option>Center</option>
                            <option>Top</option>
                            <option>Bottom</option>
                            <option>Left</option>
                            <option>Right</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Image Size</Label>
                          <select className="w-full p-2 border rounded">
                            <option>Cover</option>
                            <option>Contain</option>
                            <option>Auto</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Switch />
                          <Label>Parallax Effect</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch />
                          <Label>Overlay</Label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Overlay Opacity</Label>
                        <input type="range" min="0" max="100" defaultValue="30" className="w-full" />
                        <div className="text-sm text-muted-foreground">30% opacity</div>
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
                    height: previewMode === 'mobile' ? '300px' : 
                           previewMode === 'tablet' ? '250px' : '200px'
                  }}
                >
                  <div className="p-6 h-full flex flex-col items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                    {heroElements.map((element) => (
                      <div key={element.id} className="mb-4">
                        {element.type === 'text' && (
                          <div className={`text-${element.styles.fontSize} font-${element.styles.fontWeight} text-${element.styles.textAlign}`}>
                            {element.content}
                          </div>
                        )}
                        {element.type === 'button' && (
                          <button className="px-6 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                            {element.content}
                          </button>
                        )}
                        {element.type === 'image' && (
                          <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                            <Image className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Overview
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Hero Block Manager</h1>
            <p className="text-muted-foreground">Create and manage hero sections for author profiles</p>
          </div>
        </div>
        <Button onClick={handleCreateBlock}>
          <Plus className="h-4 w-4 mr-2" />
          Create Hero Block
        </Button>
      </div>

      {/* Hero Blocks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {heroBlocks.map((block) => (
          <Card key={block.id} className="group hover:shadow-lg transition-shadow">
            <div className="aspect-video relative overflow-hidden rounded-t-lg bg-gradient-to-r from-blue-500 to-purple-600">
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <h3 className="text-lg font-bold mb-2">Hero Preview</h3>
                  <p className="text-sm opacity-90">Dynamic content preview</p>
                  <div className="mt-4">
                    <div className="px-4 py-2 bg-white/20 rounded-lg">
                      Call to Action
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{block.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={block.enabled ? 'default' : 'secondary'}>
                      {block.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEditBlock(block)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeleteBlock(block.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>{block.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={block.enabled}
                    onCheckedChange={() => handleToggleEnabled(block.id)}
                  />
                  <Label className="text-sm">Enable for authors</Label>
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(block.updated_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {heroBlocks.length === 0 && (
        <div className="text-center py-12">
          <Blocks className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hero blocks yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first hero block to get started
          </p>
          <Button onClick={handleCreateBlock}>
            <Plus className="h-4 w-4 mr-2" />
            Create Hero Block
          </Button>
        </div>
      )}
    </div>
  );
}