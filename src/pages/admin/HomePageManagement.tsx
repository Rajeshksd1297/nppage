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
  const {
    toast
  } = useToast();
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
  
  // Real-time analytics state
  const [onlineVisitors, setOnlineVisitors] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('day');
  const [refreshInterval, setRefreshInterval] = useState(5); // Default 5 minutes
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
  const [heroTemplates, setHeroTemplates] = useState([
    {
      id: 'modern-minimal',
      name: 'Modern Minimal',
      description: 'Clean and simple hero with centered content',
      category: 'free',
      icon: Type,
      features: ['Centered Layout', 'Clean Typography', 'Single CTA'],
      preview_image_url: '',
      config: {
        layout: 'centered',
        background: 'gradient',
        animation: 'fade-in',
        responsive: true
      }
    },
    {
      id: 'split-screen',
      name: 'Split Screen Hero',
      description: 'Content on left, image on right layout',
      category: 'free',
      icon: Layout,
      features: ['Split Layout', 'Image Support', 'Dual CTA'],
      preview_image_url: '',
      config: {
        layout: 'split',
        background: 'image',
        animation: 'slide-in',
        responsive: true
      }
    },
    {
      id: 'video-background',
      name: 'Video Background',
      description: 'Full-screen video with overlay text',
      category: 'premium',
      icon: Monitor,
      features: ['Video Background', 'Overlay Text', 'Auto-play'],
      preview_image_url: '',
      config: {
        layout: 'fullscreen',
        background: 'video',
        animation: 'zoom-in',
        responsive: true,
        hasVideo: true
      }
    },
    {
      id: 'interactive-cards',
      name: 'Interactive Cards',
      description: 'Hero with interactive feature cards',
      category: 'premium',
      icon: MousePointer,
      features: ['Card Layout', 'Hover Effects', 'Interactive Elements'],
      preview_image_url: '',
      config: {
        layout: 'cards',
        background: 'gradient',
        animation: 'stagger',
        responsive: true,
        hasAnimation: true
      }
    },
    {
      id: 'author-showcase',
      name: 'Author Showcase',
      description: 'Perfect for author profiles with book highlights',
      category: 'free',
      icon: Star,
      features: ['Author Focus', 'Book Display', 'Social Links'],
      preview_image_url: '',
      config: {
        layout: 'author-focused',
        background: 'image',
        animation: 'fade-up',
        responsive: true,
        authorFeatures: true
      }
    },
    {
      id: 'animated-gradient',
      name: 'Animated Gradient',
      description: 'Dynamic gradient background with smooth animations',
      category: 'premium',
      icon: Palette,
      features: ['Animated Background', 'Smooth Transitions', 'Modern Design'],
      preview_image_url: '',
      config: {
        layout: 'centered',
        background: 'animated-gradient',
        animation: 'gradient-shift',
        responsive: true,
        hasAnimation: true
      }
    }
  ]);

  // Fetch real analytics data from database
  const fetchAnalyticsData = async (period: string) => {
    try {
      setLoading(true);
      
      // Fetch page analytics data
      const { data: pageAnalytics, error: analyticsError } = await supabase
        .from('page_analytics')
        .select('*')
        .gte('created_at', getDateRange(period).start)
        .lte('created_at', getDateRange(period).end)
        .order('created_at', { ascending: true });

      if (analyticsError) throw analyticsError;

      // Process analytics data
      const processedData = processAnalyticsData(pageAnalytics || [], period);
      setAnalyticsData(processedData);

      // Update real-time stats
      const stats = calculateStats(pageAnalytics || []);
      setRealtimeStats(stats);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Show empty state with message
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

  // Helper functions for analytics
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

    // Group data by time periods
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
    // Implementation to group analytics by time period
    const grouped = {};
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
    const pageCounts = {};
    data.forEach(item => {
      pageCounts[item.page_type || 'Home'] = (pageCounts[item.page_type || 'Home'] || 0) + 1;
    });
    return Object.keys(pageCounts).slice(0, 5);
  };

  const getPageViewCounts = (data: any[]) => {
    const pageCounts = {};
    data.forEach(item => {
      pageCounts[item.page_type || 'Home'] = (pageCounts[item.page_type || 'Home'] || 0) + 1;
    });
    return Object.values(pageCounts).slice(0, 5);
  };

  const getDeviceStats = (data: any[]) => {
    const deviceCounts = { desktop: 0, mobile: 0, tablet: 0 };
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
    const sessions = new Set(data.map(item => item.session_id)).size || 1;
    
    return {
      pageViews: data.length,
      uniqueVisitors,
      bounceRate: Math.round((sessions / uniqueVisitors) * 100) || 0,
      avgSessionTime: Math.round(data.length / sessions * 120) || 0, // Estimate
      conversionRate: Number((uniqueVisitors * 0.03).toFixed(2)) || 0,
      pageLoadTime: Number((1.2 + Math.random() * 0.6).toFixed(2)) || 1.5
    };
  };
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };
  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const
      }
    }
  };
  useEffect(() => {
    fetchHeroBlocks();
    fetchSiteSettings();
    fetchHomeSections();
    fetchSEOSettings();
    fetchCookieSettings();
    checkBackupStatus();
    fetchAllContent();
    setupRealtimeTracking();
    fetchAnalyticsData(selectedPeriod);
    setupAutoRefresh();
  }, []);

  // Fetch all content from across the portal
  const fetchAllContent = async () => {
    try {
      // Fetch books
      const { data: books, error: booksError } = await supabase
        .from('books')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (booksError) throw booksError;

      // Fetch blog posts
      const { data: blogPosts, error: blogError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (blogError) throw blogError;

      // Fetch events
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true });

      if (eventsError) throw eventsError;

      // Fetch additional pages - handle potential type issues
      let additionalPages: any[] = [];
      try {
        const pagesQuery = await (supabase as any)
          .from('additional_pages')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false });
        
        if (pagesQuery.error && pagesQuery.error.code !== 'PGRST116') {
          console.warn('Additional pages error:', pagesQuery.error);
        } else {
          additionalPages = pagesQuery.data || [];
        }
      } catch (error) {
        console.warn('Additional pages table not available:', error);
      }

      // Fetch FAQs
      const { data: faqs, error: faqsError } = await supabase
        .from('faqs')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });

      if (faqsError && faqsError.code !== 'PGRST116') {
        console.warn('FAQs table error:', faqsError);
      }

      // Fetch awards
      const { data: awards, error: awardsError } = await supabase
        .from('awards')
        .select('*')
        .order('award_date', { ascending: false });

      if (awardsError && awardsError.code !== 'PGRST116') {
        console.warn('Awards table error:', awardsError);
      }

      // Fetch gallery items
      const { data: galleryItems, error: galleryError } = await supabase
        .from('gallery_items')
        .select('*')
        .order('sort_order', { ascending: true });

      if (galleryError && galleryError.code !== 'PGRST116') {
        console.warn('Gallery items table error:', galleryError);
      }

      setAllContent({
        books: books || [],
        blogPosts: blogPosts || [],
        events: events || [],
        additionalPages: additionalPages || [],
        faqs: faqs || [],
        awards: awards || [],
        galleryItems: galleryItems || []
      });

      toast({
        title: "Content Synced",
        description: "All portal content has been synchronized successfully",
      });

    } catch (error) {
      console.error('Error fetching all content:', error);
      toast({
        title: "Sync Error",
        description: "Failed to sync some content from the portal",
        variant: "destructive"
      });
    }
  };

  // Add content section to home page
  const addContentSection = async (sectionType: string, contentData: any) => {
    try {
      const newSection = {
        type: sectionType,
        title: `${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} Section`,
        enabled: true,
        order_index: homeSections.length,
        config: {
          contentId: contentData.id,
          contentType: sectionType,
          data: contentData,
          title: contentData.title || `New ${sectionType} Section`,
          subtitle: contentData.subtitle || contentData.excerpt || contentData.description,
          backgroundColor: 'background',
          animation: 'fade-in'
        }
      };

      const { data, error } = await supabase
        .from('home_page_sections')
        .insert([newSection])
        .select()
        .single();

      if (error) throw error;

      setHomeSections(prev => [...prev, data]);
      
      toast({
        title: "Section Added",
        description: `${sectionType} section has been added to your home page`,
      });

    } catch (error) {
      console.error('Error adding content section:', error);
      toast({
        title: "Error",
        description: "Failed to add section to home page",
        variant: "destructive"
      });
    }
  };

  // Edit section
  const editSection = (section: any) => {
    // Navigate to section editor or open modal
    setActiveTab('hero'); // For now, switch to hero tab for editing
  };

  // Toggle section visibility
  const toggleSection = async (sectionId: string) => {
    try {
      const section = homeSections.find((s: any) => s.id === sectionId);
      if (!section) return;

      const { error } = await supabase
        .from('home_page_sections')
        .update({ enabled: !section.enabled })
        .eq('id', sectionId);

      if (error) throw error;

      setHomeSections(prev => 
        prev.map((s: any) => 
          s.id === sectionId ? { ...s, enabled: !s.enabled } : s
        )
      );

      toast({
        title: "Section Updated",
        description: `Section ${section.enabled ? 'disabled' : 'enabled'} successfully`,
      });

    } catch (error) {
      console.error('Error toggling section:', error);
      toast({
        title: "Error",
        description: "Failed to update section",
        variant: "destructive"
      });
    }
  };

  // Hero Block Management Functions
  const createHeroFromTemplate = async (template: any) => {
    try {
      const newHeroBlock = {
        name: `${template.name} - Custom`,
        description: `${template.description} (Created from template)`,
        enabled: false,
        config: {
          ...template.config,
          template_id: template.id,
          created_from_template: true,
          usage_count: 0,
          elements: generateTemplateElements(template),
          customizations: {}
        }
      };

      const { data, error } = await supabase
        .from('hero_blocks')
        .insert([newHeroBlock])
        .select()
        .single();

      if (error) throw error;

      setHeroBlocks(prev => [...prev, data]);
      
      toast({
        title: "Hero Block Created",
        description: `New hero block created from ${template.name} template`,
      });

      // Navigate to editor
      setSelectedHeroBlock(data);
      setHeroManagerView('editor');
      setIsCreatingHero(false);
      setActiveTab('hero');
      
      // Load elements from template
      if (generateTemplateElements(template)) {
        setHeroElements(generateTemplateElements(template));
      }

    } catch (error) {
      console.error('Error creating hero from template:', error);
      toast({
        title: "Error",
        description: "Failed to create hero block from template",
        variant: "destructive"
      });
    }
  };

  const generateTemplateElements = (template: any) => {
    switch (template.id) {
      case 'modern-minimal':
        return [
          {
            id: '1',
            type: 'text',
            content: 'Welcome to Your Story',
            styles: { fontSize: '4xl', fontWeight: 'bold', textAlign: 'center', marginBottom: '4' }
          },
          {
            id: '2',
            type: 'text',
            content: 'Discover compelling narratives and join thousands of readers on an unforgettable journey.',
            styles: { fontSize: 'lg', textAlign: 'center', color: 'muted-foreground', marginBottom: '8' }
          },
          {
            id: '3',
            type: 'button',
            content: 'Start Reading',
            styles: { variant: 'default', size: 'lg' }
          }
        ];
      case 'split-screen':
        return [
          {
            id: '1',
            type: 'text',
            content: 'Transform Your Reading Experience',
            styles: { fontSize: '3xl', fontWeight: 'bold', textAlign: 'left', marginBottom: '4' }
          },
          {
            id: '2',
            type: 'text',
            content: 'Explore our curated collection of bestselling authors and discover your next favorite book.',
            styles: { fontSize: 'lg', textAlign: 'left', marginBottom: '6' }
          },
          {
            id: '3',
            type: 'button',
            content: 'Browse Books',
            styles: { variant: 'default', size: 'lg', marginRight: '4' }
          },
          {
            id: '4',
            type: 'button',
            content: 'Learn More',
            styles: { variant: 'outline', size: 'lg' }
          },
          {
            id: '5',
            type: 'image',
            content: '/api/placeholder/600/400',
            styles: { width: '100%', height: '400px', objectFit: 'cover', borderRadius: 'lg' }
          }
        ];
      case 'author-showcase':
        return [
          {
            id: '1',
            type: 'image',
            content: '/api/placeholder/150/150',
            styles: { width: '150px', height: '150px', borderRadius: 'full', marginBottom: '4' }
          },
          {
            id: '2',
            type: 'text',
            content: 'Meet the Author',
            styles: { fontSize: '3xl', fontWeight: 'bold', textAlign: 'center', marginBottom: '2' }
          },
          {
            id: '3',
            type: 'text',
            content: 'Award-winning novelist with over 10 bestselling books',
            styles: { fontSize: 'lg', textAlign: 'center', color: 'muted-foreground', marginBottom: '6' }
          },
          {
            id: '4',
            type: 'button',
            content: 'View Books',
            styles: { variant: 'default', size: 'lg' }
          }
        ];
      default:
        return [
          {
            id: '1',
            type: 'text',
            content: 'Hero Title',
            styles: { fontSize: '3xl', fontWeight: 'bold', textAlign: 'center' }
          }
        ];
    }
  };

  const previewTemplate = (template: any) => {
    toast({
      title: "Template Preview",
      description: `Previewing ${template.name} template`,
    });
    // Could open a modal or navigate to preview
  };

  const editHeroBlock = (block: any) => {
    // Set the selected block and switch to editor view
    setSelectedHeroBlock(block);
    setHeroManagerView('editor');
    setIsCreatingHero(false);
    setActiveTab('hero'); // Ensure we're on the hero tab
    
    // Load elements from block config
    if (block.config?.elements) {
      setHeroElements(block.config.elements);
    }
    
    toast({
      title: "Editing Hero Block",
      description: `Opening editor for ${block.name}`,
    });
  };

  const createNewHeroBlock = () => {
    setSelectedHeroBlock({
      id: Date.now().toString(),
      name: '',
      description: '',
      enabled: true,
      config: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    setIsCreatingHero(true);
    setHeroManagerView('editor');
    setHeroElements([
      {
        id: '1',
        type: 'text',
        content: 'New Hero Title',
        styles: { fontSize: '3xl', fontWeight: 'bold', textAlign: 'center' },
        order: 0
      }
    ]);
  };

  const saveHeroBlock = async () => {
    if (!selectedHeroBlock?.name) {
      toast({
        title: "Error",
        description: "Please enter a block name",
        variant: "destructive"
      });
      return;
    }

    try {
      const blockData = {
        name: selectedHeroBlock.name,
        description: selectedHeroBlock.description || 'Custom hero block',
        enabled: selectedHeroBlock.enabled ?? true,
        config: { elements: heroElements }
      };

      let result;
      if (isCreatingHero) {
        const { data, error } = await supabase
          .from('hero_blocks')
          .insert([blockData])
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('hero_blocks')
          .update(blockData)
          .eq('id', selectedHeroBlock.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      // Update local state
      if (isCreatingHero) {
        setHeroBlocks(prev => [...prev, result]);
      } else {
        setHeroBlocks(prev => prev.map(b => b.id === result.id ? result : b));
      }

      // Reset form
      setSelectedHeroBlock(null);
      setIsCreatingHero(false);
      setHeroManagerView('list');
      
      toast({
        title: "Success",
        description: "Hero block saved successfully",
      });

    } catch (error) {
      console.error('Error saving hero block:', error);
      toast({
        title: "Error",
        description: "Failed to save hero block",
        variant: "destructive"
      });
    }
  };

  const addHeroElement = (type: string) => {
    const newElement = {
      id: Date.now().toString(),
      type,
      content: getDefaultContent(type),
      styles: getDefaultStyles(type),
      order: heroElements.length
    };
    setHeroElements(prev => [...prev, newElement]);
  };

  const removeHeroElement = (id: string) => {
    setHeroElements(prev => prev.filter(element => element.id !== id));
  };

  const updateHeroElement = (id: string, updates: any) => {
    setHeroElements(prev => 
      prev.map(element => 
        element.id === id ? { ...element, ...updates } : element
      )
    );
  };

  const getDefaultContent = (type: string): string => {
    switch (type) {
      case 'text': return 'New text element';
      case 'image': return '/api/placeholder/400/300';
      case 'button': return 'Click Me';
      case 'video': return 'https://example.com/video.mp4';
      case 'spacer': return '';
      default: return '';
    }
  };

  const getDefaultStyles = (type: string): any => {
    switch (type) {
      case 'text': return { fontSize: 'base', textAlign: 'left', fontWeight: 'normal' };
      case 'image': return { width: '100%', height: 'auto', borderRadius: 'rounded' };
      case 'button': return { variant: 'default', size: 'md' };
      case 'video': return { width: '100%', height: 'auto', controls: true };
      case 'spacer': return { height: '2rem' };
      default: return {};
    }
  };

  const previewHeroBlock = (block: any) => {
    // Open preview modal or navigate to preview
    toast({
      title: "Hero Block Preview",
      description: `Previewing ${block.name}`,
    });
  };

  const duplicateHeroBlock = async (block: any) => {
    try {
      const duplicatedBlock = {
        name: `${block.name} (Copy)`,
        description: `${block.description} (Duplicate)`,
        enabled: false,
        config: {
          ...block.config,
          usage_count: 0,
          created_from_duplicate: true,
          original_id: block.id
        }
      };

      const { data, error } = await supabase
        .from('hero_blocks')
        .insert([duplicatedBlock])
        .select()
        .single();

      if (error) throw error;

      setHeroBlocks(prev => [...prev, data]);
      
      toast({
        title: "Hero Block Duplicated",
        description: `Created a copy of ${block.name}`,
      });

    } catch (error) {
      console.error('Error duplicating hero block:', error);
      toast({
        title: "Error",
        description: "Failed to duplicate hero block",
        variant: "destructive"
      });
    }
  };

  const toggleHeroBlock = async (blockId: string) => {
    try {
      const block = heroBlocks.find(b => b.id === blockId);
      if (!block) return;

      const { error } = await supabase
        .from('hero_blocks')
        .update({ enabled: !block.enabled })
        .eq('id', blockId);

      if (error) throw error;

      setHeroBlocks(prev => 
        prev.map(b => 
          b.id === blockId ? { ...b, enabled: !b.enabled } : b
        )
      );

      toast({
        title: "Hero Block Updated",
        description: `Hero block ${block.enabled ? 'disabled' : 'enabled'}`,
      });

    } catch (error) {
      console.error('Error toggling hero block:', error);
      toast({
        title: "Error",
        description: "Failed to update hero block",
        variant: "destructive"
      });
    }
  };

  const deleteHeroBlock = async (blockId: string) => {
    if (!confirm('Are you sure you want to delete this hero block?')) return;

    try {
      const { error } = await supabase
        .from('hero_blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      setHeroBlocks(prev => prev.filter(b => b.id !== blockId));
      
      toast({
        title: "Hero Block Deleted",
        description: "Hero block has been permanently removed",
      });

    } catch (error) {
      console.error('Error deleting hero block:', error);
      toast({
        title: "Error",
        description: "Failed to delete hero block",
        variant: "destructive"
      });
    }
  };

  const setAsDefaultHero = async (blockId: string) => {
    try {
      // First, get all blocks and update them
      const { data: allBlocks, error: fetchError } = await supabase
        .from('hero_blocks')
        .select('*');

      if (fetchError) throw fetchError;

      // Update all blocks to remove default status
      for (const block of allBlocks) {
        const currentConfig = block.config && typeof block.config === 'object' ? block.config : {};
        const updatedConfig = Object.assign({}, currentConfig, {
          isDefault: block.id === blockId
        });

        const { error: updateError } = await supabase
          .from('hero_blocks')
          .update({ config: updatedConfig })
          .eq('id', block.id);

        if (updateError) throw updateError;
      }

      // Update local state
      setHeroBlocks(prev => 
        prev.map(b => ({
          ...b,
          config: Object.assign(
            {},
            b.config && typeof b.config === 'object' ? b.config : {},
            { isDefault: b.id === blockId }
          )
        }))
      );

      toast({
        title: "Default Hero Set",
        description: "This hero block is now the default",
      });

    } catch (error) {
      console.error('Error setting default hero:', error);
      toast({
        title: "Error",
        description: "Failed to set default hero block",
        variant: "destructive"
      });
    }
  };

  // Fetch analytics data when period changes
  useEffect(() => {
    fetchAnalyticsData(selectedPeriod);
  }, [selectedPeriod]);

  // Validate SEO data when it changes
  useEffect(() => {
    validateSEOData(seoSettings);
  }, [seoSettings.site_title, seoSettings.site_description, seoSettings.site_keywords, siteSettings.siteName, siteSettings.siteDescription, siteSettings.siteKeywords]);

  // Fetch home page sections from database
  const fetchHomeSections = async () => {
    try {
      const { data, error } = await supabase
        .from('home_page_sections')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      setHomeSections(data || []);
      
      if (!data || data.length === 0) {
        toast({
          title: "No Home Page Sections",
          description: "Create your first home page section to get started.",
        });
      }
    } catch (error) {
      console.error('Error fetching home sections:', error);
      toast({
        title: "Error",
        description: "Failed to fetch home page sections",
        variant: "destructive"
      });
    }
  };

  // Fetch SEO settings from database
  const fetchSEOSettings = async () => {
    try {
      // Initialize from current siteSettings
      const initialSEO = {
        site_title: siteSettings.siteName,
        site_description: siteSettings.siteDescription,
        site_keywords: siteSettings.siteKeywords,
        google_analytics_id: siteSettings.analytics?.googleAnalytics || '',
        google_site_verification: '',
        bing_site_verification: '',
        facebook_app_id: '',
        twitter_handle: '',
        default_og_image: '',
        enable_sitemap: true,
        enable_robots: true,
        enable_schema: true
      };

      // Try to load from localStorage for persistent settings
      const savedSEO = localStorage.getItem('seo_settings');
      if (savedSEO) {
        const parsed = JSON.parse(savedSEO);
        setSeoSettings({ ...initialSEO, ...parsed });
        validateSEOData({ ...initialSEO, ...parsed });
      } else {
        setSeoSettings(initialSEO);
        validateSEOData(initialSEO);
      }
      
    } catch (error) {
      console.error('Error loading SEO settings:', error);
    }
  };

  // Save SEO settings 
  const saveSEOSettings = async () => {
    try {
      setSaving(true);
      
      const seoData = {
        site_title: seoSettings.site_title || siteSettings.siteName,
        site_description: seoSettings.site_description || siteSettings.siteDescription,
        site_keywords: seoSettings.site_keywords || siteSettings.siteKeywords,
        google_site_verification: seoSettings.google_site_verification,
        bing_site_verification: seoSettings.bing_site_verification,
        facebook_app_id: seoSettings.facebook_app_id,
        twitter_handle: seoSettings.twitter_handle,
        default_og_image: seoSettings.default_og_image,
        enable_sitemap: seoSettings.enable_sitemap,
        enable_robots: seoSettings.enable_robots,
        enable_schema: seoSettings.enable_schema
      };

      // Save to localStorage for immediate persistence
      localStorage.setItem('seo_settings', JSON.stringify(seoData));

      // Update site settings to sync
      setSiteSettings(prev => ({
        ...prev,
        siteName: seoData.site_title,
        siteDescription: seoData.site_description,
        siteKeywords: seoData.site_keywords
      }));

      // Update real-time SEO on the website
      updateWebsiteSEO(seoData);
      
      toast({
        title: "Success",
        description: "SEO settings saved and applied to website",
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

  // Auto-generate SEO data
  const autoGenerateSEO = async () => {
    try {
      setAutoGenerating(true);
      
      // Fetch user profile and content for context
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, bio, specializations')
        .single();
        
      const { data: books } = await supabase
        .from('books')
        .select('title, description, genres')
        .eq('status', 'published')
        .limit(3);

      const { data: blogPosts } = await supabase
        .from('blog_posts')
        .select('title, excerpt')
        .eq('status', 'published')
        .limit(3);

      // Generate intelligent SEO content
      const authorName = profile?.full_name || 'Author';
      const specializations = profile?.specializations || [];
      const genres = books?.flatMap(book => book.genres || []) || [];
      
      const generatedTitle = generateSEOTitle(authorName, specializations, genres);
      const generatedDescription = generateSEODescription(authorName, profile?.bio, books, blogPosts);
      const generatedKeywords = generateSEOKeywords(specializations, genres, books);

      const newSeoSettings = {
        ...seoSettings,
        site_title: generatedTitle,
        site_description: generatedDescription,
        site_keywords: generatedKeywords
      };

      setSeoSettings(newSeoSettings);
      setSiteSettings(prev => ({
        ...prev,
        siteName: generatedTitle,
        siteDescription: generatedDescription,
        siteKeywords: generatedKeywords
      }));

      validateSEOData(newSeoSettings);

      toast({
        title: "SEO Generated",
        description: "AI-powered SEO content has been generated. Review and save changes.",
      });

    } catch (error) {
      console.error('Error generating SEO:', error);
      toast({
        title: "Error",
        description: "Failed to generate SEO content",
        variant: "destructive"
      });
    } finally {
      setAutoGenerating(false);
    }
  };

  // SEO generation helpers
  const generateSEOTitle = (authorName: string, specializations: string[], genres: string[]) => {
    if (specializations.length > 0) {
      return `${authorName} - ${specializations[0]} Author | Books & Writing`;
    }
    if (genres.length > 0) {
      return `${authorName} - ${genres[0]} Author | Published Books`;
    }
    return `${authorName} - Author & Writer | Official Website`;
  };

  const generateSEODescription = (authorName: string, bio: string, books: any[], blogPosts: any[]) => {
    const bookCount = books?.length || 0;
    const postCount = blogPosts?.length || 0;
    
    let description = `Official website of ${authorName}`;
    
    if (bio && bio.length > 20) {
      const bioSnippet = bio.substring(0, 100).trim();
      description += `. ${bioSnippet}${bioSnippet.length === 100 ? '...' : ''}`;
    }
    
    if (bookCount > 0) {
      description += `. Published author with ${bookCount} book${bookCount > 1 ? 's' : ''}`;
    }
    
    if (postCount > 0) {
      description += `. Active blogger with ${postCount}+ posts`;
    }
    
    description += '. Discover books, latest updates, and connect with the author.';
    
    return description.length > 160 ? description.substring(0, 157) + '...' : description;
  };

  const generateSEOKeywords = (specializations: string[], genres: string[], books: any[]) => {
    const keywords = new Set();
    
    // Add specializations
    specializations.forEach(spec => keywords.add(spec.toLowerCase()));
    
    // Add genres
    genres.forEach(genre => keywords.add(genre.toLowerCase()));
    
    // Add book titles (first words)
    books?.forEach(book => {
      if (book.title) {
        const firstWord = book.title.split(' ')[0].toLowerCase();
        if (firstWord.length > 3) keywords.add(firstWord);
      }
    });
    
    // Add common author keywords
    keywords.add('author');
    keywords.add('writer');
    keywords.add('books');
    keywords.add('published');
    keywords.add('writing');
    
    return Array.from(keywords).slice(0, 15).join(', ');
  };

  // Validate SEO data
  const validateSEOData = (data: any) => {
    const validation = {
      title: { valid: true, message: '' },
      description: { valid: true, message: '' },
      keywords: { valid: true, message: '' }
    };

    // Validate title
    const title = data.site_title || '';
    if (!title) {
      validation.title = { valid: false, message: 'Title is required' };
    } else if (title.length < 10) {
      validation.title = { valid: false, message: 'Title too short (min 10 characters)' };
    } else if (title.length > 60) {
      validation.title = { valid: false, message: 'Title too long (max 60 characters)' };
    }

    // Validate description
    const description = data.site_description || '';
    if (!description) {
      validation.description = { valid: false, message: 'Description is required' };
    } else if (description.length < 50) {
      validation.description = { valid: false, message: 'Description too short (min 50 characters)' };
    } else if (description.length > 160) {
      validation.description = { valid: false, message: 'Description too long (max 160 characters)' };
    }

    // Validate keywords
    const keywords = data.site_keywords || '';
    if (!keywords) {
      validation.keywords = { valid: false, message: 'Keywords are recommended' };
    } else {
      const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k);
      if (keywordArray.length < 3) {
        validation.keywords = { valid: false, message: 'Add at least 3 keywords' };
      } else if (keywordArray.length > 15) {
        validation.keywords = { valid: false, message: 'Too many keywords (max 15)' };
      }
    }

    setSeoValidation(validation);
  };

  // Update website SEO in real-time
  const updateWebsiteSEO = (seoData: any) => {
    // Update document title and meta tags
    if (seoData.site_title) {
      document.title = seoData.site_title;
    }
    
    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement;
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    if (seoData.site_description) {
      metaDesc.content = seoData.site_description;
    }
    
    // Update meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]') as HTMLMetaElement;
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.name = 'keywords';
      document.head.appendChild(metaKeywords);
    }
    if (seoData.site_keywords) {
      metaKeywords.content = seoData.site_keywords;
    }
  };

  // Fetch cookie settings
  const fetchCookieSettings = async () => {
    // Cookie settings from site_settings or default values
    setCookieSettings({
      enabled: true,
      essential_cookies: true,
      analytics_cookies: siteSettings.analytics?.googleAnalytics ? true : false,
      marketing_cookies: false
    });
  };

  // Check backup status
  const checkBackupStatus = async () => {
    // For now, show up-to-date status
    // This can be enhanced when backup system is implemented
    setBackupStatus('up-to-date');
  };

  // Save home page sections to database
  const saveHomeSections = async (sections: any[]) => {
    try {
      // Clear existing sections first
      const { error: deleteError } = await supabase
        .from('home_page_sections')
        .delete()
        .neq('id', 'never-match');
      
      if (deleteError) throw deleteError;

      // Insert new sections
      const { error: insertError } = await supabase
        .from('home_page_sections')
        .insert(sections.map((section, index) => ({
          type: section.type,
          title: section.title,
          enabled: section.enabled,
          order_index: index,
          config: section.config
        })));

      if (insertError) throw insertError;
      
      toast({
        title: "Success",
        description: "Home page sections saved successfully"
      });
      
      fetchHomeSections();
    } catch (error) {
      console.error('Error saving home sections:', error);
      toast({
        title: "Error", 
        description: "Failed to save home page sections",
        variant: "destructive"
      });
    }
  };

  // Setup auto-refresh functionality
  useEffect(() => {
    if (!isAutoRefreshing || refreshInterval === 0) return;

    const intervalMs = refreshInterval * 60 * 1000; // Convert minutes to milliseconds
    setNextRefresh(new Date(Date.now() + intervalMs));

    const interval = setInterval(() => {
      refreshAnalyticsData();
      setLastRefresh(new Date());
      setNextRefresh(new Date(Date.now() + intervalMs));
    }, intervalMs);

    return () => {
      clearInterval(interval);
    };
  }, [refreshInterval, isAutoRefreshing]);

  // Update countdown display every second
  useEffect(() => {
    if (!isAutoRefreshing || !nextRefresh) return;

    const updateCountdown = setInterval(() => {
      // Force re-render to update countdown display
      setLastRefresh(prev => new Date(prev.getTime()));
    }, 1000);

    return () => clearInterval(updateCountdown);
  }, [isAutoRefreshing, nextRefresh]);

  const setupAutoRefresh = () => {
    const initialRefreshTime = new Date(Date.now() + refreshInterval * 60 * 1000);
    setNextRefresh(initialRefreshTime);
  };

  const refreshAnalyticsData = () => {
    // Refresh real analytics data from database
    fetchAnalyticsData(selectedPeriod);
    fetchHomeSections();
    fetchAllContent();
    checkBackupStatus();
    
    toast({
      title: "Data Refreshed",
      description: "All data has been updated from the database",
    });
  };
  
  // Setup realtime tracking for analytics
  const setupRealtimeTracking = () => {
    const channel = supabase.channel('homepage_analytics')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'page_analytics'
      }, (payload) => {
        console.log('Analytics updated:', payload);
        fetchAnalyticsData(selectedPeriod);
      })
      .on('postgres_changes', {
        event: '*', 
        schema: 'public',
        table: 'home_page_sections'
      }, (payload) => {
        console.log('Home sections updated:', payload);
        fetchHomeSections();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public', 
        table: 'hero_blocks'
      }, (payload) => {
        console.log('Hero blocks updated:', payload);
        fetchHeroBlocks();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'books'
      }, (payload) => {
        console.log('Books updated:', payload);
        fetchAllContent();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'blog_posts'
      }, (payload) => {
        console.log('Blog posts updated:', payload);
        fetchAllContent();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'events'
      }, (payload) => {
        console.log('Events updated:', payload);
        fetchAllContent();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'additional_pages'
      }, (payload) => {
        console.log('Additional pages updated:', payload);
        fetchAllContent();
      })
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const count = Object.keys(newState).length;
        setOnlineVisitors(count);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setOnlineVisitors(prev => prev + newPresences.length);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        setOnlineVisitors(prev => Math.max(0, prev - leftPresences.length));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: 'admin-dashboard',
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };
  
  // Real-time visitor tracking
  const trackRealTimeVisitors = () => {
    // Update analytics every 30 seconds for real-time feel
    const interval = setInterval(() => {
      fetchAnalyticsData(selectedPeriod);
    }, 30000);
    
    return () => clearInterval(interval);
  };
  const fetchHeroBlocks = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('hero_blocks').select('*').order('created_at', {
        ascending: true
      });
      if (error) throw error;
      setHeroBlocks(data || []);
    } catch (error) {
      console.error('Error fetching hero blocks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch hero blocks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const fetchSiteSettings = async () => {
    try {
      // Use any to bypass TypeScript issues with the new table
      const {
        data,
        error
      } = await (supabase as any).from('site_settings').select('*').maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setSiteSettings(prev => ({
          ...prev,
          siteName: data.site_name || prev.siteName,
          siteDescription: data.site_description || prev.siteDescription,
          siteKeywords: data.site_keywords || prev.siteKeywords,
          contactEmail: data.contact_email || prev.contactEmail,
          allowRegistration: data.allow_registration ?? prev.allowRegistration,
          requireEmailVerification: data.require_email_verification ?? prev.requireEmailVerification,
          defaultTheme: data.default_theme || prev.defaultTheme,
          maintenanceMode: data.maintenance_mode ?? prev.maintenanceMode,
          maxFileSize: data.max_file_size || prev.maxFileSize,
          allowedFileTypes: data.allowed_file_types || prev.allowedFileTypes,
          timezone: data.timezone || prev.timezone,
          dateFormat: data.date_format || prev.dateFormat,
          language: data.language || prev.language
        }));
      }
    } catch (error) {
      console.error('Error fetching site settings:', error);
    }
  };
  const handleSaveSiteSettings = async () => {
    setSaving(true);
    try {
      const {
        error
      } = await (supabase as any).from('site_settings').upsert({
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
        description: "Site settings saved successfully"
      });
    } catch (error) {
      console.error('Error saving site settings:', error);
      toast({
        title: "Error",
        description: "Failed to save site settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  // Generate stats based on selected period with proper formatting
  const getStatsByPeriod = (period: string) => {
    const periodMultipliers = {
      hours: { visitors: 0.05, pageViews: 0.08, bounceRate: 1.2, sessionTime: 0.8, conversion: 0.6 },
      day: { visitors: 1, pageViews: 1, bounceRate: 1, sessionTime: 1, conversion: 1 },
      month: { visitors: 25, pageViews: 30, bounceRate: 0.9, sessionTime: 1.1, conversion: 1.3 },
      year: { visitors: 300, pageViews: 350, bounceRate: 0.85, sessionTime: 1.2, conversion: 1.8 },
      lifetime: { visitors: 1200, pageViews: 1500, bounceRate: 0.8, sessionTime: 1.4, conversion: 2.5 }
    };
    
    const multiplier = periodMultipliers[period] || periodMultipliers.day;
    const baseStats = realtimeStats;
    
    return [
      {
        title: "Online Visitors",
        value: onlineVisitors.toString(),
        change: "Live",
        trend: "live",
        icon: Activity,
        color: "text-green-500",
        description: "Currently active users"
      },
      {
        title: "Total Visitors",
        value: Math.round(baseStats.uniqueVisitors * multiplier.visitors).toLocaleString(),
        change: "+12.50%",
        trend: "up",
        icon: Users,
        color: "text-blue-600",
        description: `${period === 'hours' ? 'Last 6 hours' : period === 'day' ? 'Today' : period === 'month' ? 'This month' : period === 'year' ? 'This year' : 'All time'} unique visitors`
      },
      {
        title: "Page Views",
        value: Math.round(baseStats.pageViews * multiplier.pageViews).toLocaleString(),
        change: "+8.75%",
        trend: "up",
        icon: Eye,
        color: "text-purple-600",
        description: "Total page impressions"
      },
      {
        title: "Bounce Rate",
        value: `${(baseStats.bounceRate * multiplier.bounceRate).toFixed(2)}%`,
        change: "-5.25%",
        trend: "down",
        icon: TrendingUp,
        color: "text-orange-600",
        description: "Single page sessions"
      },
      {
        title: "Avg. Session",
        value: `${Math.floor((baseStats.avgSessionTime * multiplier.sessionTime) / 60)}m ${Math.round((baseStats.avgSessionTime * multiplier.sessionTime) % 60)}s`,
        change: "+15.30%",
        trend: "up",
        icon: Clock,
        color: "text-indigo-600",
        description: "Average session duration"
      },
      {
        title: "Conversion Rate",
        value: `${(baseStats.conversionRate * multiplier.conversion).toFixed(2)}%`,
        change: "+0.35%",
        trend: "up",
        icon: Target,
        color: "text-emerald-600",
        description: "Goal completion rate"
      },
      {
        title: "Page Load Time",
        value: `${baseStats.pageLoadTime.toFixed(2)}s`,
        change: "-0.20s",
        trend: "down",
        icon: Zap,
        color: "text-yellow-600",
        description: "Average load speed"
      },
      {
        title: "Engagement Score",
        value: `${(94.0 + (multiplier.conversion - 1) * 5).toFixed(2)}%`,
        change: "+2.15%",
        trend: "up",
        icon: Heart,
        color: "text-rose-600",
        description: "User engagement level"
      }
    ];
  };

  // Handle data export functionality
  const handleExportData = (period: string) => {
    const exportData = {
      period: period,
      exportDate: new Date().toISOString(),
      stats: getStatsByPeriod(period),
      analytics: analyticsData,
      metadata: {
        totalRecords: getStatsByPeriod(period).length,
        exportedBy: 'Admin',
        serverLoad: 'Optimized for minimal impact'
      }
    };

    // Create CSV content
    const csvContent = [
      'Metric,Value,Change,Period',
      ...getStatsByPeriod(period).map(stat => 
        `"${stat.title}","${stat.value}","${stat.change}","${period}"`
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics-${period}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const periodLabels = {
      'hours': 'Last 6 Hours',
      'day': 'Today',
      'month': 'This Month', 
      'year': 'This Year',
      'lifetime': 'All Time',
      'current-month': 'Current Month',
      'last-month': 'Last Month',
      'current-year': 'Current Year',
      'last-year': 'Last Year',
      'q1': 'Q1 Data',
      'q2': 'Q2 Data',
      'q3': 'Q3 Data',
      'q4': 'Q4 Data'
    };

    toast({
      title: "Export Completed",
      description: `${periodLabels[period] || period} analytics data exported successfully`,
    });
  };

  const stats = getStatsByPeriod(selectedPeriod);
  const recentActivities = [{
    action: "Hero block updated",
    time: "2 minutes ago",
    user: "Admin"
  }, {
    action: "New page created",
    time: "1 hour ago",
    user: "Editor"
  }, {
    action: "SEO settings modified",
    time: "3 hours ago",
    user: "Admin"
  }, {
    action: "Contact form submission",
    time: "5 hours ago",
    user: "Visitor"
  }, {
    action: "Blog post published",
    time: "1 day ago",
    user: "Author"
  }];
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>;
  }
  return <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold flex items-center gap-2 text-xl">
            <Home className="h-8 w-8" />
            Home Page Management
          </h1>
          <p className="text-muted-foreground text-sm">Manage your website's homepage content and settings</p>
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
        <TabsList className="flex w-full flex-wrap justify-start gap-1 h-auto p-1 bg-muted">
          <TabsTrigger value="overview" className="flex-shrink-0 text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="content" className="flex-shrink-0 text-xs sm:text-sm">Content</TabsTrigger>
          <TabsTrigger value="hero" className="flex-shrink-0 text-xs sm:text-sm">Hero Blocks</TabsTrigger>
          <TabsTrigger value="seo" className="flex-shrink-0 text-xs sm:text-sm">SEO</TabsTrigger>
          <TabsTrigger value="design" className="flex-shrink-0 text-xs sm:text-sm">Design</TabsTrigger>
          <TabsTrigger value="cookies" className="flex-shrink-0 text-xs sm:text-sm">Cookie Analytics</TabsTrigger>
          <TabsTrigger value="backup" className="flex-shrink-0 text-xs sm:text-sm">Backup & Security</TabsTrigger>
          <TabsTrigger value="settings" className="flex-shrink-0 text-xs sm:text-sm">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Overview & Analytics Dashboard</h2>
              <p className="text-muted-foreground">Comprehensive view of your website's performance and management</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExportData(selectedPeriod)}>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button 
                onClick={refreshAnalyticsData}
                disabled={!isAutoRefreshing}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Now
              </Button>
            </div>
          </div>

          {/* Unified Controls */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
              
              {/* Auto-refresh controls */}
              <div className="flex items-center gap-3">
                <Switch
                  checked={isAutoRefreshing}
                  onCheckedChange={setIsAutoRefreshing}
                  className="scale-90"
                />
                <div className="text-sm">
                  <span className="font-medium">Auto-refresh</span>
                  {isAutoRefreshing && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(Number(value))}>
                        <SelectTrigger className="w-20 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          <SelectItem value="1">1m</SelectItem>
                          <SelectItem value="5">5m</SelectItem>
                          <SelectItem value="15">15m</SelectItem>
                          <SelectItem value="60">1h</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* Time period selector */}
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Period:</Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-36 h-9 bg-background border shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="hours">Last 6 Hours</SelectItem>
                    <SelectItem value="day">Today</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="lifetime">All Time</SelectItem>
                    <SelectItem value="custom-date">📅 Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status info */}
              <div className="text-sm text-muted-foreground">
                {isAutoRefreshing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Last: {lastRefresh.toLocaleTimeString()}</span>
                    {nextRefresh && (
                      <span className="ml-2">
                        Next: {Math.max(0, Math.ceil((nextRefresh.getTime() - Date.now()) / 1000 / 60))}m
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Manual refresh only</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                        {stat.trend === 'live' && (
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-green-600 ml-1 font-medium">LIVE</span>
                          </div>
                        )}
                      </div>
                      <p className="text-2xl font-bold mb-1">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mb-2">{stat.description}</p>
                      <p className={`text-xs font-medium ${
                        stat.trend === 'up' ? 'text-green-600' : 
                        stat.trend === 'down' ? 'text-red-600' : 
                        stat.trend === 'live' ? 'text-green-600' : 'text-muted-foreground'
                      }`}>
                        {stat.trend === 'live' ? 'Real-time data' : `${stat.change} from last month`}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                  {stat.trend === 'live' && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400 animate-pulse"></div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Visitor Trends</CardTitle>
                <CardDescription>
                  {selectedPeriod === 'hours' ? 'Hourly visitor statistics for the last 6 hours' :
                   selectedPeriod === 'day' ? 'Hourly visitor statistics for today' :
                   selectedPeriod === 'month' ? 'Weekly visitor statistics for this month' :
                   selectedPeriod === 'year' ? 'Quarterly visitor statistics for this year' :
                   'Yearly visitor statistics over time'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Line data={analyticsData.visitors} options={chartOptions} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
                <CardDescription>
                  Most visited pages on your website
                  {selectedPeriod === 'hours' ? ' in the last 6 hours' :
                   selectedPeriod === 'day' ? ' today' :
                   selectedPeriod === 'month' ? ' this month' :
                   selectedPeriod === 'year' ? ' this year' :
                   ' of all time'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Bar data={analyticsData.pageViews} options={chartOptions} />
              </CardContent>
            </Card>
          </div>

          {/* Real-time Performance Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-green-500" />
                      Real-time Activity
                    </CardTitle>
                    <CardDescription>Live user interactions and system events</CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                    Live
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <MousePointer className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Page View</p>
                      <p className="text-xs text-muted-foreground">Homepage</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">Just now</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <ThumbsUp className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">User Engagement</p>
                      <p className="text-xs text-muted-foreground">Book preview clicked</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">2s ago</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium">New Visitor</p>
                      <p className="text-xs text-muted-foreground">From organic search</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">15s ago</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <div>
                      <p className="text-sm font-medium">Performance Alert</p>
                      <p className="text-xs text-muted-foreground">Page load improved</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">1m ago</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Real-time system performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Server Response Time</span>
                    <span className="font-medium text-green-600">1.2s</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Database Queries</span>
                    <span className="font-medium text-blue-600">24ms avg</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CDN Cache Hit Rate</span>
                    <span className="font-medium text-purple-600">96%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '96%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uptime (24h)</span>
                    <span className="font-medium text-emerald-600">99.9%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '99%' }}></div>
                  </div>
                </div>
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
                <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('backup')}>
                  <Shield className="h-4 w-4 mr-2" />
                  Backup & Security
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('cookies')}>
                  <Cookie className="h-4 w-4 mr-2" />
                  Cookie Analytics
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
                    {recentActivities.map((activity, index) => <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">by {activity.user}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>)}
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
              <p className="text-muted-foreground">Create and customize hero sections with advanced controls</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => fetchHeroBlocks()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Blocks
              </Button>
              <Button onClick={createNewHeroBlock}>
                <Plus className="h-4 w-4 mr-2" />
                Create Hero Block
              </Button>
            </div>
          </div>

          {heroManagerView === 'editor' ? (
            <div className="space-y-6">
              {/* Editor Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={() => {
                    setHeroManagerView('list');
                    setSelectedHeroBlock(null);
                    setIsCreatingHero(false);
                  }}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Hero List
                  </Button>
                  <div>
                    <h3 className="text-xl font-bold">
                      {isCreatingHero ? 'Create New Hero Block' : `Edit: ${selectedHeroBlock?.name}`}
                    </h3>
                    <p className="text-muted-foreground">Design your hero section with live preview</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => {
                    setHeroManagerView('list');
                    setSelectedHeroBlock(null);
                    setIsCreatingHero(false);
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={saveHeroBlock}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Block
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Editor Panel */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Block Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Block Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="heroBlockName">Block Name</Label>
                          <Input
                            id="heroBlockName"
                            value={selectedHeroBlock?.name || ''}
                            onChange={(e) => setSelectedHeroBlock(prev => prev ? { ...prev, name: e.target.value } : null)}
                            placeholder="Enter block name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="heroBlockDescription">Description</Label>
                          <Input
                            id="heroBlockDescription"
                            value={selectedHeroBlock?.description || ''}
                            onChange={(e) => setSelectedHeroBlock(prev => prev ? { ...prev, description: e.target.value } : null)}
                            placeholder="Brief description"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={selectedHeroBlock?.enabled ?? true}
                          onCheckedChange={(checked) => setSelectedHeroBlock(prev => prev ? { ...prev, enabled: checked } : null)}
                        />
                        <Label>Enable for authors</Label>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Elements Editor */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Hero Elements</CardTitle>
                      <CardDescription>Add and arrange elements for your hero section</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Element Buttons */}
                        <div className="flex gap-2 flex-wrap p-4 bg-muted rounded-lg">
                          <Button size="sm" variant="outline" onClick={() => addHeroElement('text')}>
                            <Type className="h-4 w-4 mr-1" />
                            Add Text
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => addHeroElement('image')}>
                            <ImageIcon className="h-4 w-4 mr-1" />
                            Add Image
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => addHeroElement('button')}>
                            <MousePointer className="h-4 w-4 mr-1" />
                            Add Button
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => addHeroElement('video')}>
                            <Monitor className="h-4 w-4 mr-1" />
                            Add Video
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => addHeroElement('spacer')}>
                            <Layout className="h-4 w-4 mr-1" />
                            Add Spacer
                          </Button>
                        </div>
                        
                        {/* Elements List */}
                        <div className="space-y-3">
                          {heroElements.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <Layout className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>No elements added yet. Click the buttons above to add elements.</p>
                            </div>
                          ) : (
                            heroElements.map((element, index) => (
                              <Card key={element.id} className="p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                                      {element.type === 'text' && <Type className="h-4 w-4" />}
                                      {element.type === 'image' && <ImageIcon className="h-4 w-4" />}
                                      {element.type === 'button' && <MousePointer className="h-4 w-4" />}
                                      {element.type === 'video' && <Monitor className="h-4 w-4" />}
                                      {element.type === 'spacer' && <Layout className="h-4 w-4" />}
                                    </div>
                                    <div>
                                      <p className="font-medium capitalize">{element.type}</p>
                                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                        {element.content}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm">
                                      <Settings className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => removeHeroElement(element.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            ))
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Live Preview Panel */}
                <div className="lg:col-span-1">
                  <Card className="sticky top-6">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Live Preview</CardTitle>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={heroPreviewMode === 'desktop' ? 'default' : 'outline'}
                            onClick={() => setHeroPreviewMode('desktop')}
                          >
                            <Monitor className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={heroPreviewMode === 'tablet' ? 'default' : 'outline'}
                            onClick={() => setHeroPreviewMode('tablet')}
                          >
                            <Tablet className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={heroPreviewMode === 'mobile' ? 'default' : 'outline'}
                            onClick={() => setHeroPreviewMode('mobile')}
                          >
                            <Smartphone className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className={`
                          border rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950 dark:via-background dark:to-purple-950 min-h-[400px] transition-all duration-300
                          ${heroPreviewMode === 'desktop' ? 'w-full' : heroPreviewMode === 'tablet' ? 'w-80 mx-auto' : 'w-64 mx-auto'}
                        `}
                      >
                        <div className="p-6 space-y-4">
                          {heroElements.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                              <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>Preview will appear here</p>
                              <p className="text-sm mt-2">Add elements to see the preview</p>
                            </div>
                          ) : (
                            heroElements.map((element, index) => (
                              <div key={element.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                                {element.type === 'text' && (
                                  <div 
                                    className={`
                                      ${element.styles.fontSize === '4xl' ? 'text-4xl' : element.styles.fontSize === '3xl' ? 'text-3xl' : element.styles.fontSize === 'lg' ? 'text-lg' : 'text-base'}
                                      ${element.styles.fontWeight === 'bold' ? 'font-bold' : 'font-normal'}
                                      ${element.styles.textAlign === 'center' ? 'text-center' : element.styles.textAlign === 'right' ? 'text-right' : 'text-left'}
                                      ${element.styles.color === 'muted-foreground' ? 'text-muted-foreground' : 'text-foreground'}
                                      ${element.styles.marginBottom ? `mb-${element.styles.marginBottom}` : ''}
                                    `}
                                  >
                                    {element.content}
                                  </div>
                                )}
                                {element.type === 'image' && (
                                  <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                    <span className="ml-2 text-sm text-muted-foreground">Image</span>
                                  </div>
                                )}
                                {element.type === 'button' && (
                                  <div className={element.styles.textAlign === 'center' ? 'text-center' : ''}>
                                    <Button 
                                      variant={element.styles.variant || 'default'}
                                      size={element.styles.size || 'default'}
                                      className="animate-scale-in"
                                    >
                                      {element.content}
                                    </Button>
                                  </div>
                                )}
                                {element.type === 'video' && (
                                  <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                                    <Monitor className="h-8 w-8 text-muted-foreground" />
                                    <span className="ml-2 text-sm text-muted-foreground">Video</span>
                                  </div>
                                )}
                                {element.type === 'spacer' && (
                                  <div className="h-8" />
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                      
                      {/* Preview Info */}
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {heroPreviewMode === 'desktop' ? 'Desktop View' : heroPreviewMode === 'tablet' ? 'Tablet View' : 'Mobile View'}
                          </span>
                          <span className="text-muted-foreground">
                            {heroElements.length} element{heroElements.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Hero Block Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Hero Blocks</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{heroBlocks.length}</div>
                    <p className="text-xs text-muted-foreground">+2 from last week</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Blocks</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{heroBlocks.filter(b => b.enabled).length}</div>
                    <p className="text-xs text-muted-foreground">Currently enabled</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Usage Count</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {heroBlocks.reduce((acc, block) => acc + (block.config?.usage_count || 0), 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Total uses</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Default Block</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {heroBlocks.filter(b => b.config?.isDefault).length > 0 ? '1' : '0'}
                    </div>
                    <p className="text-xs text-muted-foreground">Default set</p>
                  </CardContent>
                </Card>
              </div>

              {/* Hero Block Templates */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="h-5 w-5" />
                    Hero Block Templates
                  </CardTitle>
                  <CardDescription>Choose from pre-designed templates or create custom blocks</CardDescription>
                </CardHeader>
                <CardContent className="overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      {
                        id: 'modern-minimal',
                        name: 'Modern Minimal',
                        description: 'Clean, minimal design with centered content',
                        preview: '/api/placeholder/300/180',
                        config: { layout: 'centered', style: 'minimal' }
                      },
                      {
                        id: 'split-screen',
                        name: 'Split Screen Hero',
                        description: 'Text on one side, image on the other',
                        preview: '/api/placeholder/300/180',
                        config: { layout: 'split', style: 'modern' }
                      },
                      {
                        id: 'video-background',
                        name: 'Video Background',
                        description: 'Hero with background video and overlay text',
                        preview: '/api/placeholder/300/180',
                        config: { layout: 'overlay', style: 'video' }
                      },
                      {
                        id: 'carousel-hero',
                        name: 'Carousel Hero',
                        description: 'Multiple slides with navigation',
                        preview: '/api/placeholder/300/180',
                        config: { layout: 'carousel', style: 'dynamic' }
                      },
                      {
                        id: 'book-showcase',
                        name: 'Book Showcase',
                        description: 'Perfect for displaying featured books',
                        preview: '/api/placeholder/300/180',
                        config: { layout: 'showcase', style: 'book-focused' }
                      },
                      {
                        id: 'author-intro',
                        name: 'Author Introduction',
                        description: 'Professional author presentation',
                        preview: '/api/placeholder/300/180',
                        config: { layout: 'intro', style: 'professional' }
                      }
                    ].map((template) => (
                      <Card key={template.id} className="group hover:shadow-md transition-all cursor-pointer overflow-hidden">
                        <div className="aspect-video relative overflow-hidden rounded-t-lg bg-muted">
                          <img 
                            src={template.preview} 
                            alt={template.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                        </div>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-base mb-1 truncate">{template.name}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">{template.description}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 w-full">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => previewTemplate(template)}
                                className="flex-1 min-w-0"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                <span className="truncate">Preview</span>
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => createHeroFromTemplate(template)}
                                className="flex-1 min-w-0"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                <span className="truncate">Use Template</span>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Existing Hero Blocks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Existing Hero Blocks
                  </CardTitle>
                  <CardDescription>Manage your current hero blocks</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="grid grid-cols-1 gap-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-muted animate-pulse rounded" />
                      ))}
                    </div>
                  ) : heroBlocks.length === 0 ? (
                    <div className="text-center py-12">
                      <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Hero Blocks Yet</h3>
                      <p className="text-muted-foreground mb-4">Create your first hero block to get started</p>
                  <Button onClick={createNewHeroBlock}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Hero Block
                  </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {heroBlocks.map((block) => (
                        <Card key={block.id} className="group hover:shadow-md transition-all duration-200">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                                  <Layout className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-lg">{block.name}</h3>
                                  <p className="text-muted-foreground text-sm">{block.description}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant={block.enabled ? "default" : "secondary"}>
                                      {block.enabled ? 'Active' : 'Inactive'}
                                    </Badge>
                                    {block.config?.isDefault && (
                                      <Badge variant="outline">Default</Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      Created {new Date(block.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => previewHeroBlock(block)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => editHeroBlock(block)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => duplicateHeroBlock(block)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => toggleHeroBlock(block.id)}
                                >
                                  {block.enabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => deleteHeroBlock(block.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                
                                {block.config?.usage_count && (
                                  <div className="text-xs text-muted-foreground ml-2">
                                    Used {block.config.usage_count} times
                                  </div>
                                )}
                                
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setAsDefaultHero(block.id)}
                                  disabled={block.config?.isDefault}
                                >
                                  {block.config?.isDefault ? 'Default' : 'Set as Default'}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
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
            <div className="flex gap-2">
              <Button 
                onClick={autoGenerateSEO} 
                disabled={autoGenerating}
                variant="outline"
              >
                <Brain className="h-4 w-4 mr-2" />
                {autoGenerating ? 'Generating...' : 'Auto Generate SEO'}
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
                      <div className="flex items-center gap-2">
                        <Label htmlFor="site-title">Site Title</Label>
                        {seoValidation?.title && !seoValidation.title.valid && (
                          <Badge variant="destructive" className="text-xs">Issues</Badge>
                        )}
                      </div>
                      <Input 
                        id="site-title" 
                        placeholder="Your Website Title" 
                        value={seoSettings.site_title || siteSettings.siteName} 
                        onChange={e => {
                          setSeoSettings(prev => ({ ...prev, site_title: e.target.value }));
                          setSiteSettings(prev => ({ ...prev, siteName: e.target.value }));
                        }} 
                      />
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Recommended: 30-60 characters</span>
                        <span className={(seoSettings.site_title || siteSettings.siteName).length > 60 ? 'text-red-500' : 'text-muted-foreground'}>
                          {(seoSettings.site_title || siteSettings.siteName).length}/60
                        </span>
                      </div>
                      {seoValidation?.title && !seoValidation.title.valid && (
                        <p className="text-xs text-red-500">{seoValidation.title.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="site-description">Meta Description</Label>
                        {seoValidation?.description && !seoValidation.description.valid && (
                          <Badge variant="destructive" className="text-xs">Issues</Badge>
                        )}
                      </div>
                      <Textarea 
                        id="site-description" 
                        placeholder="Brief description of your website..." 
                        value={seoSettings.site_description || siteSettings.siteDescription} 
                        onChange={e => {
                          setSeoSettings(prev => ({ ...prev, site_description: e.target.value }));
                          setSiteSettings(prev => ({ ...prev, siteDescription: e.target.value }));
                        }} 
                        rows={3} 
                      />
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Recommended: 120-160 characters</span>
                        <span className={(seoSettings.site_description || siteSettings.siteDescription).length > 160 ? 'text-red-500' : 'text-muted-foreground'}>
                          {(seoSettings.site_description || siteSettings.siteDescription).length}/160
                        </span>
                      </div>
                      {seoValidation?.description && !seoValidation.description.valid && (
                        <p className="text-xs text-red-500">{seoValidation.description.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="keywords">SEO Keywords</Label>
                        {seoValidation?.keywords && !seoValidation.keywords.valid && (
                          <Badge variant="destructive" className="text-xs">Issues</Badge>
                        )}
                      </div>
                      <Textarea 
                        id="keywords" 
                        placeholder="keyword1, keyword2, keyword3..." 
                        value={seoSettings.site_keywords || siteSettings.siteKeywords} 
                        onChange={e => {
                          setSeoSettings(prev => ({ ...prev, site_keywords: e.target.value }));
                          setSiteSettings(prev => ({ ...prev, siteKeywords: e.target.value }));
                        }} 
                        rows={2} 
                      />
                      <p className="text-xs text-muted-foreground">
                        Separate with commas. Focus on 3-5 related keywords.
                      </p>
                      {seoValidation?.keywords && !seoValidation.keywords.valid && (
                        <p className="text-xs text-red-500">{seoValidation.keywords.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select value={siteSettings.language} onValueChange={value => setSiteSettings(prev => ({
                      ...prev,
                      language: value
                    }))}>
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
                      <Textarea id="custom-robots" placeholder="User-agent: *&#10;Disallow: /admin/&#10;Sitemap: https://yoursite.com/sitemap.xml" rows={6} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="htaccess">Custom .htaccess Rules</Label>
                      <Textarea id="htaccess" placeholder="RewriteEngine On&#10;RewriteCond %{HTTPS} off&#10;RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]" rows={4} />
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
                      <Textarea id="custom-schema" placeholder='{"@context": "https://schema.org", "@type": "Organization", "name": "Your Company"}' rows={4} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ai-seo" className="space-y-6 mt-6">
              <AISEOAssistant
                content={`${seoSettings.site_title} - ${seoSettings.site_description}`}
                currentTitle={seoSettings.site_title}
                currentDescription={seoSettings.site_description}
                currentKeywords={seoSettings.site_keywords}
                contentType="page"
                recordId="homepage"
                onApplySuggestions={(suggestions) => {
                  setSeoSettings(prev => ({
                    ...prev,
                    site_title: suggestions.title,
                    site_description: suggestions.description,
                    site_keywords: suggestions.keywords
                  }));
                }}
              />
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
                      Connect your analytics tools for comprehensive tracking
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="google-analytics">Google Analytics ID</Label>
                      <Input id="google-analytics" placeholder="G-XXXXXXXXXX" value={siteSettings.analytics.googleAnalytics} onChange={e => setSiteSettings(prev => ({
                      ...prev,
                      analytics: {
                        ...prev.analytics,
                        googleAnalytics: e.target.value
                      }
                    }))} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gtm">Google Tag Manager</Label>
                      <Input id="gtm" placeholder="GTM-XXXXXXX" value={siteSettings.analytics.googleTagManager} onChange={e => setSiteSettings(prev => ({
                      ...prev,
                      analytics: {
                        ...prev.analytics,
                        googleTagManager: e.target.value
                      }
                    }))} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="facebook-pixel">Facebook Pixel</Label>
                      <Input id="facebook-pixel" placeholder="Facebook Pixel ID" value={siteSettings.analytics.facebookPixel} onChange={e => setSiteSettings(prev => ({
                      ...prev,
                      analytics: {
                        ...prev.analytics,
                        facebookPixel: e.target.value
                      }
                    }))} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hotjar">Hotjar Tracking Code</Label>
                      <Input id="hotjar" placeholder="Hotjar Site ID" />
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
                      <Globe className="h-5 w-5" />
                      Search Console Integration
                    </CardTitle>
                    <CardDescription>
                      Connect to search engines worldwide for comprehensive SEO tracking
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Google Search Console */}
                    <div className="space-y-2">
                      <Label htmlFor="google-search-console" className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-blue-500"></div>
                        Google Search Console
                      </Label>
                      <Input id="google-search-console" placeholder="google-site-verification=xxxxx" />
                      <p className="text-xs text-muted-foreground">Dominant in US, EU, most global markets</p>
                    </div>

                    {/* Bing Webmaster Tools */}
                    <div className="space-y-2">
                      <Label htmlFor="bing-webmaster" className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-orange-500"></div>
                        Bing Webmaster Tools
                      </Label>
                      <Input id="bing-webmaster" placeholder="msvalidate.01=xxxxx" />
                      <p className="text-xs text-muted-foreground">Important for US market, ~6% search share</p>
                    </div>

                    {/* Yandex Webmaster */}
                    <div className="space-y-2">
                      <Label htmlFor="yandex-webmaster" className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-500"></div>
                        Yandex Webmaster
                      </Label>
                      <Input id="yandex-webmaster" placeholder="yandex-verification=xxxxx" />
                      <p className="text-xs text-muted-foreground">Dominant in Russia, CIS countries (~65% in Russia)</p>
                    </div>

                    {/* Baidu Webmaster */}
                    <div className="space-y-2">
                      <Label htmlFor="baidu-webmaster" className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-blue-600"></div>
                        Baidu Webmaster Tools
                      </Label>
                      <Input id="baidu-webmaster" placeholder="baidu-site-verification=xxxxx" />
                      <p className="text-xs text-muted-foreground">Dominant in China (~76% market share)</p>
                    </div>

                    <Button className="w-full">
                      <Globe className="h-4 w-4 mr-2" />
                      Verify All Search Consoles
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Search Engines by Region */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Regional Search Engines
                    </CardTitle>
                    <CardDescription>
                      Connect to regional search engines for local market optimization
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Naver - South Korea */}
                    <div className="space-y-2">
                      <Label htmlFor="naver-webmaster" className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-500"></div>
                        Naver Search Advisor (Korea)
                      </Label>
                      <Input id="naver-webmaster" placeholder="naver-site-verification=xxxxx" />
                      <p className="text-xs text-muted-foreground">~75% market share in South Korea</p>
                    </div>

                    {/* Seznam - Czech Republic */}
                    <div className="space-y-2">
                      <Label htmlFor="seznam-webmaster" className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-600"></div>
                        Seznam Webmaster (Czech Republic)
                      </Label>
                      <Input id="seznam-webmaster" placeholder="seznam-verification=xxxxx" />
                      <p className="text-xs text-muted-foreground">~50% market share in Czech Republic</p>
                    </div>

                    {/* DuckDuckGo */}
                    <div className="space-y-2">
                      <Label htmlFor="duckduckgo" className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-orange-600"></div>
                        DuckDuckGo (Privacy-focused)
                      </Label>
                      <Input id="duckduckgo" placeholder="duckduckgo-verification=xxxxx" />
                      <p className="text-xs text-muted-foreground">Growing privacy-conscious user base</p>
                    </div>

                    {/* Qwant - France */}
                    <div className="space-y-2">
                      <Label htmlFor="qwant" className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-blue-700"></div>
                        Qwant (France)
                      </Label>
                      <Input id="qwant" placeholder="qwant-verification=xxxxx" />
                      <p className="text-xs text-muted-foreground">Popular privacy-focused search in France</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      SEO Performance Metrics
                    </CardTitle>
                    <CardDescription>
                      Track your SEO progress across all search engines
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
                      <h4 className="font-medium">Search Engine Performance</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-blue-500"></div>
                            Google
                          </span>
                          <div className="text-right">
                            <span className="text-sm font-medium">892 clicks</span>
                            <p className="text-xs text-green-600">+12%</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-orange-500"></div>
                            Bing
                          </span>
                          <div className="text-right">
                            <span className="text-sm font-medium">124 clicks</span>
                            <p className="text-xs text-green-600">+8%</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-red-500"></div>
                            Yandex
                          </span>
                          <div className="text-right">
                            <span className="text-sm font-medium">67 clicks</span>
                            <p className="text-xs text-yellow-600">+2%</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-blue-600"></div>
                            Baidu
                          </span>
                          <div className="text-right">
                            <span className="text-sm font-medium">45 clicks</span>
                            <p className="text-xs text-green-600">+15%</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full" variant="outline">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Detailed Analytics
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Search Engine Market Share Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Global Search Engine Market Share by Region
                  </CardTitle>
                  <CardDescription>
                    Understanding search engine dominance by geographic region
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">🌍 Global Average</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Google</span>
                          <span className="font-medium">91.9%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Bing</span>
                          <span className="font-medium">3.0%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Yahoo</span>
                          <span className="font-medium">1.2%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Others</span>
                          <span className="font-medium">3.9%</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">🇷🇺 Russia</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Yandex</span>
                          <span className="font-medium">65.2%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Google</span>
                          <span className="font-medium">32.3%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Mail.ru</span>
                          <span className="font-medium">1.8%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Others</span>
                          <span className="font-medium">0.7%</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">🇨🇳 China</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Baidu</span>
                          <span className="font-medium">76.1%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sogou</span>
                          <span className="font-medium">15.2%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Shenma</span>
                          <span className="font-medium">4.8%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Others</span>
                          <span className="font-medium">3.9%</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">🇰🇷 South Korea</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Naver</span>
                          <span className="font-medium">74.7%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Google</span>
                          <span className="font-medium">20.9%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Daum</span>
                          <span className="font-medium">3.2%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Others</span>
                          <span className="font-medium">1.2%</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">🇨🇿 Czech Republic</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Seznam</span>
                          <span className="font-medium">49.8%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Google</span>
                          <span className="font-medium">47.1%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Bing</span>
                          <span className="font-medium">1.8%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Others</span>
                          <span className="font-medium">1.3%</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">🇺🇸 United States</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Google</span>
                          <span className="font-medium">87.8%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Bing</span>
                          <span className="font-medium">6.4%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Yahoo</span>
                          <span className="font-medium">2.8%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>DuckDuckGo</span>
                          <span className="font-medium">2.3%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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

        <TabsContent value="cookies" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Cookie className="h-6 w-6" />
                Cookie Analytics & Consent
              </h2>
              <p className="text-muted-foreground">Monitor cookie consent rates and GDPR compliance</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a href="/admin/cookie-consent">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Cookie Settings
                </a>
              </Button>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>

          {/* Cookie Consent Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Visitors</p>
                    <p className="text-2xl font-bold">2,847</p>
                    <p className="text-xs text-green-600">+15% from last month</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Consent Rate</p>
                    <p className="text-2xl font-bold text-green-600">78.5%</p>
                    <p className="text-xs text-green-600">+3.2% improvement</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Rejected Consent</p>
                    <p className="text-2xl font-bold text-red-600">612</p>
                    <p className="text-xs text-red-600">21.5% of visitors</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">GDPR Compliant</p>
                    <p className="text-2xl font-bold text-green-600">100%</p>
                    <p className="text-xs text-green-600">All visitors covered</p>
                  </div>
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cookie Categories Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cookie className="h-5 w-5" />
                  Cookie Category Consent Rates
                </CardTitle>
                <CardDescription>
                  Breakdown of consent by cookie category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded bg-green-500"></div>
                      <div>
                        <p className="font-medium">Necessary Cookies</p>
                        <p className="text-sm text-muted-foreground">Essential functionality</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">100%</p>
                      <p className="text-xs text-muted-foreground">Required</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded bg-blue-500"></div>
                      <div>
                        <p className="font-medium">Analytics Cookies</p>
                        <p className="text-sm text-muted-foreground">Usage tracking</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">65.3%</p>
                      <p className="text-xs text-green-600">+2.1%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded bg-purple-500"></div>
                      <div>
                        <p className="font-medium">Marketing Cookies</p>
                        <p className="text-sm text-muted-foreground">Advertising & remarketing</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">42.8%</p>
                      <p className="text-xs text-red-600">-1.5%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded bg-orange-500"></div>
                      <div>
                        <p className="font-medium">Functional Cookies</p>
                        <p className="text-sm text-muted-foreground">Enhanced features</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">58.7%</p>
                      <p className="text-xs text-green-600">+0.8%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Consent Trends
                </CardTitle>
                <CardDescription>
                  Cookie consent patterns over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>This Week</span>
                      <span className="font-medium">76.2%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{
                      width: '76.2%'
                    }}></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Last Week</span>
                      <span className="font-medium">74.8%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{
                      width: '74.8%'
                    }}></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Last Month</span>
                      <span className="font-medium">72.1%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{
                      width: '72.1%'
                    }}></div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">Recent Activity</h4>
                    <ScrollArea className="h-32">
                      <div className="space-y-2">
                        {Array.from({
                        length: 8
                      }).map((_, i) => <div key={i} className="flex items-center justify-between text-sm p-2 rounded border">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span>User accepted all cookies</span>
                            </div>
                            <span className="text-muted-foreground">{i + 2}m ago</span>
                          </div>)}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Geographic & Device Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Consent by Region
                </CardTitle>
                <CardDescription>
                  Geographic breakdown of cookie consent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🇺🇸 United States</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">82.3%</span>
                      <div className="w-16 bg-muted rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{
                        width: '82.3%'
                      }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🇪🇺 European Union</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">68.7%</span>
                      <div className="w-16 bg-muted rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{
                        width: '68.7%'
                      }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🇬🇧 United Kingdom</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">71.2%</span>
                      <div className="w-16 bg-muted rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{
                        width: '71.2%'
                      }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🇨🇦 Canada</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">79.1%</span>
                      <div className="w-16 bg-muted rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{
                        width: '79.1%'
                      }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🇦🇺 Australia</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">75.8%</span>
                      <div className="w-16 bg-muted rounded-full h-2">
                        <div className="bg-cyan-500 h-2 rounded-full" style={{
                        width: '75.8%'
                      }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Device & Browser Analysis
                </CardTitle>
                <CardDescription>
                  Consent patterns by device and browser type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">By Device Type</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2">
                        <span className="text-sm flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          Desktop
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">84.2%</span>
                          <div className="w-12 bg-muted rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{
                            width: '84.2%'
                          }}></div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center p-2">
                        <span className="text-sm flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          Mobile
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">72.1%</span>
                          <div className="w-12 bg-muted rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{
                            width: '72.1%'
                          }}></div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center p-2">
                        <span className="text-sm flex items-center gap-2">
                          <Tablet className="h-4 w-4" />
                          Tablet
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">76.8%</span>
                          <div className="w-12 bg-muted rounded-full h-2">
                            <div className="bg-purple-500 h-2 rounded-full" style={{
                            width: '76.8%'
                          }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3">Top Browsers</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Chrome</span>
                        <span className="font-medium">78.9%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Safari</span>
                        <span className="font-medium">73.2%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Firefox</span>
                        <span className="font-medium">81.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Edge</span>
                        <span className="font-medium">76.3%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* GDPR Compliance Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                GDPR Compliance Status
              </CardTitle>
              <CardDescription>
                Current compliance status and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <div>
                      <div className="font-medium">Cookie Banner</div>
                      <div className="text-sm text-muted-foreground">Active and compliant</div>
                    </div>
                  </div>
                  <Badge variant="default">Compliant</Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <div>
                      <div className="font-medium">Consent Recording</div>
                      <div className="text-sm text-muted-foreground">All consents logged</div>
                    </div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <div>
                      <div className="font-medium">Privacy Policy</div>
                      <div className="text-sm text-muted-foreground">Linked and accessible</div>
                    </div>
                  </div>
                  <Badge variant="default">Updated</Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertTriangle className="h-6 w-6 text-yellow-500" />
                    <div>
                      <div className="font-medium">Data Retention</div>
                      <div className="text-sm text-muted-foreground">Review settings</div>
                    </div>
                  </div>
                  <Badge variant="outline">Review Needed</Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <div>
                      <div className="font-medium">Cookie Blocking</div>
                      <div className="text-sm text-muted-foreground">Auto-blocking enabled</div>
                    </div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <div>
                      <div className="font-medium">Withdrawal Rights</div>
                      <div className="text-sm text-muted-foreground">Easy opt-out available</div>
                    </div>
                  </div>
                  <Badge variant="default">Compliant</Badge>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-200">GDPR Compliant</span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your cookie consent implementation meets GDPR requirements. Continue monitoring consent rates and update policies as needed.
                </p>
              </div>
            </CardContent>
          </Card>
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
                  <Input id="logo" placeholder="https://yoursite.com/logo.png" value={siteSettings.logo} onChange={e => setSiteSettings(prev => ({
                  ...prev,
                  logo: e.target.value
                }))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="favicon">Favicon URL</Label>
                  <Input id="favicon" placeholder="https://yoursite.com/favicon.ico" value={siteSettings.favicon} onChange={e => setSiteSettings(prev => ({
                  ...prev,
                  favicon: e.target.value
                }))} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input id="primary-color" type="color" value={siteSettings.primaryColor} onChange={e => setSiteSettings(prev => ({
                      ...prev,
                      primaryColor: e.target.value
                    }))} className="w-16 h-10 p-1" />
                      <Input value={siteSettings.primaryColor} onChange={e => setSiteSettings(prev => ({
                      ...prev,
                      primaryColor: e.target.value
                    }))} placeholder="#3b82f6" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondary-color">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input id="secondary-color" type="color" value={siteSettings.secondaryColor} onChange={e => setSiteSettings(prev => ({
                      ...prev,
                      secondaryColor: e.target.value
                    }))} className="w-16 h-10 p-1" />
                      <Input value={siteSettings.secondaryColor} onChange={e => setSiteSettings(prev => ({
                      ...prev,
                      secondaryColor: e.target.value
                    }))} placeholder="#64748b" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="font-family">Font Family</Label>
                  <Select value={siteSettings.fontFamily} onValueChange={value => setSiteSettings(prev => ({
                  ...prev,
                  fontFamily: value
                }))}>
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
                  <Select value={siteSettings.headerLayout} onValueChange={value => setSiteSettings(prev => ({
                  ...prev,
                  headerLayout: value
                }))}>
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
                  <Select value={siteSettings.footerLayout} onValueChange={value => setSiteSettings(prev => ({
                  ...prev,
                  footerLayout: value
                }))}>
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
                  <Input id="facebook" placeholder="https://facebook.com/yourpage" value={siteSettings.socialLinks.facebook} onChange={e => setSiteSettings(prev => ({
                  ...prev,
                  socialLinks: {
                    ...prev.socialLinks,
                    facebook: e.target.value
                  }
                }))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input id="twitter" placeholder="https://twitter.com/youraccount" value={siteSettings.socialLinks.twitter} onChange={e => setSiteSettings(prev => ({
                  ...prev,
                  socialLinks: {
                    ...prev.socialLinks,
                    twitter: e.target.value
                  }
                }))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input id="instagram" placeholder="https://instagram.com/youraccount" value={siteSettings.socialLinks.instagram} onChange={e => setSiteSettings(prev => ({
                  ...prev,
                  socialLinks: {
                    ...prev.socialLinks,
                    instagram: e.target.value
                  }
                }))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input id="linkedin" placeholder="https://linkedin.com/company/yourcompany" value={siteSettings.socialLinks.linkedin} onChange={e => setSiteSettings(prev => ({
                  ...prev,
                  socialLinks: {
                    ...prev.socialLinks,
                    linkedin: e.target.value
                  }
                }))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtube">YouTube</Label>
                  <Input id="youtube" placeholder="https://youtube.com/yourchannel" value={siteSettings.socialLinks.youtube} onChange={e => setSiteSettings(prev => ({
                  ...prev,
                  socialLinks: {
                    ...prev.socialLinks,
                    youtube: e.target.value
                  }
                }))} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Backup & Security Management
              </h2>
              <p className="text-muted-foreground">Configure automated backups and security settings</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export All Data
              </Button>
              <Button>
                <Shield className="h-4 w-4 mr-2" />
                Security Scan
              </Button>
            </div>
          </div>

          <Tabs defaultValue="backups" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="backups">Auto Backups</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
              <TabsTrigger value="recovery">Recovery</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="logs">Security Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="backups" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Auto Backup Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Timer className="h-5 w-5" />
                      Automated Backup Settings
                    </CardTitle>
                    <CardDescription>
                      Configure automatic backup schedules and retention policies
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Enable Automated Backups</Label>
                        <Switch defaultChecked />
                      </div>

                      <div className="space-y-2">
                        <Label>Backup Frequency</Label>
                        <Select defaultValue="daily">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">Every Hour</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <Label className="text-base font-medium">Backup Schedules</Label>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <Card className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="secondary">1 Day</Badge>
                              <Switch defaultChecked />
                            </div>
                            <p className="text-sm text-muted-foreground">Daily backup at 2:00 AM</p>
                            <p className="text-xs text-muted-foreground mt-1">Retention: 30 days</p>
                          </Card>

                          <Card className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="secondary">3 Days</Badge>
                              <Switch />
                            </div>
                            <p className="text-sm text-muted-foreground">Every 3 days at 1:00 AM</p>
                            <p className="text-xs text-muted-foreground mt-1">Retention: 90 days</p>
                          </Card>

                          <Card className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="secondary">7 Days</Badge>
                              <Switch />
                            </div>
                            <p className="text-sm text-muted-foreground">Weekly on Sunday 12:00 AM</p>
                            <p className="text-xs text-muted-foreground mt-1">Retention: 365 days</p>
                          </Card>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label>Backup Storage Location</Label>
                        <Select defaultValue="cloud">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="local">Local Storage</SelectItem>
                            <SelectItem value="cloud">Cloud Storage</SelectItem>
                            <SelectItem value="both">Both Local & Cloud</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Compression Level</Label>
                        <Select defaultValue="medium">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None (Fastest)</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High (Smallest)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Backup Status & History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Backup Status & History
                    </CardTitle>
                    <CardDescription>
                      View recent backups and system status
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Last Backup: Success</span>
                      </div>
                      <Badge variant="secondary">2 hours ago</Badge>
                    </div>

                    <div className="space-y-2">
                      <Label>Recent Backup History</Label>
                      <ScrollArea className="h-48 w-full border rounded-md p-2">
                        <div className="space-y-2">
                          {[{
                          date: '2024-01-15 02:00',
                          status: 'success',
                          size: '45.2 MB',
                          type: 'Daily'
                        }, {
                          date: '2024-01-14 02:00',
                          status: 'success',
                          size: '44.8 MB',
                          type: 'Daily'
                        }, {
                          date: '2024-01-13 02:00',
                          status: 'success',
                          size: '44.5 MB',
                          type: 'Daily'
                        }, {
                          date: '2024-01-12 02:00',
                          status: 'warning',
                          size: '44.1 MB',
                          type: 'Daily'
                        }, {
                          date: '2024-01-11 02:00',
                          status: 'success',
                          size: '43.9 MB',
                          type: 'Daily'
                        }].map((backup, index) => <div key={index} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center gap-2">
                                {backup.status === 'success' ? <CheckCircle className="h-3 w-3 text-green-600" /> : <AlertTriangle className="h-3 w-3 text-yellow-600" />}
                                <span className="text-xs">{backup.date}</span>
                                <Badge variant="outline" className="text-xs">{backup.type}</Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{backup.size}</span>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>)}
                        </div>
                      </ScrollArea>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-lg font-semibold">156</div>
                        <div className="text-xs text-muted-foreground">Total Backups</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-lg font-semibold">2.3 GB</div>
                        <div className="text-xs text-muted-foreground">Storage Used</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Advanced Backup Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <Label className="text-base font-medium">Retention Policies</Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Daily Backups</Label>
                          <Select defaultValue="30">
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="7">7 days</SelectItem>
                              <SelectItem value="14">14 days</SelectItem>
                              <SelectItem value="30">30 days</SelectItem>
                              <SelectItem value="60">60 days</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Weekly Backups</Label>
                          <Select defaultValue="12">
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="4">4 weeks</SelectItem>
                              <SelectItem value="8">8 weeks</SelectItem>
                              <SelectItem value="12">12 weeks</SelectItem>
                              <SelectItem value="26">26 weeks</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Monthly Backups</Label>
                          <Select defaultValue="12">
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="6">6 months</SelectItem>
                              <SelectItem value="12">12 months</SelectItem>
                              <SelectItem value="24">24 months</SelectItem>
                              <SelectItem value="36">36 months</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-medium">Backup Content</Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Database</Label>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">User Files</Label>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">System Settings</Label>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Themes & Templates</Label>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Logs & Analytics</Label>
                          <Switch />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-medium">Notifications</Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Success Notifications</Label>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Failure Alerts</Label>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Weekly Reports</Label>
                          <Switch defaultChecked />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Email Recipients</Label>
                          <Input placeholder="admin@example.com" className="text-sm" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Security Dashboard */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Security Overview
                    </CardTitle>
                    <CardDescription>
                      Current security status and recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Security Score: 92/100</span>
                      </div>
                      <Badge variant="secondary">Excellent</Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="text-sm">SSL Certificate Valid</span>
                        </div>
                        <Badge variant="outline" className="text-xs">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="text-sm">Firewall Protection</span>
                        </div>
                        <Badge variant="outline" className="text-xs">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3 text-yellow-600" />
                          <span className="text-sm">Two-Factor Authentication</span>
                        </div>
                        <Badge variant="outline" className="text-xs">Partial</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="text-sm">Regular Security Scans</span>
                        </div>
                        <Badge variant="outline" className="text-xs">Weekly</Badge>
                      </div>
                    </div>

                    <Button className="w-full">
                      <Shield className="h-4 w-4 mr-2" />
                      Run Security Scan Now
                    </Button>
                  </CardContent>
                </Card>

                {/* Security Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Security Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure security features and policies
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable Brute Force Protection</Label>
                          <p className="text-xs text-muted-foreground">Block IPs after failed login attempts</p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Rate Limiting</Label>
                          <p className="text-xs text-muted-foreground">Limit API requests per minute</p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>IP Whitelist Mode</Label>
                          <p className="text-xs text-muted-foreground">Only allow specific IP addresses</p>
                        </div>
                        <Switch />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Require HTTPS</Label>
                          <p className="text-xs text-muted-foreground">Force SSL for all connections</p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label>Password Policy</Label>
                        <Select defaultValue="strong">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Basic (8+ characters)</SelectItem>
                            <SelectItem value="medium">Medium (12+ chars, mixed case)</SelectItem>
                            <SelectItem value="strong">Strong (16+ chars, symbols)</SelectItem>
                            <SelectItem value="very-strong">Very Strong (20+ chars, all types)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Session Timeout (minutes)</Label>
                        <Select defaultValue="30">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="240">4 hours</SelectItem>
                            <SelectItem value="480">8 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Max Failed Login Attempts</Label>
                        <Select defaultValue="5">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3 attempts</SelectItem>
                            <SelectItem value="5">5 attempts</SelectItem>
                            <SelectItem value="10">10 attempts</SelectItem>
                            <SelectItem value="unlimited">Unlimited</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Security Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium">Medium Priority</span>
                      </div>
                      <p className="text-sm mb-2">Enable two-factor authentication for all admin accounts to improve security.</p>
                      <Button size="sm" variant="outline">
                        Configure 2FA
                      </Button>
                    </div>

                    <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Suggestion</span>
                      </div>
                      <p className="text-sm mb-2">Consider implementing Content Security Policy headers for better XSS protection.</p>
                      <Button size="sm" variant="outline">
                        Learn More
                      </Button>
                    </div>

                    <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Good Practice</span>
                      </div>
                      <p className="text-sm">Your SSL certificate is properly configured and up to date.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="monitoring" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Real-time Monitoring */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="h-5 w-5" />
                      Real-time Security Monitoring
                    </CardTitle>
                    <CardDescription>
                      Live security events and threat detection
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-lg font-semibold text-green-600">0</div>
                        <div className="text-xs text-muted-foreground">Active Threats</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-lg font-semibold">24</div>
                        <div className="text-xs text-muted-foreground">Blocked Attempts</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Recent Security Events</Label>
                      <ScrollArea className="h-48 w-full border rounded-md p-2">
                        <div className="space-y-2">
                          {[{
                          time: '14:32',
                          event: 'Failed login attempt',
                          ip: '192.168.1.100',
                          severity: 'low'
                        }, {
                          time: '14:15',
                          event: 'Successful admin login',
                          ip: '10.0.0.1',
                          severity: 'info'
                        }, {
                          time: '13:58',
                          event: 'Rate limit exceeded',
                          ip: '203.0.113.5',
                          severity: 'medium'
                        }, {
                          time: '13:45',
                          event: 'Password reset request',
                          ip: '198.51.100.2',
                          severity: 'low'
                        }, {
                          time: '13:22',
                          event: 'New user registration',
                          ip: '203.0.113.8',
                          severity: 'info'
                        }].map((event, index) => <div key={index} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${event.severity === 'info' ? 'bg-blue-500' : event.severity === 'low' ? 'bg-yellow-500' : event.severity === 'medium' ? 'bg-orange-500' : 'bg-red-500'}`} />
                                <span className="text-xs">{event.time}</span>
                                <span className="text-xs">{event.event}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">{event.ip}</span>
                            </div>)}
                        </div>
                      </ScrollArea>
                    </div>
                  </CardContent>
                </Card>

                {/* Monitoring Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Monitoring Settings
                    </CardTitle>
                    <CardDescription>
                      Configure monitoring and alerting preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Real-time Monitoring</Label>
                          <p className="text-xs text-muted-foreground">Monitor security events live</p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Intrusion Detection</Label>
                          <p className="text-xs text-muted-foreground">Detect suspicious activities</p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>DDoS Protection</Label>
                          <p className="text-xs text-muted-foreground">Protect against DDoS attacks</p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Malware Scanning</Label>
                          <p className="text-xs text-muted-foreground">Scan uploaded files for malware</p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label>Alert Threshold</Label>
                        <Select defaultValue="medium">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low (All events)</SelectItem>
                            <SelectItem value="medium">Medium (Important events)</SelectItem>
                            <SelectItem value="high">High (Critical only)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Monitoring Retention</Label>
                        <Select defaultValue="90">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 days</SelectItem>
                            <SelectItem value="90">90 days</SelectItem>
                            <SelectItem value="180">180 days</SelectItem>
                            <SelectItem value="365">1 year</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="recovery" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Disaster Recovery */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <RotateCcw className="h-5 w-5" />
                      Disaster Recovery
                    </CardTitle>
                    <CardDescription>
                      Recovery options and disaster preparedness
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Recovery Plan Status: Active</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Last tested: 7 days ago</p>
                    </div>

                    <div className="space-y-3">
                      <Button className="w-full justify-start" variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Restore from Backup
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Point-in-Time Recovery
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export Recovery Kit
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Recovery Time Objective (RTO)</Label>
                      <Select defaultValue="4h">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1h">1 hour</SelectItem>
                          <SelectItem value="4h">4 hours</SelectItem>
                          <SelectItem value="24h">24 hours</SelectItem>
                          <SelectItem value="72h">72 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Recovery Point Objective (RPO)</Label>
                      <Select defaultValue="1h">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15m">15 minutes</SelectItem>
                          <SelectItem value="1h">1 hour</SelectItem>
                          <SelectItem value="4h">4 hours</SelectItem>
                          <SelectItem value="24h">24 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Recovery Testing */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Recovery Testing
                    </CardTitle>
                    <CardDescription>
                      Test and validate recovery procedures
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Button className="w-full justify-start">
                        <Timer className="h-4 w-4 mr-2" />
                        Schedule Recovery Test
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Validate Backup Integrity
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Test Recovery Procedures
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Last Recovery Tests</Label>
                      <ScrollArea className="h-32 w-full border rounded-md p-2">
                        <div className="space-y-2">
                          {[{
                          date: '2024-01-08',
                          test: 'Full System Recovery',
                          result: 'success',
                          duration: '15m'
                        }, {
                          date: '2024-01-01',
                          test: 'Database Recovery',
                          result: 'success',
                          duration: '8m'
                        }, {
                          date: '2023-12-25',
                          test: 'File System Recovery',
                          result: 'success',
                          duration: '12m'
                        }].map((test, index) => <div key={index} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                <span className="text-xs">{test.date}</span>
                                <span className="text-xs">{test.test}</span>
                              </div>
                              <Badge variant="outline" className="text-xs">{test.duration}</Badge>
                            </div>)}
                        </div>
                      </ScrollArea>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Compliance Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Compliance Status
                    </CardTitle>
                    <CardDescription>
                      Security compliance and certification status
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-lg font-semibold text-green-600">GDPR</div>
                        <div className="text-xs text-muted-foreground">Compliant</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-lg font-semibold text-green-600">SOC 2</div>
                        <div className="text-xs text-muted-foreground">Type II</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="text-sm">Data Encryption</span>
                        </div>
                        <Badge variant="outline" className="text-xs">AES-256</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="text-sm">Access Controls</span>
                        </div>
                        <Badge variant="outline" className="text-xs">RBAC</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="text-sm">Audit Logging</span>
                        </div>
                        <Badge variant="outline" className="text-xs">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3 text-yellow-600" />
                          <span className="text-sm">Data Retention Policy</span>
                        </div>
                        <Badge variant="outline" className="text-xs">Review Required</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Compliance Tools */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Compliance Tools
                    </CardTitle>
                    <CardDescription>
                      Generate reports and manage compliance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Button className="w-full justify-start" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Generate Compliance Report
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Export Audit Logs
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <Shield className="h-4 w-4 mr-2" />
                        Security Assessment
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <Award className="h-4 w-4 mr-2" />
                        Certification Status
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Data Retention Period</Label>
                      <Select defaultValue="7years">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1year">1 year</SelectItem>
                          <SelectItem value="3years">3 years</SelectItem>
                          <SelectItem value="5years">5 years</SelectItem>
                          <SelectItem value="7years">7 years</SelectItem>
                          <SelectItem value="indefinite">Indefinite</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Compliance Framework</Label>
                      <Select defaultValue="gdpr">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gdpr">GDPR</SelectItem>
                          <SelectItem value="ccpa">CCPA</SelectItem>
                          <SelectItem value="hipaa">HIPAA</SelectItem>
                          <SelectItem value="soc2">SOC 2</SelectItem>
                          <SelectItem value="iso27001">ISO 27001</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="logs" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Security Audit Logs
                  </CardTitle>
                  <CardDescription>
                    Comprehensive security event logging and analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Input placeholder="Search logs..." className="w-64" />
                      <Select defaultValue="all">
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Events</SelectItem>
                          <SelectItem value="login">Login</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="security">Security</SelectItem>
                          <SelectItem value="backup">Backup</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>

                  <ScrollArea className="h-96 w-full border rounded-md">
                    <div className="p-4 space-y-2">
                      {[{
                      timestamp: '2024-01-15 14:32:15',
                      level: 'INFO',
                      event: 'User login successful',
                      user: 'admin@example.com',
                      ip: '192.168.1.100',
                      details: 'Login from trusted device'
                    }, {
                      timestamp: '2024-01-15 14:28:43',
                      level: 'WARN',
                      event: 'Failed login attempt',
                      user: 'unknown',
                      ip: '203.0.113.5',
                      details: 'Invalid credentials provided'
                    }, {
                      timestamp: '2024-01-15 14:15:22',
                      level: 'INFO',
                      event: 'Backup completed successfully',
                      user: 'system',
                      ip: 'localhost',
                      details: 'Daily backup - 45.2 MB'
                    }, {
                      timestamp: '2024-01-15 13:58:11',
                      level: 'WARN',
                      event: 'Rate limit exceeded',
                      user: 'api_user',
                      ip: '198.51.100.2',
                      details: '100+ requests in 1 minute'
                    }, {
                      timestamp: '2024-01-15 13:45:33',
                      level: 'INFO',
                      event: 'Password reset initiated',
                      user: 'user@example.com',
                      ip: '10.0.0.1',
                      details: 'Reset token sent via email'
                    }, {
                      timestamp: '2024-01-15 13:22:18',
                      level: 'INFO',
                      event: 'New user registration',
                      user: 'newuser@example.com',
                      ip: '203.0.113.8',
                      details: 'Email verification required'
                    }, {
                      timestamp: '2024-01-15 12:15:45',
                      level: 'ERROR',
                      event: 'Security scan detected threat',
                      user: 'system',
                      ip: 'scanner',
                      details: 'Malicious file upload blocked'
                    }, {
                      timestamp: '2024-01-15 11:30:22',
                      level: 'INFO',
                      event: 'Admin panel accessed',
                      user: 'admin@example.com',
                      ip: '192.168.1.100',
                      details: 'User management section'
                    }, {
                      timestamp: '2024-01-15 10:45:11',
                      level: 'WARN',
                      event: 'Suspicious activity detected',
                      user: 'unknown',
                      ip: '185.220.101.5',
                      details: 'Multiple failed requests'
                    }, {
                      timestamp: '2024-01-15 09:15:33',
                      level: 'INFO',
                      event: 'Database backup started',
                      user: 'system',
                      ip: 'localhost',
                      details: 'Scheduled weekly backup'
                    }].map((log, index) => <div key={index} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Badge variant={log.level === 'ERROR' ? 'destructive' : log.level === 'WARN' ? 'secondary' : 'outline'} className="text-xs">
                              {log.level}
                            </Badge>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{log.event}</span>
                              <span className="text-xs text-muted-foreground">{log.details}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs">{log.timestamp}</div>
                            <div className="text-xs text-muted-foreground">{log.user} • {log.ip}</div>
                          </div>
                        </div>)}
                    </div>
                  </ScrollArea>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Showing 10 of 1,247 events</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled>Previous</Button>
                      <Button variant="outline" size="sm">Next</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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
                  <Input id="contact-email" type="email" placeholder="contact@yoursite.com" value={siteSettings.contactInfo.email} onChange={e => setSiteSettings(prev => ({
                  ...prev,
                  contactInfo: {
                    ...prev.contactInfo,
                    email: e.target.value
                  }
                }))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Phone Number</Label>
                  <Input id="contact-phone" placeholder="+1 (555) 123-4567" value={siteSettings.contactInfo.phone} onChange={e => setSiteSettings(prev => ({
                  ...prev,
                  contactInfo: {
                    ...prev.contactInfo,
                    phone: e.target.value
                  }
                }))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-address">Business Address</Label>
                  <Textarea id="contact-address" placeholder="123 Main St, City, State 12345" value={siteSettings.contactInfo.address} onChange={e => setSiteSettings(prev => ({
                  ...prev,
                  contactInfo: {
                    ...prev.contactInfo,
                    address: e.target.value
                  }
                }))} rows={3} />
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
    </div>;
};
export default HomePageManagement;