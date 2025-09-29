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
import { 
  Settings, 
  Globe, 
  Search, 
  Share, 
  Zap, 
  Code, 
  Upload,
  Eye,
  Palette,
  Shield,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GlobalSEOSettings {
  siteTitle: string;
  siteDescription: string;
  siteKeywords: string;
  siteLogo: string;
  favicon: string;
  ogImage: string;
  twitterHandle: string;
  canonicalUrl: string;
  enableSitemap: boolean;
  enableRobots: boolean;
  // Enhanced SEO fields
  metaAuthor: string;
  metaLanguage: string;
  structuredDataType: string;
  schemaMarkup: string;
  richSnippets: boolean;
  aiOptimization: boolean;
  contentStrategy: string;
  targetAudience: string;
  competitorKeywords: string;
  localSEO: {
    businessName: string;
    address: string;
    phone: string;
    businessType: string;
  };
}

interface AnalyticsSettings {
  googleAnalyticsId: string;
  facebookPixelId: string;
  enableHotjar: boolean;
  hotjarId: string;
  customTracking: string;
}

interface PerformanceSettings {
  enableLazyLoading: boolean;
  enableImageOptimization: boolean;
  enableCaching: boolean;
  compressionLevel: string;
  enablePreloading: boolean;
}

interface SecuritySettings {
  enableSSL: boolean;
  enableCSP: boolean;
  cspDirectives: string;
  enableCORS: boolean;
  corsOrigins: string;
}

interface PageSettingsProps {
  onSave?: (settings: any) => void;
}

const PageSettings = ({ onSave }: PageSettingsProps) => {
  const [activeTab, setActiveTab] = useState('seo');
  const { toast } = useToast();

  const [seoSettings, setSeoSettings] = useState<GlobalSEOSettings>({
    siteTitle: 'Your Author Platform',
    siteDescription: 'Professional author profiles and book showcase platform',
    siteKeywords: 'author, books, publishing, writing, author platform',
    siteLogo: '',
    favicon: '',
    ogImage: '',
    twitterHandle: '',
    canonicalUrl: '',
    enableSitemap: true,
    enableRobots: true,
    // Enhanced SEO defaults
    metaAuthor: '',
    metaLanguage: 'en',
    structuredDataType: 'WebSite',
    schemaMarkup: '',
    richSnippets: true,
    aiOptimization: true,
    contentStrategy: 'author-focused',
    targetAudience: 'readers, publishers, book enthusiasts',
    competitorKeywords: '',
    localSEO: {
      businessName: '',
      address: '',
      phone: '',
      businessType: 'ProfessionalService'
    }
  });

  const [analyticsSettings, setAnalyticsSettings] = useState<AnalyticsSettings>({
    googleAnalyticsId: '',
    facebookPixelId: '',
    enableHotjar: false,
    hotjarId: '',
    customTracking: ''
  });

  const [performanceSettings, setPerformanceSettings] = useState<PerformanceSettings>({
    enableLazyLoading: true,
    enableImageOptimization: true,
    enableCaching: true,
    compressionLevel: 'medium',
    enablePreloading: true
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    enableSSL: true,
    enableCSP: false,
    cspDirectives: "default-src 'self'; script-src 'self' 'unsafe-inline';",
    enableCORS: false,
    corsOrigins: ''
  });

  const [customScripts, setCustomScripts] = useState({
    headScripts: '',
    bodyScripts: '',
    footerScripts: ''
  });

  const handleSave = () => {
    const allSettings = {
      seo: seoSettings,
      analytics: analyticsSettings,
      performance: performanceSettings,
      security: securitySettings,
      scripts: customScripts
    };
    
    onSave?.(allSettings);
    toast({
      title: "Success",
      description: "Page settings saved successfully",
    });
  };

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Settings Navigation */}
      <div className="w-80 border-r bg-muted/5 overflow-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <h3 className="font-semibold">Page Settings</h3>
            </div>
            <Button onClick={handleSave} size="sm">Save All</Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="w-full">
            <TabsList className="grid w-full grid-rows-8 h-auto gap-1">
              <TabsTrigger value="seo" className="flex items-center justify-start space-x-2 h-10">
                <Search className="h-4 w-4" />
                <span>Basic SEO</span>
              </TabsTrigger>
              <TabsTrigger value="advanced-seo" className="flex items-center justify-start space-x-2 h-10">
                <Globe className="h-4 w-4" />
                <span>Advanced SEO</span>
              </TabsTrigger>
              <TabsTrigger value="ai-optimization" className="flex items-center justify-start space-x-2 h-10">
                <Zap className="h-4 w-4" />
                <span>AI Optimization</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center justify-start space-x-2 h-10">
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="social" className="flex items-center justify-start space-x-2 h-10">
                <Share className="h-4 w-4" />
                <span>Social Sharing</span>
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center justify-start space-x-2 h-10">
                <Zap className="h-4 w-4" />
                <span>Performance</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center justify-start space-x-2 h-10">
                <Shield className="h-4 w-4" />
                <span>Security</span>
              </TabsTrigger>
              <TabsTrigger value="scripts" className="flex items-center justify-start space-x-2 h-10">
                <Code className="h-4 w-4" />
                <span>Custom Code</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Right Panel - Settings Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* SEO & Meta Settings */}
            <TabsContent value="seo" className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <Search className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Basic SEO Settings</h2>
                <Badge variant="outline">Essential</Badge>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Basic SEO</CardTitle>
                  <CardDescription>Configure your site's basic search engine optimization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="siteTitle">Site Title</Label>
                    <Input
                      id="siteTitle"
                      value={seoSettings.siteTitle}
                      onChange={(e) => setSeoSettings({...seoSettings, siteTitle: e.target.value})}
                      placeholder="Your Author Platform"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Appears in browser tabs and search results</p>
                  </div>

                  <div>
                    <Label htmlFor="siteDescription">Site Description</Label>
                    <Textarea
                      id="siteDescription"
                      value={seoSettings.siteDescription}
                      onChange={(e) => setSeoSettings({...seoSettings, siteDescription: e.target.value})}
                      placeholder="Professional author profiles and book showcase platform"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Meta description for search engines (150-160 chars)</p>
                  </div>

                  <div>
                    <Label htmlFor="siteKeywords">Keywords</Label>
                    <Input
                      id="siteKeywords"
                      value={seoSettings.siteKeywords}
                      onChange={(e) => setSeoSettings({...seoSettings, siteKeywords: e.target.value})}
                      placeholder="author, books, publishing, writing"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Target 5-10 relevant keywords</p>
                  </div>

                  <div>
                    <Label htmlFor="canonicalUrl">Canonical URL</Label>
                    <Input
                      id="canonicalUrl"
                      value={seoSettings.canonicalUrl}
                      onChange={(e) => setSeoSettings({...seoSettings, canonicalUrl: e.target.value})}
                      placeholder="https://yourdomain.com"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Helps prevent duplicate content issues</p>
                  </div>

                  <div>
                    <Label htmlFor="metaAuthor">Author Meta Tag</Label>
                    <Input
                      id="metaAuthor"
                      value={seoSettings.metaAuthor}
                      onChange={(e) => setSeoSettings({...seoSettings, metaAuthor: e.target.value})}
                      placeholder="Your Name or Organization"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Author attribution for content</p>
                  </div>

                  <div>
                    <Label htmlFor="metaLanguage">Content Language</Label>
                    <Select 
                      value={seoSettings.metaLanguage} 
                      onValueChange={(value) => setSeoSettings({...seoSettings, metaLanguage: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="it">Italian</SelectItem>
                        <SelectItem value="pt">Portuguese</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">Primary language of your content</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Site Assets</CardTitle>
                  <CardDescription>Upload your site logo, favicon, and default sharing image</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="siteLogo">Site Logo URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="siteLogo"
                        value={seoSettings.siteLogo}
                        onChange={(e) => setSeoSettings({...seoSettings, siteLogo: e.target.value})}
                        placeholder="https://yourdomain.com/logo.png"
                      />
                      <Button variant="outline" size="icon">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="favicon">Favicon URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="favicon"
                        value={seoSettings.favicon}
                        onChange={(e) => setSeoSettings({...seoSettings, favicon: e.target.value})}
                        placeholder="https://yourdomain.com/favicon.ico"
                      />
                      <Button variant="outline" size="icon">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="ogImage">Default Share Image</Label>
                    <div className="flex gap-2">
                      <Input
                        id="ogImage"
                        value={seoSettings.ogImage}
                        onChange={(e) => setSeoSettings({...seoSettings, ogImage: e.target.value})}
                        placeholder="https://yourdomain.com/share-image.jpg"
                      />
                      <Button variant="outline" size="icon">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">1200x630px recommended</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Search Engine Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable XML Sitemap</Label>
                      <p className="text-xs text-muted-foreground">Automatically generate sitemap.xml</p>
                    </div>
                    <Switch
                      checked={seoSettings.enableSitemap}
                      onCheckedChange={(checked) => setSeoSettings({...seoSettings, enableSitemap: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Robots.txt</Label>
                      <p className="text-xs text-muted-foreground">Control search engine crawling</p>
                    </div>
                    <Switch
                      checked={seoSettings.enableRobots}
                      onCheckedChange={(checked) => setSeoSettings({...seoSettings, enableRobots: checked})}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advanced SEO Settings */}
            <TabsContent value="advanced-seo" className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <Globe className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Advanced SEO</h2>
                <Badge variant="secondary">Pro</Badge>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Structured Data & Schema</CardTitle>
                  <CardDescription>Help search engines understand your content better</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Rich Snippets</Label>
                      <p className="text-xs text-muted-foreground">Automatically generate structured data</p>
                    </div>
                    <Switch
                      checked={seoSettings.richSnippets}
                      onCheckedChange={(checked) => setSeoSettings({...seoSettings, richSnippets: checked})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="structuredDataType">Schema Type</Label>
                    <Select 
                      value={seoSettings.structuredDataType} 
                      onValueChange={(value) => setSeoSettings({...seoSettings, structuredDataType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WebSite">Website</SelectItem>
                        <SelectItem value="Person">Person/Author</SelectItem>
                        <SelectItem value="Organization">Organization</SelectItem>
                        <SelectItem value="Book">Book/Publication</SelectItem>
                        <SelectItem value="CreativeWork">Creative Work</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="schemaMarkup">Custom Schema Markup</Label>
                    <Textarea
                      id="schemaMarkup"
                      value={seoSettings.schemaMarkup}
                      onChange={(e) => setSeoSettings({...seoSettings, schemaMarkup: e.target.value})}
                      placeholder='{"@context": "https://schema.org", "@type": "Person", "name": "Your Name"}'
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground mt-1">JSON-LD structured data</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content Strategy</CardTitle>
                  <CardDescription>Define your SEO content approach</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="contentStrategy">Content Focus</Label>
                    <Select 
                      value={seoSettings.contentStrategy} 
                      onValueChange={(value) => setSeoSettings({...seoSettings, contentStrategy: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="author-focused">Author Platform</SelectItem>
                        <SelectItem value="book-marketing">Book Marketing</SelectItem>
                        <SelectItem value="publisher-network">Publisher Network</SelectItem>
                        <SelectItem value="reader-community">Reader Community</SelectItem>
                        <SelectItem value="educational">Educational Content</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="targetAudience">Target Audience</Label>
                    <Input
                      id="targetAudience"
                      value={seoSettings.targetAudience}
                      onChange={(e) => setSeoSettings({...seoSettings, targetAudience: e.target.value})}
                      placeholder="readers, publishers, book enthusiasts"
                    />
                  </div>

                  <div>
                    <Label htmlFor="competitorKeywords">Competitor Keywords</Label>
                    <Textarea
                      id="competitorKeywords"
                      value={seoSettings.competitorKeywords}
                      onChange={(e) => setSeoSettings({...seoSettings, competitorKeywords: e.target.value})}
                      placeholder="goodreads, bookbub, author website, book marketing"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Research what your competitors rank for</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Local SEO</CardTitle>
                  <CardDescription>Optimize for local search results</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      value={seoSettings.localSEO.businessName}
                      onChange={(e) => setSeoSettings({
                        ...seoSettings, 
                        localSEO: {...seoSettings.localSEO, businessName: e.target.value}
                      })}
                      placeholder="Your Author Business Name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="businessAddress">Address</Label>
                    <Input
                      id="businessAddress"
                      value={seoSettings.localSEO.address}
                      onChange={(e) => setSeoSettings({
                        ...seoSettings, 
                        localSEO: {...seoSettings.localSEO, address: e.target.value}
                      })}
                      placeholder="123 Main St, City, State, ZIP"
                    />
                  </div>

                  <div>
                    <Label htmlFor="businessPhone">Phone Number</Label>
                    <Input
                      id="businessPhone"
                      value={seoSettings.localSEO.phone}
                      onChange={(e) => setSeoSettings({
                        ...seoSettings, 
                        localSEO: {...seoSettings.localSEO, phone: e.target.value}
                      })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <Label htmlFor="businessType">Business Type</Label>
                    <Select 
                      value={seoSettings.localSEO.businessType} 
                      onValueChange={(value) => setSeoSettings({
                        ...seoSettings, 
                        localSEO: {...seoSettings.localSEO, businessType: value}
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ProfessionalService">Professional Service</SelectItem>
                        <SelectItem value="LocalBusiness">Local Business</SelectItem>
                        <SelectItem value="CreativeWork">Creative Work</SelectItem>
                        <SelectItem value="EducationalOrganization">Educational Organization</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Optimization */}
            <TabsContent value="ai-optimization" className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <Zap className="h-5 w-5" />
                <h2 className="text-xl font-semibold">AI & Search Optimization</h2>
                <Badge variant="default">New</Badge>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>AI Search Optimization</CardTitle>
                  <CardDescription>Optimize for AI-powered search engines and voice search</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable AI Optimization</Label>
                      <p className="text-xs text-muted-foreground">Optimize content for ChatGPT, Bard, and other AI</p>
                    </div>
                    <Switch
                      checked={seoSettings.aiOptimization}
                      onCheckedChange={(checked) => setSeoSettings({...seoSettings, aiOptimization: checked})}
                    />
                  </div>

                  {seoSettings.aiOptimization && (
                    <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground">AI Optimization Features:</div>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Conversational content formatting</li>
                        <li>• FAQ-style content structure</li>
                        <li>• Natural language optimization</li>
                        <li>• Voice search keywords</li>
                        <li>• Featured snippet optimization</li>
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content Quality Signals</CardTitle>
                  <CardDescription>Enhance content for better AI understanding</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-sm font-medium text-green-700 dark:text-green-400">E-A-T Signals</div>
                      <div className="text-xs text-green-600 dark:text-green-500 mt-1">
                        Expertise, Authoritativeness, Trustworthiness
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-sm font-medium text-blue-700 dark:text-blue-400">User Experience</div>
                      <div className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                        Core Web Vitals & Accessibility
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-sm font-medium">Content Optimization Tips:</div>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      <li>✓ Use clear, descriptive headings (H1, H2, H3)</li>
                      <li>✓ Include author bio and credentials</li>
                      <li>✓ Add publication dates and update timestamps</li>
                      <li>✓ Use semantic HTML and proper markup</li>
                      <li>✓ Optimize for readability and scanability</li>
                      <li>✓ Include relevant internal and external links</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Search Engine Features</CardTitle>
                  <CardDescription>Target specific search features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm">Featured Snippets</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        FAQ format, lists, step-by-step guides
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm">People Also Ask</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Related questions and answers
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm">Knowledge Panels</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Author information, books, awards
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm">Rich Results</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Book reviews, events, articles
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Settings */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Analytics & Tracking</h2>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Google Analytics</CardTitle>
                  <CardDescription>Track visitors and page performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="gaId">Google Analytics ID</Label>
                    <Input
                      id="gaId"
                      value={analyticsSettings.googleAnalyticsId}
                      onChange={(e) => setAnalyticsSettings({...analyticsSettings, googleAnalyticsId: e.target.value})}
                      placeholder="G-XXXXXXXXXX or UA-XXXXXXXX-X"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Social Media Tracking</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="fbPixel">Facebook Pixel ID</Label>
                    <Input
                      id="fbPixel"
                      value={analyticsSettings.facebookPixelId}
                      onChange={(e) => setAnalyticsSettings({...analyticsSettings, facebookPixelId: e.target.value})}
                      placeholder="123456789012345"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Experience Analytics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Hotjar</Label>
                      <p className="text-xs text-muted-foreground">Heatmaps and session recordings</p>
                    </div>
                    <Switch
                      checked={analyticsSettings.enableHotjar}
                      onCheckedChange={(checked) => setAnalyticsSettings({...analyticsSettings, enableHotjar: checked})}
                    />
                  </div>

                  {analyticsSettings.enableHotjar && (
                    <div>
                      <Label htmlFor="hotjarId">Hotjar Site ID</Label>
                      <Input
                        id="hotjarId"
                        value={analyticsSettings.hotjarId}
                        onChange={(e) => setAnalyticsSettings({...analyticsSettings, hotjarId: e.target.value})}
                        placeholder="1234567"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Social Sharing */}
            <TabsContent value="social" className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <Share className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Social Sharing</h2>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Open Graph (Facebook)</CardTitle>
                  <CardDescription>Configure how your site appears when shared on Facebook</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="ogTitle">Default OG Title</Label>
                    <Input
                      id="ogTitle"
                      value={seoSettings.siteTitle}
                      onChange={(e) => setSeoSettings({...seoSettings, siteTitle: e.target.value})}
                      placeholder="Your Author Platform"
                    />
                  </div>

                  <div>
                    <Label htmlFor="ogDesc">Default OG Description</Label>
                    <Textarea
                      id="ogDesc"
                      value={seoSettings.siteDescription}
                      onChange={(e) => setSeoSettings({...seoSettings, siteDescription: e.target.value})}
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Twitter Cards</CardTitle>
                  <CardDescription>Configure how your site appears when shared on Twitter</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="twitterHandle">Twitter Handle</Label>
                    <Input
                      id="twitterHandle"
                      value={seoSettings.twitterHandle}
                      onChange={(e) => setSeoSettings({...seoSettings, twitterHandle: e.target.value})}
                      placeholder="@yourusername"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Settings */}
            <TabsContent value="performance" className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <Zap className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Performance Settings</h2>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Loading Optimization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Lazy Loading</Label>
                      <p className="text-xs text-muted-foreground">Load images only when visible</p>
                    </div>
                    <Switch
                      checked={performanceSettings.enableLazyLoading}
                      onCheckedChange={(checked) => setPerformanceSettings({...performanceSettings, enableLazyLoading: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Image Optimization</Label>
                      <p className="text-xs text-muted-foreground">Automatically optimize image sizes</p>
                    </div>
                    <Switch
                      checked={performanceSettings.enableImageOptimization}
                      onCheckedChange={(checked) => setPerformanceSettings({...performanceSettings, enableImageOptimization: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Caching</Label>
                      <p className="text-xs text-muted-foreground">Cache static resources</p>
                    </div>
                    <Switch
                      checked={performanceSettings.enableCaching}
                      onCheckedChange={(checked) => setPerformanceSettings({...performanceSettings, enableCaching: checked})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="compression">Compression Level</Label>
                    <Select
                      value={performanceSettings.compressionLevel}
                      onValueChange={(value) => setPerformanceSettings({...performanceSettings, compressionLevel: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (Faster loading)</SelectItem>
                        <SelectItem value="medium">Medium (Balanced)</SelectItem>
                        <SelectItem value="high">High (Smaller files)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Security Settings</h2>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>SSL & HTTPS</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Force HTTPS</Label>
                      <p className="text-xs text-muted-foreground">Redirect all HTTP to HTTPS</p>
                    </div>
                    <Switch
                      checked={securitySettings.enableSSL}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, enableSSL: checked})}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content Security Policy</CardTitle>
                  <CardDescription>Advanced security headers (for technical users)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable CSP</Label>
                      <p className="text-xs text-muted-foreground">Prevent XSS attacks</p>
                    </div>
                    <Switch
                      checked={securitySettings.enableCSP}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, enableCSP: checked})}
                    />
                  </div>

                  {securitySettings.enableCSP && (
                    <div>
                      <Label htmlFor="cspDirectives">CSP Directives</Label>
                      <Textarea
                        id="cspDirectives"
                        value={securitySettings.cspDirectives}
                        onChange={(e) => setSecuritySettings({...securitySettings, cspDirectives: e.target.value})}
                        rows={3}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Custom Scripts */}
            <TabsContent value="scripts" className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <Code className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Custom Code</h2>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Head Scripts</CardTitle>
                  <CardDescription>Code to insert in the &lt;head&gt; section</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={customScripts.headScripts}
                    onChange={(e) => setCustomScripts({...customScripts, headScripts: e.target.value})}
                    placeholder="<!-- Custom head scripts, meta tags, or CSS -->"
                    rows={6}
                    className="font-mono text-sm"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Body Scripts</CardTitle>
                  <CardDescription>Code to insert at the start of &lt;body&gt;</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={customScripts.bodyScripts}
                    onChange={(e) => setCustomScripts({...customScripts, bodyScripts: e.target.value})}
                    placeholder="<!-- Custom body scripts -->"
                    rows={6}
                    className="font-mono text-sm"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Footer Scripts</CardTitle>
                  <CardDescription>Code to insert before &lt;/body&gt;</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={customScripts.footerScripts}
                    onChange={(e) => setCustomScripts({...customScripts, footerScripts: e.target.value})}
                    placeholder="<!-- Custom footer scripts -->"
                    rows={6}
                    className="font-mono text-sm"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PageSettings;