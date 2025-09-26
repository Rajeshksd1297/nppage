import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Globe, Search, Code, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SEOSettings {
  id: string;
  site_title: string;
  site_description: string;
  site_keywords?: string;
  robots_txt: string;
  google_analytics_id?: string;
  google_search_console_id?: string;
  facebook_pixel_id?: string;
  twitter_handle?: string;
  default_og_image?: string;
}

export default function SEOSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SEOSettings>({
    id: '',
    site_title: 'AuthorPage',
    site_description: 'Professional author profiles and book showcases',
    site_keywords: '',
    robots_txt: 'User-agent: *\nAllow: /\n\nSitemap: /sitemap.xml',
    google_analytics_id: '',
    google_search_console_id: '',
    facebook_pixel_id: '',
    twitter_handle: '',
    default_og_image: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('seo_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching SEO settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load SEO settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settings.id) {
        const { error } = await supabase
          .from('seo_settings')
          .update(settings)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('seo_settings')
          .insert([settings]);
        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'SEO settings saved successfully',
      });
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save SEO settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof SEOSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const generateSitemap = () => {
    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yoursite.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://yoursite.com/authors</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://yoursite.com/books</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;

    const blob = new Blob([sitemapContent], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SEO Settings</h1>
          <p className="text-muted-foreground">Configure global SEO and tracking settings</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="tracking" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Tracking
          </TabsTrigger>
          <TabsTrigger value="robots" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Robots.txt
          </TabsTrigger>
          <TabsTrigger value="sitemap" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Sitemap
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Site Information</CardTitle>
              <CardDescription>Basic SEO settings for your site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="site-title">Site Title</Label>
                <Input
                  id="site-title"
                  value={settings.site_title}
                  onChange={(e) => handleInputChange('site_title', e.target.value)}
                  placeholder="Your Site Title"
                />
              </div>

              <div>
                <Label htmlFor="site-description">Site Description</Label>
                <Textarea
                  id="site-description"
                  value={settings.site_description}
                  onChange={(e) => handleInputChange('site_description', e.target.value)}
                  placeholder="Brief description of your site"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="site-keywords">Site Keywords</Label>
                <Input
                  id="site-keywords"
                  value={settings.site_keywords || ''}
                  onChange={(e) => handleInputChange('site_keywords', e.target.value)}
                  placeholder="keyword1, keyword2, keyword3"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Separate keywords with commas
                </p>
              </div>

              <div>
                <Label htmlFor="twitter-handle">Twitter Handle</Label>
                <Input
                  id="twitter-handle"
                  value={settings.twitter_handle || ''}
                  onChange={(e) => handleInputChange('twitter_handle', e.target.value)}
                  placeholder="@yourhandle"
                />
              </div>

              <div>
                <Label htmlFor="og-image">Default Open Graph Image</Label>
                <Input
                  id="og-image"
                  value={settings.default_og_image || ''}
                  onChange={(e) => handleInputChange('default_og_image', e.target.value)}
                  placeholder="https://yoursite.com/og-image.jpg"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended size: 1200x630px
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics & Tracking</CardTitle>
              <CardDescription>Configure tracking codes and analytics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ga-id">Google Analytics ID</Label>
                <Input
                  id="ga-id"
                  value={settings.google_analytics_id || ''}
                  onChange={(e) => handleInputChange('google_analytics_id', e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                />
              </div>

              <div>
                <Label htmlFor="gsc-id">Google Search Console Property</Label>
                <Input
                  id="gsc-id"
                  value={settings.google_search_console_id || ''}
                  onChange={(e) => handleInputChange('google_search_console_id', e.target.value)}
                  placeholder="https://yoursite.com/"
                />
              </div>

              <div>
                <Label htmlFor="fb-pixel">Facebook Pixel ID</Label>
                <Input
                  id="fb-pixel"
                  value={settings.facebook_pixel_id || ''}
                  onChange={(e) => handleInputChange('facebook_pixel_id', e.target.value)}
                  placeholder="123456789012345"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="robots" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Robots.txt Configuration</CardTitle>
              <CardDescription>Control how search engines crawl your site</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="robots-txt">Robots.txt Content</Label>
                <Textarea
                  id="robots-txt"
                  value={settings.robots_txt}
                  onChange={(e) => handleInputChange('robots_txt', e.target.value)}
                  rows={10}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  This will be served at /robots.txt
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sitemap" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sitemap Management</CardTitle>
              <CardDescription>Generate and manage your XML sitemap</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Your sitemap will automatically include:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>All published author profiles</li>
                  <li>All published books</li>
                  <li>All published articles</li>
                  <li>Static pages</li>
                </ul>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={generateSitemap} variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Sitemap
                </Button>
                <Button variant="outline" asChild>
                  <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer">
                    View Current Sitemap
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}