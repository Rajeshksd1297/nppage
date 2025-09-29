import { useState, useEffect } from 'react';
import VisualPageEditor from './VisualPageEditor';
import HeaderEditorVisual from './HeaderEditorVisual';
import FooterEditorVisual from './FooterEditorVisual';
import AdditionalPagesEditor from './AdditionalPagesEditor';
import { SEOAnalyzer } from '../seo/SEOAnalyzer';
import { SchemaGenerator } from '../seo/SchemaGenerator';
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
  Menu,
  Search,
  Target,
  Brain,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Share2,
  Shield,
  ExternalLink,
  Activity,
  FileText,
  Database,
  Link,
  Clock,
  AlertCircle
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
  const [currentTab, setCurrentTab] = useState<'editor' | 'seo' | 'visual' | 'header' | 'footer' | 'additional-pages'>('visual');
  const [liveSync, setLiveSync] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  
  // SEO state
  const [seoAnalysisContent, setSeoAnalysisContent] = useState('');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [seoSettings, setSeoSettings] = useState({
    siteTitle: 'Your Author Platform',
    siteDescription: 'Professional author profiles and book showcase platform',
    siteKeywords: 'author, books, publishing, writing, author platform',
    siteLogo: '',
    favicon: '',
    ogImage: '',
    twitterHandle: '',
    canonicalUrl: '',
    enableSitemap: true,
    enableRobots: true,
    metaAuthor: '',
    metaLanguage: 'en',
    structuredDataType: 'WebSite',
    richSnippets: true,
    aiOptimization: true,
    contentStrategy: 'author-focused',
    targetAudience: 'readers, publishers, book enthusiasts',
    competitorKeywords: '',
    xmlSitemap: true,
    robotsTxt: true,
    canonicalUrls: true,
    openGraph: true,
    twitterCards: true,
    schemaMarkup: true,
    breadcrumbs: true,
    internalLinking: true,
    author: '',
    language: 'en',
    googleVerification: '',
    bingVerification: '',
    yandexVerification: '',
    baiduVerification: ''
  });
  
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
        setCurrentTab('visual');
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
      <div className="flex flex-col border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Top Controls */}
        <div className="flex items-center justify-between p-4">
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

        {/* Tab Navigation */}
        <div className="px-4 pb-2">
          <div className="flex items-center space-x-1 bg-muted/30 p-1 rounded-lg w-fit">
            <Button
              variant={currentTab === 'visual' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentTab('visual')}
              className="text-xs h-8"
            >
              Visual
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
            <Button
              variant={currentTab === 'seo' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentTab('seo')}
              className="text-xs h-8"
            >
              SEO
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
      ) : currentTab === 'seo' ? (
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Search className="h-6 w-6" />
              <h1 className="text-2xl font-semibold">SEO Optimization</h1>
              <Badge variant="outline">Enhanced</Badge>
            </div>

            <Tabs defaultValue="basics" className="w-full">
              <TabsList className="grid w-full grid-cols-10">
                <TabsTrigger value="basics">
                  <Search className="h-4 w-4 mr-2" />
                  SEO Basics
                </TabsTrigger>
                <TabsTrigger value="analysis">
                  <Target className="h-4 w-4 mr-2" />
                  Analysis
                </TabsTrigger>
                <TabsTrigger value="schema">
                  <Code className="h-4 w-4 mr-2" />
                  Schema
                </TabsTrigger>
                <TabsTrigger value="advanced">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Advanced
                </TabsTrigger>
                <TabsTrigger value="ai-seo">
                  <Brain className="h-4 w-4 mr-2" />
                  AI SEO
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="social">
                  <Share2 className="h-4 w-4 mr-2" />
                  Social
                </TabsTrigger>
                <TabsTrigger value="performance">
                  <Zap className="h-4 w-4 mr-2" />
                  Performance
                </TabsTrigger>
                <TabsTrigger value="technical">
                  <Settings className="h-4 w-4 mr-2" />
                  Technical
                </TabsTrigger>
                <TabsTrigger value="console">
                  <Activity className="h-4 w-4 mr-2" />
                  Console
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basics" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Basic SEO Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Basic SEO Settings
                      </CardTitle>
                      <CardDescription>
                        Configure essential SEO metadata for your website
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="site-title">Site Title</Label>
                        <Input
                          id="site-title"
                          placeholder="Your Website Title"
                          value={seoSettings.siteTitle}
                          onChange={(e) => setSeoSettings(prev => ({ ...prev, siteTitle: e.target.value }))}
                        />
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Recommended: 30-60 characters</span>
                          <span className={seoSettings.siteTitle.length > 60 ? 'text-red-500' : 'text-muted-foreground'}>
                            {seoSettings.siteTitle.length}/60
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="site-description">Meta Description</Label>
                        <Textarea
                          id="site-description"
                          placeholder="Brief description of your website..."
                          value={seoSettings.siteDescription}
                          onChange={(e) => setSeoSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                          rows={3}
                        />
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Recommended: 120-160 characters</span>
                          <span className={seoSettings.siteDescription.length > 160 ? 'text-red-500' : 'text-muted-foreground'}>
                            {seoSettings.siteDescription.length}/160
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="focus-keyword">Focus Keyword</Label>
                        <Input
                          id="focus-keyword"
                          placeholder="primary keyword"
                          value={focusKeyword}
                          onChange={(e) => setFocusKeyword(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Main keyword you want to rank for
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="keywords">Additional Keywords</Label>
                        <Textarea
                          id="keywords"
                          placeholder="keyword1, keyword2, keyword3..."
                          value={seoSettings.siteKeywords}
                          onChange={(e) => setSeoSettings(prev => ({ ...prev, siteKeywords: e.target.value }))}
                          rows={2}
                        />
                        <p className="text-xs text-muted-foreground">
                          Separate with commas. Focus on 3-5 related keywords.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="author">Author</Label>
                        <Input
                          id="author"
                          placeholder="Author Name"
                          value={seoSettings.author}
                          onChange={(e) => setSeoSettings(prev => ({ ...prev, author: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="language">Language</Label>
                        <Select value={seoSettings.language} onValueChange={(value) => setSeoSettings(prev => ({ ...prev, language: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                            <SelectItem value="it">Italian</SelectItem>
                            <SelectItem value="pt">Portuguese</SelectItem>
                            <SelectItem value="zh">Chinese</SelectItem>
                            <SelectItem value="ja">Japanese</SelectItem>
                            <SelectItem value="ko">Korean</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* SEO Features */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        SEO Features
                      </CardTitle>
                      <CardDescription>
                        Enable advanced SEO features for better ranking
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>XML Sitemap</Label>
                          <p className="text-xs text-muted-foreground">
                            Auto-generate and submit sitemap to search engines
                          </p>
                        </div>
                        <Switch
                          checked={seoSettings.xmlSitemap}
                          onCheckedChange={(checked) => setSeoSettings(prev => ({ ...prev, xmlSitemap: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Robots.txt</Label>
                          <p className="text-xs text-muted-foreground">
                            Control search engine crawling
                          </p>
                        </div>
                        <Switch
                          checked={seoSettings.robotsTxt}
                          onCheckedChange={(checked) => setSeoSettings(prev => ({ ...prev, robotsTxt: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Canonical URLs</Label>
                          <p className="text-xs text-muted-foreground">
                            Prevent duplicate content issues
                          </p>
                        </div>
                        <Switch
                          checked={seoSettings.canonicalUrls}
                          onCheckedChange={(checked) => setSeoSettings(prev => ({ ...prev, canonicalUrls: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Open Graph Tags</Label>
                          <p className="text-xs text-muted-foreground">
                            Better social media sharing
                          </p>
                        </div>
                        <Switch
                          checked={seoSettings.openGraph}
                          onCheckedChange={(checked) => setSeoSettings(prev => ({ ...prev, openGraph: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Twitter Cards</Label>
                          <p className="text-xs text-muted-foreground">
                            Enhanced Twitter sharing
                          </p>
                        </div>
                        <Switch
                          checked={seoSettings.twitterCards}
                          onCheckedChange={(checked) => setSeoSettings(prev => ({ ...prev, twitterCards: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Schema Markup</Label>
                          <p className="text-xs text-muted-foreground">
                            Structured data for rich snippets
                          </p>
                        </div>
                        <Switch
                          checked={seoSettings.schemaMarkup}
                          onCheckedChange={(checked) => setSeoSettings(prev => ({ ...prev, schemaMarkup: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Breadcrumbs</Label>
                          <p className="text-xs text-muted-foreground">
                            Navigation breadcrumbs for better UX
                          </p>
                        </div>
                        <Switch
                          checked={seoSettings.breadcrumbs}
                          onCheckedChange={(checked) => setSeoSettings(prev => ({ ...prev, breadcrumbs: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Internal Linking</Label>
                          <p className="text-xs text-muted-foreground">
                            Auto-suggest internal links
                          </p>
                        </div>
                        <Switch
                          checked={seoSettings.internalLinking}
                          onCheckedChange={(checked) => setSeoSettings(prev => ({ ...prev, internalLinking: checked }))}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* SEO Tips */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      SEO Best Practices
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium">Use descriptive titles</h4>
                            <p className="text-sm text-muted-foreground">Include your main keyword naturally in the title</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium">Optimize meta descriptions</h4>
                            <p className="text-sm text-muted-foreground">Write compelling descriptions that encourage clicks</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium">Use header tags properly</h4>
                            <p className="text-sm text-muted-foreground">H1 for main title, H2-H6 for subheadings</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium">Create quality content</h4>
                            <p className="text-sm text-muted-foreground">Write valuable, original content regularly</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium">Add alt text to images</h4>
                            <p className="text-sm text-muted-foreground">Describe images for accessibility and SEO</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium">Improve page speed</h4>
                            <p className="text-sm text-muted-foreground">Optimize images and minimize code</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium">Build quality backlinks</h4>
                            <p className="text-sm text-muted-foreground">Get links from reputable websites</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium">Mobile optimization</h4>
                            <p className="text-sm text-muted-foreground">Ensure your site works great on mobile</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analysis" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      SEO Content Analysis
                    </CardTitle>
                    <CardDescription>
                      Analyze your content for SEO optimization opportunities
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="analysis-content">Content to Analyze</Label>
                      <Textarea
                        id="analysis-content"
                        placeholder="Paste your content here for SEO analysis..."
                        value={seoAnalysisContent}
                        onChange={(e) => setSeoAnalysisContent(e.target.value)}
                        rows={6}
                      />
                    </div>
                  </CardContent>
                </Card>

                <SEOAnalyzer
                  content={seoAnalysisContent}
                  title={seoSettings.siteTitle}
                  description={seoSettings.siteDescription}
                  keywords={seoSettings.siteKeywords.split(',').map(k => k.trim()).filter(Boolean)}
                  focusKeyword={focusKeyword}
                />
              </TabsContent>

              <TabsContent value="schema" className="space-y-6 mt-6">
                <SchemaGenerator />
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Advanced SEO Features</CardTitle>
                    <CardDescription>Professional SEO optimization tools</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Advanced SEO Coming Soon</h3>
                      <p className="text-muted-foreground">
                        Advanced features like competitor analysis, keyword research, and ranking tracking will be available soon.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai-seo" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      AI-Powered SEO
                    </CardTitle>
                    <CardDescription>Let AI optimize your content for search engines</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">AI SEO Optimization</h3>
                      <p className="text-muted-foreground">
                        AI-powered content optimization, keyword suggestions, and automated SEO improvements coming soon.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      SEO Analytics
                    </CardTitle>
                    <CardDescription>Track your SEO performance and rankings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">SEO Analytics Dashboard</h3>
                      <p className="text-muted-foreground">
                        Comprehensive analytics including keyword rankings, traffic analysis, and performance metrics.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="social" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Share2 className="h-5 w-5" />
                      Social Media SEO
                    </CardTitle>
                    <CardDescription>Optimize for social media sharing and engagement</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Social SEO Features</h3>
                      <p className="text-muted-foreground">
                        Social media optimization tools, Open Graph settings, and social sharing analytics.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Performance Optimization
                    </CardTitle>
                    <CardDescription>Improve your site's loading speed and Core Web Vitals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Performance Tools</h3>
                      <p className="text-muted-foreground">
                        Site speed analysis, Core Web Vitals monitoring, and performance optimization recommendations.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="technical" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Technical SEO
                    </CardTitle>
                    <CardDescription>Advanced technical SEO settings and configurations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Technical SEO Tools</h3>
                      <p className="text-muted-foreground">
                        robots.txt editor, htaccess configuration, crawl optimization, and technical audit tools.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="console" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Google Search Console */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-blue-600" />
                        Google Search Console
                      </CardTitle>
                      <CardDescription>
                        Monitor your site's presence in Google Search results
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="google-verification">Verification Meta Tag</Label>
                        <Input
                          id="google-verification"
                          placeholder="google-site-verification=..."
                          value={seoSettings.googleVerification || ''}
                          onChange={(e) => setSeoSettings(prev => ({ ...prev, googleVerification: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground">
                          Add the verification meta tag from Google Search Console
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-green-600" />
                          <div>
                            <div className="font-medium">Sitemap Status</div>
                            <div className="text-sm text-muted-foreground">Auto-submitted to Google</div>
                          </div>
                        </div>
                        <Badge variant="default">Active</Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Activity className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="font-medium">Indexing Status</div>
                            <div className="text-sm text-muted-foreground">Pages indexed: 15/20</div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Console
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label>Quick Actions</Label>
                        <div className="grid grid-cols-1 gap-2">
                          <Button variant="outline" size="sm" className="justify-start">
                            <Link className="h-4 w-4 mr-2" />
                            Submit Sitemap
                          </Button>
                          <Button variant="outline" size="sm" className="justify-start">
                            <Activity className="h-4 w-4 mr-2" />
                            Request Indexing
                          </Button>
                          <Button variant="outline" size="sm" className="justify-start">
                            <FileText className="h-4 w-4 mr-2" />
                            Performance Report
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bing Webmaster Tools */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-orange-600" />
                        Bing Webmaster Tools
                      </CardTitle>
                      <CardDescription>
                        Monitor your site's performance in Bing search results
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bing-verification">Verification Meta Tag</Label>
                        <Input
                          id="bing-verification"
                          placeholder="msvalidate.01=..."
                          value={seoSettings.bingVerification || ''}
                          onChange={(e) => setSeoSettings(prev => ({ ...prev, bingVerification: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground">
                          Add the verification meta tag from Bing Webmaster Tools
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-green-600" />
                          <div>
                            <div className="font-medium">Sitemap Status</div>
                            <div className="text-sm text-muted-foreground">Submitted to Bing</div>
                          </div>
                        </div>
                        <Badge variant="default">Active</Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Activity className="h-5 w-5 text-orange-600" />
                          <div>
                            <div className="font-medium">Crawl Status</div>
                            <div className="text-sm text-muted-foreground">Last crawled: 2 days ago</div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Tools
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label>Quick Actions</Label>
                        <div className="grid grid-cols-1 gap-2">
                          <Button variant="outline" size="sm" className="justify-start">
                            <Link className="h-4 w-4 mr-2" />
                            Submit URL
                          </Button>
                          <Button variant="outline" size="sm" className="justify-start">
                            <Activity className="h-4 w-4 mr-2" />
                            Crawl Control
                          </Button>
                          <Button variant="outline" size="sm" className="justify-start">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Traffic Report
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Search Console Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Search Console Overview
                    </CardTitle>
                    <CardDescription>
                      Unified view of your search engine performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="p-4 border rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">1.2K</div>
                        <div className="text-sm text-muted-foreground">Total Clicks</div>
                        <div className="text-xs text-green-600">+12% this week</div>
                      </div>
                      <div className="p-4 border rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">45K</div>
                        <div className="text-sm text-muted-foreground">Impressions</div>
                        <div className="text-xs text-blue-600">+8% this week</div>
                      </div>
                      <div className="p-4 border rounded-lg text-center">
                        <div className="text-2xl font-bold text-purple-600">2.7%</div>
                        <div className="text-sm text-muted-foreground">Avg CTR</div>
                        <div className="text-xs text-purple-600">+0.3% this week</div>
                      </div>
                      <div className="p-4 border rounded-lg text-center">
                        <div className="text-2xl font-bold text-orange-600">15.2</div>
                        <div className="text-sm text-muted-foreground">Avg Position</div>
                        <div className="text-xs text-orange-600">-2.1 this week</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-3">Recent Issues</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <AlertCircle className="h-5 w-5 text-yellow-600" />
                              <div>
                                <div className="font-medium">Mobile Usability Issues</div>
                                <div className="text-sm text-muted-foreground">3 pages affected</div>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">Fix</Button>
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Clock className="h-5 w-5 text-blue-600" />
                              <div>
                                <div className="font-medium">Sitemap Submitted</div>
                                <div className="text-sm text-muted-foreground">Processing in progress</div>
                              </div>
                            </div>
                            <Badge variant="outline">Pending</Badge>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-3">Top Performing Queries</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">author platform</div>
                              <div className="text-sm text-muted-foreground">245 clicks • 3.2% CTR</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">Position 4.2</div>
                              <div className="text-xs text-green-600">↑ +1.8</div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">book publishing</div>
                              <div className="text-sm text-muted-foreground">189 clicks • 2.8% CTR</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">Position 6.1</div>
                              <div className="text-xs text-red-600">↓ -0.5</div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">writer portfolio</div>
                              <div className="text-sm text-muted-foreground">156 clicks • 4.1% CTR</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">Position 2.7</div>
                              <div className="text-xs text-green-600">↑ +2.3</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-2">
                      <Button className="flex-1">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Google Search Console
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Bing Webmaster Tools
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Search Engines */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Other Search Engines
                    </CardTitle>
                    <CardDescription>
                      Connect with additional search engines and directories
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <Globe className="h-6 w-6 text-red-600" />
                          <div>
                            <div className="font-medium">Yandex Webmaster</div>
                            <div className="text-sm text-muted-foreground">Russian search engine</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Input
                            placeholder="Yandex verification code"
                            value={seoSettings.yandexVerification || ''}
                            onChange={(e) => setSeoSettings(prev => ({ ...prev, yandexVerification: e.target.value }))}
                          />
                          <Button variant="outline" size="sm" className="w-full">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Connect Yandex
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <Globe className="h-6 w-6 text-green-600" />
                          <div>
                            <div className="font-medium">Baidu Webmaster</div>
                            <div className="text-sm text-muted-foreground">Chinese search engine</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Input
                            placeholder="Baidu verification code"
                            value={seoSettings.baiduVerification || ''}
                            onChange={(e) => setSeoSettings(prev => ({ ...prev, baiduVerification: e.target.value }))}
                          />
                          <Button variant="outline" size="sm" className="w-full">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Connect Baidu
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <Globe className="h-6 w-6 text-purple-600" />
                          <div>
                            <div className="font-medium">DuckDuckGo</div>
                            <div className="text-sm text-muted-foreground">Privacy-focused search</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground">
                            No verification required - optimized automatically
                          </div>
                          <Badge variant="default" className="w-full justify-center">Connected</Badge>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <Globe className="h-6 w-6 text-blue-500" />
                          <div>
                            <div className="font-medium">Yahoo Search</div>
                            <div className="text-sm text-muted-foreground">Via Bing integration</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground">
                            Automatically included with Bing Webmaster Tools
                          </div>
                          <Badge variant="default" className="w-full justify-center">Auto-Connected</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-muted/5">
          <div className="text-center max-w-md">
            <MousePointer className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a Tab</h3>
            <p className="text-muted-foreground mb-4">
              Choose a tab from the navigation above to start editing your page.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedHomePageEditor;