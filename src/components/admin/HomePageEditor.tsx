import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Plus, 
  GripVertical, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save,
  ArrowLeft,
  Image,
  Type,
  Layout,
  Sliders,
  Star,
  Users,
  BarChart3,
  Settings,
  Palette
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HomeSection {
  id: string;
  type: 'hero' | 'stats' | 'features' | 'pricing' | 'testimonials' | 'newsletter' | 'slider';
  title: string;
  enabled: boolean;
  order: number;
  config: {
    title?: string;
    subtitle?: string;
    description?: string;
    backgroundColor?: string;
    textColor?: string;
    image?: string;
    buttons?: Array<{ text: string; url: string; variant: 'primary' | 'secondary' }>;
    items?: Array<any>;
    autoPlay?: boolean;
    interval?: number;
    showDots?: boolean;
    showArrows?: boolean;
  };
}

interface SortableItemProps {
  section: HomeSection;
  onEdit: (section: HomeSection) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

function SortableItem({ section, onEdit, onDelete, onToggle }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'hero': return <Star className="h-4 w-4" />;
      case 'stats': return <BarChart3 className="h-4 w-4" />;
      case 'features': return <Layout className="h-4 w-4" />;
      case 'pricing': return <Users className="h-4 w-4" />;
      case 'slider': return <Sliders className="h-4 w-4" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <Card className={`${isDragging ? 'shadow-lg' : ''} transition-shadow`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab hover:cursor-grabbing p-1 hover:bg-muted rounded"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center space-x-2">
                {getSectionIcon(section.type)}
                <span className="font-medium">{section.title}</span>
                <Badge variant={section.enabled ? 'default' : 'secondary'} className="text-xs">
                  {section.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggle(section.id)}
              >
                {section.enabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(section)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(section.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {section.config.subtitle && (
            <p className="text-sm text-muted-foreground mt-2">{section.config.subtitle}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface HomePageEditorProps {
  onBack: () => void;
  onSave: (sections: HomeSection[]) => void;
}

const HomePageEditor = ({ onBack, onSave }: HomePageEditorProps) => {
  const [sections, setSections] = useState<HomeSection[]>([
    {
      id: '1',
      type: 'hero',
      title: 'Hero Section',
      enabled: true,
      order: 1,
      config: {
        title: 'Welcome to NP Page',
        subtitle: 'Create professional author profiles and showcase your books',
        backgroundColor: 'gradient-to-br from-primary/5 to-primary/10',
        buttons: [
          { text: 'Get Started', url: '/auth', variant: 'primary' },
          { text: 'Learn More', url: '#features', variant: 'secondary' }
        ]
      }
    },
    {
      id: '2',
      type: 'stats',
      title: 'Statistics Section',
      enabled: true,
      order: 2,
      config: {
        title: 'Trusted by Authors Worldwide',
        backgroundColor: 'muted/50',
        items: [
          { label: 'Authors', value: '1,000+' },
          { label: 'Books Published', value: '5,000+' },
          { label: 'Page Views', value: '100K+' },
          { label: 'Active Users', value: '500+' }
        ]
      }
    }
  ]);
  
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null);
  const [currentTab, setCurrentTab] = useState('sections');
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((item, index) => ({ ...item, order: index + 1 }));
      });
    }
  };

  const handleAddSection = (type: HomeSection['type']) => {
    const newSection: HomeSection = {
      id: Date.now().toString(),
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Section`,
      enabled: true,
      order: sections.length + 1,
      config: {
        title: `New ${type} section`,
        subtitle: 'Configure this section',
        backgroundColor: 'background'
      }
    };

    if (type === 'slider') {
      newSection.config = {
        ...newSection.config,
        autoPlay: true,
        interval: 5000,
        showDots: true,
        showArrows: true,
        items: [
          { title: 'Slide 1', description: 'First slide content', image: '' },
          { title: 'Slide 2', description: 'Second slide content', image: '' }
        ]
      };
    }

    setSections(prev => [...prev, newSection]);
    setEditingSection(newSection);
    setCurrentTab('editor');
  };

  const handleEditSection = (section: HomeSection) => {
    setEditingSection(section);
    setCurrentTab('editor');
  };

  const handleUpdateSection = (updatedSection: HomeSection) => {
    setSections(prev => 
      prev.map(section => 
        section.id === updatedSection.id ? updatedSection : section
      )
    );
    setEditingSection(updatedSection);
  };

  const handleDeleteSection = (id: string) => {
    if (confirm('Are you sure you want to delete this section?')) {
      setSections(prev => prev.filter(section => section.id !== id));
      if (editingSection?.id === id) {
        setEditingSection(null);
        setCurrentTab('sections');
      }
    }
  };

  const handleToggleSection = (id: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === id ? { ...section, enabled: !section.enabled } : section
      )
    );
  };

  const handleSave = () => {
    onSave(sections);
    toast({
      title: "Success",
      description: "Home page sections saved successfully",
    });
  };

  const renderSectionEditor = () => {
    if (!editingSection) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit {editingSection.title}</h3>
          <Badge variant="outline">{editingSection.type}</Badge>
        </div>

        <div className="grid gap-4">
          <div>
            <Label htmlFor="section-title">Section Title</Label>
            <Input
              id="section-title"
              value={editingSection.title}
              onChange={(e) => handleUpdateSection({
                ...editingSection,
                title: e.target.value
              })}
            />
          </div>

          <div>
            <Label htmlFor="content-title">Content Title</Label>
            <Input
              id="content-title"
              value={editingSection.config.title || ''}
              onChange={(e) => handleUpdateSection({
                ...editingSection,
                config: { ...editingSection.config, title: e.target.value }
              })}
            />
          </div>

          <div>
            <Label htmlFor="content-subtitle">Subtitle</Label>
            <Textarea
              id="content-subtitle"
              value={editingSection.config.subtitle || ''}
              onChange={(e) => handleUpdateSection({
                ...editingSection,
                config: { ...editingSection.config, subtitle: e.target.value }
              })}
            />
          </div>

          <div>
            <Label htmlFor="background">Background Style</Label>
            <Select
              value={editingSection.config.backgroundColor || 'background'}
              onValueChange={(value) => handleUpdateSection({
                ...editingSection,
                config: { ...editingSection.config, backgroundColor: value }
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="background">Default</SelectItem>
                <SelectItem value="muted/50">Light Gray</SelectItem>
                <SelectItem value="gradient-to-br from-primary/5 to-primary/10">Primary Gradient</SelectItem>
                <SelectItem value="gradient-to-r from-blue-50 to-indigo-50">Blue Gradient</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {editingSection.type === 'slider' && (
            <>
              <Separator />
              <h4 className="font-medium">Slider Settings</h4>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingSection.config.autoPlay || false}
                  onCheckedChange={(checked) => handleUpdateSection({
                    ...editingSection,
                    config: { ...editingSection.config, autoPlay: checked }
                  })}
                />
                <Label>Auto Play</Label>
              </div>

              <div>
                <Label htmlFor="interval">Interval (ms)</Label>
                <Input
                  id="interval"
                  type="number"
                  value={editingSection.config.interval || 5000}
                  onChange={(e) => handleUpdateSection({
                    ...editingSection,
                    config: { ...editingSection.config, interval: parseInt(e.target.value) }
                  })}
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingSection.config.showDots || false}
                    onCheckedChange={(checked) => handleUpdateSection({
                      ...editingSection,
                      config: { ...editingSection.config, showDots: checked }
                    })}
                  />
                  <Label>Show Dots</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingSection.config.showArrows || false}
                    onCheckedChange={(checked) => handleUpdateSection({
                      ...editingSection,
                      config: { ...editingSection.config, showArrows: checked }
                    })}
                  />
                  <Label>Show Arrows</Label>
                </div>
              </div>

              <div>
                <Label>Slider Items</Label>
                <div className="space-y-3 mt-2">
                  {(editingSection.config.items || []).map((item: any, index: number) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="grid gap-3">
                          <Input
                            placeholder="Slide title"
                            value={item.title || ''}
                            onChange={(e) => {
                              const newItems = [...(editingSection.config.items || [])];
                              newItems[index] = { ...item, title: e.target.value };
                              handleUpdateSection({
                                ...editingSection,
                                config: { ...editingSection.config, items: newItems }
                              });
                            }}
                          />
                          <Textarea
                            placeholder="Slide description"
                            value={item.description || ''}
                            onChange={(e) => {
                              const newItems = [...(editingSection.config.items || [])];
                              newItems[index] = { ...item, description: e.target.value };
                              handleUpdateSection({
                                ...editingSection,
                                config: { ...editingSection.config, items: newItems }
                              });
                            }}
                          />
                          <Input
                            placeholder="Image URL"
                            value={item.image || ''}
                            onChange={(e) => {
                              const newItems = [...(editingSection.config.items || [])];
                              newItems[index] = { ...item, image: e.target.value };
                              handleUpdateSection({
                                ...editingSection,
                                config: { ...editingSection.config, items: newItems }
                              });
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newItems = [...(editingSection.config.items || [])];
                              newItems.splice(index, 1);
                              handleUpdateSection({
                                ...editingSection,
                                config: { ...editingSection.config, items: newItems }
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Slide
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => {
                      const newItems = [...(editingSection.config.items || []), {
                        title: 'New Slide',
                        description: 'Slide description',
                        image: ''
                      }];
                      handleUpdateSection({
                        ...editingSection,
                        config: { ...editingSection.config, items: newItems }
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Slide
                  </Button>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              checked={editingSection.enabled}
              onCheckedChange={(checked) => handleUpdateSection({
                ...editingSection,
                enabled: checked
              })}
            />
            <Label>Enable this section</Label>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Home Page Editor</h1>
            <p className="text-muted-foreground">Manage sections, content, and layout</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => window.open('/', '_blank')}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="editor">Section Editor</TabsTrigger>
          <TabsTrigger value="settings">Global Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="sections" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Page Sections</CardTitle>
                  <CardDescription>
                    Drag and drop to reorder sections. Click edit to modify content.
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Select onValueChange={(type) => handleAddSection(type as HomeSection['type'])}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Add Section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hero">Hero Section</SelectItem>
                      <SelectItem value="stats">Statistics</SelectItem>
                      <SelectItem value="features">Features</SelectItem>
                      <SelectItem value="pricing">Pricing</SelectItem>
                      <SelectItem value="slider">Image Slider</SelectItem>
                      <SelectItem value="testimonials">Testimonials</SelectItem>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={sections} strategy={verticalListSortingStrategy}>
                  {sections.map((section) => (
                    <SortableItem
                      key={section.id}
                      section={section}
                      onEdit={handleEditSection}
                      onDelete={handleDeleteSection}
                      onToggle={handleToggleSection}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              
              {sections.length === 0 && (
                <div className="text-center py-12">
                  <Layout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No sections yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your first section to start building your home page
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="editor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Section Editor</CardTitle>
              <CardDescription>
                Edit the selected section's content and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {editingSection ? (
                renderSectionEditor()
              ) : (
                <div className="text-center py-12">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No section selected</h3>
                  <p className="text-muted-foreground">
                    Select a section from the Sections tab to edit its content
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Global Settings</CardTitle>
              <CardDescription>
                Configure site-wide settings and appearance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">SEO Settings</h4>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="site-title">Site Title</Label>
                      <Input id="site-title" defaultValue="NP Page - Author Platform" />
                    </div>
                    <div>
                      <Label htmlFor="site-description">Meta Description</Label>
                      <Textarea 
                        id="site-description" 
                        defaultValue="Create professional author profiles and showcase your books with NP Page"
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-3">Theme Settings</h4>
                  <div className="grid gap-4">
                    <div>
                      <Label>Primary Color</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-8 h-8 bg-primary rounded border"></div>
                        <span className="text-sm text-muted-foreground">Current primary color</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HomePageEditor;