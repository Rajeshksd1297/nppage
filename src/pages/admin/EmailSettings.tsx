import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Mail, Send, Settings as SettingsIcon, TestTube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EmailSettings() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [emailSettings, setEmailSettings] = useState({
    // SMTP Configuration
    smtpHost: "",
    smtpPort: "587",
    smtpUsername: "",
    smtpPassword: "",
    smtpEncryption: "tls",
    fromEmail: "",
    fromName: "AuthorPage",
    
    // Welcome Email
    welcomeEmailEnabled: true,
    welcomeEmailSubject: "Welcome to AuthorPage!",
    welcomeEmailTemplate: `Welcome to AuthorPage!

We're excited to have you on board. Your author profile is now ready to showcase your books and connect with readers.

Getting started:
1. Complete your profile information
2. Add your first book
3. Customize your author page

If you have any questions, feel free to contact our support team.

Best regards,
The AuthorPage Team`,

    // Password Reset
    resetPasswordSubject: "Reset Your Password",
    resetPasswordTemplate: `You requested a password reset for your AuthorPage account.

Click the link below to reset your password:
[RESET_LINK]

If you didn't request this reset, please ignore this email.

This link will expire in 24 hours.

Best regards,
The AuthorPage Team`,

    // Notification Settings
    notificationEmails: true,
    adminNotifications: true,
    newUserNotifications: true,
    bookPublishedNotifications: true,
    
    // Newsletter
    newsletterEnabled: false,
    newsletterFromEmail: "",
    newsletterFromName: "AuthorPage Newsletter",
  });

  const handleSaveEmailSettings = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Success",
        description: "Email settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save email settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTesting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Test Email Sent",
        description: "Check your inbox for the test email",
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Could not send test email. Check your SMTP settings.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8" />
            Email Settings
          </h1>
          <p className="text-muted-foreground">Configure email templates and SMTP settings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleTestEmail} disabled={testing}>
            <TestTube className="h-4 w-4 mr-2" />
            {testing ? 'Testing...' : 'Test Email'}
          </Button>
          <Button onClick={handleSaveEmailSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="smtp" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="smtp">SMTP Config</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
        </TabsList>

        <TabsContent value="smtp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SMTP Configuration</CardTitle>
              <CardDescription>Configure your email server settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPort: e.target.value }))}
                    placeholder="587"
                  />
                </div>
                <div>
                  <Label htmlFor="smtpUsername">Username</Label>
                  <Input
                    id="smtpUsername"
                    value={emailSettings.smtpUsername}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpUsername: e.target.value }))}
                    placeholder="your-email@domain.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPassword">Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={emailSettings.smtpPassword}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPassword: e.target.value }))}
                    placeholder="Your SMTP password"
                  />
                </div>
                <div>
                  <Label htmlFor="smtpEncryption">Encryption</Label>
                  <select
                    id="smtpEncryption"
                    value={emailSettings.smtpEncryption}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpEncryption: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="tls">TLS</option>
                    <option value="ssl">SSL</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">From Address</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      value={emailSettings.fromEmail}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                      placeholder="noreply@yourdomain.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      value={emailSettings.fromName}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, fromName: e.target.value }))}
                      placeholder="AuthorPage"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome Email</CardTitle>
              <CardDescription>Email sent to new users when they register</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="welcomeEmailEnabled"
                  checked={emailSettings.welcomeEmailEnabled}
                  onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, welcomeEmailEnabled: checked }))}
                />
                <Label htmlFor="welcomeEmailEnabled">Send welcome emails to new users</Label>
              </div>

              {emailSettings.welcomeEmailEnabled && (
                <>
                  <div>
                    <Label htmlFor="welcomeEmailSubject">Subject Line</Label>
                    <Input
                      id="welcomeEmailSubject"
                      value={emailSettings.welcomeEmailSubject}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, welcomeEmailSubject: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="welcomeEmailTemplate">Email Template</Label>
                    <Textarea
                      id="welcomeEmailTemplate"
                      value={emailSettings.welcomeEmailTemplate}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, welcomeEmailTemplate: e.target.value }))}
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Available variables: [USER_NAME], [USER_EMAIL], [SITE_NAME], [PROFILE_URL]
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Password Reset Email</CardTitle>
              <CardDescription>Email sent when users request a password reset</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="resetPasswordSubject">Subject Line</Label>
                <Input
                  id="resetPasswordSubject"
                  value={emailSettings.resetPasswordSubject}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, resetPasswordSubject: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="resetPasswordTemplate">Email Template</Label>
                <Textarea
                  id="resetPasswordTemplate"
                  value={emailSettings.resetPasswordTemplate}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, resetPasswordTemplate: e.target.value }))}
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Available variables: [USER_NAME], [RESET_LINK], [SITE_NAME], [EXPIRY_TIME]
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure when to send notification emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="notificationEmails"
                    checked={emailSettings.notificationEmails}
                    onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, notificationEmails: checked }))}
                  />
                  <Label htmlFor="notificationEmails">Enable notification emails</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="adminNotifications"
                    checked={emailSettings.adminNotifications}
                    onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, adminNotifications: checked }))}
                  />
                  <Label htmlFor="adminNotifications">Send admin notifications</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="newUserNotifications"
                    checked={emailSettings.newUserNotifications}
                    onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, newUserNotifications: checked }))}
                  />
                  <Label htmlFor="newUserNotifications">Notify admins of new user registrations</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="bookPublishedNotifications"
                    checked={emailSettings.bookPublishedNotifications}
                    onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, bookPublishedNotifications: checked }))}
                  />
                  <Label htmlFor="bookPublishedNotifications">Notify admins when books are published</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="newsletter" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Newsletter Settings</CardTitle>
              <CardDescription>Configure newsletter functionality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="newsletterEnabled"
                  checked={emailSettings.newsletterEnabled}
                  onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, newsletterEnabled: checked }))}
                />
                <Label htmlFor="newsletterEnabled">Enable newsletter functionality</Label>
              </div>

              {emailSettings.newsletterEnabled && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="newsletterFromEmail">Newsletter From Email</Label>
                    <Input
                      id="newsletterFromEmail"
                      type="email"
                      value={emailSettings.newsletterFromEmail}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, newsletterFromEmail: e.target.value }))}
                      placeholder="newsletter@yourdomain.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newsletterFromName">Newsletter From Name</Label>
                    <Input
                      id="newsletterFromName"
                      value={emailSettings.newsletterFromName}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, newsletterFromName: e.target.value }))}
                      placeholder="AuthorPage Newsletter"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}