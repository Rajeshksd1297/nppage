import { useState, useEffect } from 'react';
import VisualPageEditor from './VisualPageEditor';
import HeaderEditor from './HeaderEditor';
import FooterEditor from './FooterEditor';
import AdditionalPagesEditor from './AdditionalPagesEditor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
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
  Layout,
  Type,
  Image as ImageIcon,
  Star,
  Users,
  BarChart3,
  Sliders,
  Palette,
  Settings,
  Monitor,
  Tablet,
  Smartphone,
  Layers,
  Box,
  Navigation,
  Zap,
  Globe,
  Code,
  Paintbrush,
  MousePointer,
  RefreshCw,
  Menu
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HomeSection {
  id: string;
  type: 'hero' | 'stats' | 'features' | 'pricing' | 'testimonials' | 'newsletter' | 'slider' | 'header' | 'footer' | 
        'interactive_hero' | 'premium_showcase' | 'free_vs_pro' | 'faq' | 'free_success' | 'trial_cta' | 'success_stories' | 'final_cta';
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
    // Hero Block specific
    heroBlockId?: string;
    heroSize?: 'small' | 'medium' | 'large' | 'full';
    heroAlignment?: 'left' | 'center' | 'right';
    heroLayout?: 'text-only' | 'text-image' | 'background-image';
    padding?: string;
    margin?: string;
    borderRadius?: string;
    shadow?: string;
    customCss?: string;
    // Header/Footer specific
    logoUrl?: string;
    logoPosition?: 'left' | 'center' | 'right';
    navigationItems?: Array<{ label: string; url: string; target?: string }>;
    copyrightText?: string;
    socialLinks?: Array<{ platform: string; url: string; icon: string }>;
    stickyHeader?: boolean;
    transparentHeader?: boolean;
    // Advanced styling
    maxWidth?: string;
    minHeight?: string;
    overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
    position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
    zIndex?: number;
    opacity?: number;
    transform?: string;
    transition?: string;
  };
}

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

interface SortableItemProps {
  section: HomeSection;
  onEdit: (section: HomeSection) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onDuplicate: (section: HomeSection) => void;
}

function SortableItem({ section, onEdit, onDelete, onToggle, onDuplicate }: SortableItemProps) {
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
      case 'hero':
      case 'interactive_hero': return <Star className="h-4 w-4" />;
      case 'stats': return <BarChart3 className="h-4 w-4" />;
      case 'features': return <Layout className="h-4 w-4" />;
      case 'pricing': return <Users className="h-4 w-4" />;
      case 'premium_showcase': return <Zap className="h-4 w-4" />;
      case 'free_vs_pro': return <Users className="h-4 w-4" />;
      case 'faq': return <Type className="h-4 w-4" />;
      case 'free_success':
      case 'success_stories': return <Star className="h-4 w-4" />;
      case 'trial_cta':
      case 'final_cta': return <MousePointer className="h-4 w-4" />;
      case 'slider': return <Sliders className="h-4 w-4" />;
      case 'header': return <Navigation className="h-4 w-4" />;
      case 'footer': return <Box className="h-4 w-4" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <Card className={`${isDragging ? 'shadow-xl border-primary' : 'shadow-sm hover:shadow-md'} transition-all duration-200 group`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab hover:cursor-grabbing p-2 hover:bg-muted rounded-lg transition-colors"
                title="Drag to reorder"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="p-2 bg-muted/50 rounded-lg">
                {getSectionIcon(section.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium truncate">{section.title}</span>
                  <Badge variant={section.enabled ? 'default' : 'secondary'} className="text-xs shrink-0">
                    {section.enabled ? 'Live' : 'Hidden'}
                  </Badge>
                  {section.config.heroBlockId && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      <Zap className="h-3 w-3 mr-1" />
                      Hero Block
                    </Badge>
                  )}
                </div>
                {section.config.subtitle && (
                  <p className="text-sm text-muted-foreground truncate mt-1">{section.config.subtitle}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-1 opacity-100 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggle(section.id)}
                className="h-8 w-8 p-0"
                title={section.enabled ? "Hide section" : "Show section"}
              >
                {section.enabled ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDuplicate(section)}
                className="h-8 w-8 p-0"
                title="Duplicate section"
              >
                <Layers className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(section)}
                className="h-8 w-8 p-0"
                title="Edit section"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(section.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                title="Delete section"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface EnhancedHomePageEditorProps {
  onBack?: () => void;
}

const EnhancedHomePageEditor = ({ onBack }: EnhancedHomePageEditorProps) => {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [heroBlocks, setHeroBlocks] = useState<HeroBlock[]>([]);
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [currentTab, setCurrentTab] = useState<'sections' | 'editor' | 'settings' | 'preview' | 'visual' | 'header' | 'footer' | 'additional-pages'>('visual');
  const [liveSync, setLiveSync] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchSections();
    fetchHeroBlocks();
  }, []);

  useEffect(() => {
    if (autoSave && sections.length > 0) {
      const timer = setTimeout(() => {
        saveSections();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [sections, autoSave]);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('home_page_sections')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      if (data) {
        console.log('Fetched sections:', data);
        const transformedData = data.map(section => ({
          ...section,
          config: typeof section.config === 'object' ? section.config : {}
        }));
        console.log('Transformed sections:', transformedData);
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

  const fetchHeroBlocks = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_blocks')
        .select('*')
        .eq('enabled', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHeroBlocks(data || []);
    } catch (error) {
      console.error('Error fetching hero blocks:', error);
    }
  };

  const saveSections = async () => {
    if (!sections.length) return;
    
    try {
      setSaving(true);
      
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

      if (liveSync) {
        toast({
          title: "Auto-saved",
          description: "Changes saved automatically",
        });
      }
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
        config: getDefaultConfig(type)
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
      setCurrentTab('editor');
      
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

  const getDefaultConfig = (type: string) => {
    const baseConfig = {
      title: `New ${type} section`,
      subtitle: 'Configure this section',
      backgroundColor: 'background',
      animation: 'fade-in',
      padding: '2rem',
      margin: '0',
      borderRadius: '0.5rem',
      shadow: 'sm'
    };

    switch (type) {
      case 'hero':
      case 'interactive_hero':
        return {
          ...baseConfig,
          heroSize: 'large',
          heroAlignment: 'center',
          heroLayout: 'text-only',
          textColor: 'foreground',
          buttons: [
            { text: 'Get Started', url: '/auth', variant: 'primary' as const },
            { text: 'Learn More', url: '#features', variant: 'secondary' as const }
          ]
        };
      case 'header':
        return {
          ...baseConfig,
          logoUrl: '',
          logoPosition: 'left',
          navigationItems: [
            { label: 'Home', url: '/' },
            { label: 'About', url: '/about' },
            { label: 'Contact', url: '/contact' }
          ],
          stickyHeader: true,
          transparentHeader: false,
          position: 'sticky',
          zIndex: 1000
        };
      case 'footer':
        return {
          ...baseConfig,
          copyrightText: `© ${new Date().getFullYear()} Your Company. All rights reserved.`,
          socialLinks: [
            { platform: 'twitter', url: '', icon: 'twitter' },
            { platform: 'facebook', url: '', icon: 'facebook' },
            { platform: 'linkedin', url: '', icon: 'linkedin' }
          ]
        };
      case 'premium_showcase':
        return {
          ...baseConfig,
          title: 'Premium Features Showcase',
          items: []
        };
      case 'free_vs_pro':
        return {
          ...baseConfig,
          title: 'Free vs Pro Comparison',
          plans: []
        };
      case 'faq':
        return {
          ...baseConfig,
          title: 'Frequently Asked Questions',
          categories: []
        };
      case 'success_stories':
        return {
          ...baseConfig,
          title: 'Success Stories',
          stories: []
        };
      case 'trial_cta':
      case 'final_cta':
        return {
          ...baseConfig,
          title: 'Call to Action',
          buttons: [
            { text: 'Get Started', url: '/auth', variant: 'primary' as const }
          ]
        };
      case 'free_success':
        return {
          ...baseConfig,
          title: 'Success Stories',
          stories: []
        };
      case 'slider':
        return {
          ...baseConfig,
          autoPlay: true,
          interval: 5000,
          showDots: true,
          showArrows: true,
          items: [
            { title: 'Slide 1', description: 'First slide content', image: '' },
            { title: 'Slide 2', description: 'Second slide content', image: '' }
          ]
        };
      default:
        return baseConfig;
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
        setCurrentTab('sections');
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

  const handleDuplicateSection = async (section: HomeSection) => {
    try {
      const maxOrder = Math.max(...sections.map(s => s.order_index), 0);
      
      const duplicatedSection = {
        type: section.type,
        title: `${section.title} (Copy)`,
        enabled: section.enabled,
        order_index: maxOrder + 1,
        config: { ...section.config }
      };

      const { data, error } = await supabase
        .from('home_page_sections')
        .insert([duplicatedSection])
        .select()
        .single();

      if (error) throw error;
      
      const transformedData = {
        ...data,
        config: typeof data.config === 'object' ? data.config : {}
      };
      
      setSections(prev => [...prev, transformedData as HomeSection]);
      
      toast({
        title: "Success",
        description: "Section duplicated successfully",
      });
    } catch (error) {
      console.error('Error duplicating section:', error);
      toast({
        title: "Error",
        description: "Failed to duplicate section",
        variant: "destructive",
      });
    }
  };

  const renderSectionEditor = () => {
    if (!editingSection) return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Edit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Select a section to edit</p>
        </div>
      </div>
    );

    return (
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{editingSection.title}</h3>
              <Badge variant="outline" className="mt-1">{editingSection.type}</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleSection(editingSection.id)}
              >
                {editingSection.enabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {editingSection.enabled ? 'Hide' : 'Show'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDuplicateSection(editingSection)}
              >
                <Layers className="h-4 w-4 mr-2" />
                Duplicate
              </Button>
            </div>
          </div>

          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              {renderContentEditor()}
            </TabsContent>

            <TabsContent value="style" className="space-y-4">
              {renderStyleEditor()}
            </TabsContent>

            <TabsContent value="layout" className="space-y-4">
              {renderLayoutEditor()}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              {renderAdvancedEditor()}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    );
  };

  const renderContentEditor = () => (
    <>
      <div className="grid gap-4">
        <div>
          <Label htmlFor="section-title">Section Title</Label>
          <Input
            id="section-title"
            value={editingSection?.title || ''}
            onChange={(e) => editingSection && handleUpdateSection({
              ...editingSection,
              title: e.target.value
            })}
          />
        </div>

        <div>
          <Label htmlFor="content-title">Content Title</Label>
          <Input
            id="content-title"
            value={editingSection?.config.title || ''}
            onChange={(e) => editingSection && handleUpdateSection({
              ...editingSection,
              config: { ...editingSection.config, title: e.target.value }
            })}
          />
        </div>

        <div>
          <Label htmlFor="content-subtitle">Subtitle</Label>
          <Textarea
            id="content-subtitle"
            value={editingSection?.config.subtitle || ''}
            onChange={(e) => editingSection && handleUpdateSection({
              ...editingSection,
              config: { ...editingSection.config, subtitle: e.target.value }
            })}
          />
        </div>

        {editingSection?.type === 'hero' && heroBlocks.length > 0 && (
          <div>
            <Label htmlFor="hero-block">Hero Block</Label>
            <Select
              value={editingSection.config.heroBlockId || ''}
              onValueChange={(value) => handleUpdateSection({
                ...editingSection,
                config: { ...editingSection.config, heroBlockId: value }
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a hero block" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {heroBlocks.map((block) => (
                  <SelectItem key={block.id} value={block.id}>
                    {block.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {editingSection?.type === 'header' && (
          <>
            <div>
              <Label htmlFor="logo-url">Logo URL</Label>
              <Input
                id="logo-url"
                value={editingSection.config.logoUrl || ''}
                onChange={(e) => handleUpdateSection({
                  ...editingSection,
                  config: { ...editingSection.config, logoUrl: e.target.value }
                })}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div>
              <Label>Navigation Items</Label>
              <div className="space-y-2 mt-2">
                {(editingSection.config.navigationItems || []).map((item: any, index: number) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Label"
                      value={item.label || ''}
                      onChange={(e) => {
                        const newItems = [...(editingSection.config.navigationItems || [])];
                        newItems[index] = { ...item, label: e.target.value };
                        handleUpdateSection({
                          ...editingSection,
                          config: { ...editingSection.config, navigationItems: newItems }
                        });
                      }}
                    />
                    <Input
                      placeholder="URL"
                      value={item.url || ''}
                      onChange={(e) => {
                        const newItems = [...(editingSection.config.navigationItems || [])];
                        newItems[index] = { ...item, url: e.target.value };
                        handleUpdateSection({
                          ...editingSection,
                          config: { ...editingSection.config, navigationItems: newItems }
                        });
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newItems = [...(editingSection.config.navigationItems || [])];
                        newItems.splice(index, 1);
                        handleUpdateSection({
                          ...editingSection,
                          config: { ...editingSection.config, navigationItems: newItems }
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newItems = [...(editingSection.config.navigationItems || []), {
                      label: 'New Item',
                      url: '/'
                    }];
                    handleUpdateSection({
                      ...editingSection,
                      config: { ...editingSection.config, navigationItems: newItems }
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Navigation Item
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );

  const renderStyleEditor = () => (
    <>
      <div className="grid gap-4">
        <div>
          <Label htmlFor="background-color">Background</Label>
          <Select
            value={editingSection?.config.backgroundColor || 'background'}
            onValueChange={(value) => editingSection && handleUpdateSection({
              ...editingSection,
              config: { ...editingSection.config, backgroundColor: value }
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="background">Default</SelectItem>
              <SelectItem value="muted">Muted</SelectItem>
              <SelectItem value="primary">Primary</SelectItem>
              <SelectItem value="secondary">Secondary</SelectItem>
              <SelectItem value="accent">Accent</SelectItem>
              <SelectItem value="gradient-to-r from-primary to-secondary">Primary Gradient</SelectItem>
              <SelectItem value="gradient-to-br from-background to-muted">Subtle Gradient</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="text-color">Text Color</Label>
          <Select
            value={editingSection?.config.textColor || 'foreground'}
            onValueChange={(value) => editingSection && handleUpdateSection({
              ...editingSection,
              config: { ...editingSection.config, textColor: value }
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="foreground">Default</SelectItem>
              <SelectItem value="muted-foreground">Muted</SelectItem>
              <SelectItem value="primary">Primary</SelectItem>
              <SelectItem value="secondary">Secondary</SelectItem>
              <SelectItem value="white">White</SelectItem>
              <SelectItem value="black">Black</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="border-radius">Border Radius</Label>
          <Select
            value={editingSection?.config.borderRadius || '0.5rem'}
            onValueChange={(value) => editingSection && handleUpdateSection({
              ...editingSection,
              config: { ...editingSection.config, borderRadius: value }
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">None</SelectItem>
              <SelectItem value="0.25rem">Small</SelectItem>
              <SelectItem value="0.5rem">Medium</SelectItem>
              <SelectItem value="1rem">Large</SelectItem>
              <SelectItem value="2rem">Extra Large</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="shadow">Shadow</Label>
          <Select
            value={editingSection?.config.shadow || 'sm'}
            onValueChange={(value) => editingSection && handleUpdateSection({
              ...editingSection,
              config: { ...editingSection.config, shadow: value }
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="sm">Small</SelectItem>
              <SelectItem value="md">Medium</SelectItem>
              <SelectItem value="lg">Large</SelectItem>
              <SelectItem value="xl">Extra Large</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="animation">Animation</Label>
          <Select
            value={editingSection?.config.animation || 'fade-in'}
            onValueChange={(value) => editingSection && handleUpdateSection({
              ...editingSection,
              config: { ...editingSection.config, animation: value }
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="fade-in">Fade In</SelectItem>
              <SelectItem value="slide-up">Slide Up</SelectItem>
              <SelectItem value="slide-down">Slide Down</SelectItem>
              <SelectItem value="slide-left">Slide Left</SelectItem>
              <SelectItem value="slide-right">Slide Right</SelectItem>
              <SelectItem value="zoom-in">Zoom In</SelectItem>
              <SelectItem value="bounce">Bounce</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  );

  const renderLayoutEditor = () => (
    <>
      <div className="grid gap-4">
        <div>
          <Label htmlFor="padding">Padding</Label>
          <Input
            id="padding"
            value={editingSection?.config.padding || '2rem'}
            onChange={(e) => editingSection && handleUpdateSection({
              ...editingSection,
              config: { ...editingSection.config, padding: e.target.value }
            })}
            placeholder="2rem or 32px"
          />
        </div>

        <div>
          <Label htmlFor="margin">Margin</Label>
          <Input
            id="margin"
            value={editingSection?.config.margin || '0'}
            onChange={(e) => editingSection && handleUpdateSection({
              ...editingSection,
              config: { ...editingSection.config, margin: e.target.value }
            })}
            placeholder="0 or 1rem 0"
          />
        </div>

        <div>
          <Label htmlFor="max-width">Max Width</Label>
          <Input
            id="max-width"
            value={editingSection?.config.maxWidth || ''}
            onChange={(e) => editingSection && handleUpdateSection({
              ...editingSection,
              config: { ...editingSection.config, maxWidth: e.target.value }
            })}
            placeholder="1200px or 100%"
          />
        </div>

        <div>
          <Label htmlFor="min-height">Min Height</Label>
          <Input
            id="min-height"
            value={editingSection?.config.minHeight || ''}
            onChange={(e) => editingSection && handleUpdateSection({
              ...editingSection,
              config: { ...editingSection.config, minHeight: e.target.value }
            })}
            placeholder="300px or 50vh"
          />
        </div>

        {editingSection?.type === 'hero' && (
          <>
            <div>
              <Label htmlFor="hero-size">Hero Size</Label>
              <Select
                value={editingSection.config.heroSize || 'large'}
                onValueChange={(value) => handleUpdateSection({
                  ...editingSection,
                  config: { ...editingSection.config, heroSize: value as 'small' | 'medium' | 'large' | 'full' }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="full">Full Screen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="hero-alignment">Alignment</Label>
              <Select
                value={editingSection.config.heroAlignment || 'center'}
                onValueChange={(value) => handleUpdateSection({
                  ...editingSection,
                  config: { ...editingSection.config, heroAlignment: value as 'left' | 'center' | 'right' }
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
          </>
        )}
      </div>
    </>
  );

  const renderAdvancedEditor = () => (
    <>
      <div className="grid gap-4">
        <div>
          <Label htmlFor="position">Position</Label>
          <Select
            value={editingSection?.config.position || 'static'}
            onValueChange={(value) => editingSection && handleUpdateSection({
              ...editingSection,
              config: { ...editingSection.config, position: value as 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky' }
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="static">Static</SelectItem>
              <SelectItem value="relative">Relative</SelectItem>
              <SelectItem value="absolute">Absolute</SelectItem>
              <SelectItem value="fixed">Fixed</SelectItem>
              <SelectItem value="sticky">Sticky</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="z-index">Z-Index</Label>
          <Input
            id="z-index"
            type="number"
            value={editingSection?.config.zIndex || 0}
            onChange={(e) => editingSection && handleUpdateSection({
              ...editingSection,
              config: { ...editingSection.config, zIndex: parseInt(e.target.value) }
            })}
          />
        </div>

        <div>
          <Label htmlFor="opacity">Opacity: {editingSection?.config.opacity || 1}</Label>
          <Slider
            value={[editingSection?.config.opacity || 1]}
            onValueChange={([value]) => editingSection && handleUpdateSection({
              ...editingSection,
              config: { ...editingSection.config, opacity: value }
            })}
            max={1}
            min={0}
            step={0.1}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="custom-css">Custom CSS</Label>
          <Textarea
            id="custom-css"
            value={editingSection?.config.customCss || ''}
            onChange={(e) => editingSection && handleUpdateSection({
              ...editingSection,
              config: { ...editingSection.config, customCss: e.target.value }
            })}
            placeholder="Enter custom CSS styles..."
            className="font-mono text-sm"
            rows={6}
          />
        </div>
      </div>
    </>
  );

  const renderPreview = () => (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4 p-4 border-b">
        <div className="flex items-center space-x-2">
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open('/', '_blank')}
        >
          <Globe className="h-4 w-4 mr-2" />
          Open Live Site
        </Button>
      </div>
      
      <div className={`mx-auto transition-all duration-300 ${
        previewMode === 'desktop' ? 'max-w-full' :
        previewMode === 'tablet' ? 'max-w-3xl' : 'max-w-sm'
      }`}>
        <iframe
          src="/"
          className={`w-full border rounded-lg ${
            previewMode === 'desktop' ? 'h-[800px]' :
            previewMode === 'tablet' ? 'h-[600px]' : 'h-[700px]'
          }`}
          title="Live Preview"
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Loading page editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center space-x-4">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-xl font-semibold">Home Page Editor</h1>
            <p className="text-sm text-muted-foreground">Build and customize your home page</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 mr-4">
            <Switch
              checked={autoSave}
              onCheckedChange={setAutoSave}
              id="auto-save"
            />
            <Label htmlFor="auto-save" className="text-sm">Auto-save</Label>
          </div>
          
          <div className="flex items-center space-x-2 mr-4">
            <Switch
              checked={liveSync}
              onCheckedChange={setLiveSync}
              id="live-sync"
            />
            <Label htmlFor="live-sync" className="text-sm">Live Sync</Label>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => saveSections()}
            disabled={saving}
          >
            {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {currentTab === 'visual' ? (
        <VisualPageEditor onBack={onBack} />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 border-r bg-muted/10 flex flex-col">
            <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as typeof currentTab)} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-4 m-4">
                <TabsTrigger value="visual" className="text-xs">Visual</TabsTrigger>
                <TabsTrigger value="sections" className="text-xs">Sections</TabsTrigger>
                <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
                <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
              </TabsList>
              
              <TabsList className="grid w-full grid-cols-3 mx-4 mb-4">
                <TabsTrigger value="header" className="text-xs">Header</TabsTrigger>
                <TabsTrigger value="footer" className="text-xs">Footer</TabsTrigger>
                <TabsTrigger value="additional-pages" className="text-xs">Pages</TabsTrigger>
              </TabsList>

            <TabsContent value="sections" className="flex-1 overflow-hidden">
              <div className="p-4 space-y-4">
                <div>
                  <h3 className="font-medium mb-3">Add Section</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSection('header')}
                      className="flex items-center justify-start"
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Header
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSection('interactive_hero')}
                      className="flex items-center justify-start"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Hero
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSection('features')}
                      className="flex items-center justify-start"
                    >
                      <Layout className="h-4 w-4 mr-2" />
                      Features
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSection('stats')}
                      className="flex items-center justify-start"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Stats
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSection('premium_showcase')}
                      className="flex items-center justify-start"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Showcase
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSection('free_vs_pro')}
                      className="flex items-center justify-start"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Pricing
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSection('faq')}
                      className="flex items-center justify-start"
                    >
                      <Type className="h-4 w-4 mr-2" />
                      FAQ
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSection('success_stories')}
                      className="flex items-center justify-start"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Testimonials
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSection('trial_cta')}
                      className="flex items-center justify-start"
                    >
                      <MousePointer className="h-4 w-4 mr-2" />
                      CTA
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSection('footer')}
                      className="flex items-center justify-start"
                    >
                      <Box className="h-4 w-4 mr-2" />
                      Footer
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">Page Structure</h3>
                    <Badge variant="outline" className="text-xs">
                      {sections.length} sections
                    </Badge>
                  </div>
                  <ScrollArea className="h-[400px]">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={sections}
                        strategy={verticalListSortingStrategy}
                      >
                        {sections.length > 0 ? (
                          sections.map((section) => (
                            <SortableItem
                              key={section.id}
                              section={section}
                              onEdit={(section) => {
                                setEditingSection(section);
                                setCurrentTab('editor');
                              }}
                              onDelete={handleDeleteSection}
                              onToggle={handleToggleSection}
                              onDuplicate={handleDuplicateSection}
                            />
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <Layout className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">No sections found</p>
                            <p className="text-xs text-muted-foreground mt-1">Add sections using the buttons above</p>
                          </div>
                        )}
                      </SortableContext>
                    </DndContext>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="editor" className="flex-1">
              {renderSectionEditor()}
            </TabsContent>

            <TabsContent value="settings" className="flex-1 p-4">
              <div className="space-y-4">
                <h3 className="font-medium">Page Settings</h3>
                <div className="text-sm text-muted-foreground">
                  Global page settings and configurations will be available here.
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="flex-1">
              {renderPreview()}
            </TabsContent>

            <TabsContent value="header" className="flex-1 overflow-auto">
              <HeaderEditor />
            </TabsContent>

            <TabsContent value="footer" className="flex-1 overflow-auto">
              <FooterEditor />
            </TabsContent>

            <TabsContent value="additional-pages" className="flex-1 overflow-auto">
              <AdditionalPagesEditor />
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 overflow-hidden">
          {currentTab === 'preview' ? (
            renderPreview()
          ) : (
            <div className="h-full flex items-center justify-center bg-muted/5">
              <div className="text-center max-w-md">
                <MousePointer className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Visual Editor</h3>
                <p className="text-muted-foreground mb-4">
                  Select sections from the sidebar to edit them, or use the preview tab to see your changes live.
                </p>
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentTab('preview')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Changes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('/', '_blank')}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Live Site
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default EnhancedHomePageEditor;