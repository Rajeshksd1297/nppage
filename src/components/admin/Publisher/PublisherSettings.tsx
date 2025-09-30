import { useState, useEffect } from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Globe, Bell, BookOpen, Shield, Save, RefreshCw, FileCheck, Palette, Settings as SettingsIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Settings {
  id: string;
  allow_publisher_registration: boolean;
  require_publisher_approval: boolean;
  publisher_subdomain_prefix: string;
  enable_custom_branding: boolean;
  enable_white_label: boolean;
  max_authors_per_publisher: number;
  // Author Management
  allow_author_invites: boolean;
  require_author_approval: boolean;
  allow_author_self_registration: boolean;
  max_books_per_author: number;
  allow_author_themes: boolean;
  // Content & Publishing
  enable_content_moderation: boolean;
  auto_publish_enabled: boolean;
  require_admin_review: boolean;
  default_book_visibility: string;
  enable_collaborative_editing: boolean;
  // Notifications & Communication
  enable_email_notifications: boolean;
  notify_new_author_requests: boolean;
  notify_new_book_submissions: boolean;
  allow_author_messaging: boolean;
  // Analytics
  enable_author_analytics: boolean;
}

export default function PublisherSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('publisher_settings')
        .select('*')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings(data as Settings);
      } else {
        // Create default settings
        const defaultSettings = {
          allow_publisher_registration: true,
          require_publisher_approval: false,
          publisher_subdomain_prefix: 'pub',
          enable_custom_branding: true,
          enable_white_label: false,
          max_authors_per_publisher: 25,
          allow_author_invites: true,
          require_author_approval: true,
          allow_author_self_registration: false,
          max_books_per_author: 50,
          allow_author_themes: true,
          enable_content_moderation: true,
          auto_publish_enabled: false,
          require_admin_review: false,
          default_book_visibility: 'private',
          enable_collaborative_editing: false,
          enable_email_notifications: true,
          notify_new_author_requests: true,
          notify_new_book_submissions: true,
          allow_author_messaging: true,
          enable_author_analytics: true,
        };

        const { data: newSettings, error: createError } = await supabase
          .from('publisher_settings')
          .insert([defaultSettings])
          .select()
          .single();

        if (createError) throw createError;
        setSettings(newSettings as Settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('publisher_settings')
        .update(settings)
        .eq('id', settings.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (field: keyof Settings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  if (loading) {
    return (
      <CardContent className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </CardContent>
    );
  }

  if (!settings) {
    return (
      <CardContent className="text-center py-8">
        <h3 className="text-lg font-medium mb-2">Settings not found</h3>
        <p className="text-muted-foreground">Unable to load publisher settings</p>
      </CardContent>
    );
  }

  return (
    <>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Publisher Configuration</CardTitle>
            <CardDescription>
              Configure global publisher and author management settings
            </CardDescription>
          </div>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Publisher Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Publisher Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Allow Publisher Registration</Label>
                <p className="text-sm text-muted-foreground">
                  Enable new publishers to register
                </p>
              </div>
              <Switch
                checked={settings.allow_publisher_registration}
                onCheckedChange={(checked) => updateSetting('allow_publisher_registration', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Require Publisher Approval</Label>
                <p className="text-sm text-muted-foreground">
                  New publishers need admin approval
                </p>
              </div>
              <Switch
                checked={settings.require_publisher_approval}
                onCheckedChange={(checked) => updateSetting('require_publisher_approval', checked)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="slug_prefix">Slug Prefix</Label>
                <Input
                  id="slug_prefix"
                  value={settings.publisher_subdomain_prefix}
                  onChange={(e) => updateSetting('publisher_subdomain_prefix', e.target.value)}
                  placeholder="pub"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Example: {settings.publisher_subdomain_prefix}-publishername
                </p>
              </div>

              <div>
                <Label htmlFor="max_authors">Max Authors per Publisher</Label>
                <Input
                  id="max_authors"
                  type="number"
                  min="1"
                  value={settings.max_authors_per_publisher}
                  onChange={(e) => updateSetting('max_authors_per_publisher', parseInt(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Author Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Author Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Allow Author Invites</Label>
                <p className="text-sm text-muted-foreground">
                  Publishers can invite authors to join
                </p>
              </div>
              <Switch
                checked={settings.allow_author_invites}
                onCheckedChange={(checked) => updateSetting('allow_author_invites', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Require Author Approval</Label>
                <p className="text-sm text-muted-foreground">
                  Authors need publisher approval to join
                </p>
              </div>
              <Switch
                checked={settings.require_author_approval}
                onCheckedChange={(checked) => updateSetting('require_author_approval', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Allow Author Self-Registration</Label>
                <p className="text-sm text-muted-foreground">
                  Authors can directly request to join publishers
                </p>
              </div>
              <Switch
                checked={settings.allow_author_self_registration}
                onCheckedChange={(checked) => updateSetting('allow_author_self_registration', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Allow Author Themes</Label>
                <p className="text-sm text-muted-foreground">
                  Authors can customize their profile themes
                </p>
              </div>
              <Switch
                checked={settings.allow_author_themes}
                onCheckedChange={(checked) => updateSetting('allow_author_themes', checked)}
              />
            </div>

            <div>
              <Label htmlFor="max_books">Max Books per Author</Label>
              <Input
                id="max_books"
                type="number"
                min="1"
                value={settings.max_books_per_author}
                onChange={(e) => updateSetting('max_books_per_author', parseInt(e.target.value))}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Maximum number of books an author can publish
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Content & Publishing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Content & Publishing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Enable Content Moderation</Label>
                <p className="text-sm text-muted-foreground">
                  Review content before publishing
                </p>
              </div>
              <Switch
                checked={settings.enable_content_moderation}
                onCheckedChange={(checked) => updateSetting('enable_content_moderation', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Auto-Publish Approved Content</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically publish after approval
                </p>
              </div>
              <Switch
                checked={settings.auto_publish_enabled}
                onCheckedChange={(checked) => updateSetting('auto_publish_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Require Admin Review</Label>
                <p className="text-sm text-muted-foreground">
                  Platform admins review all content
                </p>
              </div>
              <Switch
                checked={settings.require_admin_review}
                onCheckedChange={(checked) => updateSetting('require_admin_review', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Enable Collaborative Editing</Label>
                <p className="text-sm text-muted-foreground">
                  Multiple authors can edit books together
                </p>
              </div>
              <Switch
                checked={settings.enable_collaborative_editing}
                onCheckedChange={(checked) => updateSetting('enable_collaborative_editing', checked)}
              />
            </div>

            <div>
              <Label htmlFor="book_visibility">Default Book Visibility</Label>
              <Select 
                value={settings.default_book_visibility}
                onValueChange={(value) => updateSetting('default_book_visibility', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                Default visibility for new books
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications & Communication */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications & Communication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Enable Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send email notifications to users
                </p>
              </div>
              <Switch
                checked={settings.enable_email_notifications}
                onCheckedChange={(checked) => updateSetting('enable_email_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Notify New Author Requests</Label>
                <p className="text-sm text-muted-foreground">
                  Alert publishers of new author requests
                </p>
              </div>
              <Switch
                checked={settings.notify_new_author_requests}
                onCheckedChange={(checked) => updateSetting('notify_new_author_requests', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Notify New Book Submissions</Label>
                <p className="text-sm text-muted-foreground">
                  Alert publishers of new book submissions
                </p>
              </div>
              <Switch
                checked={settings.notify_new_book_submissions}
                onCheckedChange={(checked) => updateSetting('notify_new_book_submissions', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Allow Author Messaging</Label>
                <p className="text-sm text-muted-foreground">
                  Enable messaging between publishers and authors
                </p>
              </div>
              <Switch
                checked={settings.allow_author_messaging}
                onCheckedChange={(checked) => updateSetting('allow_author_messaging', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Analytics & Reporting */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              Analytics & Reporting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Enable Author Analytics</Label>
                <p className="text-sm text-muted-foreground">
                  Authors can view their performance metrics
                </p>
              </div>
              <Switch
                checked={settings.enable_author_analytics}
                onCheckedChange={(checked) => updateSetting('enable_author_analytics', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Branding & Customization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Enable Custom Branding</Label>
                <p className="text-sm text-muted-foreground">
                  Publishers can customize colors and logos
                </p>
              </div>
              <Switch
                checked={settings.enable_custom_branding}
                onCheckedChange={(checked) => updateSetting('enable_custom_branding', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Enable White Label</Label>
                <p className="text-sm text-muted-foreground">
                  Remove platform branding from publisher pages
                </p>
              </div>
              <Switch
                checked={settings.enable_white_label}
                onCheckedChange={(checked) => updateSetting('enable_white_label', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Current Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Registration:</span>
                  <Badge variant={settings.allow_publisher_registration ? 'default' : 'secondary'}>
                    {settings.allow_publisher_registration ? 'Open' : 'Closed'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Author Invites:</span>
                  <Badge variant={settings.allow_author_invites ? 'default' : 'secondary'}>
                    {settings.allow_author_invites ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Self-Registration:</span>
                  <Badge variant={settings.allow_author_self_registration ? 'default' : 'secondary'}>
                    {settings.allow_author_self_registration ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Moderation:</span>
                  <Badge variant={settings.enable_content_moderation ? 'default' : 'secondary'}>
                    {settings.enable_content_moderation ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Auto-Publish:</span>
                  <Badge variant={settings.auto_publish_enabled ? 'default' : 'secondary'}>
                    {settings.auto_publish_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Admin Review:</span>
                  <Badge variant={settings.require_admin_review ? 'default' : 'secondary'}>
                    {settings.require_admin_review ? 'Required' : 'Optional'}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Email Notifications:</span>
                  <Badge variant={settings.enable_email_notifications ? 'default' : 'secondary'}>
                    {settings.enable_email_notifications ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Analytics:</span>
                  <Badge variant={settings.enable_author_analytics ? 'default' : 'secondary'}>
                    {settings.enable_author_analytics ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Messaging:</span>
                  <Badge variant={settings.allow_author_messaging ? 'default' : 'secondary'}>
                    {settings.allow_author_messaging ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </>
  );
}