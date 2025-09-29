import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HeroBlockManager } from '@/components/admin/HeroBlockManager';
import { Plus, Edit, Eye, Settings, Monitor, Smartphone, Tablet, Type, Layout, Star, Palette, MousePointer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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

interface HeroSectionTabProps {
  heroBlocks: HeroBlock[];
  setHeroBlocks: (blocks: HeroBlock[]) => void;
  heroManagerView: 'list' | 'editor';
  setHeroManagerView: (view: 'list' | 'editor') => void;
  selectedHeroBlock: HeroBlock | null;
  setSelectedHeroBlock: (block: HeroBlock | null) => void;
  isCreatingHero: boolean;
  setIsCreatingHero: (creating: boolean) => void;
  heroPreviewMode: 'desktop' | 'tablet' | 'mobile';
  setHeroPreviewMode: (mode: 'desktop' | 'tablet' | 'mobile') => void;
}

export const HeroSectionTab = ({
  heroBlocks,
  setHeroBlocks,
  heroManagerView,
  setHeroManagerView,
  selectedHeroBlock,
  setSelectedHeroBlock,
  isCreatingHero,
  setIsCreatingHero,
  heroPreviewMode,
  setHeroPreviewMode
}: HeroSectionTabProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const heroTemplates = [
    {
      id: 'modern-minimal',
      name: 'Modern Minimal',
      description: 'Clean and simple hero with centered content',
      category: 'free',
      icon: Type,
      features: ['Centered Layout', 'Clean Typography', 'Single CTA'],
      preview_image_url: '',
      config: {
        layout: 'centered',
        background: 'gradient',
        animation: 'fade-in',
        responsive: true
      }
    },
    {
      id: 'split-screen',
      name: 'Split Screen Hero',
      description: 'Content on left, image on right layout',
      category: 'free',
      icon: Layout,
      features: ['Split Layout', 'Image Support', 'Dual CTA'],
      preview_image_url: '',
      config: {
        layout: 'split',
        background: 'image',
        animation: 'slide-in',
        responsive: true
      }
    },
    {
      id: 'author-showcase',
      name: 'Author Showcase',
      description: 'Perfect for author profiles with book highlights',
      category: 'free',
      icon: Star,
      features: ['Author Focus', 'Book Display', 'Social Links'],
      preview_image_url: '',
      config: {
        layout: 'author-focused',
        background: 'image',
        animation: 'fade-up',
        responsive: true,
        authorFeatures: true
      }
    },
    {
      id: 'animated-gradient',
      name: 'Animated Gradient',
      description: 'Dynamic gradient background with smooth animations',
      category: 'premium',
      icon: Palette,
      features: ['Animated Background', 'Smooth Transitions', 'Modern Design'],
      preview_image_url: '',
      config: {
        layout: 'centered',
        background: 'animated-gradient',
        animation: 'gradient-shift',
        responsive: true,
        hasAnimation: true
      }
    }
  ];

  const fetchHeroBlocks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hero_blocks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHeroBlocks(data || []);
    } catch (error) {
      console.error('Error fetching hero blocks:', error);
      toast({
        title: "Error",
        description: "Failed to load hero blocks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeroBlocks();
  }, []);

  const handleCreateHeroBlock = () => {
    setIsCreatingHero(true);
    setSelectedHeroBlock(null);
    setHeroManagerView('editor');
  };

  const handleEditHeroBlock = (block: HeroBlock) => {
    setSelectedHeroBlock(block);
    setIsCreatingHero(false);
    setHeroManagerView('editor');
  };

  const handlePreviewHeroBlock = (block: HeroBlock) => {
    // Open preview in new tab or modal
    window.open(`/preview/hero/${block.id}`, '_blank');
  };

  if (heroManagerView === 'editor') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">
              {isCreatingHero ? 'Create New Hero Block' : 'Edit Hero Block'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isCreatingHero ? 'Choose a template and customize your hero section' : 'Modify your existing hero block'}
            </p>
          </div>
          <Button variant="outline" onClick={() => setHeroManagerView('list')}>
            Back to List
          </Button>
        </div>

        <HeroBlockManager
          selectedBlock={selectedHeroBlock}
          isCreating={isCreatingHero}
          onSave={(block) => {
            fetchHeroBlocks();
            setHeroManagerView('list');
            toast({
              title: "Success",
              description: `Hero block ${isCreatingHero ? 'created' : 'updated'} successfully`
            });
          }}
          onCancel={() => setHeroManagerView('list')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Hero Section Management</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage hero sections for your home page
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Preview Mode Selector */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={heroPreviewMode === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setHeroPreviewMode('desktop')}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={heroPreviewMode === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setHeroPreviewMode('tablet')}
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              variant={heroPreviewMode === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setHeroPreviewMode('mobile')}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={handleCreateHeroBlock}>
            <Plus className="h-4 w-4 mr-2" />
            Create Hero Block
          </Button>
        </div>
      </div>

      {/* Hero Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {heroTemplates.map((template) => (
          <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <template.icon className="h-8 w-8 text-primary" />
                <Badge variant={template.category === 'premium' ? 'default' : 'secondary'}>
                  {template.category}
                </Badge>
              </div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {template.features.map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => {
                    setSelectedHeroBlock({
                      id: '',
                      name: template.name,
                      description: template.description,
                      config: template.config,
                      enabled: true,
                      created_at: '',
                      updated_at: ''
                    });
                    setIsCreatingHero(true);
                    setHeroManagerView('editor');
                  }}
                >
                  Use Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Existing Hero Blocks */}
      {heroBlocks.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-md font-medium">Your Hero Blocks</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {heroBlocks.map((block) => (
              <Card key={block.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{block.name}</CardTitle>
                    <Badge variant={block.enabled ? 'default' : 'secondary'}>
                      {block.enabled ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardDescription>{block.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditHeroBlock(block)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreviewHeroBlock(block)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
