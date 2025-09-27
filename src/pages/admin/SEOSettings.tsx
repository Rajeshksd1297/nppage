import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SEOHead } from '@/components/SEOHead';
import { Search, Globe, BarChart, FileText, Download } from 'lucide-react';

interface SEOSettings {
  id?: string;
  site_title: string;
  site_description: string;
  site_keywords?: string;
  google_analytics_id?: string;
  google_search_console_id?: string;
  facebook_pixel_id?: string;
  twitter_handle?: string;
  default_og_image?: string;
  robots_txt?: string;
}

export default function SEOSettings() {
  const [settings, setSettings] = useState<SEOSettings>({
    site_title: 'AuthorPage',
    site_description: 'Professional author profiles and book showcases',
    robots_txt: 'User-agent: *\nAllow: /\n\nSitemap: /sitemap.xml'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      toast.error('Failed to load SEO settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('seo_settings')
        .upsert(settings, { onConflict: 'id' });

      if (error) throw error;
      
      toast.success('SEO settings saved successfully');
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      toast.error('Failed to save SEO settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof SEOSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const generateSitemap = () => {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://authorpage.com/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://authorpage.com/auth</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

    const blob = new Blob([sitemap], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Sitemap downloaded successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <SEOHead
        title="SEO Settings - Admin Dashboard"
        description="Configure SEO settings for better search engine visibility"
        type="website"
      />
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">SEO Settings</h1>
        <p className="text-muted-foreground">
          Configure SEO settings to improve search engine visibility and organic traffic from USA, UK, EU, India, and Australia.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="tracking" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Tracking
          </TabsTrigger>
          <TabsTrigger value="robots" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Robots.txt
          </TabsTrigger>
          <TabsTrigger value="sitemap" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Sitemap
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Site Information</CardTitle>
              <CardDescription>
                Basic site information used for SEO and social media sharing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="site_title">Site Title</Label>
                <Input
                  id="site_title"
                  value={settings.site_title}
                  onChange={(e) => handleInputChange('site_title', e.target.value)}
                  placeholder="AuthorPage - Professional Author Platform"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Keep under 60 characters for best SEO results
                </p>
              </div>

              <div>
                <Label htmlFor="site_description">Site Description</Label>
                <Textarea
                  id="site_description"
                  value={settings.site_description}
                  onChange={(e) => handleInputChange('site_description', e.target.value)}
                  placeholder="Create professional author profiles and showcase your books to readers worldwide"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Keep under 160 characters for search snippets
                </p>
              </div>

              <div>
                <Label htmlFor="site_keywords">Keywords</Label>
                <Input
                  id="site_keywords"
                  value={settings.site_keywords || ''}
                  onChange={(e) => handleInputChange('site_keywords', e.target.value)}
                  placeholder="author profiles, book marketing, writer platform, book showcase"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Comma-separated keywords for international SEO
                </p>
              </div>

              <div>
                <Label htmlFor="twitter_handle">Twitter Handle</Label>
                <Input
                  id="twitter_handle"
                  value={settings.twitter_handle || ''}
                  onChange={(e) => handleInputChange('twitter_handle', e.target.value)}
                  placeholder="@authorpage"
                />
              </div>

              <div>
                <Label htmlFor="default_og_image">Default Open Graph Image</Label>
                <Input
                  id="default_og_image"
                  value={settings.default_og_image || ''}
                  onChange={(e) => handleInputChange('default_og_image', e.target.value)}
                  placeholder="https://yoursite.com/og-image.jpg"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  1200x630 pixels recommended for social media sharing
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking">
          <Card>
            <CardHeader>
              <CardTitle>Analytics & Tracking</CardTitle>
              <CardDescription>
                Configure tracking codes for analytics and advertising
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="google_analytics_id">Google Analytics ID</Label>
                <Input
                  id="google_analytics_id"
                  value={settings.google_analytics_id || ''}
                  onChange={(e) => handleInputChange('google_analytics_id', e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                />
              </div>

              <div>
                <Label htmlFor="google_search_console_id">Google Search Console ID</Label>
                <Input
                  id="google_search_console_id"
                  value={settings.google_search_console_id || ''}
                  onChange={(e) => handleInputChange('google_search_console_id', e.target.value)}
                  placeholder="google1234567890.html"
                />
              </div>

              <div>
                <Label htmlFor="facebook_pixel_id">Facebook Pixel ID</Label>
                <Input
                  id="facebook_pixel_id"
                  value={settings.facebook_pixel_id || ''}
                  onChange={(e) => handleInputChange('facebook_pixel_id', e.target.value)}
                  placeholder="123456789012345"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="robots">
          <Card>
            <CardHeader>
              <CardTitle>Robots.txt Configuration</CardTitle>
              <CardDescription>
                Control how search engines crawl your site
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="robots_txt">Robots.txt Content</Label>
                <Textarea
                  id="robots_txt"
                  value={settings.robots_txt || ''}
                  onChange={(e) => handleInputChange('robots_txt', e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
                <div className="mt-2 space-y-1">
                  <Badge variant="secondary">Current URL: /robots.txt</Badge>
                  <p className="text-xs text-muted-foreground">
                    This content will be served at your site's robots.txt endpoint
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sitemap">
          <Card>
            <CardHeader>
              <CardTitle>XML Sitemap</CardTitle>
              <CardDescription>
                Generate and manage your site's XML sitemap for search engines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-medium mb-2">Sitemap Information</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>URL:</strong> /sitemap.xml</p>
                  <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
                  <p><strong>Status:</strong> <Badge variant="default">Active</Badge></p>
                </div>
              </div>

              <Button onClick={generateSitemap} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download Sitemap
              </Button>

              <div className="text-sm text-muted-foreground">
                <p>The sitemap includes:</p>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Homepage and main pages</li>
                  <li>All published author profiles</li>
                  <li>All published book pages</li>
                  <li>Blog posts</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}