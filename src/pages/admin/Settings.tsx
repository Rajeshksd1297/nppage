import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings as SettingsIcon, 
  Save,
  Mail,
  Globe,
  Shield,
  CreditCard,
  Palette,
  PlusCircle,
  Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";

export default function AdminSettings() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'site');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Email Settings
  const [emailSettings, setEmailSettings] = useState({
    welcomeEmailEnabled: true,
    welcomeEmailSubject: "Welcome to AuthorPage!",
    welcomeEmailTemplate: "Welcome to our platform! We're excited to have you on board.",
    resetPasswordSubject: "Reset Your Password",
    resetPasswordTemplate: "You requested a password reset. Click the link below to reset your password.",
    notificationEmails: true
  });

  // Site Settings
  const [siteSettings, setSiteSettings] = useState({
    siteName: "AuthorPage Platform",
    siteDescription: "Professional author profiles and book showcases",
    allowRegistration: true,
    requireEmailVerification: true,
    defaultTheme: "minimal",
    maintenanceMode: false
  });

  // Package Management Settings
  const [packageSettings, setPackageSettings] = useState({
    packages: [
      {
        id: '1',
        name: 'Free',
        price_monthly: 0,
        price_yearly: 0,
        features: ['Up to 3 books', 'Basic profile', 'Standard themes'],
        max_books: 3,
        badge_text: '',
        badge_color: '',
        description: 'Perfect for getting started',
        discount_percent: 0,
        discount_from: '',
        discount_to: '',
        popular: false,
        active: true
      },
      {
        id: '2', 
        name: 'Pro',
        price_monthly: 9.99,
        price_yearly: 99.99,
        features: ['Unlimited books', 'Custom domain', 'Premium themes', 'Advanced analytics'],
        max_books: null,
        badge_text: 'Most Popular',
        badge_color: 'primary',
        description: 'Everything you need to grow',
        discount_percent: 0,
        discount_from: '',
        discount_to: '',
        popular: true,
        active: true
      }
    ],
    trial_days: 15,
    allow_downgrades: true,
    prorate_charges: true
  });

  const handleSaveEmailSettings = async () => {
    setSaving(true);
    // In a real app, save to database or API
    setTimeout(() => {
      setSaving(false);
      toast({
        title: "Success",
        description: "Email settings saved successfully",
      });
    }, 1000);
  };

  const handleSaveSiteSettings = async () => {
    setSaving(true);
    // In a real app, save to database or API
    setTimeout(() => {
      setSaving(false);
      toast({
        title: "Success",
        description: "Site settings saved successfully",
      });
    }, 1000);
  };

  const handleSavePaymentSettings = async () => {
    setSaving(true);
    // In a real app, save to database or API
    setTimeout(() => {
      setSaving(false);
      toast({
        title: "Success",
        description: "Payment settings saved successfully",
      });
    }, 1000);
  };

  const handleSavePackageSettings = async () => {
    setSaving(true);
    // In a real app, save to database or API
    setTimeout(() => {
      setSaving(false);
      toast({
        title: "Success",
        description: "Package settings saved successfully",
      });
    }, 1000);
  };

  const addNewPackage = () => {
    const newPackage = {
      id: Date.now().toString(),
      name: 'New Package',
      price_monthly: 0,
      price_yearly: 0,
      features: ['Feature 1', 'Feature 2'],
      max_books: 10,
      badge_text: '',
      badge_color: '',
      description: 'Description for new package',
      discount_percent: 0,
      discount_from: '',
      discount_to: '',
      popular: false,
      active: true
    };
    setPackageSettings(prev => ({
      ...prev,
      packages: [...prev.packages, newPackage]
    }));
  };

  const deletePackage = (packageId: string) => {
    setPackageSettings(prev => ({
      ...prev,
      packages: prev.packages.filter(pkg => pkg.id !== packageId)
    }));
  };

  const updatePackage = (packageId: string, updates: any) => {
    setPackageSettings(prev => ({
      ...prev,
      packages: prev.packages.map(pkg => 
        pkg.id === packageId ? { ...pkg, ...updates } : pkg
      )
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">Configure platform-wide settings and preferences</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="site" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Site
          </TabsTrigger>
          <TabsTrigger value="packages" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Packages
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="themes" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Themes
          </TabsTrigger>
          <TabsTrigger value="domains" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Domains
          </TabsTrigger>
        </TabsList>

        <TabsContent value="site" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Site Configuration</CardTitle>
              <CardDescription>Basic site settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={siteSettings.siteName}
                    onChange={(e) => setSiteSettings(prev => ({ ...prev, siteName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="defaultTheme">Default Theme</Label>
                  <Input
                    id="defaultTheme"
                    value={siteSettings.defaultTheme}
                    onChange={(e) => setSiteSettings(prev => ({ ...prev, defaultTheme: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={siteSettings.siteDescription}
                  onChange={(e) => setSiteSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowRegistration"
                    checked={siteSettings.allowRegistration}
                    onCheckedChange={(checked) => setSiteSettings(prev => ({ ...prev, allowRegistration: checked }))}
                  />
                  <Label htmlFor="allowRegistration">Allow new user registration</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="requireEmailVerification"
                    checked={siteSettings.requireEmailVerification}
                    onCheckedChange={(checked) => setSiteSettings(prev => ({ ...prev, requireEmailVerification: checked }))}
                  />
                  <Label htmlFor="requireEmailVerification">Require email verification</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="maintenanceMode"
                    checked={siteSettings.maintenanceMode}
                    onCheckedChange={(checked) => setSiteSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                  />
                  <Label htmlFor="maintenanceMode">Maintenance mode</Label>
                </div>
              </div>

              <Button onClick={handleSaveSiteSettings} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                Save Site Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>Configure automated email messages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="welcomeEmailEnabled"
                    checked={emailSettings.welcomeEmailEnabled}
                    onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, welcomeEmailEnabled: checked }))}
                  />
                  <Label htmlFor="welcomeEmailEnabled">Send welcome emails to new users</Label>
                </div>

                <div>
                  <Label htmlFor="welcomeEmailSubject">Welcome Email Subject</Label>
                  <Input
                    id="welcomeEmailSubject"
                    value={emailSettings.welcomeEmailSubject}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, welcomeEmailSubject: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="welcomeEmailTemplate">Welcome Email Template</Label>
                  <Textarea
                    id="welcomeEmailTemplate"
                    value={emailSettings.welcomeEmailTemplate}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, welcomeEmailTemplate: e.target.value }))}
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="resetPasswordSubject">Password Reset Email Subject</Label>
                  <Input
                    id="resetPasswordSubject"
                    value={emailSettings.resetPasswordSubject}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, resetPasswordSubject: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="resetPasswordTemplate">Password Reset Email Template</Label>
                  <Textarea
                    id="resetPasswordTemplate"
                    value={emailSettings.resetPasswordTemplate}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, resetPasswordTemplate: e.target.value }))}
                    rows={4}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="notificationEmails"
                    checked={emailSettings.notificationEmails}
                    onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, notificationEmails: checked }))}
                  />
                  <Label htmlFor="notificationEmails">Send notification emails</Label>
                </div>
              </div>

              <Button onClick={handleSaveEmailSettings} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                Save Email Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Package Management</CardTitle>
              <CardDescription>Design and manage subscription packages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Global Package Settings */}
              <div className="grid gap-4 md:grid-cols-3 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label htmlFor="trialDays">Trial Days</Label>
                  <Input
                    id="trialDays"
                    type="number"
                    value={packageSettings.trial_days}
                    onChange={(e) => setPackageSettings(prev => ({ ...prev, trial_days: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowDowngrades"
                    checked={packageSettings.allow_downgrades}
                    onCheckedChange={(checked) => setPackageSettings(prev => ({ ...prev, allow_downgrades: checked }))}
                  />
                  <Label htmlFor="allowDowngrades">Allow downgrades</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="prorateCharges"
                    checked={packageSettings.prorate_charges}
                    onCheckedChange={(checked) => setPackageSettings(prev => ({ ...prev, prorate_charges: checked }))}
                  />
                  <Label htmlFor="prorateCharges">Prorate charges</Label>
                </div>
              </div>

              {/* Package List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Packages</h3>
                  <Button onClick={addNewPackage} size="sm">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Package
                  </Button>
                </div>

                {packageSettings.packages.map((pkg) => (
                  <Card key={pkg.id} className="border-2">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Input
                            value={pkg.name}
                            onChange={(e) => updatePackage(pkg.id, { name: e.target.value })}
                            className="font-semibold text-lg w-32"
                          />
                          {pkg.popular && (
                            <Badge variant="default">Most Popular</Badge>
                          )}
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deletePackage(pkg.id)}
                          disabled={packageSettings.packages.length <= 1}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Pricing */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label>Monthly Price ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={pkg.price_monthly}
                            onChange={(e) => updatePackage(pkg.id, { price_monthly: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <Label>Yearly Price ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={pkg.price_yearly}
                            onChange={(e) => updatePackage(pkg.id, { price_yearly: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                      </div>

                      {/* Package Settings */}
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <Label>Max Books</Label>
                          <Input
                            type="number"
                            value={pkg.max_books || ''}
                            placeholder="Unlimited"
                            onChange={(e) => updatePackage(pkg.id, { max_books: e.target.value ? parseInt(e.target.value) : null })}
                          />
                        </div>
                        <div>
                          <Label>Badge Text</Label>
                          <Input
                            value={pkg.badge_text}
                            placeholder="e.g., Most Popular"
                            onChange={(e) => updatePackage(pkg.id, { badge_text: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Badge Color</Label>
                          <select
                            value={pkg.badge_color}
                            onChange={(e) => updatePackage(pkg.id, { badge_color: e.target.value })}
                            className="w-full p-2 border rounded-md"
                          >
                            <option value="">Default</option>
                            <option value="primary">Primary</option>
                            <option value="secondary">Secondary</option>
                            <option value="destructive">Red</option>
                            <option value="outline">Outline</option>
                          </select>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={pkg.description}
                          onChange={(e) => updatePackage(pkg.id, { description: e.target.value })}
                          rows={2}
                        />
                      </div>

                      {/* Discount Settings */}
                      <div className="border-t pt-4">
                        <Label className="text-sm font-medium mb-3 block">Discount Settings</Label>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <Label>Discount %</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={pkg.discount_percent}
                              onChange={(e) => updatePackage(pkg.id, { discount_percent: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                          <div>
                            <Label>From Date</Label>
                            <Input
                              type="date"
                              value={pkg.discount_from}
                              onChange={(e) => updatePackage(pkg.id, { discount_from: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>To Date</Label>
                            <Input
                              type="date"
                              value={pkg.discount_to}
                              onChange={(e) => updatePackage(pkg.id, { discount_to: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Features */}
                      <div>
                        <Label>Features (one per line)</Label>
                        <Textarea
                          value={pkg.features.join('\n')}
                          onChange={(e) => updatePackage(pkg.id, { features: e.target.value.split('\n').filter(f => f.trim()) })}
                          rows={4}
                          placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                        />
                      </div>

                      {/* Package Status */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={pkg.popular}
                              onCheckedChange={(checked) => updatePackage(pkg.id, { popular: checked })}
                            />
                            <Label>Mark as Popular</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={pkg.active}
                              onCheckedChange={(checked) => updatePackage(pkg.id, { active: checked })}
                            />
                            <Label>Active</Label>
                          </div>
                        </div>
                        {pkg.discount_percent > 0 && (
                          <Badge variant="secondary">
                            {pkg.discount_percent}% OFF
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button onClick={handleSavePackageSettings} disabled={saving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save All Package Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="themes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme Management</CardTitle>
              <CardDescription>Manage available themes for author pages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="enableThemeCustomization">Premium Theme Features</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="premiumThemes" defaultChecked />
                      <Label htmlFor="premiumThemes">Enable premium themes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="customColors" defaultChecked />
                      <Label htmlFor="customColors">Allow custom color schemes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="customFonts" />
                      <Label htmlFor="customFonts">Enable custom fonts</Label>
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="themeApproval">Theme Approval Process</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="requireApproval" />
                      <Label htmlFor="requireApproval">Require admin approval for new themes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="userUploadThemes" />
                      <Label htmlFor="userUploadThemes">Allow users to upload custom themes</Label>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button onClick={handleSaveSiteSettings}>
                <Save className="h-4 w-4 mr-2" />
                Save Theme Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Domain Management</CardTitle>
              <CardDescription>Manage custom domain settings and features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="domainFeatures">Domain Features</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="enableCustomDomains" defaultChecked />
                      <Label htmlFor="enableCustomDomains">Enable custom domains</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="autoSSL" defaultChecked />
                      <Label htmlFor="autoSSL">Automatic SSL certificates</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="subdomainSupport" defaultChecked />
                      <Label htmlFor="subdomainSupport">Support subdomains</Label>
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="domainLimits">Domain Limits</Label>
                  <div className="space-y-2 mt-2">
                    <div>
                      <Label htmlFor="maxDomainsPerUser" className="text-sm">Max domains per user</Label>
                      <Input id="maxDomainsPerUser" type="number" defaultValue="1" className="mt-1" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="requireVerification" defaultChecked />
                      <Label htmlFor="requireVerification">Require domain verification</Label>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button onClick={handleSaveSiteSettings}>
                <Save className="h-4 w-4 mr-2" />
                Save Domain Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}