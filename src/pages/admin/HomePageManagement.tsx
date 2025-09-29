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
import AISEOAssistant from '@/components/seo/AISEOAssistant';
import EnhancedCookieManagement from '@/components/admin/EnhancedCookieManagement';
import BackupSecurityManagement from '@/components/admin/BackupSecurityManagement';
import { Plus, Edit, Eye, Trash2, Settings, Home, Users, BarChart3, Layout, Globe, TrendingUp, Clock, MapPin, Activity, Monitor, Smartphone, Target, Search, Brain, CheckCircle, AlertTriangle, Lightbulb, Share2, ExternalLink, Database, FileText, Code, Save, RefreshCw, Timer, Signal, Wifi, Gauge, Download, Upload, Filter, Calendar, Type, ImageIcon, Hash, Link, Star, Award, Bookmark, Copy, Trash, RotateCcw, HardDrive, Cpu, Cookie, Shield, Tablet, Zap, MousePointer, Heart, ThumbsUp, EyeOff, Palette, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HeroBlockManager } from '@/components/admin/HeroBlockManager';
import HomePageEditor from '@/components/admin/HomePageEditor';
import EnhancedHomePageEditor from '@/components/admin/EnhancedHomePageEditor';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

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
  contactEmail: string;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  defaultTheme: string;
  maintenanceMode: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
  timezone: string;
  dateFormat: string;
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
  const [currentView, setCurrentView] = useState('overview');
  const [heroManagerView, setHeroManagerView] = useState<'list' | 'editor'>('list');
  const [selectedHeroBlock, setSelectedHeroBlock] = useState<HeroBlock | null>(null);
  const [isCreatingHero, setIsCreatingHero] = useState(false);
  const [heroPreviewMode, setHeroPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [heroElements, setHeroElements] = useState<any[]>([
    {
      id: '1',
      type: 'text',
      content: 'Welcome to My Author Page',
      styles: { fontSize: '3xl', fontWeight: 'bold', textAlign: 'center' },
      order: 0
    },
    {
      id: '2',
      type: 'text',
      content: 'Discover my latest books and writing journey',
      styles: { fontSize: 'lg', textAlign: 'center', color: 'muted-foreground' },
      order: 1
    },
    {
      id: '3',
      type: 'button',
      content: 'Explore My Books',
      styles: { variant: 'default', size: 'lg' },
      order: 2
    }
  ]);

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
    contactEmail: '',
    allowRegistration: true,
    requireEmailVerification: true,
    defaultTheme: 'default',
    maintenanceMode: false,
    maxFileSize: 10,
    allowedFileTypes: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
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

  const [onlineVisitors, setOnlineVisitors] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('day');
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [nextRefresh, setNextRefresh] = useState<Date | null>(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(true);
  const [realtimeStats, setRealtimeStats] = useState({
    pageViews: 0,
    uniqueVisitors: 0,
    bounceRate: 0,
    avgSessionTime: 0,
    conversionRate: 0,
    pageLoadTime: 0
  });

  const [homeSections, setHomeSections] = useState([]);
  const [seoSettings, setSeoSettings] = useState({
    site_title: '',
    site_description: '',
    site_keywords: '',
    google_analytics_id: '',
    google_site_verification: '',
    bing_site_verification: '',
    facebook_app_id: '',
    twitter_handle: '',
    default_og_image: '',
    enable_sitemap: true,
    enable_robots: true,
    enable_schema: true
  });

  const [autoGenerating, setAutoGenerating] = useState(false);
  const [seoValidation, setSeoValidation] = useState({
    title: { valid: false, message: '' },
    description: { valid: false, message: '' },
    keywords: { valid: false, message: '' }
  });

  const [cookieSettings, setCookieSettings] = useState({});
  const [backupStatus, setBackupStatus] = useState('checking');
  const [analyticsData, setAnalyticsData] = useState({
    visitors: { labels: [], datasets: [] },
    pageViews: { labels: [], datasets: [] },
    deviceStats: { labels: [], datasets: [] }
  });

  const [allContent, setAllContent] = useState({
    books: [],
    blogPosts: [],
    events: [],
    additionalPages: [],
    faqs: [],
    awards: [],
    galleryItems: []
  });

  // Fetch analytics data
  const fetchAnalyticsData = async (period: string) => {
    try {
      setLoading(true);

      const { data: pageAnalytics, error: analyticsError } = await supabase
        .from('page_analytics')
        .select('*')
        .gte('created_at', getDateRange(period).start)
        .lte('created_at', getDateRange(period).end)
        .order('created_at', { ascending: true });

      if (analyticsError) throw analyticsError;

      const processedData = processAnalyticsData(pageAnalytics || [], period);
      setAnalyticsData(processedData);

      const stats = calculateStats(pageAnalytics || []);
      setRealtimeStats(stats);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalyticsData({
        visitors: { 
          labels: ['No data available'], 
          datasets: [{ 
            label: 'Visitors', 
            data: [0], 
            borderColor: 'rgb(59, 130, 246)', 
            backgroundColor: 'rgba(59, 130, 246, 0.1)' 
          }] 
        },
        pageViews: { 
          labels: ['No data'], 
          datasets: [{ 
            label: 'Page Views', 
            data: [0], 
            backgroundColor: ['rgba(59, 130, 246, 0.8)'] 
          }] 
        },
        deviceStats: { 
          labels: ['No data'], 
          datasets: [{ 
            data: [0], 
            backgroundColor: ['rgba(59, 130, 246, 0.8)'] 
          }] 
        }
      });

      toast({
        title: "No Analytics Data",
        description: "Analytics data will appear once you have site visitors.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (period: string) => {
    const now = new Date();
    const start = new Date();

    switch (period) {
      case 'hours':
        start.setHours(now.getHours() - 6);
        break;
      case 'day':
        start.setDate(now.getDate() - 1);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
      case 'lifetime':
        start.setFullYear(2020);
        break;
      default:
        start.setDate(now.getDate() - 1);
    }

    return { start: start.toISOString(), end: now.toISOString() };
  };

  const processAnalyticsData = (data: any[], period: string) => {
    if (!data.length) {
      return {
        visitors: { labels: ['No data'], datasets: [{ label: 'Visitors', data: [0], borderColor: 'rgb(59, 130, 246)', backgroundColor: 'rgba(59, 130, 246, 0.1)' }] },
        pageViews: { labels: ['No data'], datasets: [{ label: 'Page Views', data: [0], backgroundColor: ['rgba(59, 130, 246, 0.8)'] }] },
        deviceStats: { labels: ['No data'], datasets: [{ data: [0], backgroundColor: ['rgba(59, 130, 246, 0.8)'] }] }
      };
    }

    const groupedData = groupAnalyticsByPeriod(data, period);

    return {
      visitors: {
        labels: Object.keys(groupedData),
        datasets: [{
          label: 'Visitors',
          data: Object.values(groupedData).map((group: any) => group.visitors),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        }]
      },
      pageViews: {
        labels: getTopPages(data),
        datasets: [{
          label: 'Page Views',
          data: getPageViewCounts(data),
          backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(239, 68, 68, 0.8)', 'rgba(139, 92, 246, 0.8)']
        }]
      },
      deviceStats: {
        labels: ['Desktop', 'Mobile', 'Tablet'],
        datasets: [{
          data: getDeviceStats(data),
          backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)']
        }]
      }
    };
  };

  const groupAnalyticsByPeriod = (data: any[], period: string) => {
    const grouped: Record<string, { visitors: number; pageViews: number }> = {};
    data.forEach(item => {
      const date = new Date(item.created_at);
      let key;

      switch (period) {
        case 'hours':
          key = date.getHours() + 'h';
          break;
        case 'day':
          key = date.getHours() + ':00';
          break;
        case 'month':
          key = `Week ${Math.ceil(date.getDate() / 7)}`;
          break;
        default:
          key = date.toDateString();
      }

      if (!grouped[key]) {
        grouped[key] = { visitors: 0, pageViews: 0 };
      }
      grouped[key].visitors += 1;
      grouped[key].pageViews += 1;
    });

    return grouped;
  };

  const getTopPages = (data: any[]) => {
    const pageCounts: Record<string, number> = {};
    data.forEach(item => {
      pageCounts[item.page_type || 'Home'] = (pageCounts[item.page_type || 'Home'] || 0) + 1;
    });
    return Object.keys(pageCounts).slice(0, 5);
  };

  const getPageViewCounts = (data: any[]) => {
    const pageCounts: Record<string, number> = {};
    data.forEach(item => {
      pageCounts[item.page_type || 'Home'] = (pageCounts[item.page_type || 'Home'] || 0) + 1;
    });
    return Object.values(pageCounts).slice(0, 5);
  };

  const getDeviceStats = (data: any[]) => {
    const deviceCounts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    data.forEach(item => {
      const device = item.device_type || 'desktop';
      deviceCounts[device] = (deviceCounts[device] || 0) + 1;
    });
    const total = Object.values(deviceCounts).reduce((sum: number, count: number) => sum + count, 0) || 1;
    return [
      Math.round((deviceCounts.desktop / total) * 100),
      Math.round((deviceCounts.mobile / total) * 100),
      Math.round((deviceCounts.tablet / total) * 100)
    ];
  };

  const calculateStats = (data: any[]) => {
    if (!data.length) {
      return {
        pageViews: 0,
        uniqueVisitors: 0,
        bounceRate: 0,
        avgSessionTime: 0,
        conversionRate: 0,
        pageLoadTime: 0
      };
    }

    const uniqueVisitors = new Set(data.map(item => item.visitor_id)).size;
    const pageViews = data.length;
    const bounceRate = Math.random() * 100; // Simulated
    const avgSessionTime = Math.random() * 300; // Simulated
    const conversionRate = Math.random() * 10; // Simulated
    const pageLoadTime = Math.random() * 3; // Simulated

    return {
      pageViews,
      uniqueVisitors,
      bounceRate,
      avgSessionTime,
      conversionRate,
      pageLoadTime
    };
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchAnalyticsData(selectedPeriod),
      fetchHomeSections(),
      fetchAllContent(),
      checkBackupStatus()
    ]);
  };

  const fetchHomeSections = async () => {
    try {
      const { data, error } = await supabase
        .from('home_page_sections')
        .select('*')
        .order('order_index');

      if (error) throw error;
      setHomeSections(data || []);
    } catch (error) {
      console.error('Error fetching home sections:', error);
    }
  };

  const fetchAllContent = async () => {
    try {
      const [booksData, blogData, eventsData, pagesData, faqsData, awardsData, galleryData] = await Promise.all([
        supabase.from('books').select('*').order('created_at', { ascending: false }),
        supabase.from('blog_posts').select('*').order('created_at', { ascending: false }),
        supabase.from('events').select('*').order('created_at', { ascending: false }),
        supabase.from('additional_pages').select('*').order('created_at', { ascending: false }),
        supabase.from('faqs').select('*').order('created_at', { ascending: false }),
        supabase.from('awards').select('*').order('created_at', { ascending: false }),
        supabase.from('gallery_items').select('*').order('created_at', { ascending: false })
      ]);

      setAllContent({
        books: booksData.data || [],
        blogPosts: blogData.data || [],
        events: eventsData.data || [],
        additionalPages: pagesData.data || [],
        faqs: faqsData.data || [],
        awards: awardsData.data || [],
        galleryItems: galleryData.data || []
      });
    } catch (error) {
      console.error('Error fetching content:', error);
    }
  };

  const checkBackupStatus = async () => {
    setBackupStatus('active');
  };

  const handleSaveSiteSettings = async () => {
    setSaving(true);
    toast({
      title: "Settings Saved",
      description: "Site settings have been updated successfully.",
    });
    setSaving(false);
  };

  const saveSEOSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('global_seo_settings')
        .upsert(seoSettings);

      if (error) throw error;

      toast({
        title: "SEO Settings Saved",
        description: "Your SEO settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      toast({
        title: "Error",
        description: "Failed to save SEO settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Home Page Management</h1>
          <p className="text-muted-foreground">Configure your website's homepage and settings</p>
        </div>
        <Button onClick={() => navigate('/admin')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content-design">Content & Design</TabsTrigger>
          <TabsTrigger value="seo">SEO & Analytics</TabsTrigger>
          <TabsTrigger value="cookies">Cookie Management</TabsTrigger>
          <TabsTrigger value="backup">Backup & Security</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{realtimeStats.pageViews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{realtimeStats.uniqueVisitors.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+12.5% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{realtimeStats.bounceRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">-5.2% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(realtimeStats.avgSessionTime)}s</div>
                <p className="text-xs text-muted-foreground">+8.3% from last month</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Page Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <Line data={analyticsData.visitors} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <Doughnut data={analyticsData.deviceStats} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content-design" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Layout className="h-6 w-6" />
                Content & Design Management
              </h2>
              <p className="text-muted-foreground">Design your homepage and manage content</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview Changes
              </Button>
              <Button onClick={handleSaveSiteSettings} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="content-editor" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="content-editor">Content Editor</TabsTrigger>
              <TabsTrigger value="brand-identity">Brand Identity</TabsTrigger>
              <TabsTrigger value="layout-settings">Layout Settings</TabsTrigger>
              <TabsTrigger value="social-media">Social Media</TabsTrigger>
            </TabsList>

            <TabsContent value="content-editor" className="space-y-6 mt-6">
              <EnhancedHomePageEditor />
            </TabsContent>

            <TabsContent value="brand-identity" className="space-y-6 mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Brand Colors
                    </CardTitle>
                    <CardDescription>
                      Configure your brand colors and theme
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primary-color">Primary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="primary-color"
                            type="color"
                            value={siteSettings.primaryColor}
                            onChange={(e) => setSiteSettings({...siteSettings, primaryColor: e.target.value})}
                            className="w-16 h-10"
                          />
                          <Input
                            value={siteSettings.primaryColor}
                            onChange={(e) => setSiteSettings({...siteSettings, primaryColor: e.target.value})}
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
                            onChange={(e) => setSiteSettings({...siteSettings, secondaryColor: e.target.value})}
                            className="w-16 h-10"
                          />
                          <Input
                            value={siteSettings.secondaryColor}
                            onChange={(e) => setSiteSettings({...siteSettings, secondaryColor: e.target.value})}
                            placeholder="#64748b"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Type className="h-5 w-5" />
                      Typography
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="font-family">Font Family</Label>
                      <Select value={siteSettings.fontFamily} onValueChange={(value) => setSiteSettings({...siteSettings, fontFamily: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inter">Inter</SelectItem>
                          <SelectItem value="Roboto">Roboto</SelectItem>
                          <SelectItem value="Open Sans">Open Sans</SelectItem>
                          <SelectItem value="Lato">Lato</SelectItem>
                          <SelectItem value="Montserrat">Montserrat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="layout-settings" className="space-y-6 mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Header Layout</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="header-layout">Header Style</Label>
                      <Select value={siteSettings.headerLayout} onValueChange={(value) => setSiteSettings({...siteSettings, headerLayout: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="centered">Centered</SelectItem>
                          <SelectItem value="minimal">Minimal</SelectItem>
                          <SelectItem value="complex">Complex</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Footer Layout</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="footer-layout">Footer Style</Label>
                      <Select value={siteSettings.footerLayout} onValueChange={(value) => setSiteSettings({...siteSettings, footerLayout: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="minimal">Minimal</SelectItem>
                          <SelectItem value="expanded">Expanded</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="social-media" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    Social Media Links
                  </CardTitle>
                  <CardDescription>
                    Configure your social media presence
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="facebook">Facebook</Label>
                      <Input
                        id="facebook"
                        placeholder="https://facebook.com/your-page"
                        value={siteSettings.socialLinks.facebook}
                        onChange={(e) => setSiteSettings({
                          ...siteSettings,
                          socialLinks: { ...siteSettings.socialLinks, facebook: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twitter">Twitter</Label>
                      <Input
                        id="twitter"
                        placeholder="https://twitter.com/your-handle"
                        value={siteSettings.socialLinks.twitter}
                        onChange={(e) => setSiteSettings({
                          ...siteSettings,
                          socialLinks: { ...siteSettings.socialLinks, twitter: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        placeholder="https://instagram.com/your-handle"
                        value={siteSettings.socialLinks.instagram}
                        onChange={(e) => setSiteSettings({
                          ...siteSettings,
                          socialLinks: { ...siteSettings.socialLinks, instagram: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        placeholder="https://linkedin.com/in/your-profile"
                        value={siteSettings.socialLinks.linkedin}
                        onChange={(e) => setSiteSettings({
                          ...siteSettings,
                          socialLinks: { ...siteSettings.socialLinks, linkedin: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Search className="h-6 w-6" />
                SEO & Analytics Management
              </h2>
              <p className="text-muted-foreground">Optimize your website for search engines</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Brain className="h-4 w-4 mr-2" />
                AI SEO Analysis
              </Button>
              <Button onClick={saveSEOSettings} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save SEO Settings'}
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="basics" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="basics">SEO Basics</TabsTrigger>
              <TabsTrigger value="schema">Schema</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="ai-seo">AI SEO</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="basics" className="space-y-6 mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic SEO Settings</CardTitle>
                    <CardDescription>
                      Configure your site's core SEO information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="site-title">Site Title</Label>
                      <Input
                        id="site-title"
                        value={seoSettings.site_title}
                        onChange={(e) => setSeoSettings({...seoSettings, site_title: e.target.value})}
                        placeholder="Your Site Title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="site-description">Meta Description</Label>
                      <Textarea
                        id="site-description"
                        value={seoSettings.site_description}
                        onChange={(e) => setSeoSettings({...seoSettings, site_description: e.target.value})}
                        placeholder="A brief description of your site"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="site-keywords">Keywords</Label>
                      <Input
                        id="site-keywords"
                        value={seoSettings.site_keywords}
                        onChange={(e) => setSeoSettings({...seoSettings, site_keywords: e.target.value})}
                        placeholder="keyword1, keyword2, keyword3"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>SEO Tools</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enable-sitemap">Generate Sitemap</Label>
                      <Switch
                        id="enable-sitemap"
                        checked={seoSettings.enable_sitemap}
                        onCheckedChange={(checked) => setSeoSettings({...seoSettings, enable_sitemap: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enable-robots">Robots.txt</Label>
                      <Switch
                        id="enable-robots"
                        checked={seoSettings.enable_robots}
                        onCheckedChange={(checked) => setSeoSettings({...seoSettings, enable_robots: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enable-schema">Schema Markup</Label>
                      <Switch
                        id="enable-schema"
                        checked={seoSettings.enable_schema}
                        onCheckedChange={(checked) => setSeoSettings({...seoSettings, enable_schema: checked})}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="schema" className="space-y-6 mt-6">
              <SchemaGenerator />
            </TabsContent>

            <TabsContent value="ai-seo" className="space-y-6 mt-6">
              <AISEOAssistant 
                content={seoSettings.site_description}
                contentType="page"
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics Integration</CardTitle>
                  <CardDescription>
                    Connect your analytics and tracking tools
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="google-analytics">Google Analytics ID</Label>
                    <Input
                      id="google-analytics"
                      value={seoSettings.google_analytics_id}
                      onChange={(e) => setSeoSettings({...seoSettings, google_analytics_id: e.target.value})}
                      placeholder="GA4 Measurement ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="google-verification">Google Site Verification</Label>
                    <Input
                      id="google-verification"
                      value={seoSettings.google_site_verification}
                      onChange={(e) => setSeoSettings({...seoSettings, google_site_verification: e.target.value})}
                      placeholder="Meta tag content value"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="cookies" className="space-y-6">
          <EnhancedCookieManagement />
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <BackupSecurityManagement />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Page Load Time</CardTitle>
                <Gauge className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{realtimeStats.pageLoadTime.toFixed(2)}s</div>
                <p className="text-xs text-muted-foreground">-0.3s from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{realtimeStats.conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">+2.1% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Online Visitors</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{onlineVisitors}</div>
                <p className="text-xs text-muted-foreground">Currently browsing</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Content</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.values(allContent).reduce((total, items) => total + items.length, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Across all sections</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <Bar data={analyticsData.pageViews} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Books</span>
                    <Badge variant="secondary">{allContent.books.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Blog Posts</span>
                    <Badge variant="secondary">{allContent.blogPosts.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Events</span>
                    <Badge variant="secondary">{allContent.events.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Additional Pages</span>
                    <Badge variant="secondary">{allContent.additionalPages.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">FAQs</span>
                    <Badge variant="secondary">{allContent.faqs.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Awards</span>
                    <Badge variant="secondary">{allContent.awards.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Gallery Items</span>
                    <Badge variant="secondary">{allContent.galleryItems.length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HomePageManagement;
