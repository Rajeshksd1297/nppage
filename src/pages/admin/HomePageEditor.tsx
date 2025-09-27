import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
  ArrowLeft, 
  Save, 
  Eye, 
  Plus, 
  GripVertical, 
  Edit, 
  Trash2, 
  EyeOff, 
  ChevronUp, 
  ChevronDown,
  Image as ImageIcon,
  Type,
  Layout,
  Sliders,
  Star,
  Users,
  BarChart3,
  Palette,
  Zap,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HomeSection {
  id: string;
  type: 'hero' | 'stats' | 'features' | 'pricing' | 'testimonials' | 'newsletter' | 'slider';
  title: string;
  enabled: boolean;
  order_index: number;
  config: {
    title?: string;
    subtitle?: string;
    description?: string;
    backgroundColor?: string;
    textColor?: string;
    image?: string;
    backgroundImage?: string;
    animation?: string;
    buttons?: Array<{ text: string; url: string; variant: 'primary' | 'secondary' }>;
    items?: Array<any>;
    autoPlay?: boolean;
    interval?: number;
    showDots?: boolean;
    showArrows?: boolean;
    // Hero-specific options
    heroSize?: 'small' | 'medium' | 'large' | 'full';
    heroAlignment?: 'left' | 'center' | 'right';
    heroLayout?: 'text-only' | 'text-image' | 'background-image';
    padding?: 'small' | 'medium' | 'large' | 'extra-large';
    overlay?: boolean;
    overlayOpacity?: number;
    customCss?: string;
    textSize?: 'small' | 'medium' | 'large' | 'extra-large';
    borderRadius?: 'none' | 'small' | 'medium' | 'large';
    shadow?: 'none' | 'small' | 'medium' | 'large';
  };
}

interface SortableItemProps {
  section: HomeSection;
  onEdit: (section: HomeSection) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
}

function SortableItem({ section, onEdit, onDelete, onToggle, onMoveUp, onMoveDown, isFirst, isLast }: SortableItemProps) {
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
      <Card className={`${isDragging ? 'shadow-lg border-primary' : ''} transition-all duration-200 hover:shadow-md`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab hover:cursor-grabbing p-1 hover:bg-muted rounded transition-colors"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center space-x-2 flex-1">
                {getSectionIcon(section.type)}
                <span className="font-medium">{section.title}</span>
                <Badge variant={section.enabled ? 'default' : 'secondary'} className="text-xs">
                  {section.enabled ? 'Live' : 'Hidden'}
                </Badge>
                {section.config.animation && (
                  <Badge variant="outline" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    {section.config.animation}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMoveUp(section.id)}
                disabled={isFirst}
                className="h-8 w-8 p-0"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMoveDown(section.id)}
                disabled={isLast}
                className="h-8 w-8 p-0"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggle(section.id)}
                className="h-8 w-8 p-0"
              >
                {section.enabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(section)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(section.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {section.config.subtitle && (
            <p className="text-sm text-muted-foreground mt-2 ml-7">{section.config.subtitle}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const HomePageEditor = () => {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('home_page_sections')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      if (data) {
        const transformedData = data.map(section => ({
          ...section,
          config: typeof section.config === 'object' ? section.config : {}
        }));
        setSections(transformedData as HomeSection[]);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast({
        title: "Error",
        description: "Failed to load home page sections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSections = async () => {
    try {
      setSaving(true);
      
      // Update sections with new order
      const updates = sections.map((section, index) => ({
        id: section.id,
        type: section.type,
        title: section.title,
        enabled: section.enabled,
        order_index: index + 1,
        config: section.config
      }));

      for (const section of updates) {
        const { error } = await supabase
          .from('home_page_sections')
          .update(section)
          .eq('id', section.id);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Home page sections saved successfully",
      });
    } catch (error) {
      console.error('Error saving sections:', error);
      toast({
        title: "Error",
        description: "Failed to save sections",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((item, index) => ({ ...item, order_index: index + 1 }));
      });
    }
  };

  const handleAddSection = async (type: HomeSection['type']) => {
    try {
      const maxOrder = Math.max(...sections.map(s => s.order_index), 0);
      
      const newSection = {
        type,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Section`,
        enabled: true,
        order_index: maxOrder + 1,
        config: {
          title: `New ${type} section`,
          subtitle: 'Configure this section',
          backgroundColor: 'background',
          animation: 'fade-in',
          ...(type === 'hero' && {
            heroSize: 'large',
            heroAlignment: 'center',
            heroLayout: 'text-only',
            padding: 'large',
            textSize: 'large',
            borderRadius: 'medium',
            shadow: 'none'
          }),
          ...(type === 'slider' && {
            autoPlay: true,
            interval: 5000,
            showDots: true,
            showArrows: true,
            items: [
              { title: 'Slide 1', description: 'First slide content', image: '' },
              { title: 'Slide 2', description: 'Second slide content', image: '' }
            ]
          })
        }
      };

      const { data, error } = await supabase
        .from('home_page_sections')
        .insert([newSection])
        .select()
        .single();

      if (error) throw error;
      
      const transformedData = {
        ...data,
        config: typeof data.config === 'object' ? data.config : {}
      };
      
      setSections(prev => [...prev, transformedData as HomeSection]);
      setEditingSection(transformedData as HomeSection);
      
      toast({
        title: "Success",
        description: `${type} section added successfully`,
      });
    } catch (error) {
      console.error('Error adding section:', error);
      toast({
        title: "Error",
        description: "Failed to add section",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSection = async (updatedSection: HomeSection) => {
    try {
      const { error } = await supabase
        .from('home_page_sections')
        .update({
          title: updatedSection.title,
          enabled: updatedSection.enabled,
          config: updatedSection.config
        })
        .eq('id', updatedSection.id);

      if (error) throw error;

      setSections(prev =>
        prev.map(section =>
          section.id === updatedSection.id ? updatedSection : section
        )
      );
      setEditingSection(updatedSection);
    } catch (error) {
      console.error('Error updating section:', error);
      toast({
        title: "Error",
        description: "Failed to update section",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;

    try {
      const { error } = await supabase
        .from('home_page_sections')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSections(prev => prev.filter(section => section.id !== id));
      if (editingSection?.id === id) {
        setEditingSection(null);
      }

      toast({
        title: "Success",
        description: "Section deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting section:', error);
      toast({
        title: "Error",
        description: "Failed to delete section",
        variant: "destructive",
      });
    }
  };

  const handleToggleSection = async (id: string) => {
    const section = sections.find(s => s.id === id);
    if (!section) return;

    try {
      const { error } = await supabase
        .from('home_page_sections')
        .update({ enabled: !section.enabled })
        .eq('id', id);

      if (error) throw error;

      setSections(prev =>
        prev.map(section =>
          section.id === id ? { ...section, enabled: !section.enabled } : section
        )
      );
    } catch (error) {
      console.error('Error toggling section:', error);
      toast({
        title: "Error",
        description: "Failed to toggle section",
        variant: "destructive",
      });
    }
  };

  const handleMoveSection = (id: string, direction: 'up' | 'down') => {
    const currentIndex = sections.findIndex(s => s.id === id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= sections.length) return;

    const newSections = [...sections];
    [newSections[currentIndex], newSections[newIndex]] = [newSections[newIndex], newSections[currentIndex]];
    
    setSections(newSections.map((section, index) => ({ 
      ...section, 
      order_index: index + 1 
    })));
  };

  const renderSectionEditor = () => {
    if (!editingSection) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit {editingSection.title}</h3>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{editingSection.type}</Badge>
            <Switch
              checked={editingSection.enabled}
              onCheckedChange={(checked) => handleUpdateSection({
                ...editingSection,
                enabled: checked
              })}
            />
          </div>
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
            <Label htmlFor="content-description">Description</Label>
            <Textarea
              id="content-description"
              value={editingSection.config.description || ''}
              onChange={(e) => handleUpdateSection({
                ...editingSection,
                config: { ...editingSection.config, description: e.target.value }
              })}
            />
          </div>

          {/* Hero-specific controls */}
          {editingSection.type === 'hero' && (
            <>
              <Separator />
              <h4 className="font-medium flex items-center">
                <Star className="h-4 w-4 mr-2" />
                Hero Section Settings
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hero-size">Section Size</Label>
                  <Select
                    value={editingSection.config.heroSize || 'large'}
                    onValueChange={(value) => handleUpdateSection({
                      ...editingSection,
                      config: { ...editingSection.config, heroSize: value as any }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (400px)</SelectItem>
                      <SelectItem value="medium">Medium (500px)</SelectItem>
                      <SelectItem value="large">Large (600px)</SelectItem>
                      <SelectItem value="full">Full Screen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="hero-alignment">Text Alignment</Label>
                  <Select
                    value={editingSection.config.heroAlignment || 'center'}
                    onValueChange={(value) => handleUpdateSection({
                      ...editingSection,
                      config: { ...editingSection.config, heroAlignment: value as any }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hero-layout">Layout Style</Label>
                  <Select
                    value={editingSection.config.heroLayout || 'text-only'}
                    onValueChange={(value) => handleUpdateSection({
                      ...editingSection,
                      config: { ...editingSection.config, heroLayout: value as any }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text-only">Text Only</SelectItem>
                      <SelectItem value="text-image">Text + Image</SelectItem>
                      <SelectItem value="background-image">Background Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="padding">Padding</Label>
                  <Select
                    value={editingSection.config.padding || 'large'}
                    onValueChange={(value) => handleUpdateSection({
                      ...editingSection,
                      config: { ...editingSection.config, padding: value as any }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                      <SelectItem value="extra-large">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="text-size">Text Size</Label>
                  <Select
                    value={editingSection.config.textSize || 'large'}
                    onValueChange={(value) => handleUpdateSection({
                      ...editingSection,
                      config: { ...editingSection.config, textSize: value as any }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                      <SelectItem value="extra-large">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="border-radius">Border Radius</Label>
                  <Select
                    value={editingSection.config.borderRadius || 'medium'}
                    onValueChange={(value) => handleUpdateSection({
                      ...editingSection,
                      config: { ...editingSection.config, borderRadius: value as any }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(editingSection.config.heroLayout === 'text-image' || editingSection.config.heroLayout === 'background-image') && (
                <div>
                  <Label htmlFor="hero-image">Image URL</Label>
                  <Input
                    id="hero-image"
                    placeholder="https://example.com/image.jpg"
                    value={editingSection.config.backgroundImage || editingSection.config.image || ''}
                    onChange={(e) => handleUpdateSection({
                      ...editingSection,
                      config: { 
                        ...editingSection.config, 
                        ...(editingSection.config.heroLayout === 'background-image' 
                          ? { backgroundImage: e.target.value }
                          : { image: e.target.value }
                        )
                      }
                    })}
                  />
                </div>
              )}

              {editingSection.config.heroLayout === 'background-image' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={editingSection.config.overlay || false}
                      onCheckedChange={(checked) => handleUpdateSection({
                        ...editingSection,
                        config: { ...editingSection.config, overlay: checked }
                      })}
                    />
                    <Label>Enable Overlay</Label>
                  </div>
                  
                  {editingSection.config.overlay && (
                    <div>
                      <Label htmlFor="overlay-opacity">Overlay Opacity</Label>
                      <Input
                        id="overlay-opacity"
                        type="range"
                        min="0"
                        max="100"
                        value={editingSection.config.overlayOpacity || 50}
                        onChange={(e) => handleUpdateSection({
                          ...editingSection,
                          config: { ...editingSection.config, overlayOpacity: parseInt(e.target.value) }
                        })}
                        className="w-full"
                      />
                      <span className="text-sm text-muted-foreground">
                        {editingSection.config.overlayOpacity || 50}%
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="shadow">Shadow Effect</Label>
                <Select
                  value={editingSection.config.shadow || 'none'}
                  onValueChange={(value) => handleUpdateSection({
                    ...editingSection,
                    config: { ...editingSection.config, shadow: value as any }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="custom-css">Custom CSS Classes</Label>
                <Input
                  id="custom-css"
                  placeholder="additional-class another-class"
                  value={editingSection.config.customCss || ''}
                  onChange={(e) => handleUpdateSection({
                    ...editingSection,
                    config: { ...editingSection.config, customCss: e.target.value }
                  })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Add custom Tailwind CSS classes for advanced styling
                </p>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
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
                  <SelectItem value="primary/5">Primary Light</SelectItem>
                  <SelectItem value="secondary/5">Secondary Light</SelectItem>
                  <SelectItem value="gradient-to-br from-primary/5 to-primary/10">Primary Gradient</SelectItem>
                  <SelectItem value="gradient-to-r from-blue-50 to-indigo-50">Blue Gradient</SelectItem>
                  <SelectItem value="gradient-to-br from-purple-50 to-pink-50">Purple Gradient</SelectItem>
                  <SelectItem value="gradient-to-r from-green-50 to-emerald-50">Green Gradient</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="animation">Animation</Label>
              <Select
                value={editingSection.config.animation || 'fade-in'}
                onValueChange={(value) => handleUpdateSection({
                  ...editingSection,
                  config: { ...editingSection.config, animation: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fade-in">Fade In</SelectItem>
                  <SelectItem value="slide-in-right">Slide In Right</SelectItem>
                  <SelectItem value="scale-in">Scale In</SelectItem>
                  <SelectItem value="none">No Animation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {editingSection.type === 'slider' && (
            <>
              <Separator />
              <h4 className="font-medium flex items-center">
                <Sliders className="h-4 w-4 mr-2" />
                Slider Settings
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="interval">Interval (seconds)</Label>
                  <Input
                    id="interval"
                    type="number"
                    value={(editingSection.config.interval || 5000) / 1000}
                    onChange={(e) => handleUpdateSection({
                      ...editingSection,
                      config: { ...editingSection.config, interval: parseInt(e.target.value) * 1000 }
                    })}
                  />
                </div>
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
                    <Card key={index} className="border-dashed">
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
                          <div className="flex items-center space-x-2">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
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
                          </div>
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
                            className="w-fit"
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
                    className="w-full border-dashed"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Slide
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const getPreviewStyles = () => {
    switch (previewMode) {
      case 'mobile':
        return 'w-[375px] min-h-[667px]';
      case 'tablet':
        return 'w-[768px] min-h-[1024px]';
      default:
        return 'w-full min-h-[800px]';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading home page editor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Home Page Editor</h1>
                <p className="text-muted-foreground">Design and manage your home page sections</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
                <Button
                  variant={previewMode === 'desktop' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('desktop')}
                  className="h-8"
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewMode === 'tablet' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('tablet')}
                  className="h-8"
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewMode === 'mobile' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('mobile')}
                  className="h-8"
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" onClick={() => window.open('/', '_blank')}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button onClick={saveSections} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sections Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Layout className="h-5 w-5 mr-2" />
                  Page Sections
                </CardTitle>
                <CardDescription>
                  Drag to reorder, click to edit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Select onValueChange={(type) => handleAddSection(type as HomeSection['type'])}>
                    <SelectTrigger>
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

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={sections} strategy={verticalListSortingStrategy}>
                    {sections.map((section, index) => (
                      <SortableItem
                        key={section.id}
                        section={section}
                        onEdit={setEditingSection}
                        onDelete={handleDeleteSection}
                        onToggle={handleToggleSection}
                        onMoveUp={(id) => handleMoveSection(id, 'up')}
                        onMoveDown={(id) => handleMoveSection(id, 'down')}
                        isFirst={index === 0}
                        isLast={index === sections.length - 1}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
                
                {sections.length === 0 && (
                  <div className="text-center py-8">
                    <Layout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No sections yet</h3>
                    <p className="text-muted-foreground text-sm">
                      Add your first section to start building your home page
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section Editor */}
            {editingSection && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Edit className="h-5 w-5 mr-2" />
                    Section Editor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderSectionEditor()}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Live Preview Panel */}
          <div className="lg:col-span-2">
            <Card className="h-fit">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Eye className="h-5 w-5 mr-2" />
                    Live Preview
                  </CardTitle>
                  <Badge variant="outline" className="capitalize">
                    {previewMode}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mx-auto bg-background border rounded-lg overflow-hidden" style={{ maxWidth: '100%' }}>
                  <div className={`${getPreviewStyles()} mx-auto bg-white transition-all duration-300`}>
                    <iframe
                      src="/"
                      className="w-full h-full border-0"
                      style={{ minHeight: '600px' }}
                      title="Home Page Preview"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePageEditor;