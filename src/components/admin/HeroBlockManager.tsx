import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Image,
  Video,
  Layout,
  Blocks,
  Monitor,
  Tablet,
  Smartphone,
  Type,
  Move,
  Save,
  Settings,
  Star
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
      className="border rounded-lg p-3 bg-card hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div {...attributes} {...listeners} className="cursor-grab hover:cursor-grabbing">
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
            <Settings className="h-3 w-3" />
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
      <div className="text-sm text-muted-foreground truncate">
        {element.content.substring(0, 50)}...
      </div>
    </div>
  );
}

export function HeroBlockManager({ heroBlocks, selectedBlock, onBack, onUpdate }: HeroBlockManagerProps) {
  const { toast } = useToast();
  const [selectedBlockState, setSelectedBlockState] = useState<HeroBlock | null>(selectedBlock || null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isCreating, setIsCreating] = useState(false);
  
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
      styles: { fontSize: 'lg', textAlign: 'center', color: 'muted-foreground' },
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
    setIsCreating(true);
    setHeroElements([
      {
        id: '1',
        type: 'text',
        content: 'New Hero Title',
        styles: { fontSize: '3xl', fontWeight: 'bold', textAlign: 'center' },
        order: 0
      }
    ]);
  };

  const handleEditBlock = (block: HeroBlock) => {
    setSelectedBlockState(block);
    setIsCreating(false);
    // Load elements from block config
    if (block.config?.elements) {
      setHeroElements(block.config.elements);
    }
  };

  const handleSaveBlock = () => {
    if (!selectedBlockState?.name) {
      toast({
        title: "Error",
        description: "Please enter a block name",
        variant: "destructive"
      });
      return;
    }

    const blockData = {
      id: selectedBlockState?.id || Date.now().toString(),
      name: selectedBlockState.name,
      description: selectedBlockState?.description || 'Custom hero block',
      preview_image_url: '/api/placeholder/400/200',
      enabled: selectedBlockState?.enabled ?? true,
      config: { elements: heroElements },
      created_at: selectedBlockState?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let updatedBlocks;
    if (selectedBlockState && !isCreating) {
      updatedBlocks = heroBlocks.map(b => b.id === blockData.id ? blockData : b);
    } else {
      updatedBlocks = [...heroBlocks, blockData];
    }

    onUpdate(updatedBlocks);
    setSelectedBlockState(null);
    setIsCreating(false);
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

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home Management
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Hero Block Designer</h1>
            <p className="text-muted-foreground">Design and manage hero sections with live preview</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCreateBlock}>
            <Plus className="h-4 w-4 mr-2" />
            New Block
          </Button>
          {(selectedBlockState || isCreating) && (
            <>
              <Button variant="outline" onClick={() => {
                setSelectedBlockState(null);
                setIsCreating(false);
              }}>
                Cancel
              </Button>
              <Button onClick={handleSaveBlock}>
                <Save className="h-4 w-4 mr-2" />
                Save Block
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hero Blocks List + Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Create Form */}
          {(isCreating || selectedBlockState) && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {isCreating ? 'Create New Hero Block' : `Edit: ${selectedBlockState?.name}`}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="blockName">Block Name</Label>
                    <Input
                      id="blockName"
                      value={selectedBlockState?.name || ''}
                      onChange={(e) => {
                        if (isCreating) {
                          setSelectedBlockState({ 
                            id: Date.now().toString(),
                            name: e.target.value,
                            description: '',
                            enabled: true,
                            config: {},
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                          });
                        } else {
                          setSelectedBlockState(prev => prev ? { ...prev, name: e.target.value } : null);
                        }
                      }}
                      placeholder="Enter block name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="blockDescription">Description</Label>
                    <Input
                      id="blockDescription"
                      value={selectedBlockState?.description || ''}
                      onChange={(e) => setSelectedBlockState(prev => prev ? { ...prev, description: e.target.value } : null)}
                      placeholder="Brief description"
                    />
                  </div>
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
          )}

          {/* Elements Editor */}
          {(isCreating || selectedBlockState) && (
            <Card>
              <CardHeader>
                <CardTitle>Hero Elements</CardTitle>
                <CardDescription>Add and arrange elements for your hero section</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Element Buttons */}
                  <div className="flex gap-2 flex-wrap p-4 bg-muted rounded-lg">
                    <Button size="sm" variant="outline" onClick={() => addHeroElement('text')}>
                      <Type className="h-4 w-4 mr-1" />
                      Add Text
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addHeroElement('image')}>
                      <Image className="h-4 w-4 mr-1" />
                      Add Image
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addHeroElement('button')}>
                      <Blocks className="h-4 w-4 mr-1" />
                      Add Button
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addHeroElement('video')}>
                      <Video className="h-4 w-4 mr-1" />
                      Add Video
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addHeroElement('spacer')}>
                      <Layout className="h-4 w-4 mr-1" />
                      Add Spacer
                    </Button>
                  </div>
                  
                  {/* Sortable Elements */}
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
                        {heroElements.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Layout className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No elements added yet. Click the buttons above to add elements.</p>
                          </div>
                        ) : (
                          heroElements.map((element) => (
                            <SortableHeroElement
                              key={element.id}
                              element={element}
                              onUpdate={updateHeroElement}
                              onRemove={removeHeroElement}
                            />
                          ))
                        )}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Hero Blocks */}
          <Card>
            <CardHeader>
              <CardTitle>Existing Hero Blocks</CardTitle>
              <CardDescription>Click on a block to edit or manage it</CardDescription>
            </CardHeader>
            <CardContent>
              {heroBlocks.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Hero Blocks Yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first hero block to get started</p>
                  <Button onClick={handleCreateBlock}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Block
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {heroBlocks.map((block) => (
                    <Card 
                      key={block.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedBlockState?.id === block.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => handleEditBlock(block)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <Layout className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{block.name}</h3>
                              <p className="text-sm text-muted-foreground">{block.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={block.enabled ? "default" : "secondary"} className="text-xs">
                                  {block.enabled ? 'Active' : 'Inactive'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(block.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditBlock(block)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                const updatedBlocks = heroBlocks.filter(b => b.id !== block.id);
                                onUpdate(updatedBlocks);
                                toast({
                                  title: "Success",
                                  description: "Hero block deleted",
                                });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Live Preview</CardTitle>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={previewMode === 'desktop' ? 'default' : 'outline'}
                    onClick={() => setPreviewMode('desktop')}
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={previewMode === 'tablet' ? 'default' : 'outline'}
                    onClick={() => setPreviewMode('tablet')}
                  >
                    <Tablet className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={previewMode === 'mobile' ? 'default' : 'outline'}
                    onClick={() => setPreviewMode('mobile')}
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div 
                className={`
                  border rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950 dark:via-background dark:to-purple-950 min-h-[400px] transition-all duration-300
                  ${previewMode === 'desktop' ? 'w-full' : previewMode === 'tablet' ? 'w-80 mx-auto' : 'w-64 mx-auto'}
                `}
              >
                <div className="p-6 space-y-4">
                  {heroElements.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Preview will appear here</p>
                      <p className="text-sm mt-2">Add elements to see the preview</p>
                    </div>
                  ) : (
                    heroElements.map((element, index) => (
                      <div key={element.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                        {element.type === 'text' && (
                          <div 
                            className={`
                              ${element.styles.fontSize === '4xl' ? 'text-4xl' : element.styles.fontSize === '3xl' ? 'text-3xl' : element.styles.fontSize === 'lg' ? 'text-lg' : 'text-base'}
                              ${element.styles.fontWeight === 'bold' ? 'font-bold' : 'font-normal'}
                              ${element.styles.textAlign === 'center' ? 'text-center' : element.styles.textAlign === 'right' ? 'text-right' : 'text-left'}
                              ${element.styles.color === 'muted-foreground' ? 'text-muted-foreground' : 'text-foreground'}
                              ${element.styles.marginBottom ? `mb-${element.styles.marginBottom}` : ''}
                            `}
                          >
                            {element.content}
                          </div>
                        )}
                        {element.type === 'image' && (
                          <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                            <Image className="h-8 w-8 text-muted-foreground" />
                            <span className="ml-2 text-sm text-muted-foreground">Image</span>
                          </div>
                        )}
                        {element.type === 'button' && (
                          <div className={element.styles.textAlign === 'center' ? 'text-center' : ''}>
                            <Button 
                              variant={element.styles.variant || 'default'}
                              size={element.styles.size || 'default'}
                              className="animate-scale-in"
                            >
                              {element.content}
                            </Button>
                          </div>
                        )}
                        {element.type === 'video' && (
                          <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                            <Video className="h-8 w-8 text-muted-foreground" />
                            <span className="ml-2 text-sm text-muted-foreground">Video</span>
                          </div>
                        )}
                        {element.type === 'spacer' && (
                          <div className="h-8" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Preview Info */}
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {previewMode === 'desktop' ? 'Desktop View' : previewMode === 'tablet' ? 'Tablet View' : 'Mobile View'}
                  </span>
                  <span className="text-muted-foreground">
                    {heroElements.length} element{heroElements.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
