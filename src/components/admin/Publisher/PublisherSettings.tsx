import { useState, useEffect } from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Globe, FileEdit, Bell, Shield, Save, RefreshCw, BookOpen, Palette } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Settings {
  id: string;
  // General
  allow_publisher_registration: boolean;
  require_publisher_approval: boolean;
  publisher_subdomain_prefix: string;
  max_authors_per_publisher: number;
  
  // Author Management
  allow_author_invites: boolean;
  require_author_approval: boolean;
  allow_author_self_registration: boolean;
  max_books_per_author: number;
  
  // Content & Publishing
  enable_content_moderation: boolean;
  auto_publish_enabled: boolean;
  require_admin_review: boolean;
  default_book_visibility: string;
  enable_collaborative_editing: boolean;
  
  // Analytics & Features
  enable_author_analytics: boolean;
  allow_author_messaging: boolean;
  allow_author_themes: boolean;
  
  // Notifications
  enable_email_notifications: boolean;
  notify_new_author_requests: boolean;
  notify_new_book_submissions: boolean;
  
  // Branding
  enable_custom_branding: boolean;
  enable_white_label: boolean;
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
          max_authors_per_publisher: 25,
          allow_author_invites: true,
          require_author_approval: true,
          allow_author_self_registration: false,
          max_books_per_author: 50,
          enable_content_moderation: true,
          auto_publish_enabled: false,
          require_admin_review: false,
          default_book_visibility: 'private',
          enable_collaborative_editing: false,
          enable_author_analytics: true,
          allow_author_messaging: true,
          allow_author_themes: true,
          enable_email_notifications: true,
          notify_new_author_requests: true,
          notify_new_book_submissions: true,
          enable_custom_branding: true,
          enable_white_label: false,
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
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Allow Publisher Registration</Label>
                <p className="text-sm text-muted-foreground">
                  Enable new publishers to register on the platform
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
                  New publishers need admin approval before activation
                </p>
              </div>
              <Switch
                checked={settings.require_publisher_approval}
                onCheckedChange={(checked) => updateSetting('require_publisher_approval', checked)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="slug_prefix">Publisher Slug Prefix</Label>
                <Input
                  id="slug_prefix"
                  value={settings.publisher_subdomain_prefix}
                  onChange={(e) => updateSetting('publisher_subdomain_prefix', e.target.value)}
                  placeholder="pub"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  e.g., {settings.publisher_subdomain_prefix}-publishername
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
                  Authors can register directly with publishers
                </p>
              </div>
              <Switch
                checked={settings.allow_author_self_registration}
                onCheckedChange={(checked) => updateSetting('allow_author_self_registration', checked)}
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
                Maximum number of books an author can create
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
                <Label className="text-base">Auto-Publish</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically publish approved content
                </p>
              </div>
              <Switch
                checked={settings.auto_publish_enabled}
                onCheckedChange={(checked) => updateSetting('auto_publish_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Require Platform Admin Review</Label>
                <p className="text-sm text-muted-foreground">
                  Platform admins must review all new content
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
                  Allow multiple authors to edit content together
                </p>
              </div>
              <Switch
                checked={settings.enable_collaborative_editing}
                onCheckedChange={(checked) => updateSetting('enable_collaborative_editing', checked)}
              />
            </div>

            <div>
              <Label htmlFor="default_visibility">Default Book Visibility</Label>
              <Select
                value={settings.default_book_visibility}
                onValueChange={(value) => updateSetting('default_book_visibility', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="unlisted">Unlisted</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                Default visibility for new books
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features & Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileEdit className="w-5 h-5" />
              Features & Tools
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Enable Author Analytics</Label>
                <p className="text-sm text-muted-foreground">
                  Provide analytics dashboards for authors
                </p>
              </div>
              <Switch
                checked={settings.enable_author_analytics}
                onCheckedChange={(checked) => updateSetting('enable_author_analytics', checked)}
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
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
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
                  Alert publishers when authors request to join
                </p>
              </div>
              <Switch
                checked={settings.notify_new_author_requests}
                onCheckedChange={(checked) => updateSetting('notify_new_author_requests', checked)}
                disabled={!settings.enable_email_notifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Notify New Book Submissions</Label>
                <p className="text-sm text-muted-foreground">
                  Alert publishers when authors submit books
                </p>
              </div>
              <Switch
                checked={settings.notify_new_book_submissions}
                onCheckedChange={(checked) => updateSetting('notify_new_book_submissions', checked)}
                disabled={!settings.enable_email_notifications}
              />
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Branding Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Custom Branding</Label>
                <p className="text-sm text-muted-foreground">
                  Allow publishers to customize colors and logos
                </p>
              </div>
              <Switch
                checked={settings.enable_custom_branding}
                onCheckedChange={(checked) => updateSetting('enable_custom_branding', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">White Label Mode</Label>
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

        {/* Current Status Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Current Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Publishers</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Registration:</span>
                    <Badge variant={settings.allow_publisher_registration ? 'default' : 'secondary'}>
                      {settings.allow_publisher_registration ? 'Open' : 'Closed'}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Approval:</span>
                    <Badge variant={settings.require_publisher_approval ? 'default' : 'secondary'}>
                      {settings.require_publisher_approval ? 'Required' : 'Not Required'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Authors</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Self-Register:</span>
                    <Badge variant={settings.allow_author_self_registration ? 'default' : 'secondary'}>
                      {settings.allow_author_self_registration ? 'Allowed' : 'Not Allowed'}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Approval:</span>
                    <Badge variant={settings.require_author_approval ? 'default' : 'secondary'}>
                      {settings.require_author_approval ? 'Required' : 'Not Required'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Content</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Moderation:</span>
                    <Badge variant={settings.enable_content_moderation ? 'default' : 'secondary'}>
                      {settings.enable_content_moderation ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Auto-Publish:</span>
                    <Badge variant={settings.auto_publish_enabled ? 'default' : 'secondary'}>
                      {settings.auto_publish_enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </>
  );
}