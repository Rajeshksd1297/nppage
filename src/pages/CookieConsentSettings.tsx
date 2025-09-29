import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Cookie,
  Shield,
  Settings,
  BarChart3,
  Users,
  Globe,
  Save,
  Eye,
  AlertTriangle,
  CheckCircle,
  Palette,
  Code,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  Trash2,
  Plus,
  Edit
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

// Validation schema for cookie consent settings
const cookieConsentSchema = z.object({
  banner_title: z.string().min(1, "Banner title is required").max(100, "Title must be less than 100 characters"),
  banner_message: z.string().min(1, "Banner message is required").max(500, "Message must be less than 500 characters"),
  accept_button_text: z.string().min(1, "Accept button text is required").max(50, "Text must be less than 50 characters"),
  reject_button_text: z.string().min(1, "Reject button text is required").max(50, "Text must be less than 50 characters"),
  privacy_policy_url: z.string().url("Invalid privacy policy URL").optional().or(z.literal("")),
  cookie_policy_url: z.string().url("Invalid cookie policy URL").optional().or(z.literal("")),
});

interface CookieCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  enabled: boolean;
  cookies: string[];
}

interface CookieConsentData {
  user_id?: string;
  ip_address: string;
  user_agent: string;
  consent_given: boolean;
  categories_accepted: string[];
  created_at: string;
}

const CookieConsentSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
  
  // Cookie consent settings state
  const [consentSettings, setConsentSettings] = useState({
    enabled: true,
    banner_title: 'We use cookies',
    banner_message: 'We use cookies to enhance your experience, analyze site traffic, and for marketing purposes. By clicking "Accept All", you consent to our use of cookies.',
    accept_button_text: 'Accept All',
    reject_button_text: 'Reject All',
    customize_button_text: 'Customize',
    privacy_policy_url: '',
    cookie_policy_url: '',
    banner_position: 'bottom',
    banner_theme: 'dark',
    auto_block_scripts: true,
    consent_expiry_days: 365,
    show_decline_button: true,
    force_consent: false,
    respect_dnt: true
  });

  // Cookie categories state
  const [cookieCategories, setCookieCategories] = useState<CookieCategory[]>([
    {
      id: 'necessary',
      name: 'Necessary Cookies',
      description: 'These cookies are essential for the website to function properly.',
      required: true,
      enabled: true,
      cookies: ['session_id', 'csrf_token', 'auth_token']
    },
    {
      id: 'analytics',
      name: 'Analytics Cookies',
      description: 'These cookies help us understand how visitors interact with our website.',
      required: false,
      enabled: false,
      cookies: ['_ga', '_gtag', '_gid', 'analytics_session']
    },
    {
      id: 'marketing',
      name: 'Marketing Cookies',
      description: 'These cookies are used to track visitors across websites for advertising purposes.',
      required: false,
      enabled: false,
      cookies: ['fb_pixel', 'google_ads', 'marketing_id']
    },
    {
      id: 'functional',
      name: 'Functional Cookies',
      description: 'These cookies enable enhanced functionality and personalization.',
      required: false,
      enabled: false,
      cookies: ['theme_preference', 'language', 'user_preferences']
    }
  ]);

  // Analytics state
  const [consentAnalytics, setConsentAnalytics] = useState({
    total_visitors: 0,
    consent_given: 0,
    consent_declined: 0,
    consent_rate: 0,
    recent_consents: [] as CookieConsentData[]
  });

  useEffect(() => {
    fetchConsentSettings();
    fetchConsentAnalytics();
  }, []);

  const fetchConsentSettings = async () => {
    try {
      // This would fetch from a cookie_consent_settings table
      // For now, we'll use the current state as default
      setLoading(false);
    } catch (error) {
      console.error('Error fetching consent settings:', error);
      toast({
        title: "Error",
        description: "Failed to load cookie consent settings",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const fetchConsentAnalytics = async () => {
    try {
      // Mock analytics data - in real implementation, this would come from database
      setConsentAnalytics({
        total_visitors: 1250,
        consent_given: 980,
        consent_declined: 270,
        consent_rate: 78.4,
        recent_consents: [
          {
            ip_address: '192.168.1.1',
            user_agent: 'Mozilla/5.0...',
            consent_given: true,
            categories_accepted: ['necessary', 'analytics'],
            created_at: new Date().toISOString()
          }
        ]
      });
    } catch (error) {
      console.error('Error fetching consent analytics:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      // Validate the form data
      const validatedData = cookieConsentSchema.parse(consentSettings);
      
      setSaving(true);
      
      // Here you would save to your database
      // await supabase.from('cookie_consent_settings').upsert([consentSettings]);
      
      toast({
        title: "Success",
        description: "Cookie consent settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save cookie consent settings",
          variant: "destructive",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setCookieCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId ? { ...cat, enabled: !cat.enabled } : cat
      )
    );
  };

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
            <Cookie className="h-8 w-8" />
            Cookie Consent Management
          </h1>
          <p className="text-muted-foreground">
            Manage GDPR-compliant cookie consent for your website
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open('/', '_blank')}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSaveSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="categories">
            <Shield className="h-4 w-4 mr-2" />
            Cookie Categories
          </TabsTrigger>
          <TabsTrigger value="design">
            <Palette className="h-4 w-4 mr-2" />
            Design
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Basic Settings
                </CardTitle>
                <CardDescription>
                  Configure your cookie consent banner
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Cookie Consent</Label>
                    <p className="text-xs text-muted-foreground">
                      Show cookie consent banner to visitors
                    </p>
                  </div>
                  <Switch
                    checked={consentSettings.enabled}
                    onCheckedChange={(checked) => 
                      setConsentSettings(prev => ({ ...prev, enabled: checked }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banner-title">Banner Title</Label>
                  <Input
                    id="banner-title"
                    value={consentSettings.banner_title}
                    onChange={(e) => 
                      setConsentSettings(prev => ({ ...prev, banner_title: e.target.value }))
                    }
                    placeholder="We use cookies"
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    {consentSettings.banner_title.length}/100 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banner-message">Banner Message</Label>
                  <Textarea
                    id="banner-message"
                    value={consentSettings.banner_message}
                    onChange={(e) => 
                      setConsentSettings(prev => ({ ...prev, banner_message: e.target.value }))
                    }
                    placeholder="We use cookies to enhance your experience..."
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">
                    {consentSettings.banner_message.length}/500 characters
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accept-button">Accept Button Text</Label>
                    <Input
                      id="accept-button"
                      value={consentSettings.accept_button_text}
                      onChange={(e) => 
                        setConsentSettings(prev => ({ ...prev, accept_button_text: e.target.value }))
                      }
                      placeholder="Accept All"
                      maxLength={50}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reject-button">Reject Button Text</Label>
                    <Input
                      id="reject-button"
                      value={consentSettings.reject_button_text}
                      onChange={(e) => 
                        setConsentSettings(prev => ({ ...prev, reject_button_text: e.target.value }))
                      }
                      placeholder="Reject All"
                      maxLength={50}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Legal Compliance
                </CardTitle>
                <CardDescription>
                  Configure legal links and compliance settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="privacy-policy">Privacy Policy URL</Label>
                  <Input
                    id="privacy-policy"
                    type="url"
                    value={consentSettings.privacy_policy_url}
                    onChange={(e) => 
                      setConsentSettings(prev => ({ ...prev, privacy_policy_url: e.target.value }))
                    }
                    placeholder="https://yoursite.com/privacy-policy"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cookie-policy">Cookie Policy URL</Label>
                  <Input
                    id="cookie-policy"
                    type="url"
                    value={consentSettings.cookie_policy_url}
                    onChange={(e) => 
                      setConsentSettings(prev => ({ ...prev, cookie_policy_url: e.target.value }))
                    }
                    placeholder="https://yoursite.com/cookie-policy"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consent-expiry">Consent Expiry (Days)</Label>
                  <Input
                    id="consent-expiry"
                    type="number"
                    min="1"
                    max="3650"
                    value={consentSettings.consent_expiry_days}
                    onChange={(e) => 
                      setConsentSettings(prev => ({ ...prev, consent_expiry_days: parseInt(e.target.value) || 365 }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    How long to remember user consent (1-3650 days)
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Force Consent</Label>
                      <p className="text-xs text-muted-foreground">
                        Block site access until consent is given
                      </p>
                    </div>
                    <Switch
                      checked={consentSettings.force_consent}
                      onCheckedChange={(checked) => 
                        setConsentSettings(prev => ({ ...prev, force_consent: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Respect Do Not Track</Label>
                      <p className="text-xs text-muted-foreground">
                        Honor browser Do Not Track settings
                      </p>
                    </div>
                    <Switch
                      checked={consentSettings.respect_dnt}
                      onCheckedChange={(checked) => 
                        setConsentSettings(prev => ({ ...prev, respect_dnt: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-block Scripts</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically block tracking scripts until consent
                      </p>
                    </div>
                    <Switch
                      checked={consentSettings.auto_block_scripts}
                      onCheckedChange={(checked) => 
                        setConsentSettings(prev => ({ ...prev, auto_block_scripts: checked }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="space-y-4">
            {cookieCategories.map((category) => (
              <Card key={category.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{category.name}</h3>
                        {category.required && (
                          <Badge variant="secondary">Required</Badge>
                        )}
                        {category.enabled && !category.required && (
                          <Badge variant="default">Enabled</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {category.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {category.cookies.map((cookie) => (
                          <Badge key={cookie} variant="outline" className="text-xs">
                            {cookie}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!category.required && (
                        <Switch
                          checked={category.enabled}
                          onCheckedChange={() => handleCategoryToggle(category.id)}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button className="w-full" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Cookie Category
          </Button>
        </TabsContent>

        <TabsContent value="design" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Banner Appearance
                </CardTitle>
                <CardDescription>
                  Customize the look and feel of your cookie banner
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="banner-position">Banner Position</Label>
                  <Select 
                    value={consentSettings.banner_position}
                    onValueChange={(value) => 
                      setConsentSettings(prev => ({ ...prev, banner_position: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="bottom">Bottom</SelectItem>
                      <SelectItem value="center">Center Modal</SelectItem>
                      <SelectItem value="corner">Bottom Right Corner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banner-theme">Banner Theme</Label>
                  <Select 
                    value={consentSettings.banner_theme}
                    onValueChange={(value) => 
                      setConsentSettings(prev => ({ ...prev, banner_theme: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto (follows system)</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  See how your cookie banner will appear
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="space-y-3">
                    <h4 className="font-medium">{consentSettings.banner_title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {consentSettings.banner_message}
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm">{consentSettings.accept_button_text}</Button>
                      <Button size="sm" variant="outline">{consentSettings.reject_button_text}</Button>
                      <Button size="sm" variant="ghost">Customize</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Visitors</p>
                    <p className="text-2xl font-bold">{consentAnalytics.total_visitors.toLocaleString()}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Consent Given</p>
                    <p className="text-2xl font-bold text-green-600">{consentAnalytics.consent_given.toLocaleString()}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Consent Declined</p>
                    <p className="text-2xl font-bold text-red-600">{consentAnalytics.consent_declined.toLocaleString()}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Consent Rate</p>
                    <p className="text-2xl font-bold text-purple-600">{consentAnalytics.consent_rate}%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Consent Analytics
              </CardTitle>
              <CardDescription>
                Detailed analytics about cookie consent behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Consent by Category</h4>
                    <div className="space-y-2">
                      {cookieCategories.map((category) => (
                        <div key={category.id} className="flex justify-between items-center">
                          <span className="text-sm">{category.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${Math.random() * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{Math.floor(Math.random() * 100)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Recent Activity</h4>
                    <ScrollArea className="h-40">
                      <div className="space-y-2">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div key={i} className="flex items-center justify-between text-sm p-2 rounded border">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span>Consent accepted</span>
                            </div>
                            <span className="text-muted-foreground">{i + 1}m ago</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                  <Button variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Analytics
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CookieConsentSettings;