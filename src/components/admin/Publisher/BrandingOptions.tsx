import { useState, useEffect } from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Palette, Save, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

interface BrandingOption {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: string;
}

const BRANDING_OPTIONS: BrandingOption[] = [
  {
    id: 'custom_logo',
    name: 'Custom Logo',
    description: 'Allow publishers to upload their own logo',
    enabled: true,
    category: 'visual'
  },
  {
    id: 'custom_favicon',
    name: 'Custom Favicon',
    description: 'Allow publishers to set custom favicon',
    enabled: true,
    category: 'visual'
  },
  {
    id: 'primary_color',
    name: 'Primary Color',
    description: 'Let publishers choose their primary brand color',
    enabled: true,
    category: 'colors'
  },
  {
    id: 'secondary_color',
    name: 'Secondary Color',
    description: 'Let publishers choose their secondary color',
    enabled: true,
    category: 'colors'
  },
  {
    id: 'accent_color',
    name: 'Accent Color',
    description: 'Let publishers choose an accent color',
    enabled: true,
    category: 'colors'
  },
  {
    id: 'custom_fonts',
    name: 'Custom Fonts',
    description: 'Allow publishers to select from available font families',
    enabled: true,
    category: 'typography'
  },
  {
    id: 'custom_css',
    name: 'Custom CSS',
    description: 'Advanced: Allow custom CSS styling (requires technical knowledge)',
    enabled: false,
    category: 'advanced'
  },
  {
    id: 'background_image',
    name: 'Background Image',
    description: 'Allow publishers to set custom background images',
    enabled: true,
    category: 'visual'
  },
  {
    id: 'button_styles',
    name: 'Button Styles',
    description: 'Let publishers customize button appearance',
    enabled: true,
    category: 'components'
  },
  {
    id: 'header_customization',
    name: 'Header Customization',
    description: 'Allow publishers to customize header layout and style',
    enabled: true,
    category: 'layout'
  },
  {
    id: 'footer_customization',
    name: 'Footer Customization',
    description: 'Allow publishers to customize footer content and style',
    enabled: true,
    category: 'layout'
  },
  {
    id: 'social_media_colors',
    name: 'Social Media Colors',
    description: 'Custom colors for social media links',
    enabled: false,
    category: 'components'
  },
];

const CATEGORIES = [
  { id: 'visual', name: 'Visual Elements', description: 'Logos, images, and visual assets' },
  { id: 'colors', name: 'Color Scheme', description: 'Brand color customization' },
  { id: 'typography', name: 'Typography', description: 'Font and text styling' },
  { id: 'layout', name: 'Layout & Structure', description: 'Page structure and layout options' },
  { id: 'components', name: 'UI Components', description: 'Buttons, cards, and other elements' },
  { id: 'advanced', name: 'Advanced Options', description: 'Technical customization options' },
];

export default function BrandingOptions() {
  const [options, setOptions] = useState<BrandingOption[]>(BRANDING_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBrandingSettings();
  }, []);

  const fetchBrandingSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('publisher_settings')
        .select('branding_options')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data?.branding_options) {
        const savedOptions = data.branding_options as any;
        setOptions(options.map(option => ({
          ...option,
          enabled: savedOptions[option.id] ?? option.enabled
        })));
      }
    } catch (error) {
      console.error('Error fetching branding settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (optionId: string) => {
    setOptions(options.map(opt => 
      opt.id === optionId ? { ...opt, enabled: !opt.enabled } : opt
    ));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const brandingConfig = options.reduce((acc, opt) => ({
        ...acc,
        [opt.id]: opt.enabled
      }), {});

      const { data: existing } = await supabase
        .from('publisher_settings')
        .select('id')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('publisher_settings')
          .update({ branding_options: brandingConfig })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('publisher_settings')
          .insert([{ branding_options: brandingConfig }]);
        
        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Branding options updated successfully',
      });
    } catch (error: any) {
      console.error('Error saving branding options:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save branding options',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getEnabledCount = (categoryId: string) => {
    return options.filter(opt => opt.category === categoryId && opt.enabled).length;
  };

  const getTotalCount = (categoryId: string) => {
    return options.filter(opt => opt.category === categoryId).length;
  };

  if (loading) {
    return (
      <CardContent className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </CardContent>
    );
  }

  return (
    <>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Publisher Branding Options
            </CardTitle>
            <CardDescription>
              Configure which branding options are available to all publishers
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {CATEGORIES.map((category) => {
          const categoryOptions = options.filter(opt => opt.category === category.id);
          
          return (
            <Card key={category.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{category.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {category.description}
                    </CardDescription>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getEnabledCount(category.id)}/{getTotalCount(category.id)} enabled
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {categoryOptions.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 pr-4">
                      <Label htmlFor={option.id} className="font-medium cursor-pointer text-sm">
                        {option.name}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {option.description}
                      </p>
                    </div>
                    <Switch
                      id={option.id}
                      checked={option.enabled}
                      onCheckedChange={() => handleToggle(option.id)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}

        <Separator />

        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            Publishers will only see and be able to customize enabled options
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </CardContent>
    </>
  );
}
