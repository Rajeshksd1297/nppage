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
  AlertCircle,
  Download,
  Upload,
  Copy,
  Trash,
  RotateCcw,
  Filter,
  Calendar,
  MapPin,
  Hash,
  Award,
  Bookmark,
  Timer,
  Gauge,
  Wifi,
  Signal,
  Cpu,
  HardDrive,
  Smartphone as Mobile
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
    baiduVerification: '',
    ogTitle: '',
    ogDescription: '',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    twitterSite: '',
    twitterCreator: '',
    twitterImage: ''
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Keyword Research */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Hash className="h-5 w-5" />
                        Keyword Research
                      </CardTitle>
                      <CardDescription>
                        Discover and analyze high-performing keywords
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="seed-keyword">Seed Keyword</Label>
                        <div className="flex gap-2">
                          <Input
                            id="seed-keyword"
                            placeholder="Enter base keyword..."
                            className="flex-1"
                          />
                          <Button>
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label>Suggested Keywords</Label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {[
                            { keyword: 'author platform building', volume: '2.4K', difficulty: 'Medium', cpc: '$1.20' },
                            { keyword: 'book marketing strategy', volume: '1.8K', difficulty: 'Hard', cpc: '$2.10' },
                            { keyword: 'writer portfolio examples', volume: '960', difficulty: 'Easy', cpc: '$0.85' },
                            { keyword: 'publishing platform authors', volume: '720', difficulty: 'Medium', cpc: '$1.45' },
                            { keyword: 'author website design', volume: '540', difficulty: 'Easy', cpc: '$1.05' }
                          ].map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <div className="font-medium text-sm">{item.keyword}</div>
                                <div className="text-xs text-muted-foreground">
                                  {item.volume} searches/month • {item.cpc} CPC
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={item.difficulty === 'Easy' ? 'default' : item.difficulty === 'Medium' ? 'secondary' : 'destructive'}>
                                  {item.difficulty}
                                </Badge>
                                <Button variant="ghost" size="sm">
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Competitor Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Competitor Analysis
                      </CardTitle>
                      <CardDescription>
                        Analyze competitor SEO strategies
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="competitor-url">Competitor URL</Label>
                        <div className="flex gap-2">
                          <Input
                            id="competitor-url"
                            placeholder="https://competitor.com"
                            className="flex-1"
                          />
                          <Button>Analyze</Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label>Top Competitors</Label>
                        <div className="space-y-2">
                          {[
                            { domain: 'authorhub.com', rank: '85/100', keywords: '1.2K', traffic: '45K' },
                            { domain: 'writersplatform.net', rank: '78/100', keywords: '980', traffic: '32K' },
                            { domain: 'bookauthors.io', rank: '72/100', keywords: '750', traffic: '28K' }
                          ].map((comp, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <div className="font-medium text-sm">{comp.domain}</div>
                                <div className="text-xs text-muted-foreground">
                                  {comp.keywords} keywords • {comp.traffic} monthly traffic
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{comp.rank}</Badge>
                                <Button variant="ghost" size="sm">
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* SERP Features */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bookmark className="h-5 w-5" />
                      SERP Features Optimization
                    </CardTitle>
                    <CardDescription>
                      Optimize for featured snippets and rich results
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <FileText className="h-6 w-6 text-blue-600" />
                          <div>
                            <div className="font-medium">Featured Snippets</div>
                            <div className="text-sm text-muted-foreground">Position 0 optimization</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm">
                            <strong>Target:</strong> "What is an author platform"
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Optimize content structure for snippet capture
                          </div>
                          <Button variant="outline" size="sm" className="w-full">
                            Optimize Content
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <MapPin className="h-6 w-6 text-green-600" />
                          <div>
                            <div className="font-medium">Local Pack</div>
                            <div className="text-sm text-muted-foreground">Local SEO presence</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm">
                            <strong>Status:</strong> Not appearing
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Add local business schema
                          </div>
                          <Button variant="outline" size="sm" className="w-full">
                            Setup Local SEO
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <Star className="h-6 w-6 text-yellow-600" />
                          <div>
                            <div className="font-medium">Review Stars</div>
                            <div className="text-sm text-muted-foreground">Rich review snippets</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm">
                            <strong>Rating:</strong> 4.8/5 (24 reviews)
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Add review schema markup
                          </div>
                          <Button variant="outline" size="sm" className="w-full">
                            Add Schema
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai-seo" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* AI Content Optimizer */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        AI Content Optimizer
                      </CardTitle>
                      <CardDescription>
                        Let AI improve your content for better rankings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="content-to-optimize">Content to Optimize</Label>
                        <Textarea
                          id="content-to-optimize"
                          placeholder="Paste your content here for AI optimization..."
                          rows={6}
                          className="resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="target-keywords">Target Keywords</Label>
                        <Input
                          id="target-keywords"
                          placeholder="keyword1, keyword2, keyword3"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="content-type">Content Type</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select content type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="blog-post">Blog Post</SelectItem>
                            <SelectItem value="product-page">Product Page</SelectItem>
                            <SelectItem value="landing-page">Landing Page</SelectItem>
                            <SelectItem value="about-page">About Page</SelectItem>
                            <SelectItem value="service-page">Service Page</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button className="w-full">
                        <Brain className="h-4 w-4 mr-2" />
                        Optimize with AI
                      </Button>
                    </CardContent>
                  </Card>

                  {/* AI SEO Suggestions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5" />
                        AI SEO Suggestions
                      </CardTitle>
                      <CardDescription>
                        Smart recommendations for your website
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        {[
                          {
                            type: 'Title Optimization',
                            suggestion: 'Add power words like "Ultimate" or "Complete" to your title',
                            impact: 'High',
                            icon: <Type className="h-4 w-4" />
                          },
                          {
                            type: 'Content Gap',
                            suggestion: 'Add a FAQ section to target long-tail keywords',
                            impact: 'Medium',
                            icon: <FileText className="h-4 w-4" />
                          },
                          {
                            type: 'Internal Linking',
                            suggestion: 'Link to your "Services" page from the homepage',
                            impact: 'Medium',
                            icon: <Link className="h-4 w-4" />
                          },
                          {
                            type: 'Meta Description',
                            suggestion: 'Include a call-to-action in your meta descriptions',
                            impact: 'High',
                            icon: <Edit className="h-4 w-4" />
                          }
                        ].map((item, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              {item.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{item.type}</span>
                                <Badge variant={item.impact === 'High' ? 'default' : 'secondary'} className="text-xs">
                                  {item.impact} Impact
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">{item.suggestion}</div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <Button variant="outline" className="w-full">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Get More Suggestions
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Content Generation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      AI Content Generation
                    </CardTitle>
                    <CardDescription>
                      Generate SEO-optimized content automatically
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg text-center">
                        <FileText className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                        <h4 className="font-medium mb-2">Meta Descriptions</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Generate compelling meta descriptions that drive clicks
                        </p>
                        <Button variant="outline" size="sm" className="w-full">
                          Generate
                        </Button>
                      </div>

                      <div className="p-4 border rounded-lg text-center">
                        <Type className="h-8 w-8 text-green-600 mx-auto mb-3" />
                        <h4 className="font-medium mb-2">SEO Titles</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Create attention-grabbing titles optimized for search
                        </p>
                        <Button variant="outline" size="sm" className="w-full">
                          Generate
                        </Button>
                      </div>

                      <div className="p-4 border rounded-lg text-center">
                        <Hash className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                        <h4 className="font-medium mb-2">Alt Text</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Generate descriptive alt text for better accessibility
                        </p>
                        <Button variant="outline" size="sm" className="w-full">
                          Generate
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* SEO Performance Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        SEO Performance
                      </CardTitle>
                      <CardDescription>
                        Track your SEO metrics and improvements
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-3 border rounded-lg">
                          <div className="text-2xl font-bold text-green-600">78</div>
                          <div className="text-sm text-muted-foreground">SEO Score</div>
                          <div className="text-xs text-green-600">+12 this month</div>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">156</div>
                          <div className="text-sm text-muted-foreground">Keywords Ranking</div>
                          <div className="text-xs text-blue-600">+23 this month</div>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">8.2K</div>
                          <div className="text-sm text-muted-foreground">Organic Traffic</div>
                          <div className="text-xs text-purple-600">+18% this month</div>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">3.2%</div>
                          <div className="text-sm text-muted-foreground">Click-through Rate</div>
                          <div className="text-xs text-orange-600">+0.4% this month</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Performance Trend (Last 30 days)</Label>
                        <div className="h-32 bg-muted/20 rounded-lg flex items-end justify-between p-2">
                          {[65, 72, 68, 75, 78, 82, 78].map((height, index) => (
                            <div
                              key={index}
                              className="bg-primary rounded-sm w-8"
                              style={{ height: `${height}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Keyword Rankings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Keyword Rankings
                      </CardTitle>
                      <CardDescription>
                        Monitor your keyword positions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { keyword: 'author platform', position: 4, change: '+2', traffic: '245' },
                          { keyword: 'book marketing', position: 7, change: '-1', traffic: '189' },
                          { keyword: 'writer portfolio', position: 3, change: '+5', traffic: '156' },
                          { keyword: 'publishing tools', position: 12, change: '+3', traffic: '98' },
                          { keyword: 'author website', position: 6, change: '0', traffic: '87' }
                        ].map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium text-sm">{item.keyword}</div>
                              <div className="text-xs text-muted-foreground">{item.traffic} monthly clicks</div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold">#{item.position}</div>
                              <div className={`text-xs ${
                                item.change.startsWith('+') ? 'text-green-600' : 
                                item.change.startsWith('-') ? 'text-red-600' : 'text-muted-foreground'
                              }`}>
                                {item.change !== '0' ? item.change : 'No change'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <Button variant="outline" className="w-full mt-4">
                        <Filter className="h-4 w-4 mr-2" />
                        View All Keywords
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Traffic Sources & Top Pages */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Traffic Sources
                      </CardTitle>
                      <CardDescription>
                        Where your organic traffic comes from
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { source: 'Google Search', percentage: 78, sessions: '6.4K', color: 'bg-blue-500' },
                          { source: 'Bing Search', percentage: 15, sessions: '1.2K', color: 'bg-orange-500' },
                          { source: 'DuckDuckGo', percentage: 4, sessions: '328', color: 'bg-purple-500' },
                          { source: 'Yahoo Search', percentage: 3, sessions: '246', color: 'bg-yellow-500' }
                        ].map((item, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{item.source}</span>
                              <span className="text-sm text-muted-foreground">{item.sessions} sessions</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className={`${item.color} h-2 rounded-full`}
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                            <div className="text-xs text-muted-foreground">{item.percentage}% of total</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Top Performing Pages
                      </CardTitle>
                      <CardDescription>
                        Your highest traffic pages
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { page: '/author-platform-guide', views: '2.1K', bounce: '32%', duration: '4:25' },
                          { page: '/book-marketing-tips', views: '1.8K', bounce: '28%', duration: '3:47' },
                          { page: '/writer-portfolio-examples', views: '1.5K', bounce: '41%', duration: '2:56' },
                          { page: '/publishing-checklist', views: '1.2K', bounce: '35%', duration: '3:12' },
                          { page: '/author-bio-template', views: '980', bounce: '29%', duration: '2:38' }
                        ].map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{item.page}</div>
                              <div className="text-xs text-muted-foreground">
                                {item.views} views • {item.bounce} bounce • {item.duration} avg time
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* SEO Issues & Opportunities */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      SEO Issues & Opportunities
                    </CardTitle>
                    <CardDescription>
                      Critical issues and improvement opportunities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-3 text-red-600">Critical Issues</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 p-3 border border-red-200 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            <div>
                              <div className="font-medium text-sm">Slow Page Speed</div>
                              <div className="text-xs text-muted-foreground">5 pages loading &gt; 3 seconds</div>
                            </div>
                            <Button variant="outline" size="sm">Fix</Button>
                          </div>
                          <div className="flex items-center gap-3 p-3 border border-red-200 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            <div>
                              <div className="font-medium text-sm">Missing Alt Text</div>
                              <div className="text-xs text-muted-foreground">12 images without descriptions</div>
                            </div>
                            <Button variant="outline" size="sm">Fix</Button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-3 text-yellow-600">Opportunities</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 p-3 border border-yellow-200 rounded-lg">
                            <Lightbulb className="h-5 w-5 text-yellow-500" />
                            <div>
                              <div className="font-medium text-sm">Internal Linking</div>
                              <div className="text-xs text-muted-foreground">Add 8 more internal links</div>
                            </div>
                            <Button variant="outline" size="sm">Add</Button>
                          </div>
                          <div className="flex items-center gap-3 p-3 border border-yellow-200 rounded-lg">
                            <Lightbulb className="h-5 w-5 text-yellow-500" />
                            <div>
                              <div className="font-medium text-sm">Featured Snippets</div>
                              <div className="text-xs text-muted-foreground">3 opportunities identified</div>
                            </div>
                            <Button variant="outline" size="sm">Optimize</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="social" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Open Graph Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5" />
                        Open Graph Settings
                      </CardTitle>
                      <CardDescription>
                        Control how your content appears when shared on social media
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="og-title">Open Graph Title</Label>
                        <Input
                          id="og-title"
                          placeholder="Custom title for social sharing"
                          value={seoSettings.ogTitle || ''}
                          onChange={(e) => setSeoSettings(prev => ({ ...prev, ogTitle: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="og-description">Open Graph Description</Label>
                        <Textarea
                          id="og-description"
                          placeholder="Description that appears in social media previews"
                          rows={3}
                          value={seoSettings.ogDescription || ''}
                          onChange={(e) => setSeoSettings(prev => ({ ...prev, ogDescription: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="og-image">Open Graph Image URL</Label>
                        <div className="flex gap-2">
                          <Input
                            id="og-image"
                            placeholder="https://example.com/image.jpg"
                            value={seoSettings.ogImage || ''}
                            onChange={(e) => setSeoSettings(prev => ({ ...prev, ogImage: e.target.value }))}
                            className="flex-1"
                          />
                          <Button variant="outline" size="sm">
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Recommended size: 1200x630px for best results
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="og-type">Content Type</Label>
                        <Select value={seoSettings.ogType || 'website'} onValueChange={(value) => setSeoSettings(prev => ({ ...prev, ogType: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="website">Website</SelectItem>
                            <SelectItem value="article">Article</SelectItem>
                            <SelectItem value="book">Book</SelectItem>
                            <SelectItem value="profile">Profile</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="music">Music</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Twitter Card Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5" />
                        Twitter Card Settings
                      </CardTitle>
                      <CardDescription>
                        Optimize your content for Twitter sharing
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="twitter-card">Card Type</Label>
                        <Select value={seoSettings.twitterCard || 'summary_large_image'} onValueChange={(value) => setSeoSettings(prev => ({ ...prev, twitterCard: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="summary">Summary</SelectItem>
                            <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
                            <SelectItem value="app">App</SelectItem>
                            <SelectItem value="player">Player</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="twitter-site">Twitter Site Handle</Label>
                        <Input
                          id="twitter-site"
                          placeholder="@yourusername"
                          value={seoSettings.twitterSite || ''}
                          onChange={(e) => setSeoSettings(prev => ({ ...prev, twitterSite: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="twitter-creator">Twitter Creator Handle</Label>
                        <Input
                          id="twitter-creator"
                          placeholder="@authorname"
                          value={seoSettings.twitterCreator || ''}
                          onChange={(e) => setSeoSettings(prev => ({ ...prev, twitterCreator: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="twitter-image">Twitter Image URL</Label>
                        <div className="flex gap-2">
                          <Input
                            id="twitter-image"
                            placeholder="https://example.com/twitter-image.jpg"
                            value={seoSettings.twitterImage || ''}
                            onChange={(e) => setSeoSettings(prev => ({ ...prev, twitterImage: e.target.value }))}
                            className="flex-1"
                          />
                          <Button variant="outline" size="sm">
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Recommended size: 1200x600px for large image cards
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Social Media Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Social Media Preview
                    </CardTitle>
                    <CardDescription>
                      See how your content will appear when shared
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Facebook Preview */}
                      <div>
                        <h4 className="font-medium mb-3">Facebook Preview</h4>
                        <div className="border rounded-lg overflow-hidden">
                          <div className="aspect-video bg-muted flex items-center justify-center">
                            {seoSettings.ogImage ? (
                              <img src={seoSettings.ogImage} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="h-12 w-12 text-muted-foreground" />
                            )}
                          </div>
                          <div className="p-3 bg-background">
                            <div className="text-xs text-muted-foreground mb-1">yourdomain.com</div>
                            <div className="font-medium text-sm line-clamp-2">
                              {seoSettings.ogTitle || seoSettings.siteTitle || 'Your Website Title'}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {seoSettings.ogDescription || seoSettings.siteDescription || 'Your website description'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Twitter Preview */}
                      <div>
                        <h4 className="font-medium mb-3">Twitter Preview</h4>
                        <div className="border rounded-xl overflow-hidden">
                          <div className="aspect-video bg-muted flex items-center justify-center">
                            {seoSettings.twitterImage || seoSettings.ogImage ? (
                              <img src={seoSettings.twitterImage || seoSettings.ogImage} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="h-12 w-12 text-muted-foreground" />
                            )}
                          </div>
                          <div className="p-3">
                            <div className="font-medium text-sm line-clamp-2 mb-1">
                              {seoSettings.ogTitle || seoSettings.siteTitle || 'Your Website Title'}
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {seoSettings.ogDescription || seoSettings.siteDescription || 'Your website description'}
                            </div>
                            <div className="text-xs text-muted-foreground">yourdomain.com</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Social Sharing Tools */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Share2 className="h-5 w-5" />
                      Social Sharing Tools
                    </CardTitle>
                    <CardDescription>
                      Tools to test and optimize your social media presence
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg text-center">
                        <Globe className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                        <h4 className="font-medium mb-2">Facebook Debugger</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Test how your URLs will appear on Facebook
                        </p>
                        <Button variant="outline" size="sm" className="w-full">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Test on Facebook
                        </Button>
                      </div>

                      <div className="p-4 border rounded-lg text-center">
                        <Share2 className="h-8 w-8 text-blue-400 mx-auto mb-3" />
                        <h4 className="font-medium mb-2">Twitter Card Validator</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Validate your Twitter Card markup
                        </p>
                        <Button variant="outline" size="sm" className="w-full">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Test on Twitter
                        </Button>
                      </div>

                      <div className="p-4 border rounded-lg text-center">
                        <Share2 className="h-8 w-8 text-blue-700 mx-auto mb-3" />
                        <h4 className="font-medium mb-2">LinkedIn Post Inspector</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Check how posts appear on LinkedIn
                        </p>
                        <Button variant="outline" size="sm" className="w-full">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Test on LinkedIn
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Core Web Vitals */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Gauge className="h-5 w-5" />
                        Core Web Vitals
                      </CardTitle>
                      <CardDescription>
                        Monitor Google's Core Web Vitals metrics
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">Largest Contentful Paint (LCP)</div>
                            <div className="text-sm text-muted-foreground">Loading performance</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-green-600">1.2s</div>
                            <Badge variant="default" className="text-xs">Good</Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">First Input Delay (FID)</div>
                            <div className="text-sm text-muted-foreground">Interactivity</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-green-600">85ms</div>
                            <Badge variant="default" className="text-xs">Good</Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">Cumulative Layout Shift (CLS)</div>
                            <div className="text-sm text-muted-foreground">Visual stability</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-yellow-600">0.15</div>
                            <Badge variant="secondary" className="text-xs">Needs Improvement</Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">Time to First Byte (TTFB)</div>
                            <div className="text-sm text-muted-foreground">Server response</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-green-600">450ms</div>
                            <Badge variant="default" className="text-xs">Good</Badge>
                          </div>
                        </div>
                      </div>

                      <Button className="w-full">
                        <Activity className="h-4 w-4 mr-2" />
                        Run Performance Test
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Page Speed Insights */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Timer className="h-5 w-5" />
                        Page Speed Analysis
                      </CardTitle>
                      <CardDescription>
                        Detailed performance breakdown
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Performance Score</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-muted rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: '84%' }} />
                            </div>
                            <span className="text-sm font-semibold">84/100</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Accessibility</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-muted rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }} />
                            </div>
                            <span className="text-sm font-semibold">92/100</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Best Practices</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-muted rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: '88%' }} />
                            </div>
                            <span className="text-sm font-semibold">88/100</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">SEO</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-muted rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }} />
                            </div>
                            <span className="text-sm font-semibold">95/100</span>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label>Performance Metrics</Label>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span>First Contentful Paint</span>
                            <span className="text-green-600">0.8s</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Speed Index</span>
                            <span className="text-green-600">1.1s</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Time to Interactive</span>
                            <span className="text-yellow-600">2.3s</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Blocking Time</span>
                            <span className="text-green-600">150ms</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Performance Optimization */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Performance Optimization
                    </CardTitle>
                    <CardDescription>
                      Improve your site's loading speed and user experience
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <ImageIcon className="h-6 w-6 text-blue-600" />
                          <div>
                            <div className="font-medium">Image Optimization</div>
                            <div className="text-sm text-muted-foreground">Compress and optimize images</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Switch defaultChecked />
                            <span className="text-sm">Auto-compress images</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <Switch defaultChecked />
                            <span className="text-sm">WebP conversion</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <Switch />
                            <span className="text-sm">Lazy loading</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <Cpu className="h-6 w-6 text-green-600" />
                          <div>
                            <div className="font-medium">Code Optimization</div>
                            <div className="text-sm text-muted-foreground">Minify and compress code</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Switch defaultChecked />
                            <span className="text-sm">Minify CSS/JS</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <Switch defaultChecked />
                            <span className="text-sm">Remove unused CSS</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <Switch />
                            <span className="text-sm">Tree shaking</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <HardDrive className="h-6 w-6 text-purple-600" />
                          <div>
                            <div className="font-medium">Caching</div>
                            <div className="text-sm text-muted-foreground">Browser and server caching</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Switch defaultChecked />
                            <span className="text-sm">Browser caching</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <Switch defaultChecked />
                            <span className="text-sm">CDN caching</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <Switch />
                            <span className="text-sm">Service worker</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Mobile Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mobile className="h-5 w-5" />
                      Mobile Performance
                    </CardTitle>
                    <CardDescription>
                      Optimize for mobile devices and Core Web Vitals
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">Mobile Metrics</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="text-sm font-medium">Mobile Performance Score</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">76/100</Badge>
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="text-sm font-medium">Mobile LCP</span>
                            <span className="text-sm text-yellow-600">2.1s</span>
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="text-sm font-medium">Mobile CLS</span>
                            <span className="text-sm text-red-600">0.25</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-3">Mobile Optimization</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium text-sm">Viewport Configuration</div>
                              <div className="text-xs text-muted-foreground">Proper mobile viewport setup</div>
                            </div>
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium text-sm">Touch Target Sizing</div>
                              <div className="text-xs text-muted-foreground">Buttons and links sizing</div>
                            </div>
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium text-sm">Text Readability</div>
                              <div className="text-xs text-muted-foreground">Font size and contrast</div>
                            </div>
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="technical" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Robots.txt Editor */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Robots.txt Editor
                      </CardTitle>
                      <CardDescription>
                        Control how search engines crawl your website
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="robots-content">Robots.txt Content</Label>
                        <Textarea
                          id="robots-content"
                          className="font-mono text-sm"
                          rows={8}
                          defaultValue={`User-agent: *
Allow: /

# Disallow admin pages
Disallow: /admin/
Disallow: /api/

# Allow important pages
Allow: /api/sitemap.xml

# Sitemap location
Sitemap: https://yourdomain.com/sitemap.xml`}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button className="flex-1">
                          <Save className="h-4 w-4 mr-2" />
                          Save Robots.txt
                        </Button>
                        <Button variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>

                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="text-sm font-medium mb-2">Quick Templates</div>
                        <div className="space-y-1">
                          <Button variant="ghost" size="sm" className="w-full justify-start">
                            Allow All Search Engines
                          </Button>
                          <Button variant="ghost" size="sm" className="w-full justify-start">
                            Block All Search Engines
                          </Button>
                          <Button variant="ghost" size="sm" className="w-full justify-start">
                            Block Specific Directories
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* XML Sitemap Manager */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        XML Sitemap Manager
                      </CardTitle>
                      <CardDescription>
                        Generate and manage your XML sitemaps
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium text-sm">Main Sitemap</div>
                            <div className="text-xs text-muted-foreground">sitemap.xml • 45 URLs</div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium text-sm">Blog Sitemap</div>
                            <div className="text-xs text-muted-foreground">blog-sitemap.xml • 23 URLs</div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium text-sm">Images Sitemap</div>
                            <div className="text-xs text-muted-foreground">images-sitemap.xml • 156 URLs</div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Button className="w-full">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Regenerate All Sitemaps
                        </Button>
                        <Button variant="outline" className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Custom Sitemap
                        </Button>
                      </div>

                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="text-sm font-medium mb-2">Sitemap Settings</div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs">Auto-generate on content update</span>
                            <Switch defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs">Include images in sitemap</span>
                            <Switch defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs">Include last modified dates</span>
                            <Switch defaultChecked />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Technical SEO Audit */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Technical SEO Audit
                    </CardTitle>
                    <CardDescription>
                      Comprehensive technical SEO analysis and recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3 text-green-600">Passed Checks</h4>
                        <div className="space-y-2">
                          {[
                            'HTTPS enabled',
                            'XML sitemap present',
                            'Robots.txt configured',
                            'Meta viewport tag',
                            'Canonical URLs',
                            'Mobile-friendly design',
                            'Fast loading speed',
                            'Structured data present'
                          ].map((check, index) => (
                            <div key={index} className="flex items-center gap-3 p-2 border border-green-200 rounded-lg">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">{check}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-3 text-red-600">Issues Found</h4>
                        <div className="space-y-2">
                          {[
                            'Duplicate title tags (3 pages)',
                            'Missing H1 tags (2 pages)',
                            'Large image files (5 images)',
                            'Mixed content warnings'
                          ].map((issue, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border border-red-200 rounded-lg">
                              <div className="flex items-center gap-3">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <span className="text-sm">{issue}</span>
                              </div>
                              <Button variant="outline" size="sm">Fix</Button>
                            </div>
                          ))}
                        </div>

                        <h4 className="font-medium mb-3 mt-6 text-yellow-600">Warnings</h4>
                        <div className="space-y-2">
                          {[
                            'Long meta descriptions (4 pages)',
                            'Missing alt text (2 images)'
                          ].map((warning, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border border-yellow-200 rounded-lg">
                              <div className="flex items-center gap-3">
                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm">{warning}</span>
                              </div>
                              <Button variant="outline" size="sm">Review</Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-2">
                      <Button className="flex-1">
                        <Activity className="h-4 w-4 mr-2" />
                        Run Full Audit
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Advanced Technical Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Advanced Technical Settings
                    </CardTitle>
                    <CardDescription>
                      Advanced configurations for technical SEO
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="canonical-domain">Preferred Domain</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select preferred domain" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="www">www.yourdomain.com</SelectItem>
                              <SelectItem value="non-www">yourdomain.com</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="crawl-delay">Crawl Delay (seconds)</Label>
                          <Input
                            id="crawl-delay"
                            type="number"
                            placeholder="10"
                            min="0"
                            max="300"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Delay between crawler requests (0 = no delay)
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>Redirect Settings</Label>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Force HTTPS redirects</span>
                              <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Trailing slash redirects</span>
                              <Switch />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">WWW/non-WWW redirects</span>
                              <Switch defaultChecked />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="hreflang">Hreflang Configuration</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select language setup" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single">Single Language</SelectItem>
                              <SelectItem value="multi">Multi-Language</SelectItem>
                              <SelectItem value="regional">Regional Targeting</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="pagination">Pagination Handling</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select pagination type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="rel-next-prev">Rel Next/Prev</SelectItem>
                              <SelectItem value="canonical">Canonical to View All</SelectItem>
                              <SelectItem value="noindex">NoIndex Follow</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Security Headers</Label>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">X-Robots-Tag header</span>
                              <Switch />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">X-Content-Type-Options</span>
                              <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Referrer-Policy header</span>
                              <Switch defaultChecked />
                            </div>
                          </div>
                        </div>
                      </div>
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