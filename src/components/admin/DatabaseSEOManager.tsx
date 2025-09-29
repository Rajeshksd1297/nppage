import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { updateSEO, generateStructuredData, injectStructuredData } from '@/utils/seo';
import { 
  Search, 
  Globe, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  Database,
  RefreshCw,
  Save,
  Eye,
  Target,
  BarChart3,
  Monitor,
  Smartphone,
  Brain,
  Lightbulb
} from 'lucide-react';

interface SEOData {
  id?: string;
  page_type: string;
  page_id?: string;
  title: string;
  description: string;
  keywords: string;
  canonical_url?: string;
  og_image?: string;
  meta_author?: string;
  schema_data?: any;
  created_at?: string;
  updated_at?: string;
}

interface GlobalSEOSettings {
  site_title: string;
  site_description: string;
  site_keywords: string;
  default_og_image: string;
  enable_schema: boolean;
  enable_sitemap: boolean;
  enable_robots: boolean;
  google_site_verification?: string;
  bing_site_verification?: string;
  facebook_app_id?: string;
  twitter_handle?: string;
}

interface SEOHealth {
  score: number;
  issues: {
    type: 'critical' | 'warning' | 'info';
    message: string;
    page?: string;
  }[];
  recommendations: string[];
}

export const DatabaseSEOManager = () => {
  const { toast } = useToast();
  
  // States
  const [globalSettings, setGlobalSettings] = useState<GlobalSEOSettings>({
    site_title: '',
    site_description: '',
    site_keywords: '',
    default_og_image: '',
    enable_schema: true,
    enable_sitemap: true,
    enable_robots: true,
    google_site_verification: '',
    bing_site_verification: '',
    facebook_app_id: '',
    twitter_handle: ''
  });
  
  const [pagesSEO, setPagesSEO] = useState<SEOData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [seoHealth, setSeoHealth] = useState<SEOHealth>({
    score: 0,
    issues: [],
    recommendations: []
  });
  const [selectedPage, setSelectedPage] = useState<string>('home');
  const [editingPage, setEditingPage] = useState<SEOData | null>(null);

  // Database operations
  useEffect(() => {
    loadSEOData();
    loadGlobalSettings();
  }, []);

  const loadSEOData = async () => {
    try {
      setLoading(true);
      
      // Fetch all SEO data from multiple tables
      const [
        { data: homePageSEO },
        { data: booksSEO },
        { data: blogsSEO },
        { data: pagesSEO },
        { data: profilesSEO }
      ] = await Promise.all([
        supabase.from('home_page_sections').select('*').eq('type', 'seo'),
        supabase.from('books').select('id, title, seo_title, seo_description, seo_keywords, slug'),
        supabase.from('blog_posts').select('id, title, meta_title, meta_description, slug'),
        supabase.from('additional_pages').select('id, title, meta_title, meta_description, slug'),
        supabase.from('profiles').select('id, full_name, seo_title, seo_description, seo_keywords, slug')
      ]);

      // Transform and combine all SEO data
      const combinedSEO: SEOData[] = [
        // Home page
        {
          page_type: 'home',
          page_id: 'home',
          title: homePageSEO?.[0]?.config?.title || 'Home',
          description: homePageSEO?.[0]?.config?.description || '',
          keywords: homePageSEO?.[0]?.config?.keywords || ''
        },
        // Books
        ...(booksSEO || []).map(book => ({
          page_type: 'book',
          page_id: book.id,
          title: book.seo_title || book.title,
          description: book.seo_description || '',
          keywords: book.seo_keywords || '',
          canonical_url: `/books/${book.slug}`
        })),
        // Blog posts
        ...(blogsSEO || []).map(post => ({
          page_type: 'blog',
          page_id: post.id,
          title: post.meta_title || post.title,
          description: post.meta_description || '',
          keywords: '',
          canonical_url: `/blog/${post.slug}`
        })),
        // Additional pages
        ...(pagesSEO || []).map(page => ({
          page_type: 'page',
          page_id: page.id,
          title: page.meta_title || page.title,
          description: page.meta_description || '',
          keywords: '',
          canonical_url: `/${page.slug}`
        })),
        // Profiles
        ...(profilesSEO || []).map(profile => ({
          page_type: 'profile',
          page_id: profile.id,
          title: profile.seo_title || profile.full_name,
          description: profile.seo_description || '',
          keywords: profile.seo_keywords || '',
          canonical_url: `/author/${profile.slug}`
        }))
      ];

      setPagesSEO(combinedSEO);
      analyzeSEOHealth(combinedSEO);
      
    } catch (error) {
      console.error('Error loading SEO data:', error);
      toast({
        title: "Error",
        description: "Failed to load SEO data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadGlobalSettings = async () => {
    try {
      // Try to load from a global settings table or use defaults
      const { data: settings } = await supabase
        .from('global_seo_settings')
        .select('*')
        .limit(1)
        .single();

      if (settings) {
        setGlobalSettings(settings);
      }
    } catch (error) {
      // Table might not exist, use defaults
      console.log('No global SEO settings found, using defaults');
    }
  };

  const saveGlobalSettings = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('global_seo_settings')
        .upsert(globalSettings, { onConflict: 'id' });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Global SEO settings saved successfully"
      });

      // Apply global settings to document head
      updateSEO({
        title: globalSettings.site_title,
        description: globalSettings.site_description,
        keywords: globalSettings.site_keywords,
        image: globalSettings.default_og_image,
        type: 'website'
      });

    } catch (error) {
      console.error('Error saving global settings:', error);
      toast({
        title: "Error",
        description: "Failed to save global SEO settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const syncWithWebsite = async () => {
    try {
      setSyncing(true);
      
      // Update all pages with their SEO data
      for (const page of pagesSEO) {
        await updatePageSEO(page);
      }

      // Generate and inject structured data
      if (globalSettings.enable_schema) {
        const schemaData = generateStructuredData('Organization', {
          name: globalSettings.site_title,
          description: globalSettings.site_description,
          url: window.location.origin,
          logo: globalSettings.default_og_image
        });
        injectStructuredData(schemaData);
      }

      setLastSync(new Date());
      
      toast({
        title: "Success",
        description: "SEO data synchronized with website"
      });

    } catch (error) {
      console.error('Error syncing SEO:', error);
      toast({
        title: "Error",
        description: "Failed to sync SEO with website",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  const updatePageSEO = async (seoData: SEOData) => {
    try {
      let updateQuery;
      
      switch (seoData.page_type) {
        case 'book':
          updateQuery = supabase
            .from('books')
            .update({
              seo_title: seoData.title,
              seo_description: seoData.description,
              seo_keywords: seoData.keywords
            })
            .eq('id', seoData.page_id);
          break;
          
        case 'blog':
          updateQuery = supabase
            .from('blog_posts')
            .update({
              meta_title: seoData.title,
              meta_description: seoData.description
            })
            .eq('id', seoData.page_id);
          break;
          
        case 'page':
          updateQuery = supabase
            .from('additional_pages')
            .update({
              meta_title: seoData.title,
              meta_description: seoData.description
            })
            .eq('id', seoData.page_id);
          break;
          
        case 'profile':
          updateQuery = supabase
            .from('profiles')
            .update({
              seo_title: seoData.title,
              seo_description: seoData.description,
              seo_keywords: seoData.keywords
            })
            .eq('id', seoData.page_id);
          break;
          
        case 'home':
          updateQuery = supabase
            .from('home_page_sections')
            .upsert({
              type: 'seo',
              title: 'SEO Settings',
              config: {
                title: seoData.title,
                description: seoData.description,
                keywords: seoData.keywords
              }
            }, { onConflict: 'type' });
          break;
      }

      if (updateQuery) {
        const { error } = await updateQuery;
        if (error) throw error;
      }

    } catch (error) {
      console.error(`Error updating ${seoData.page_type} SEO:`, error);
      throw error;
    }
  };

  const analyzeSEOHealth = (seoData: SEOData[]) => {
    const issues: SEOHealth['issues'] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check for missing titles
    const missingTitles = seoData.filter(page => !page.title || page.title.length < 10);
    if (missingTitles.length > 0) {
      score -= 20;
      issues.push({
        type: 'critical',
        message: `${missingTitles.length} pages missing proper titles`,
        page: missingTitles[0]?.page_type
      });
    }

    // Check for missing descriptions
    const missingDescriptions = seoData.filter(page => !page.description || page.description.length < 50);
    if (missingDescriptions.length > 0) {
      score -= 15;
      issues.push({
        type: 'warning',
        message: `${missingDescriptions.length} pages missing meta descriptions`,
        page: missingDescriptions[0]?.page_type
      });
    }

    // Check for missing keywords
    const missingKeywords = seoData.filter(page => !page.keywords);
    if (missingKeywords.length > 0) {
      score -= 10;
      issues.push({
        type: 'info',
        message: `${missingKeywords.length} pages missing keywords`
      });
    }

    // Check title lengths
    const longTitles = seoData.filter(page => page.title && page.title.length > 60);
    if (longTitles.length > 0) {
      score -= 10;
      issues.push({
        type: 'warning',
        message: `${longTitles.length} pages have titles too long for SEO`
      });
    }

    // Generate recommendations
    if (missingTitles.length > 0) {
      recommendations.push('Add descriptive titles (30-60 characters) to all pages');
    }
    if (missingDescriptions.length > 0) {
      recommendations.push('Write compelling meta descriptions (150-160 characters) for better click-through rates');
    }
    if (!globalSettings.enable_schema) {
      recommendations.push('Enable structured data markup for better search visibility');
    }

    setSeoHealth({
      score: Math.max(0, score),
      issues,
      recommendations
    });
  };

  const generatePageSEO = async (pageType: string) => {
    try {
      setSaving(true);
      
      // Generate SEO based on page content
      const pages = pagesSEO.filter(p => p.page_type === pageType);
      
      for (const page of pages) {
        if (!page.title || !page.description || !page.keywords) {
          // Auto-generate missing SEO elements
          const updatedPage = {
            ...page,
            title: page.title || `${globalSettings.site_title} - ${page.page_type}`,
            description: page.description || `Discover amazing content on ${globalSettings.site_title}`,
            keywords: page.keywords || globalSettings.site_keywords
          };
          
          await updatePageSEO(updatedPage);
        }
      }
      
      await loadSEOData();
      
      toast({
        title: "Success",
        description: `Auto-generated SEO for ${pageType} pages`
      });
      
    } catch (error) {
      console.error('Error generating SEO:', error);
      toast({
        title: "Error",
        description: "Failed to generate SEO",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* SEO Health Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                SEO Health Dashboard
              </CardTitle>
              <CardDescription>
                Monitor and optimize your website's search performance
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={loadSEOData}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button
                onClick={syncWithWebsite}
                disabled={syncing}
                size="sm"
              >
                <Database className="h-4 w-4 mr-1" />
                {syncing ? 'Syncing...' : 'Sync Website'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* SEO Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">SEO Score</span>
                <span className={`text-2xl font-bold ${getHealthColor(seoHealth.score)}`}>
                  {seoHealth.score}%
                </span>
              </div>
              <Progress value={seoHealth.score} className="h-2" />
            </div>

            {/* Pages Analyzed */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pages Analyzed</span>
                <span className="text-2xl font-bold">{pagesSEO.length}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {pagesSEO.filter(p => p.title && p.description).length} optimized
              </div>
            </div>

            {/* Last Sync */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Sync</span>
                <span className="text-sm">
                  {lastSync ? lastSync.toLocaleTimeString() : 'Never'}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Auto-sync with website
              </div>
            </div>
          </div>

          {/* Issues */}
          {seoHealth.issues.length > 0 && (
            <div className="mt-6 space-y-2">
              <h4 className="font-medium">Issues Found</h4>
              {seoHealth.issues.map((issue, index) => (
                <div key={index} className="flex items-center gap-2">
                  {issue.type === 'critical' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  {issue.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                  {issue.type === 'info' && <AlertTriangle className="h-4 w-4 text-blue-500" />}
                  <span className="text-sm">{issue.message}</span>
                  {issue.page && (
                    <Badge variant="outline" className="text-xs">
                      {issue.page}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {seoHealth.recommendations.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Recommendations
              </h4>
              {seoHealth.recommendations.map((rec, index) => (
                <div key={index} className="text-sm text-muted-foreground">
                  • {rec}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Global SEO Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Global SEO Settings
          </CardTitle>
          <CardDescription>
            Configure default SEO settings for your entire website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="site-title">Site Title</Label>
              <Input
                id="site-title"
                value={globalSettings.site_title}
                onChange={(e) => setGlobalSettings({
                  ...globalSettings,
                  site_title: e.target.value
                })}
                placeholder="Your Website Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="site-keywords">Default Keywords</Label>
              <Input
                id="site-keywords"
                value={globalSettings.site_keywords}
                onChange={(e) => setGlobalSettings({
                  ...globalSettings,
                  site_keywords: e.target.value
                })}
                placeholder="keyword1, keyword2, keyword3"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="site-description">Site Description</Label>
            <Textarea
              id="site-description"
              value={globalSettings.site_description}
              onChange={(e) => setGlobalSettings({
                ...globalSettings,
                site_description: e.target.value
              })}
              placeholder="Brief description of your website"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="og-image">Default Social Image URL</Label>
            <Input
              id="og-image"
              value={globalSettings.default_og_image}
              onChange={(e) => setGlobalSettings({
                ...globalSettings,
                default_og_image: e.target.value
              })}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="enable-schema"
                checked={globalSettings.enable_schema}
                onCheckedChange={(checked) => setGlobalSettings({
                  ...globalSettings,
                  enable_schema: checked
                })}
              />
              <Label htmlFor="enable-schema">Enable Schema Markup</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enable-sitemap"
                checked={globalSettings.enable_sitemap}
                onCheckedChange={(checked) => setGlobalSettings({
                  ...globalSettings,
                  enable_sitemap: checked
                })}
              />
              <Label htmlFor="enable-sitemap">Generate Sitemap</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enable-robots"
                checked={globalSettings.enable_robots}
                onCheckedChange={(checked) => setGlobalSettings({
                  ...globalSettings,
                  enable_robots: checked
                })}
              />
              <Label htmlFor="enable-robots">Enable Robots.txt</Label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={saveGlobalSettings}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Saving...' : 'Save Global Settings'}
            </Button>

            <Button
              onClick={() => generatePageSEO('all')}
              variant="outline"
              disabled={saving}
            >
              <Brain className="h-4 w-4 mr-1" />
              Auto-Generate SEO
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Page-by-Page SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Page-by-Page SEO
          </CardTitle>
          <CardDescription>
            Manage SEO settings for individual pages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Page Type Filter */}
            <div className="flex gap-2 flex-wrap">
              {['all', 'home', 'book', 'blog', 'page', 'profile'].map((type) => (
                <Button
                  key={type}
                  variant={selectedPage === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPage(type)}
                >
                  {type === 'all' ? 'All Pages' : type.charAt(0).toUpperCase() + type.slice(1)}
                  <Badge variant="secondary" className="ml-1">
                    {type === 'all' ? pagesSEO.length : pagesSEO.filter(p => p.page_type === type).length}
                  </Badge>
                </Button>
              ))}
            </div>

            {/* Pages List */}
            <div className="space-y-2">
              {pagesSEO
                .filter(page => selectedPage === 'all' || page.page_type === selectedPage)
                .map((page, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{page.page_type}</Badge>
                          <span className="font-medium">{page.title || 'Untitled'}</span>
                          {(!page.title || !page.description) && (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {page.description || 'No description'}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingPage(page)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>

                    {page.keywords && (
                      <div className="flex gap-1 flex-wrap">
                        {page.keywords.split(',').map((keyword, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {keyword.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* Bulk Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={() => generatePageSEO(selectedPage)}
                variant="outline"
                disabled={saving}
              >
                <Brain className="h-4 w-4 mr-1" />
                Auto-Generate for {selectedPage === 'all' ? 'All' : selectedPage} Pages
              </Button>

              <Button
                onClick={syncWithWebsite}
                disabled={syncing}
              >
                <Database className="h-4 w-4 mr-1" />
                Sync to Website
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};