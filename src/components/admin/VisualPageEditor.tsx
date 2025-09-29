import { useState, useEffect, useRef } from 'react';
import SectionRenderer from './SectionRenderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Edit,
  Eye,
  EyeOff,
  Save,
  Plus,
  Trash2,
  GripVertical,
  Settings,
  Monitor,
  Tablet,
  Smartphone,
  Layers,
  Navigation,
  Star,
  Layout,
  BarChart3,
  Users,
  Type,
  Zap,
  MousePointer,
  Box,
  ArrowUp,
  ArrowDown
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
  config: any;
}

interface VisualPageEditorProps {
  onBack?: () => void;
}

const VisualPageEditor = ({ onBack }: VisualPageEditorProps) => {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);

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

  const updateSection = async (updatedSection: HomeSection) => {
    try {
      setSaving(true);
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
      
      toast({
        title: "Success",
        description: "Section updated successfully",
      });
    } catch (error) {
      console.error('Error updating section:', error);
      toast({
        title: "Error",
        description: "Failed to update section",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = async (id: string) => {
    const section = sections.find(s => s.id === id);
    if (!section) return;

    const updatedSection = { ...section, enabled: !section.enabled };
    await updateSection(updatedSection);
  };

  const moveSection = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = sections.findIndex(s => s.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const newSections = [...sections];
    [newSections[currentIndex], newSections[newIndex]] = [newSections[newIndex], newSections[currentIndex]];
    
    // Update order_index for both sections
    newSections[currentIndex].order_index = currentIndex + 1;
    newSections[newIndex].order_index = newIndex + 1;

    setSections(newSections);

    // Save to database
    try {
      await Promise.all([
        supabase.from('home_page_sections').update({ order_index: currentIndex + 1 }).eq('id', newSections[currentIndex].id),
        supabase.from('home_page_sections').update({ order_index: newIndex + 1 }).eq('id', newSections[newIndex].id)
      ]);
    } catch (error) {
      console.error('Error updating section order:', error);
    }
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
      case 'header': return <Navigation className="h-4 w-4" />;
      case 'footer': return <Box className="h-4 w-4" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  const getPreviewWidth = () => {
    switch (previewMode) {
      case 'mobile': return 'w-[375px]';
      case 'tablet': return 'w-[768px]';
      default: return 'w-full';
    }
  };

  const renderSectionPreview = (section: HomeSection) => {
    const isHovered = hoveredSection === section.id;
    const isEditing = editingSection?.id === section.id;
    
    return (
      <div
        key={section.id}
        className={`relative group transition-all duration-200 ${
          isEditing ? 'ring-2 ring-primary ring-offset-2' : 
          isHovered ? 'ring-2 ring-primary/50 ring-offset-1' : ''
        } ${!section.enabled ? 'opacity-50' : ''}`}
        onMouseEnter={() => setHoveredSection(section.id)}
        onMouseLeave={() => setHoveredSection(null)}
      >
        {/* Actual Section Content */}
        <SectionRenderer 
          type={section.type} 
          config={section.config}
          className="min-h-[100px]"
        />

        {/* Overlay Controls */}
        {(isHovered || isEditing) && (
          <div className="absolute inset-0 bg-primary/5 pointer-events-none">
            <div className="absolute top-4 right-4 flex space-x-2 pointer-events-auto">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => moveSection(section.id, 'up')}
                disabled={sections.findIndex(s => s.id === section.id) === 0}
                className="h-8 w-8 p-0 shadow-md"
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => moveSection(section.id, 'down')}
                disabled={sections.findIndex(s => s.id === section.id) === sections.length - 1}
                className="h-8 w-8 p-0 shadow-md"
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => toggleSection(section.id)}
                className="h-8 w-8 p-0 shadow-md"
              >
                {section.enabled ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setEditingSection(section)}
                className="h-8 w-8 p-0 shadow-md"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="absolute top-4 left-4 pointer-events-auto">
              <Badge variant="secondary" className="text-xs shadow-md">
                {section.type} • {section.title}
              </Badge>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderEditPanel = () => {
    if (!editingSection) return null;

    return (
      <div className="w-80 border-l bg-background p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Edit Section</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingSection(null)}
          >
            Close
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="section-title">Section Title</Label>
            <Input
              id="section-title"
              value={editingSection.title || ''}
              onChange={(e) => setEditingSection({
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
              onChange={(e) => setEditingSection({
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
              onChange={(e) => setEditingSection({
                ...editingSection,
                config: { ...editingSection.config, subtitle: e.target.value }
              })}
            />
          </div>

          <div>
            <Label htmlFor="background-color">Background</Label>
            <Select
              value={editingSection.config.backgroundColor || 'background'}
              onValueChange={(value) => setEditingSection({
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
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={editingSection.enabled}
              onCheckedChange={(checked) => setEditingSection({
                ...editingSection,
                enabled: checked
              })}
            />
            <Label>Section Enabled</Label>
          </div>

          <Button
            onClick={() => updateSection(editingSection)}
            disabled={saving}
            className="w-full"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-2" />
          <p className="text-muted-foreground">Loading visual editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">Visual Page Editor</h1>
          <Badge variant="outline">{sections.length} sections</Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={previewMode === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('desktop')}
              className="h-8 w-8 p-0"
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={previewMode === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('tablet')}
              className="h-8 w-8 p-0"
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              variant={previewMode === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('mobile')}
              className="h-8 w-8 p-0"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Preview Area */}
        <div className="flex-1 overflow-auto bg-muted/20">
          <div className="p-6">
            <div className={`mx-auto transition-all duration-300 ${getPreviewWidth()}`}>
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {sections.length > 0 ? (
                  <div className="space-y-1">
                    {sections
                      .filter(section => section.enabled)
                      .map((section) => renderSectionPreview(section))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Layout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No sections found</h3>
                    <p className="text-muted-foreground">Add sections to start building your page</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Panel */}
        {editingSection && renderEditPanel()}
      </div>
    </div>
  );
};

export default VisualPageEditor;