import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { SEOAnalyzer } from '@/components/seo/SEOAnalyzer';
import { SchemaGenerator } from '@/components/seo/SchemaGenerator';
import AISEOAssistant from '@/components/seo/AISEOAssistant';
import { Search, Brain, CheckCircle, AlertTriangle, Lightbulb, Save, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SEOTabProps {
  seoSettings: {
    site_title: string;
    site_description: string;
    site_keywords: string;
    google_analytics_id: string;
    google_site_verification: string;
    bing_site_verification: string;
    facebook_app_id: string;
    twitter_handle: string;
    default_og_image: string;
    enable_sitemap: boolean;
    enable_robots: boolean;
    enable_schema: boolean;
  };
  setSeoSettings: (settings: any) => void;
  autoGenerating: boolean;
  setAutoGenerating: (generating: boolean) => void;
  seoValidation: {
    title: { valid: boolean; message: string };
    description: { valid: boolean; message: string };
    keywords: { valid: boolean; message: string };
  };
  setSeoValidation: (validation: any) => void;
}

export const SEOTab = ({
  seoSettings,
  setSeoSettings,
  autoGenerating,
  setAutoGenerating,
  seoValidation,
  setSeoValidation
}: SEOTabProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchSEOSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('global_seo_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSeoSettings({
          site_title: data.site_title || '',
          site_description: data.site_description || '',
          site_keywords: data.site_keywords || '',
          google_analytics_id: '', // Not stored in global_seo_settings
          google_site_verification: data.google_site_verification || '',
          bing_site_verification: data.bing_site_verification || '',
          facebook_app_id: data.facebook_app_id || '',
          twitter_handle: data.twitter_handle || '',
          default_og_image: data.default_og_image || '',
          enable_sitemap: data.enable_sitemap ?? true,
          enable_robots: data.enable_robots ?? true,
          enable_schema: data.enable_schema ?? true
        });
      }
    } catch (error) {
      console.error('Error fetching SEO settings:', error);
      toast({
        title: "Error",
        description: "Failed to load SEO settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSEOSettings = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('global_seo_settings')
        .upsert({
          site_title: seoSettings.site_title,
          site_description: seoSettings.site_description,
          site_keywords: seoSettings.site_keywords,
          google_site_verification: seoSettings.google_site_verification,
          bing_site_verification: seoSettings.bing_site_verification,
          facebook_app_id: seoSettings.facebook_app_id,
          twitter_handle: seoSettings.twitter_handle,
          default_og_image: seoSettings.default_og_image,
          enable_sitemap: seoSettings.enable_sitemap,
          enable_robots: seoSettings.enable_robots,
          enable_schema: seoSettings.enable_schema
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "SEO settings saved successfully"
      });
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      toast({
        title: "Error",
        description: "Failed to save SEO settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const validateSEO = () => {
    const newValidation = {
      title: {
        valid: seoSettings.site_title.length >= 30 && seoSettings.site_title.length <= 60,
        message: seoSettings.site_title.length < 30 
          ? 'Title too short (minimum 30 characters)' 
          : seoSettings.site_title.length > 60 
          ? 'Title too long (maximum 60 characters)' 
          : 'Good title length'
      },
      description: {
        valid: seoSettings.site_description.length >= 120 && seoSettings.site_description.length <= 160,
        message: seoSettings.site_description.length < 120 
          ? 'Description too short (minimum 120 characters)' 
          : seoSettings.site_description.length > 160 
          ? 'Description too long (maximum 160 characters)' 
          : 'Good description length'
      },
      keywords: {
        valid: seoSettings.site_keywords.split(',').length >= 3 && seoSettings.site_keywords.split(',').length <= 10,
        message: seoSettings.site_keywords.split(',').length < 3 
          ? 'Add more keywords (minimum 3)' 
          : seoSettings.site_keywords.split(',').length > 10 
          ? 'Too many keywords (maximum 10)' 
          : 'Good number of keywords'
      }
    };
    setSeoValidation(newValidation);
  };

  const generateSEOContent = async () => {
    try {
      setAutoGenerating(true);
      
      // This would call an AI service to generate SEO content
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSeoSettings(prev => ({
        ...prev,
        site_title: 'Your Amazing Author Website - Books, Stories & More',
        site_description: 'Discover captivating stories and bestselling books from [Author Name]. Explore literary works, upcoming releases, and connect with readers worldwide.',
        site_keywords: 'author, books, novels, stories, literature, writing, bestseller, fiction, publishing, reading'
      }));

      toast({
        title: "Success",
        description: "SEO content generated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate SEO content",
        variant: "destructive"
      });
    } finally {
      setAutoGenerating(false);
    }
  };

  useEffect(() => {
    fetchSEOSettings();
  }, []);

  useEffect(() => {
    validateSEO();
  }, [seoSettings.site_title, seoSettings.site_description, seoSettings.site_keywords]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">SEO Management</h3>
          <p className="text-sm text-muted-foreground">
            Optimize your website for search engines
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={generateSEOContent} disabled={autoGenerating}>
            <Brain className={`h-4 w-4 mr-2 ${autoGenerating ? 'animate-spin' : ''}`} />
            {autoGenerating ? 'Generating...' : 'AI Generate'}
          </Button>
          <Button onClick={saveSEOSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Basic SEO Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Basic SEO Settings
          </CardTitle>
          <CardDescription>Configure fundamental SEO elements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="site_title">Site Title</Label>
            <Input
              id="site_title"
              value={seoSettings.site_title}
              onChange={(e) => setSeoSettings(prev => ({ ...prev, site_title: e.target.value }))}
              placeholder="Your website title"
            />
            <div className="flex items-center gap-2 text-xs">
              {seoValidation.title.valid ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
              )}
              <span className={seoValidation.title.valid ? 'text-green-600' : 'text-yellow-600'}>
                {seoValidation.title.message}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="site_description">Meta Description</Label>
            <Textarea
              id="site_description"
              value={seoSettings.site_description}
              onChange={(e) => setSeoSettings(prev => ({ ...prev, site_description: e.target.value }))}
              placeholder="Brief description of your website"
              rows={3}
            />
            <div className="flex items-center gap-2 text-xs">
              {seoValidation.description.valid ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
              )}
              <span className={seoValidation.description.valid ? 'text-green-600' : 'text-yellow-600'}>
                {seoValidation.description.message}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="site_keywords">Keywords</Label>
            <Input
              id="site_keywords"
              value={seoSettings.site_keywords}
              onChange={(e) => setSeoSettings(prev => ({ ...prev, site_keywords: e.target.value }))}
              placeholder="keyword1, keyword2, keyword3"
            />
            <div className="flex items-center gap-2 text-xs">
              {seoValidation.keywords.valid ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
              )}
              <span className={seoValidation.keywords.valid ? 'text-green-600' : 'text-yellow-600'}>
                {seoValidation.keywords.message}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Media & Verification */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media & Verification</CardTitle>
          <CardDescription>Configure social media integration and site verification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="google_verification">Google Site Verification</Label>
              <Input
                id="google_verification"
                value={seoSettings.google_site_verification}
                onChange={(e) => setSeoSettings(prev => ({ ...prev, google_site_verification: e.target.value }))}
                placeholder="Google verification code"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bing_verification">Bing Site Verification</Label>
              <Input
                id="bing_verification"
                value={seoSettings.bing_site_verification}
                onChange={(e) => setSeoSettings(prev => ({ ...prev, bing_site_verification: e.target.value }))}
                placeholder="Bing verification code"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebook_app_id">Facebook App ID</Label>
              <Input
                id="facebook_app_id"
                value={seoSettings.facebook_app_id}
                onChange={(e) => setSeoSettings(prev => ({ ...prev, facebook_app_id: e.target.value }))}
                placeholder="Facebook App ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter_handle">Twitter Handle</Label>
              <Input
                id="twitter_handle"
                value={seoSettings.twitter_handle}
                onChange={(e) => setSeoSettings(prev => ({ ...prev, twitter_handle: e.target.value }))}
                placeholder="@yourusername"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_og_image">Default Open Graph Image</Label>
            <Input
              id="default_og_image"
              value={seoSettings.default_og_image}
              onChange={(e) => setSeoSettings(prev => ({ ...prev, default_og_image: e.target.value }))}
              placeholder="https://yoursite.com/og-image.jpg"
            />
          </div>
        </CardContent>
      </Card>

      {/* SEO Features */}
      <Card>
        <CardHeader>
          <CardTitle>SEO Features</CardTitle>
          <CardDescription>Enable or disable SEO features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>XML Sitemap</Label>
              <p className="text-xs text-muted-foreground">
                Automatically generate and update XML sitemap
              </p>
            </div>
            <Switch
              checked={seoSettings.enable_sitemap}
              onCheckedChange={(checked) => setSeoSettings(prev => ({ ...prev, enable_sitemap: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Robots.txt</Label>
              <p className="text-xs text-muted-foreground">
                Generate robots.txt file for search engines
              </p>
            </div>
            <Switch
              checked={seoSettings.enable_robots}
              onCheckedChange={(checked) => setSeoSettings(prev => ({ ...prev, enable_robots: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Schema Markup</Label>
              <p className="text-xs text-muted-foreground">
                Add structured data for better search results
              </p>
            </div>
            <Switch
              checked={seoSettings.enable_schema}
              onCheckedChange={(checked) => setSeoSettings(prev => ({ ...prev, enable_schema: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* AI SEO Assistant */}
      <AISEOAssistant 
        currentContent={{
          title: seoSettings.site_title,
          description: seoSettings.site_description,
          keywords: seoSettings.site_keywords
        }}
      />

      {/* SEO Analyzer */}
      <SEOAnalyzer />

      {/* Schema Generator */}
      <SchemaGenerator />
    </div>
  );
};