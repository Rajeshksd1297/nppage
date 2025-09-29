import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Menu, 
  User, 
  Moon, 
  Sun, 
  Search, 
  Home, 
  Phone, 
  Mail, 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube,
  Save,
  Plus,
  Trash2,
  Edit,
  Link,
  Image,
  Globe
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

interface AdditionalPage {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  show_in_footer: boolean;
}

const HeaderFooterEditor = () => {
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [additionalPages, setAdditionalPages] = useState<AdditionalPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch site settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('site_settings')
        .select('*')
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;
      if (settingsData) setSiteSettings(settingsData);

      // Fetch additional pages for footer links
      const { data: pagesData, error: pagesError } = await supabase
        .from('additional_pages')
        .select('id, title, slug, is_published, show_in_footer')
        .eq('is_published', true)
        .eq('show_in_footer', true);

      if (pagesError) throw pagesError;
      if (pagesData) setAdditionalPages(pagesData);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load header/footer settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: Partial<SiteSettings>) => {
    try {
      setSaving(true);
      
      if (siteSettings?.id) {
        const { error } = await supabase
          .from('site_settings')
          .update({
            ...newSettings,
            updated_at: new Date().toISOString()
          })
          .eq('id', siteSettings.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert([{
            ...newSettings,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
        
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Header/Footer settings saved successfully",
      });

      fetchData();
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

  const updateHeaderConfig = (key: string, value: any) => {
    if (!siteSettings) return;
    
    const newHeaderConfig = {
      ...siteSettings.header_config,
      [key]: value
    };
    
    setSiteSettings(prev => prev ? {
      ...prev,
      header_config: newHeaderConfig
    } : null);
  };

  const updateFooterConfig = (key: string, value: any) => {
    if (!siteSettings) return;
    
    const newFooterConfig = {
      ...siteSettings.footer_config,
      [key]: value
    };
    
    setSiteSettings(prev => prev ? {
      ...prev,
      footer_config: newFooterConfig
    } : null);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading header/footer settings...</div>;
  }

  const headerConfig = siteSettings?.header_config || {};
  const footerConfig = siteSettings?.footer_config || {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Header & Footer Settings</h2>
        <p className="text-muted-foreground">Configure your site's header and footer appearance</p>
      </div>

      <Tabs defaultValue="header" className="w-full">
        <TabsList>
          <TabsTrigger value="header">Header</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
        </TabsList>

        <TabsContent value="header" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Menu className="h-5 w-5" />
                Header Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Logo & Branding</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="logo_url">Logo URL</Label>
                    <Input
                      id="logo_url"
                      value={siteSettings?.logo_url || ''}
                      onChange={(e) => setSiteSettings(prev => prev ? { ...prev, logo_url: e.target.value } : null)}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site_title">Site Title</Label>
                    <Input
                      id="site_title"
                      value={siteSettings?.site_title || ''}
                      onChange={(e) => setSiteSettings(prev => prev ? { ...prev, site_title: e.target.value } : null)}
                      placeholder="Your Site Title"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="show_logo"
                    checked={headerConfig.showLogo !== false}
                    onCheckedChange={(checked) => updateHeaderConfig('showLogo', checked)}
                  />
                  <Label htmlFor="show_logo">Show Logo</Label>
                </div>
              </div>

              <Separator />

              {/* Navigation Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Navigation Elements</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show_login"
                      checked={headerConfig.showLogin !== false}
                      onCheckedChange={(checked) => updateHeaderConfig('showLogin', checked)}
                    />
                    <Label htmlFor="show_login" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Login Button
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show_dark_mode"
                      checked={headerConfig.showDarkMode !== false}
                      onCheckedChange={(checked) => updateHeaderConfig('showDarkMode', checked)}
                    />
                    <Label htmlFor="show_dark_mode" className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Dark Mode Toggle
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show_search"
                      checked={headerConfig.showSearch === true}
                      onCheckedChange={(checked) => updateHeaderConfig('showSearch', checked)}
                    />
                    <Label htmlFor="show_search" className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Search Bar
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sticky_header"
                      checked={headerConfig.stickyHeader !== false}
                      onCheckedChange={(checked) => updateHeaderConfig('stickyHeader', checked)}
                    />
                    <Label htmlFor="sticky_header">Sticky Header</Label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Header Style */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Header Style</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Header Layout</Label>
                    <Select
                      value={headerConfig.layout || 'center'}
                      onValueChange={(value) => updateHeaderConfig('layout', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left Aligned</SelectItem>
                        <SelectItem value="center">Center Aligned</SelectItem>
                        <SelectItem value="split">Split (Logo Left, Nav Right)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Header Background</Label>
                    <Select
                      value={headerConfig.background || 'default'}
                      onValueChange={(value) => updateHeaderConfig('background', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="transparent">Transparent</SelectItem>
                        <SelectItem value="blur">Blur</SelectItem>
                        <SelectItem value="solid">Solid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="footer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Footer Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Footer Content */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Footer Content</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="copyright">Copyright Text</Label>
                    <Input
                      id="copyright"
                      value={footerConfig.copyright || ''}
                      onChange={(e) => updateFooterConfig('copyright', e.target.value)}
                      placeholder="© 2024 Your Company. All rights reserved."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="custom_text">Custom Footer Text</Label>
                    <Textarea
                      id="custom_text"
                      value={footerConfig.customText || ''}
                      onChange={(e) => updateFooterConfig('customText', e.target.value)}
                      placeholder="Additional footer text or description"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Footer Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Footer Links</h3>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show_pages"
                    checked={footerConfig.showPages !== false}
                    onCheckedChange={(checked) => updateFooterConfig('showPages', checked)}
                  />
                  <Label htmlFor="show_pages">Show Additional Pages Links</Label>
                </div>

                {footerConfig.showPages !== false && (
                  <div className="space-y-2">
                    <Label>Available Pages for Footer</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {additionalPages.map((page) => (
                        <Badge key={page.id} variant="outline" className="justify-between">
                          {page.title}
                          <Link className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                    {additionalPages.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No additional pages available. Create some in the "Additional Pages" tab.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Social Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Social Media</h3>
                <div className="flex items-center space-x-2 mb-4">
                  <Switch
                    id="show_social"
                    checked={footerConfig.showSocial !== false}
                    onCheckedChange={(checked) => updateFooterConfig('showSocial', checked)}
                  />
                  <Label htmlFor="show_social">Show Social Media Links</Label>
                </div>

                {footerConfig.showSocial !== false && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'facebook', icon: Facebook, label: 'Facebook' },
                      { key: 'twitter', icon: Twitter, label: 'Twitter' },
                      { key: 'instagram', icon: Instagram, label: 'Instagram' },
                      { key: 'youtube', icon: Youtube, label: 'YouTube' },
                    ].map(({ key, icon: Icon, label }) => (
                      <div key={key} className="space-y-2">
                        <Label htmlFor={key} className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {label} URL
                        </Label>
                        <Input
                          id={key}
                          value={footerConfig.socialLinks?.[key] || ''}
                          onChange={(e) => updateFooterConfig('socialLinks', {
                            ...footerConfig.socialLinks,
                            [key]: e.target.value
                          })}
                          placeholder={`https://${key}.com/yourprofile`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Footer Layout */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Footer Layout</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Footer Style</Label>
                    <Select
                      value={footerConfig.style || 'simple'}
                      onValueChange={(value) => updateFooterConfig('style', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Simple</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Footer Background</Label>
                    <Select
                      value={footerConfig.background || 'dark'}
                      onValueChange={(value) => updateFooterConfig('background', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="accent">Accent Color</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={() => saveSettings(siteSettings || {})} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};

export default HeaderFooterEditor;