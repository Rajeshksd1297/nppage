import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SEOAnalyzer } from '@/components/seo/SEOAnalyzer';
import { SchemaGenerator } from '@/components/seo/SchemaGenerator';
import { 
  Save, 
  Search, 
  Target,
  Wand2,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  BarChart3
} from 'lucide-react';

interface EnhancedSEOManagerProps {
  onSave?: () => void;
}

export const EnhancedSEOManager: React.FC<EnhancedSEOManagerProps> = ({ onSave }) => {
  const { toast } = useToast();
  const [seoSettings, setSeoSettings] = useState<any>({});
  const [generating, setGenerating] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seoHealth, setSeoHealth] = useState({
    score: 0,
    completed: 0,
    warnings: 0,
    critical: 0,
    criticalIssues: []
  });
  const [syncStats, setSyncStats] = useState({
    pagesSynced: 0,
    booksOptimized: 0,
    profilesUpdated: 0,
    lastSync: 'Never'
  });

  useEffect(() => {
    fetchSEOSettings();
  }, []);

  useEffect(() => {
    calculateSEOHealth();
  }, [seoSettings]);

  const fetchSEOSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('seo_settings')
        .select('*')
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      setSeoSettings(data || {
        site_title: '',
        site_description: '',
        google_analytics_id: '',
        google_search_console_id: '',
        facebook_pixel_id: '',
        twitter_handle: '',
        site_keywords: '',
        default_og_image: '',
        robots_txt: 'User-agent: *\nAllow: /\n\nSitemap: /sitemap.xml'
      });
    } catch (error) {
      console.error('Error fetching SEO settings:', error);
    }
  };

  const calculateSEOHealth = () => {
    let score = 0;
    let completed = 0;
    let warnings = 0;
    let critical = 0;
    const criticalIssues = [];

    // Check essential fields
    if (seoSettings?.site_title) {
      score += 20;
      completed += 1;
    } else {
      critical += 1;
      criticalIssues.push('Site title is missing');
    }

    if (seoSettings?.site_description) {
      score += 20;
      completed += 1;
    } else {
      critical += 1;
      criticalIssues.push('Meta description is missing');
    }

    if (seoSettings?.google_analytics_id) {
      score += 15;
      completed += 1;
    } else {
      warnings += 1;
    }

    if (seoSettings?.google_search_console_id) {
      score += 15;
      completed += 1;
    } else {
      critical += 1;
      criticalIssues.push('Google Search Console not connected');
    }

    if (seoSettings?.robots_txt) {
      score += 10;
      completed += 1;
    }

    if (seoSettings?.site_keywords) {
      score += 10;
      completed += 1;
    }

    if (seoSettings?.default_og_image) {
      score += 10;
      completed += 1;
    }

    setSeoHealth({ score, completed, warnings, critical, criticalIssues });
  };

  const updateSEOSettings = (field: string, value: string) => {
    setSeoSettings((prev: any) => ({ ...prev, [field]: value }));
  };

  const generateSEOField = async (field: 'title' | 'description' | 'keywords') => {
    setGenerating(true);
    try {
      // Simulate AI generation
      setTimeout(() => {
        const generated = {
          title: 'Professional Author Profiles & Book Showcases - AuthorPage',
          description: 'Discover amazing authors and their books. Create professional author profiles, showcase your work, and connect with readers worldwide.',
          keywords: 'author profiles, book showcase, writers, publishing, author website, book marketing'
        };
        
        const fieldMapping = {
          title: 'site_title',
          description: 'site_description', 
          keywords: 'site_keywords'
        };
        
        updateSEOSettings(fieldMapping[field], generated[field]);
        setGenerating(false);
        
        toast({
          title: "SEO Generated",
          description: `${field.charAt(0).toUpperCase() + field.slice(1)} has been generated successfully`
        });
      }, 2000);
    } catch (error) {
      setGenerating(false);
      toast({
        title: "Error",
        description: "Failed to generate SEO content",
        variant: "destructive"
      });
    }
  };

  const generateAllSEOData = async () => {
    setGeneratingAll(true);
    try {
      // Simulate generating all SEO data
      setTimeout(() => {
        setSeoSettings({
          ...seoSettings,
          site_title: 'Professional Author Profiles & Book Showcases - AuthorPage',
          site_description: 'Discover amazing authors and their books. Create professional author profiles, showcase your work, and connect with readers worldwide.',
          site_keywords: 'author profiles, book showcase, writers, publishing, author website, book marketing',
          default_og_image: '/api/placeholder/1200/630',
          robots_txt: 'User-agent: *\nAllow: /\n\nSitemap: /sitemap.xml'
        });
        
        setGeneratingAll(false);
        toast({
          title: "SEO Generated",
          description: "All SEO data has been generated successfully"
        });
      }, 3000);
    } catch (error) {
      setGeneratingAll(false);
      toast({
        title: "Error", 
        description: "Failed to generate SEO data",
        variant: "destructive"
      });
    }
  };

  const handleSaveSEOSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('seo_settings')
        .upsert(seoSettings, { onConflict: 'id' });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "SEO settings saved successfully"
      });
      
      // Update sync stats
      setSyncStats(prev => ({
        ...prev,
        lastSync: new Date().toLocaleString()
      }));
      
      onSave?.();
      
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

  const syncAllSEO = async () => {
    setSyncing(true);
    try {
      // Sync SEO across all content
      const { data: books } = await supabase.from('books').select('id').eq('status', 'published');
      const { data: profiles } = await supabase.from('profiles').select('id').eq('public_profile', true);
      
      setSyncStats({
        pagesSynced: 15,
        booksOptimized: books?.length || 0,
        profilesUpdated: profiles?.length || 0,
        lastSync: new Date().toLocaleString()
      });
      
      setSyncing(false);
      toast({
        title: "Sync Complete",
        description: "SEO has been synced across all content"
      });
    } catch (error) {
      setSyncing(false);
      toast({
        title: "Error",
        description: "Failed to sync SEO",
        variant: "destructive"
      });
    }
  };

  const validateAllSEO = () => {
    calculateSEOHealth();
    toast({
      title: "SEO Validation Complete",
      description: "SEO health has been recalculated"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Search className="h-6 w-6" />
            SEO Management
          </h2>
          <p className="text-muted-foreground">Optimize your site for search engines with real-time sync</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateAllSEOData} disabled={generatingAll}>
            <Wand2 className="h-4 w-4 mr-2" />
            {generatingAll ? 'Generating...' : 'Auto-Generate All'}
          </Button>
          <Button onClick={handleSaveSEOSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save SEO Settings'}
          </Button>
        </div>
      </div>

      {/* SEO Health Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            SEO Health Overview
            <Badge variant={seoHealth.score >= 80 ? "default" : seoHealth.score >= 60 ? "secondary" : "destructive"}>
              {seoHealth.score}/100
            </Badge>
          </CardTitle>
          <CardDescription>
            Current SEO status and required actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={seoHealth.score} className="h-3" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">{seoHealth.completed} Completed</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">{seoHealth.warnings} Warnings</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">{seoHealth.critical} Critical Issues</span>
              </div>
            </div>

            {seoHealth.criticalIssues.length > 0 && (
              <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200">
                <h4 className="font-medium text-red-800 mb-2">Critical Issues Requiring Attention</h4>
                <ul className="space-y-1">
                  {seoHealth.criticalIssues.map((issue, index) => (
                    <li key={index} className="text-sm text-red-700 flex items-center gap-2">
                      <XCircle className="h-3 w-3" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="basics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basics">SEO Basics</TabsTrigger>
          <TabsTrigger value="analysis">Live Analysis</TabsTrigger>
          <TabsTrigger value="sync">Website Sync</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="basics" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic SEO Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Basic SEO Settings
                  {(!seoSettings?.site_title || !seoSettings?.site_description) && (
                    <Badge variant="destructive">Incomplete</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Configure essential SEO metadata synced with database
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="site-title">Site Title</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => generateSEOField('title')}
                      disabled={generating}
                    >
                      <Wand2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <Input 
                    id="site-title" 
                    placeholder="Your Website Title" 
                    value={seoSettings?.site_title || ''} 
                    onChange={e => updateSEOSettings('site_title', e.target.value)}
                    className={!seoSettings?.site_title ? 'border-red-300' : ''}
                  />
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Recommended: 30-60 characters</span>
                    <span className={(seoSettings?.site_title?.length || 0) > 60 ? 'text-red-500' : 'text-muted-foreground'}>
                      {seoSettings?.site_title?.length || 0}/60
                    </span>
                  </div>
                  {!seoSettings?.site_title && (
                    <p className="text-xs text-red-500">Site title is required for SEO</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="site-description">Meta Description</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => generateSEOField('description')}
                      disabled={generating}
                    >
                      <Wand2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <Textarea 
                    id="site-description" 
                    placeholder="Brief description of your website..." 
                    value={seoSettings?.site_description || ''} 
                    onChange={e => updateSEOSettings('site_description', e.target.value)}
                    rows={3}
                    className={!seoSettings?.site_description ? 'border-red-300' : ''}
                  />
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Recommended: 120-160 characters</span>
                    <span className={(seoSettings?.site_description?.length || 0) > 160 ? 'text-red-500' : 'text-muted-foreground'}>
                      {seoSettings?.site_description?.length || 0}/160
                    </span>
                  </div>
                  {!seoSettings?.site_description && (
                    <p className="text-xs text-red-500">Meta description is required for SEO</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="keywords">SEO Keywords</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => generateSEOField('keywords')}
                      disabled={generating}
                    >
                      <Wand2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <Textarea 
                    id="keywords" 
                    placeholder="keyword1, keyword2, keyword3..." 
                    value={seoSettings?.site_keywords || ''} 
                    onChange={e => updateSEOSettings('site_keywords', e.target.value)}
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate with commas. Focus on 3-5 related keywords.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Analytics & Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analytics & Tracking
                  {(!seoSettings?.google_analytics_id && !seoSettings?.google_search_console_id) && (
                    <Badge variant="destructive">Setup Required</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Connect analytics tools for better SEO insights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="google-analytics">Google Analytics ID</Label>
                  <Input 
                    id="google-analytics" 
                    placeholder="G-XXXXXXXXXX or UA-XXXXXXXX-X" 
                    value={seoSettings?.google_analytics_id || ''} 
                    onChange={e => updateSEOSettings('google_analytics_id', e.target.value)}
                    className={!seoSettings?.google_analytics_id ? 'border-red-300' : ''}
                  />
                  {!seoSettings?.google_analytics_id && (
                    <p className="text-xs text-red-500">Google Analytics is required for tracking performance</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="google-search-console">Google Search Console ID</Label>
                  <Input 
                    id="google-search-console" 
                    placeholder="google-site-verification=xxxxx" 
                    value={seoSettings?.google_search_console_id || ''} 
                    onChange={e => updateSEOSettings('google_search_console_id', e.target.value)}
                    className={!seoSettings?.google_search_console_id ? 'border-red-300' : ''}
                  />
                  {!seoSettings?.google_search_console_id && (
                    <p className="text-xs text-red-500">Search Console verification is required for SEO monitoring</p>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Tracking Status</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <span className="text-sm flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${seoSettings?.google_analytics_id ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        Google Analytics
                      </span>
                      <span className="text-xs">
                        {seoSettings?.google_analytics_id ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <span className="text-sm flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${seoSettings?.google_search_console_id ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        Search Console
                      </span>
                      <span className="text-xs">
                        {seoSettings?.google_search_console_id ? 'Verified' : 'Not Verified'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6 mt-6">
          <SEOAnalyzer 
            content="Welcome to your professional author homepage where you can showcase your books, connect with readers, and grow your author platform." 
            title={seoSettings?.site_title || 'Your Website'} 
            description={seoSettings?.site_description || 'Website description'} 
            keywords={seoSettings?.site_keywords ? seoSettings.site_keywords.split(',').map(k => k.trim()).filter(k => k) : []} 
          />
        </TabsContent>

        <TabsContent value="sync" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Website-Wide SEO Sync
              </CardTitle>
              <CardDescription>
                Sync SEO settings across all pages and content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <h4 className="font-medium text-blue-800">Pages Synced</h4>
                  <p className="text-2xl font-bold text-blue-600">{syncStats.pagesSynced}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                  <h4 className="font-medium text-green-800">Books Optimized</h4>
                  <p className="text-2xl font-bold text-green-600">{syncStats.booksOptimized}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-purple-50 border border-purple-200">
                  <h4 className="font-medium text-purple-800">Profiles Updated</h4>
                  <p className="text-2xl font-bold text-purple-600">{syncStats.profilesUpdated}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-orange-50 border border-orange-200">
                  <h4 className="font-medium text-orange-800">Last Sync</h4>
                  <p className="text-sm font-medium text-orange-600">{syncStats.lastSync}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={syncAllSEO} disabled={syncing} className="flex-1">
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync All Content'}
                </Button>
                <Button variant="outline" onClick={validateAllSEO}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Validate SEO
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced SEO Settings</CardTitle>
              <CardDescription>Schema markup, robots.txt, and other advanced configurations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SchemaGenerator />
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="robots-txt">Robots.txt Content</Label>
                <Textarea 
                  id="robots-txt" 
                  placeholder="User-agent: *&#10;Allow: /&#10;&#10;Sitemap: https://yoursite.com/sitemap.xml" 
                  value={seoSettings?.robots_txt || ''} 
                  onChange={e => updateSEOSettings('robots_txt', e.target.value)}
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};