import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SEOAnalyzer } from '@/components/seo/SEOAnalyzer';
import { SchemaGenerator } from '@/components/seo/SchemaGenerator';
import { 
  Plus, Edit, Eye, Trash2, Settings, Home, Users, BarChart3, Layout, 
  Globe, TrendingUp, Clock, MapPin, Activity, Monitor, Smartphone, 
  Target, Search, Brain, CheckCircle, AlertTriangle, Lightbulb,
  Share2, ExternalLink, Database, FileText, Code, Save, RefreshCw,
  Timer, Signal, Wifi, Gauge, Download, Upload, Filter, Calendar,
  Type, ImageIcon, Hash, Link, Star, Award, Bookmark, Copy, Trash,
  RotateCcw, HardDrive, Cpu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HeroBlockManager } from '@/components/admin/HeroBlockManager';
import HomePageEditor from '@/components/admin/HomePageEditor';
import EnhancedHomePageEditor from '@/components/admin/EnhancedHomePageEditor';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement, 
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement, 
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface HeroBlock {
  id: string;
  name: string;
  description: string;
  preview_image_url?: string;
  enabled: boolean;
  config: any;
  created_at: string;
  updated_at: string;
}

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  siteKeywords: string;
  language: string;
  favicon: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  headerLayout: string;
  footerLayout: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
    youtube: string;
  };
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  analytics: {
    googleAnalytics: string;
    facebookPixel: string;
    googleTagManager: string;
  };
  seo: {
    enableSitemap: boolean;
    enableRobots: boolean;
    enableOpenGraph: boolean;
    enableTwitterCards: boolean;
    enableSchemaMarkup: boolean;
  };
}

const HomePageManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [heroBlocks, setHeroBlocks] = useState<HeroBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteName: '',
    siteDescription: '',
    siteKeywords: '',
    language: 'en',
    favicon: '',
    logo: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    fontFamily: 'Inter',
    headerLayout: 'default',
    footerLayout: 'default',
    socialLinks: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: '',
      youtube: ''
    },
    contactInfo: {
      email: '',
      phone: '',
      address: ''
    },
    analytics: {
      googleAnalytics: '',
      facebookPixel: '',
      googleTagManager: ''
    },
    seo: {
      enableSitemap: true,
      enableRobots: true,
      enableOpenGraph: true,
      enableTwitterCards: true,
      enableSchemaMarkup: true
    }
  });

  // Mock data for analytics
  const analyticsData = {
    visitors: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Visitors',
        data: [1200, 1900, 3000, 5000, 2000, 3000],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      }]
    },
    pageViews: {
      labels: ['Home', 'About', 'Services', 'Contact', 'Blog'],
      datasets: [{
        label: 'Page Views',
        data: [4500, 2300, 3200, 1800, 2800],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)'
        ]
      }]
    },
    deviceStats: {
      labels: ['Desktop', 'Mobile', 'Tablet'],
      datasets: [{
        data: [65, 30, 5],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)'
        ]
      }]
    }
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  useEffect(() => {
    fetchHeroBlocks();
    fetchSiteSettings();
  }, []);

  const fetchHeroBlocks = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_blocks')
        .select('*')
        .order('order', { ascending: true });

      if (error) throw error;
      setHeroBlocks(data || []);
    } catch (error) {
      console.error('Error fetching hero blocks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch hero blocks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSiteSettings = async () => {
    try {
      // Use any to bypass TypeScript issues with the new table
      const { data, error } = await (supabase as any)
        .from('site_settings')
        .select('*')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSiteSettings({
          siteName: data.site_name,
          siteDescription: data.site_description,
          siteKeywords: data.site_keywords,
          contactEmail: data.contact_email,
          allowRegistration: data.allow_registration,
          requireEmailVerification: data.require_email_verification,
          defaultTheme: data.default_theme,
          maintenanceMode: data.maintenance_mode,
          maxFileSize: data.max_file_size,
          allowedFileTypes: data.allowed_file_types,
          timezone: data.timezone,
          dateFormat: data.date_format,
          language: data.language
        });
      }
    } catch (error) {
      console.error('Error fetching site settings:', error);
    }
  };

  const handleSaveSiteSettings = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('site_settings')
        .upsert({
          site_name: siteSettings.siteName,
          site_description: siteSettings.siteDescription,
          site_keywords: siteSettings.siteKeywords,
          contact_email: siteSettings.contactEmail,
          allow_registration: siteSettings.allowRegistration,
          require_email_verification: siteSettings.requireEmailVerification,
          default_theme: siteSettings.defaultTheme,
          maintenance_mode: siteSettings.maintenanceMode,
          max_file_size: siteSettings.maxFileSize,
          allowed_file_types: siteSettings.allowedFileTypes,
          timezone: siteSettings.timezone,
          date_format: siteSettings.dateFormat,
          language: siteSettings.language
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Site settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving site settings:', error);
      toast({
        title: "Error",
        description: "Failed to save site settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const stats = [
    {
      title: "Total Visitors",
      value: "12,345",
      change: "+12%",
      trend: "up",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Page Views",
      value: "45,678",
      change: "+8%",
      trend: "up",
      icon: Eye,
      color: "text-green-600"
    },
    {
      title: "Bounce Rate",
      value: "32%",
      change: "-5%",
      trend: "down",
      icon: TrendingUp,
      color: "text-orange-600"
    },
    {
      title: "Avg. Session",
      value: "2m 34s",
      change: "+15%",
      trend: "up",
      icon: Clock,
      color: "text-purple-600"
    }
  ];

  const recentActivities = [
    { action: "Hero block updated", time: "2 minutes ago", user: "Admin" },
    { action: "New page created", time: "1 hour ago", user: "Editor" },
    { action: "SEO settings modified", time: "3 hours ago", user: "Admin" },
    { action: "Contact form submission", time: "5 hours ago", user: "Visitor" },
    { action: "Blog post published", time: "1 day ago", user: "Author" }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Home className="h-8 w-8" />
            Home Page Management
          </h1>
          <p className="text-muted-foreground">Manage your website's homepage content and settings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/admin')}>
            <Settings className="h-4 w-4 mr-2" />
            Admin Dashboard
          </Button>
          <Button onClick={() => window.open('/', '_blank')}>
            <Eye className="h-4 w-4 mr-2" />
            Preview Site
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="hero">Hero Blocks</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className={`text-xs ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change} from last month
                      </p>
                    </div>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Visitor Trends</CardTitle>
                <CardDescription>Monthly visitor statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <Line data={analyticsData.visitors} options={chartOptions} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Usage</CardTitle>
                <CardDescription>Visitor device breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <Doughnut data={analyticsData.deviceStats} options={doughnutOptions} />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common homepage management tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('content')}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Homepage Content
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('hero')}>
                  <Layout className="h-4 w-4 mr-2" />
                  Manage Hero Blocks
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('seo')}>
                  <Search className="h-4 w-4 mr-2" />
                  SEO Optimization
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('design')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Design Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest changes and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">by {activity.user}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Content Management</h2>
              <p className="text-muted-foreground">Edit your homepage content and layout</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
          
          <EnhancedHomePageEditor />
        </TabsContent>

        <TabsContent value="hero" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Hero Block Management</h2>
              <p className="text-muted-foreground">Create and manage hero sections for your homepage</p>
            </div>
          </div>
          
          <HeroBlockManager
            heroBlocks={heroBlocks.map(block => ({
              ...block,
              preview_image: block.preview_image_url || '',
              enabled_for_authors: block.enabled
            }))}
            onBack={() => setCurrentView('overview')}
            onUpdate={fetchHeroBlocks}
          />
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Search className="h-6 w-6" />
                SEO Management
              </h2>
              <p className="text-muted-foreground">Optimize your site for search engines</p>
            </div>
            <Button onClick={handleSaveSiteSettings} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save SEO Settings'}
            </Button>
          </div>

          <Tabs defaultValue="basics" className="w-full">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="basics">SEO Basics</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="schema">Schema</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="ai-seo">AI SEO</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="basics" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic SEO Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Basic SEO Settings
                    </CardTitle>
                    <CardDescription>
                      Configure essential SEO metadata for your website
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="site-title">Site Title</Label>
                      <Input
                        id="site-title"
                        placeholder="Your Website Title"
                        value={siteSettings.siteName}
                        onChange={(e) => setSiteSettings(prev => ({ ...prev, siteName: e.target.value }))}
                      />
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Recommended: 30-60 characters</span>
                        <span className={siteSettings.siteName.length > 60 ? 'text-red-500' : 'text-muted-foreground'}>
                          {siteSettings.siteName.length}/60
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="site-description">Meta Description</Label>
                      <Textarea
                        id="site-description"
                        placeholder="Brief description of your website..."
                        value={siteSettings.siteDescription}
                        onChange={(e) => setSiteSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                        rows={3}
                      />
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Recommended: 120-160 characters</span>
                        <span className={siteSettings.siteDescription.length > 160 ? 'text-red-500' : 'text-muted-foreground'}>
                          {siteSettings.siteDescription.length}/160
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="keywords">SEO Keywords</Label>
                      <Textarea
                        id="keywords"
                        placeholder="keyword1, keyword2, keyword3..."
                        value={siteSettings.siteKeywords}
                        onChange={(e) => setSiteSettings(prev => ({ ...prev, siteKeywords: e.target.value }))}
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground">
                        Separate with commas. Focus on 3-5 related keywords.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select value={siteSettings.language} onValueChange={(value) => setSiteSettings(prev => ({ ...prev, language: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="it">Italian</SelectItem>
                          <SelectItem value="pt">Portuguese</SelectItem>
                          <SelectItem value="zh">Chinese</SelectItem>
                          <SelectItem value="ja">Japanese</SelectItem>
                          <SelectItem value="ko">Korean</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="canonicalUrl">Canonical URL</Label>
                      <Input id="canonicalUrl" placeholder="https://yoursite.com/" />
                    </div>
                  </CardContent>
                </Card>

                {/* SEO Features */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      SEO Features
                    </CardTitle>
                    <CardDescription>
                      Enable advanced SEO features for better ranking
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>XML Sitemap</Label>
                        <p className="text-xs text-muted-foreground">
                          Auto-generate and submit sitemap to search engines
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Robots.txt</Label>
                        <p className="text-xs text-muted-foreground">
                          Control search engine crawling
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Canonical URLs</Label>
                        <p className="text-xs text-muted-foreground">
                          Prevent duplicate content issues
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Open Graph Tags</Label>
                        <p className="text-xs text-muted-foreground">
                          Better social media sharing
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Twitter Cards</Label>
                        <p className="text-xs text-muted-foreground">
                          Enhanced Twitter sharing
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Schema Markup</Label>
                        <p className="text-xs text-muted-foreground">
                          Structured data for rich snippets
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Breadcrumbs</Label>
                        <p className="text-xs text-muted-foreground">
                          Navigation breadcrumbs for better UX
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Internal Linking</Label>
                        <p className="text-xs text-muted-foreground">
                          Auto-suggest internal links
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* SEO Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    SEO Best Practices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Use descriptive titles</h4>
                          <p className="text-sm text-muted-foreground">Include your main keyword naturally in the title</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Optimize meta descriptions</h4>
                          <p className="text-sm text-muted-foreground">Write compelling descriptions that encourage clicks</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Use header tags properly</h4>
                          <p className="text-sm text-muted-foreground">H1 for main title, H2-H6 for subheadings</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Create quality content</h4>
                          <p className="text-sm text-muted-foreground">Write valuable, original content regularly</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Add alt text to images</h4>
                          <p className="text-sm text-muted-foreground">Describe images for accessibility and SEO</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Improve page speed</h4>
                          <p className="text-sm text-muted-foreground">Optimize images and minimize code</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Build quality backlinks</h4>
                          <p className="text-sm text-muted-foreground">Get links from reputable websites</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Mobile optimization</h4>
                          <p className="text-sm text-muted-foreground">Ensure your site works great on mobile</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6 mt-6">
              <SEOAnalyzer 
                content="Welcome to your professional author homepage where you can showcase your books, connect with readers, and grow your author platform."
                title={siteSettings.siteName}
                description={siteSettings.siteDescription}
                keywords={siteSettings.siteKeywords.split(',').map(k => k.trim()).filter(k => k)}
              />
            </TabsContent>

            <TabsContent value="schema" className="space-y-6 mt-6">
              <SchemaGenerator />
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Advanced SEO Settings
                    </CardTitle>
                    <CardDescription>
                      Configure advanced SEO options
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="robots-meta">Robots Meta Tag</Label>
                      <Select defaultValue="index,follow">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="index,follow">Index, Follow</SelectItem>
                          <SelectItem value="noindex,follow">No Index, Follow</SelectItem>
                          <SelectItem value="index,nofollow">Index, No Follow</SelectItem>
                          <SelectItem value="noindex,nofollow">No Index, No Follow</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="custom-robots">Custom Robots.txt</Label>
                      <Textarea
                        id="custom-robots"
                        placeholder="User-agent: *&#10;Disallow: /admin/&#10;Sitemap: https://yoursite.com/sitemap.xml"
                        rows={6}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="htaccess">Custom .htaccess Rules</Label>
                      <Textarea
                        id="htaccess"
                        placeholder="RewriteEngine On&#10;RewriteCond %{HTTPS} off&#10;RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]"
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Structured Data
                    </CardTitle>
                    <CardDescription>
                      Configure structured data markup
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Organization Schema</Label>
                        <p className="text-xs text-muted-foreground">
                          Add organization information
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Website Schema</Label>
                        <p className="text-xs text-muted-foreground">
                          Add website metadata
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Breadcrumb Schema</Label>
                        <p className="text-xs text-muted-foreground">
                          Add breadcrumb navigation
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Local Business Schema</Label>
                        <p className="text-xs text-muted-foreground">
                          Add local business information
                        </p>
                      </div>
                      <Switch />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="custom-schema">Custom Schema JSON-LD</Label>
                      <Textarea
                        id="custom-schema"
                        placeholder='{"@context": "https://schema.org", "@type": "Organization", "name": "Your Company"}'
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ai-seo" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI-Powered SEO Assistant
                  </CardTitle>
                  <CardDescription>
                    Get AI-powered suggestions to improve your SEO
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button className="h-auto p-4 flex-col items-start">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-5 w-5" />
                        <span className="font-medium">Keyword Research</span>
                      </div>
                      <p className="text-sm text-muted-foreground text-left">
                        Find high-impact keywords for your content
                      </p>
                    </Button>

                    <Button className="h-auto p-4 flex-col items-start" variant="outline">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5" />
                        <span className="font-medium">Content Optimization</span>
                      </div>
                      <p className="text-sm text-muted-foreground text-left">
                        Optimize existing content for better rankings
                      </p>
                    </Button>

                    <Button className="h-auto p-4 flex-col items-start" variant="outline">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5" />
                        <span className="font-medium">Competitor Analysis</span>
                      </div>
                      <p className="text-sm text-muted-foreground text-left">
                        Analyze competitor SEO strategies
                      </p>
                    </Button>

                    <Button className="h-auto p-4 flex-col items-start" variant="outline">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-5 w-5" />
                        <span className="font-medium">SEO Recommendations</span>
                      </div>
                      <p className="text-sm text-muted-foreground text-left">
                        Get personalized SEO improvement tips
                      </p>
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Recent AI Suggestions</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Add "web design services" to your meta description</p>
                          <p className="text-xs text-muted-foreground">This keyword has high search volume and low competition</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Your page title is too long (67 characters)</p>
                          <p className="text-xs text-muted-foreground">Consider shortening to 50-60 characters for better display</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Add internal links to your services pages</p>
                          <p className="text-xs text-muted-foreground">This will help distribute page authority and improve navigation</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      SEO Analytics Integration
                    </CardTitle>
                    <CardDescription>
                      Connect your analytics tools
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="google-analytics">Google Analytics ID</Label>
                      <Input
                        id="google-analytics"
                        placeholder="G-XXXXXXXXXX"
                        value={siteSettings.analytics.googleAnalytics}
                        onChange={(e) => setSiteSettings(prev => ({
                          ...prev,
                          analytics: { ...prev.analytics, googleAnalytics: e.target.value }
                        }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="search-console">Google Search Console</Label>
                      <Input id="search-console" placeholder="Verification code" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gtm">Google Tag Manager</Label>
                      <Input
                        id="gtm"
                        placeholder="GTM-XXXXXXX"
                        value={siteSettings.analytics.googleTagManager}
                        onChange={(e) => setSiteSettings(prev => ({
                          ...prev,
                          analytics: { ...prev.analytics, googleTagManager: e.target.value }
                        }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="facebook-pixel">Facebook Pixel</Label>
                      <Input
                        id="facebook-pixel"
                        placeholder="Facebook Pixel ID"
                        value={siteSettings.analytics.facebookPixel}
                        onChange={(e) => setSiteSettings(prev => ({
                          ...prev,
                          analytics: { ...prev.analytics, facebookPixel: e.target.value }
                        }))}
                      />
                    </div>

                    <Button className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Connect Analytics
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      SEO Performance Metrics
                    </CardTitle>
                    <CardDescription>
                      Track your SEO progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold text-green-600">85</p>
                        <p className="text-sm text-muted-foreground">SEO Score</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold text-blue-600">142</p>
                        <p className="text-sm text-muted-foreground">Keywords Ranking</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold text-purple-600">23</p>
                        <p className="text-sm text-muted-foreground">Top 10 Rankings</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold text-orange-600">1.2k</p>
                        <p className="text-sm text-muted-foreground">Organic Clicks</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-medium">Top Performing Keywords</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">web design</span>
                          <Badge variant="secondary">#3</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">responsive design</span>
                          <Badge variant="secondary">#7</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">ui ux design</span>
                          <Badge variant="secondary">#12</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="social" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Share2 className="h-5 w-5" />
                      Open Graph Settings
                    </CardTitle>
                    <CardDescription>
                      Configure how your site appears on social media
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="og-title">Open Graph Title</Label>
                      <Input id="og-title" placeholder="Your Site Title" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="og-description">Open Graph Description</Label>
                      <Textarea id="og-description" placeholder="Description for social sharing..." rows={3} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="og-image">Open Graph Image</Label>
                      <Input id="og-image" placeholder="https://yoursite.com/og-image.jpg" />
                      <p className="text-xs text-muted-foreground">
                        Recommended size: 1200x630 pixels
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="og-type">Content Type</Label>
                      <Select defaultValue="website">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="article">Article</SelectItem>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="profile">Profile</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Share2 className="h-5 w-5" />
                      Twitter Card Settings
                    </CardTitle>
                    <CardDescription>
                      Configure Twitter card appearance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="twitter-card">Card Type</Label>
                      <Select defaultValue="summary_large_image">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="summary">Summary</SelectItem>
                          <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
                          <SelectItem value="app">App</SelectItem>
                          <SelectItem value="player">Player</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="twitter-site">Twitter Site Handle</Label>
                      <Input id="twitter-site" placeholder="@yoursite" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="twitter-creator">Twitter Creator Handle</Label>
                      <Input id="twitter-creator" placeholder="@creator" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="twitter-title">Twitter Title</Label>
                      <Input id="twitter-title" placeholder="Your Site Title" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="twitter-description">Twitter Description</Label>
                      <Textarea id="twitter-description" placeholder="Description for Twitter..." rows={2} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="twitter-image">Twitter Image</Label>
                      <Input id="twitter-image" placeholder="https://yoursite.com/twitter-image.jpg" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gauge className="h-5 w-5" />
                      Page Speed Optimization
                    </CardTitle>
                    <CardDescription>
                      Improve your site's loading speed
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold text-green-600">92</p>
                        <p className="text-sm text-muted-foreground">Desktop Score</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold text-yellow-600">78</p>
                        <p className="text-sm text-muted-foreground">Mobile Score</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Image Compression</Label>
                          <p className="text-xs text-muted-foreground">
                            Automatically compress images
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>CSS Minification</Label>
                          <p className="text-xs text-muted-foreground">
                            Minify CSS files
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>JavaScript Minification</Label>
                          <p className="text-xs text-muted-foreground">
                            Minify JavaScript files
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Browser Caching</Label>
                          <p className="text-xs text-muted-foreground">
                            Enable browser caching
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>GZIP Compression</Label>
                          <p className="text-xs text-muted-foreground">
                            Enable GZIP compression
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>

                    <Button className="w-full">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Run Speed Test
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="h-5 w-5" />
                      Core Web Vitals
                    </CardTitle>
                    <CardDescription>
                      Monitor user experience metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Largest Contentful Paint</p>
                          <p className="text-sm text-muted-foreground">Loading performance</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">1.2s</p>
                          <p className="text-xs text-green-600">Good</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">First Input Delay</p>
                          <p className="text-sm text-muted-foreground">Interactivity</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">45ms</p>
                          <p className="text-xs text-green-600">Good</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Cumulative Layout Shift</p>
                          <p className="text-sm text-muted-foreground">Visual stability</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-yellow-600">0.15</p>
                          <p className="text-xs text-yellow-600">Needs Improvement</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-medium">Optimization Suggestions</h4>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                          <p className="text-sm">Reduce layout shifts by setting image dimensions</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <p className="text-sm">Loading performance is excellent</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <p className="text-sm">Interactivity is within good range</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="design" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Design Settings</h2>
              <p className="text-muted-foreground">Customize your website's appearance and branding</p>
            </div>
            <Button onClick={handleSaveSiteSettings} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Design Settings'}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Brand Identity</CardTitle>
                <CardDescription>Configure your brand colors, logo, and typography</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo URL</Label>
                  <Input
                    id="logo"
                    placeholder="https://yoursite.com/logo.png"
                    value={siteSettings.logo}
                    onChange={(e) => setSiteSettings(prev => ({ ...prev, logo: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="favicon">Favicon URL</Label>
                  <Input
                    id="favicon"
                    placeholder="https://yoursite.com/favicon.ico"
                    value={siteSettings.favicon}
                    onChange={(e) => setSiteSettings(prev => ({ ...prev, favicon: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primary-color"
                        type="color"
                        value={siteSettings.primaryColor}
                        onChange={(e) => setSiteSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={siteSettings.primaryColor}
                        onChange={(e) => setSiteSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondary-color">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondary-color"
                        type="color"
                        value={siteSettings.secondaryColor}
                        onChange={(e) => setSiteSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={siteSettings.secondaryColor}
                        onChange={(e) => setSiteSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        placeholder="#64748b"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="font-family">Font Family</Label>
                  <Select value={siteSettings.fontFamily} onValueChange={(value) => setSiteSettings(prev => ({ ...prev, fontFamily: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                      <SelectItem value="Lato">Lato</SelectItem>
                      <SelectItem value="Montserrat">Montserrat</SelectItem>
                      <SelectItem value="Poppins">Poppins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Layout Settings</CardTitle>
                <CardDescription>Configure header and footer layouts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="header-layout">Header Layout</Label>
                  <Select value={siteSettings.headerLayout} onValueChange={(value) => setSiteSettings(prev => ({ ...prev, headerLayout: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="centered">Centered</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="full-width">Full Width</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer-layout">Footer Layout</Label>
                  <Select value={siteSettings.footerLayout} onValueChange={(value) => setSiteSettings(prev => ({ ...prev, footerLayout: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="expanded">Expanded</SelectItem>
                      <SelectItem value="newsletter">With Newsletter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label>Design Features</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Dark Mode Support</Label>
                        <p className="text-xs text-muted-foreground">Enable dark/light theme toggle</p>
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Animations</Label>
                        <p className="text-xs text-muted-foreground">Enable page animations and transitions</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Sticky Header</Label>
                        <p className="text-xs text-muted-foreground">Keep header visible when scrolling</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Back to Top Button</Label>
                        <p className="text-xs text-muted-foreground">Show scroll to top button</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>Add your social media profiles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    placeholder="https://facebook.com/yourpage"
                    value={siteSettings.socialLinks.facebook}
                    onChange={(e) => setSiteSettings(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, facebook: e.target.value }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input
                    id="twitter"
                    placeholder="https://twitter.com/youraccount"
                    value={siteSettings.socialLinks.twitter}
                    onChange={(e) => setSiteSettings(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    placeholder="https://instagram.com/youraccount"
                    value={siteSettings.socialLinks.instagram}
                    onChange={(e) => setSiteSettings(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, instagram: e.target.value }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    placeholder="https://linkedin.com/company/yourcompany"
                    value={siteSettings.socialLinks.linkedin}
                    onChange={(e) => setSiteSettings(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtube">YouTube</Label>
                  <Input
                    id="youtube"
                    placeholder="https://youtube.com/yourchannel"
                    value={siteSettings.socialLinks.youtube}
                    onChange={(e) => setSiteSettings(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, youtube: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
              <p className="text-muted-foreground">Monitor your website's performance and visitor behavior</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className={`text-xs ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change} from last month
                      </p>
                    </div>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Visitor Trends</CardTitle>
                <CardDescription>Daily visitor statistics over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <Line data={analyticsData.visitors} options={chartOptions} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
                <CardDescription>Most visited pages on your website</CardDescription>
              </CardHeader>
              <CardContent>
                <Bar data={analyticsData.pageViews} options={chartOptions} />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
                <CardDescription>Visitor device statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <Doughnut data={analyticsData.deviceStats} options={doughnutOptions} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
                <CardDescription>Where your visitors come from</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Organic Search</span>
                  </div>
                  <span className="text-sm font-medium">45%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Direct</span>
                  </div>
                  <span className="text-sm font-medium">30%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Social Media</span>
                  </div>
                  <span className="text-sm font-medium">15%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Referral</span>
                  </div>
                  <span className="text-sm font-medium">10%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geographic Data</CardTitle>
                <CardDescription>Top visitor locations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">United States</span>
                  </div>
                  <span className="text-sm font-medium">35%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">United Kingdom</span>
                  </div>
                  <span className="text-sm font-medium">20%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">Canada</span>
                  </div>
                  <span className="text-sm font-medium">15%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">Australia</span>
                  </div>
                  <span className="text-sm font-medium">12%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">Germany</span>
                  </div>
                  <span className="text-sm font-medium">10%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">General Settings</h2>
              <p className="text-muted-foreground">Configure general website settings and preferences</p>
            </div>
            <Button onClick={handleSaveSiteSettings} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Business contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email Address</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="contact@yoursite.com"
                    value={siteSettings.contactInfo.email}
                    onChange={(e) => setSiteSettings(prev => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, email: e.target.value }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Phone Number</Label>
                  <Input
                    id="contact-phone"
                    placeholder="+1 (555) 123-4567"
                    value={siteSettings.contactInfo.phone}
                    onChange={(e) => setSiteSettings(prev => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, phone: e.target.value }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-address">Business Address</Label>
                  <Textarea
                    id="contact-address"
                    placeholder="123 Main St, City, State 12345"
                    value={siteSettings.contactInfo.address}
                    onChange={(e) => setSiteSettings(prev => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, address: e.target.value }
                    }))}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Site Preferences</CardTitle>
                <CardDescription>General website preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-xs text-muted-foreground">
                      Show maintenance page to visitors
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>User Registration</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow new user registrations
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Comments</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable comments on blog posts
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Newsletter Signup</Label>
                    <p className="text-xs text-muted-foreground">
                      Show newsletter signup forms
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Cookie Consent</Label>
                    <p className="text-xs text-muted-foreground">
                      Show cookie consent banner
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Backup & Security</CardTitle>
              <CardDescription>Manage backups and security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-auto p-4 flex-col">
                  <Download className="h-6 w-6 mb-2" />
                  <span className="font-medium">Create Backup</span>
                  <span className="text-xs text-muted-foreground">Export site data</span>
                </Button>

                <Button variant="outline" className="h-auto p-4 flex-col">
                  <Upload className="h-6 w-6 mb-2" />
                  <span className="font-medium">Restore Backup</span>
                  <span className="text-xs text-muted-foreground">Import site data</span>
                </Button>

                <Button variant="outline" className="h-auto p-4 flex-col">
                  <Settings className="h-6 w-6 mb-2" />
                  <span className="font-medium">Security Scan</span>
                  <span className="text-xs text-muted-foreground">Check for issues</span>
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Automatic Backups</Label>
                    <p className="text-xs text-muted-foreground">
                      Create daily automatic backups
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-xs text-muted-foreground">
                      Require 2FA for admin access
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Login Attempts Limit</Label>
                    <p className="text-xs text-muted-foreground">
                      Limit failed login attempts
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HomePageManagement;
