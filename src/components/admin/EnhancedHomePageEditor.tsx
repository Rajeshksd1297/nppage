import { useState, useEffect } from 'react';
import VisualPageEditor from './VisualPageEditor';
import HeaderEditorVisual from './HeaderEditorVisual';
import FooterEditorVisual from './FooterEditorVisual';
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
  const [currentTab, setCurrentTab] = useState<'visual' | 'header' | 'footer' | 'additional-pages'>('visual');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <div>
              <h1 className="text-xl font-semibold">Content Editor</h1>
              <p className="text-sm text-muted-foreground">
                Manage your homepage content and layout
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={liveSync}
                onCheckedChange={setLiveSync}
                id="live-sync"
              />
              <Label htmlFor="live-sync" className="text-xs">Live Sync</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={autoSave}
                onCheckedChange={setAutoSave}
                id="auto-save"
              />
              <Label htmlFor="auto-save" className="text-xs">Auto Save</Label>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('desktop')}
                className="rounded-none border-0 px-3"
              >
                <Monitor className="h-3 w-3" />
              </Button>
              <Button
                variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('tablet')}
                className="rounded-none border-0 px-3"
              >
                <Tablet className="h-3 w-3" />
              </Button>
              <Button
                variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('mobile')}
                className="rounded-none border-0 px-3"
              >
                <Smartphone className="h-3 w-3" />
              </Button>
            </div>
            {saving && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="border-t">
          <div className="flex space-x-1 p-2">
            <Button
              variant={currentTab === 'visual' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentTab('visual')}
              className="text-xs h-8"
            >
              Visual Editor
            </Button>
            <Button
              variant={currentTab === 'header' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentTab('header')}
              className="text-xs h-8"
            >
              Header
            </Button>
            <Button
              variant={currentTab === 'footer' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentTab('footer')}
              className="text-xs h-8"
            >
              Footer
            </Button>
            <Button
              variant={currentTab === 'additional-pages' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentTab('additional-pages')}
              className="text-xs h-8"
            >
              Pages
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {currentTab === 'visual' ? (
        <VisualPageEditor onBack={onBack} />
      ) : currentTab === 'header' ? (
        <HeaderEditorVisual onBack={onBack} />
      ) : currentTab === 'footer' ? (
        <FooterEditorVisual onBack={onBack} />
      ) : currentTab === 'additional-pages' ? (
        <div className="flex-1 overflow-auto p-6">
          <AdditionalPagesEditor />
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-6">
          <div className="text-center py-12">
            <Layout className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Content Editor</h3>
            <p className="text-muted-foreground">Select a tab above to edit your content</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedHomePageEditor;