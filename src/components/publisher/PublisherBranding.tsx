import { useState } from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props {
  publisher: any;
  onUpdate: () => void;
}

const FONT_OPTIONS = [
  { value: 'inter', label: 'Inter' },
  { value: 'roboto', label: 'Roboto' },
  { value: 'open-sans', label: 'Open Sans' },
  { value: 'lato', label: 'Lato' },
  { value: 'montserrat', label: 'Montserrat' },
  { value: 'playfair', label: 'Playfair Display' },
  { value: 'merriweather', label: 'Merriweather' },
];

export default function PublisherBranding({ publisher, onUpdate }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const brandingConfig = publisher.branding_config || {};
  const [formData, setFormData] = useState({
    primary_color: brandingConfig.primary_color || '#3b82f6',
    secondary_color: brandingConfig.secondary_color || '#6366f1',
    accent_color: brandingConfig.accent_color || '#8b5cf6',
    logo_url: brandingConfig.logo_url || '',
    favicon_url: brandingConfig.favicon_url || '',
    font_family: brandingConfig.font_family || 'inter',
    custom_css: brandingConfig.custom_css || '',
  });

  const handleSave = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('publishers')
        .update({ branding_config: formData as any })
        .eq('id', publisher.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Branding settings updated successfully',
      });

      onUpdate();
    } catch (error: any) {
      console.error('Error saving branding:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save branding settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Publisher Branding
        </CardTitle>
        <CardDescription>
          Customize your publisher's visual identity and branding
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Colors */}
        <div className="space-y-4">
          <h3 className="font-semibold">Brand Colors</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary_color">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary_color"
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) =>
                    setFormData({ ...formData, primary_color: e.target.value })
                  }
                  className="w-20 h-10"
                />
                <Input
                  value={formData.primary_color}
                  onChange={(e) =>
                    setFormData({ ...formData, primary_color: e.target.value })
                  }
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary_color">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary_color"
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) =>
                    setFormData({ ...formData, secondary_color: e.target.value })
                  }
                  className="w-20 h-10"
                />
                <Input
                  value={formData.secondary_color}
                  onChange={(e) =>
                    setFormData({ ...formData, secondary_color: e.target.value })
                  }
                  placeholder="#6366f1"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accent_color">Accent Color</Label>
              <div className="flex gap-2">
                <Input
                  id="accent_color"
                  type="color"
                  value={formData.accent_color}
                  onChange={(e) =>
                    setFormData({ ...formData, accent_color: e.target.value })
                  }
                  className="w-20 h-10"
                />
                <Input
                  value={formData.accent_color}
                  onChange={(e) =>
                    setFormData({ ...formData, accent_color: e.target.value })
                  }
                  placeholder="#8b5cf6"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Logos */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="font-semibold">Logos & Icons</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                type="url"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
              {formData.logo_url && (
                <div className="mt-2 p-4 border rounded-lg bg-muted/50">
                  <img
                    src={formData.logo_url}
                    alt="Publisher Logo"
                    className="max-h-20 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="favicon_url">Favicon URL</Label>
              <Input
                id="favicon_url"
                type="url"
                value={formData.favicon_url}
                onChange={(e) => setFormData({ ...formData, favicon_url: e.target.value })}
                placeholder="https://example.com/favicon.ico"
              />
              {formData.favicon_url && (
                <div className="mt-2 p-4 border rounded-lg bg-muted/50">
                  <img
                    src={formData.favicon_url}
                    alt="Favicon"
                    className="h-8 w-8 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="font-semibold">Typography</h3>
          <div className="space-y-2">
            <Label htmlFor="font_family">Font Family</Label>
            <Select
              value={formData.font_family}
              onValueChange={(value) => setFormData({ ...formData, font_family: value })}
            >
              <SelectTrigger id="font_family">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Custom CSS */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="font-semibold">Advanced Customization</h3>
          <div className="space-y-2">
            <Label htmlFor="custom_css">Custom CSS</Label>
            <Textarea
              id="custom_css"
              value={formData.custom_css}
              onChange={(e) => setFormData({ ...formData, custom_css: e.target.value })}
              placeholder="/* Add custom CSS here */"
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Add custom CSS to further customize your public page appearance
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Branding'}
          </Button>
        </div>
      </CardContent>
    </>
  );
}
