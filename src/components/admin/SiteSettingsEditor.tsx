import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { 
  Save,
  Palette,
  Globe,
  Settings,
  Type,
  Layout,
  Paintbrush,
  Image,
  Upload
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SiteSettings {
  id: string;
  site_title: string;
  site_description: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color: string;
  secondary_color: string;
  enable_dark_mode: boolean;
  header_config: any;
  footer_config: any;
  created_at: string;
  updated_at: string;
}

const SiteSettingsEditor = () => {
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSiteSettings();
  }, []);

  const fetchSiteSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setSiteSettings(data);
      }
    } catch (error) {
      console.error('Error fetching site settings:', error);
      toast({
        title: "Error",
        description: "Failed to load site settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!siteSettings) return;

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('site_settings')
        .update({
          ...siteSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', siteSettings.id);
      
      if (error) throw error;

      toast({
        title: "Success",
        description: "Site settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof SiteSettings, value: any) => {
    setSiteSettings(prev => prev ? { ...prev, [key]: value } : null);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading site settings...</div>;
  }

  if (!siteSettings) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">No site settings found</h3>
        <p className="text-muted-foreground">Site settings will be created automatically.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Site Settings</h2>
        <p className="text-muted-foreground">Configure global site settings and appearance</p>
      </div>

      {/* Basic Site Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Site Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="site_title">Site Title</Label>
              <Input
                id="site_title"
                value={siteSettings.site_title}
                onChange={(e) => updateSetting('site_title', e.target.value)}
                placeholder="Your Site Title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="site_description">Site Description</Label>
              <Input
                id="site_description"
                value={siteSettings.site_description}
                onChange={(e) => updateSetting('site_description', e.target.value)}
                placeholder="Brief description of your site"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="site_description_full">Full Site Description</Label>
            <Textarea
              id="site_description_full"
              value={siteSettings.site_description}
              onChange={(e) => updateSetting('site_description', e.target.value)}
              placeholder="Detailed description for SEO and meta tags"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Brand Assets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Brand Assets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <div className="flex gap-2">
                <Input
                  id="logo_url"
                  value={siteSettings.logo_url || ''}
                  onChange={(e) => updateSetting('logo_url', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Recommended: 200x50px PNG or SVG with transparent background
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="favicon_url">Favicon URL</Label>
              <div className="flex gap-2">
                <Input
                  id="favicon_url"
                  value={siteSettings.favicon_url || ''}
                  onChange={(e) => updateSetting('favicon_url', e.target.value)}
                  placeholder="https://example.com/favicon.ico"
                />
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Recommended: 32x32px ICO or PNG file
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Scheme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Color Scheme
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary_color">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary_color"
                  type="color"
                  value={siteSettings.primary_color}
                  onChange={(e) => updateSetting('primary_color', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={siteSettings.primary_color}
                  onChange={(e) => updateSetting('primary_color', e.target.value)}
                  placeholder="#000000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary_color">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary_color"
                  type="color"
                  value={siteSettings.secondary_color}
                  onChange={(e) => updateSetting('secondary_color', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={siteSettings.secondary_color}
                  onChange={(e) => updateSetting('secondary_color', e.target.value)}
                  placeholder="#666666"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="enable_dark_mode"
                checked={siteSettings.enable_dark_mode}
                onCheckedChange={(checked) => updateSetting('enable_dark_mode', checked)}
              />
              <Label htmlFor="enable_dark_mode">Enable Dark Mode Support</Label>
            </div>

            <div className="p-4 border rounded-lg space-y-2">
              <h4 className="font-medium">Color Preview</h4>
              <div className="flex gap-4">
                <div 
                  className="w-16 h-16 rounded-lg border-2 border-gray-200"
                  style={{ backgroundColor: siteSettings.primary_color }}
                />
                <div 
                  className="w-16 h-16 rounded-lg border-2 border-gray-200"
                  style={{ backgroundColor: siteSettings.secondary_color }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Advanced Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default Font Family</Label>
              <Select defaultValue="inter">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inter">Inter</SelectItem>
                  <SelectItem value="roboto">Roboto</SelectItem>
                  <SelectItem value="open-sans">Open Sans</SelectItem>
                  <SelectItem value="lato">Lato</SelectItem>
                  <SelectItem value="playfair">Playfair Display</SelectItem>
                  <SelectItem value="merriweather">Merriweather</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Site Layout</Label>
              <Select defaultValue="full-width">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-width">Full Width</SelectItem>
                  <SelectItem value="contained">Contained</SelectItem>
                  <SelectItem value="centered">Centered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Border Radius (Global)</Label>
              <div className="px-3">
                <Slider
                  defaultValue={[8]}
                  max={24}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Controls the roundness of buttons, cards, and other elements
              </p>
            </div>

            <div className="space-y-2">
              <Label>Animation Speed</Label>
              <Select defaultValue="normal">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slow">Slow</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="fast">Fast</SelectItem>
                  <SelectItem value="none">No Animations</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Typography
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Heading Font Size</Label>
              <Select defaultValue="large">
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

            <div className="space-y-2">
              <Label>Body Font Size</Label>
              <Select defaultValue="medium">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Line Height</Label>
              <Select defaultValue="relaxed">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tight">Tight</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="relaxed">Relaxed</SelectItem>
                  <SelectItem value="loose">Loose</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  );
};

export default SiteSettingsEditor;