import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Save, Globe, Settings as SettingsIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SiteSettings() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  const [siteSettings, setSiteSettings] = useState({
    siteName: "AuthorPage Platform",
    siteDescription: "Professional author profiles and book showcases",
    siteKeywords: "authors, books, publishing, profiles",
    contactEmail: "support@authorpage.com",
    allowRegistration: true,
    requireEmailVerification: true,
    defaultTheme: "minimal",
    maintenanceMode: false,
    maxFileSize: "10",
    allowedFileTypes: "jpg,jpeg,png,gif,pdf",
    timezone: "UTC",
    dateFormat: "MM/dd/yyyy",
    language: "en"
  });

  const handleSaveSiteSettings = async () => {
    setSaving(true);
    try {
      // In a real app, save to database or API
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Success",
        description: "Site settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save site settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe className="h-8 w-8" />
            Site Settings
          </h1>
          <p className="text-muted-foreground">Configure basic site settings and preferences</p>
        </div>
        <Button onClick={handleSaveSiteSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>General site information and branding</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={siteSettings.siteName}
                onChange={(e) => setSiteSettings(prev => ({ ...prev, siteName: e.target.value }))}
                placeholder="Your site name"
              />
            </div>
            <div>
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={siteSettings.contactEmail}
                onChange={(e) => setSiteSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                placeholder="support@yoursite.com"
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
              placeholder="Describe what your site is about"
            />
          </div>

          <div>
            <Label htmlFor="siteKeywords">SEO Keywords</Label>
            <Input
              id="siteKeywords"
              value={siteSettings.siteKeywords}
              onChange={(e) => setSiteSettings(prev => ({ ...prev, siteKeywords: e.target.value }))}
              placeholder="keyword1, keyword2, keyword3"
            />
          </div>
        </CardContent>
      </Card>

      {/* User Registration */}
      <Card>
        <CardHeader>
          <CardTitle>User Registration</CardTitle>
          <CardDescription>Control how new users can join your platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      {/* File Upload Settings */}
      <Card>
        <CardHeader>
          <CardTitle>File Upload Settings</CardTitle>
          <CardDescription>Configure file upload limits and restrictions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
              <Input
                id="maxFileSize"
                type="number"
                value={siteSettings.maxFileSize}
                onChange={(e) => setSiteSettings(prev => ({ ...prev, maxFileSize: e.target.value }))}
                min="1"
                max="100"
              />
            </div>
            <div>
              <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
              <Input
                id="allowedFileTypes"
                value={siteSettings.allowedFileTypes}
                onChange={(e) => setSiteSettings(prev => ({ ...prev, allowedFileTypes: e.target.value }))}
                placeholder="jpg,png,pdf"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Localization */}
      <Card>
        <CardHeader>
          <CardTitle>Localization</CardTitle>
          <CardDescription>Configure regional settings and formats</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                value={siteSettings.timezone}
                onChange={(e) => setSiteSettings(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>
            <div>
              <Label htmlFor="dateFormat">Date Format</Label>
              <select
                id="dateFormat"
                value={siteSettings.dateFormat}
                onChange={(e) => setSiteSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="MM/dd/yyyy">MM/dd/yyyy</option>
                <option value="dd/MM/yyyy">dd/MM/yyyy</option>
                <option value="yyyy-MM-dd">yyyy-MM-dd</option>
                <option value="MMM dd, yyyy">MMM dd, yyyy</option>
              </select>
            </div>
            <div>
              <Label htmlFor="language">Default Language</Label>
              <select
                id="language"
                value={siteSettings.language}
                onChange={(e) => setSiteSettings(prev => ({ ...prev, language: e.target.value }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>Advanced system configuration options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="maintenanceMode"
              checked={siteSettings.maintenanceMode}
              onCheckedChange={(checked) => setSiteSettings(prev => ({ ...prev, maintenanceMode: checked }))}
            />
            <Label htmlFor="maintenanceMode">Maintenance mode</Label>
          </div>
          
          {siteSettings.maintenanceMode && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                ⚠️ Maintenance mode is enabled. Only administrators can access the site.
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="defaultTheme">Default Theme</Label>
            <select
              id="defaultTheme"
              value={siteSettings.defaultTheme}
              onChange={(e) => setSiteSettings(prev => ({ ...prev, defaultTheme: e.target.value }))}
              className="w-full p-2 border rounded-md"
            >
              <option value="minimal">Minimal</option>
              <option value="classic">Classic</option>
              <option value="modern">Modern</option>
              <option value="elegant">Elegant</option>
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}