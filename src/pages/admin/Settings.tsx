import { useState } from "react";
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
  Palette
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettings() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

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

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    stripeEnabled: false,
    stripePublishableKey: "",
    paypalEnabled: false,
    paypalClientId: "",
    subscriptionPricing: {
      basic: 9.99,
      pro: 19.99,
      enterprise: 49.99
    }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">Configure platform-wide settings and preferences</p>
        </div>
      </div>

      <Tabs defaultValue="site" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="site" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Site
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="themes" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Themes
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

        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Integration</CardTitle>
              <CardDescription>Configure payment gateways and subscription pricing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="stripeEnabled"
                    checked={paymentSettings.stripeEnabled}
                    onCheckedChange={(checked) => setPaymentSettings(prev => ({ ...prev, stripeEnabled: checked }))}
                  />
                  <Label htmlFor="stripeEnabled">Enable Stripe payments</Label>
                </div>

                {paymentSettings.stripeEnabled && (
                  <div>
                    <Label htmlFor="stripePublishableKey">Stripe Publishable Key</Label>
                    <Input
                      id="stripePublishableKey"
                      type="password"
                      value={paymentSettings.stripePublishableKey}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, stripePublishableKey: e.target.value }))}
                      placeholder="pk_test_..."
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="paypalEnabled"
                    checked={paymentSettings.paypalEnabled}
                    onCheckedChange={(checked) => setPaymentSettings(prev => ({ ...prev, paypalEnabled: checked }))}
                  />
                  <Label htmlFor="paypalEnabled">Enable PayPal payments</Label>
                </div>

                {paymentSettings.paypalEnabled && (
                  <div>
                    <Label htmlFor="paypalClientId">PayPal Client ID</Label>
                    <Input
                      id="paypalClientId"
                      value={paymentSettings.paypalClientId}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, paypalClientId: e.target.value }))}
                      placeholder="AZDxjQ..."
                    />
                  </div>
                )}

                <div>
                  <Label>Subscription Pricing (USD)</Label>
                  <div className="grid gap-4 md:grid-cols-3 mt-2">
                    <div>
                      <Label htmlFor="basicPrice">Basic Plan</Label>
                      <Input
                        id="basicPrice"
                        type="number"
                        step="0.01"
                        value={paymentSettings.subscriptionPricing.basic}
                        onChange={(e) => setPaymentSettings(prev => ({
                          ...prev,
                          subscriptionPricing: {
                            ...prev.subscriptionPricing,
                            basic: parseFloat(e.target.value) || 0
                          }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="proPrice">Pro Plan</Label>
                      <Input
                        id="proPrice"
                        type="number"
                        step="0.01"
                        value={paymentSettings.subscriptionPricing.pro}
                        onChange={(e) => setPaymentSettings(prev => ({
                          ...prev,
                          subscriptionPricing: {
                            ...prev.subscriptionPricing,
                            pro: parseFloat(e.target.value) || 0
                          }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="enterprisePrice">Enterprise Plan</Label>
                      <Input
                        id="enterprisePrice"
                        type="number"
                        step="0.01"
                        value={paymentSettings.subscriptionPricing.enterprise}
                        onChange={(e) => setPaymentSettings(prev => ({
                          ...prev,
                          subscriptionPricing: {
                            ...prev.subscriptionPricing,
                            enterprise: parseFloat(e.target.value) || 0
                          }
                        }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={handleSavePaymentSettings} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                Save Payment Settings
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
            <CardContent>
              <div className="text-center py-8">
                <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Theme Management</h3>
                <p className="text-muted-foreground mb-4">
                  Advanced theme management features coming soon
                </p>
                <Button variant="outline">
                  Add New Theme
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}