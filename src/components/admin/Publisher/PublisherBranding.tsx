import { useState, useEffect } from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Palette, RefreshCw, Save, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Publisher {
  id: string;
  name: string;
}

interface BrandingConfig {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url: string;
  favicon_url: string;
  custom_css: string;
  font_family: string;
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

export default function PublisherBranding() {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [selectedPublisher, setSelectedPublisher] = useState<string>('');
  const [branding, setBranding] = useState<BrandingConfig>({
    primary_color: '#3b82f6',
    secondary_color: '#6366f1',
    accent_color: '#8b5cf6',
    logo_url: '',
    favicon_url: '',
    custom_css: '',
    font_family: 'inter',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPublishers();
  }, []);

  useEffect(() => {
    if (selectedPublisher) {
      fetchBranding();
    }
  }, [selectedPublisher]);

  const fetchPublishers = async () => {
    try {
      const { data, error } = await supabase
        .from('publishers')
        .select('id, name')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setPublishers(data || []);
    } catch (error: any) {
      console.error('Error fetching publishers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load publishers',
        variant: 'destructive',
      });
    }
  };

  const fetchBranding = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('publishers')
        .select('branding_config')
        .eq('id', selectedPublisher)
        .single();

      if (error) throw error;
      
      if (data?.branding_config) {
        setBranding({ ...branding, ...data.branding_config });
      }
    } catch (error: any) {
      console.error('Error fetching branding:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPublisher) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('publishers')
        .update({ branding_config: branding })
        .eq('id', selectedPublisher);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Branding settings updated successfully',
      });
    } catch (error: any) {
      console.error('Error saving branding:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update branding',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleColorChange = (field: keyof BrandingConfig, value: string) => {
    setBranding(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Publisher Branding
            </CardTitle>
            <CardDescription>
              Customize publisher branding including logos, colors, and themes
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Publisher Selection */}
        <div>
          <Label>Select Publisher</Label>
          <Select value={selectedPublisher} onValueChange={setSelectedPublisher}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Choose a publisher to customize" />
            </SelectTrigger>
            <SelectContent>
              {publishers.map((pub) => (
                <SelectItem key={pub.id} value={pub.id}>
                  {pub.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Branding Settings */}
        {selectedPublisher && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Color Scheme */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Color Scheme</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="primary_color">Primary Color</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="primary_color"
                          type="color"
                          value={branding.primary_color}
                          onChange={(e) => handleColorChange('primary_color', e.target.value)}
                          className="h-10 w-20 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={branding.primary_color}
                          onChange={(e) => handleColorChange('primary_color', e.target.value)}
                          placeholder="#3b82f6"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="secondary_color">Secondary Color</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="secondary_color"
                          type="color"
                          value={branding.secondary_color}
                          onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                          className="h-10 w-20 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={branding.secondary_color}
                          onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                          placeholder="#6366f1"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="accent_color">Accent Color</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="accent_color"
                          type="color"
                          value={branding.accent_color}
                          onChange={(e) => handleColorChange('accent_color', e.target.value)}
                          className="h-10 w-20 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={branding.accent_color}
                          onChange={(e) => handleColorChange('accent_color', e.target.value)}
                          placeholder="#8b5cf6"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Typography */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Typography</h3>
                  <div>
                    <Label htmlFor="font_family">Font Family</Label>
                    <Select
                      value={branding.font_family}
                      onValueChange={(value) => handleColorChange('font_family', value)}
                    >
                      <SelectTrigger className="mt-2">
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

                {/* Logos */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Logos & Icons</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="logo_url">Logo URL</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="logo_url"
                          type="url"
                          value={branding.logo_url}
                          onChange={(e) => handleColorChange('logo_url', e.target.value)}
                          placeholder="https://example.com/logo.png"
                        />
                        <Button variant="outline" size="icon">
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="favicon_url">Favicon URL</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="favicon_url"
                          type="url"
                          value={branding.favicon_url}
                          onChange={(e) => handleColorChange('favicon_url', e.target.value)}
                          placeholder="https://example.com/favicon.ico"
                        />
                        <Button variant="outline" size="icon">
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Custom CSS */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Custom CSS</h3>
                  <div>
                    <Label htmlFor="custom_css">Additional Styling</Label>
                    <Textarea
                      id="custom_css"
                      value={branding.custom_css}
                      onChange={(e) => handleColorChange('custom_css', e.target.value)}
                      placeholder=".custom-class { color: red; }"
                      className="mt-2 font-mono text-sm"
                      rows={6}
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="space-y-4 p-6 border rounded-lg" style={{
                  backgroundColor: `${branding.primary_color}10`,
                  borderColor: branding.primary_color,
                }}>
                  <h3 className="text-lg font-semibold">Preview</h3>
                  <div className="space-y-3">
                    <Button style={{ backgroundColor: branding.primary_color }}>
                      Primary Button
                    </Button>
                    <Button variant="outline" style={{ borderColor: branding.secondary_color, color: branding.secondary_color }}>
                      Secondary Button
                    </Button>
                    <div style={{ color: branding.accent_color, fontFamily: branding.font_family }}>
                      Sample text in {FONT_OPTIONS.find(f => f.value === branding.font_family)?.label}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Branding'}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {!selectedPublisher && (
          <div className="text-center py-12 text-muted-foreground">
            Select a publisher to customize their branding
          </div>
        )}
      </CardContent>
    </>
  );
}
