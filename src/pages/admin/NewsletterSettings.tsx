import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface NewsletterSettings {
  id?: string;
  allow_user_newsletters?: boolean;
  max_newsletters_per_user?: number;
  require_email_verification?: boolean;
  max_subject_length?: number;
  max_content_length?: number;
  allow_html_content?: boolean;
  require_content_approval?: boolean;
  allow_images?: boolean;
  max_image_size_mb?: number;
  auto_generate_thumbnails?: boolean;
  image_compression_quality?: number;
  require_category?: boolean;
  max_recipients_per_campaign?: number;
  send_rate_limit_per_hour?: number;
  enable_unsubscribe_link?: boolean;
  enable_tracking?: boolean;
  auto_schedule_enabled?: boolean;
  default_send_time?: string;
  enable_a_b_testing?: boolean;
  default_template?: string;
  from_email?: string;
  from_name?: string;
  reply_to_email?: string | null;
  timezone?: string;
  categories?: string[];
  allowed_image_types?: string[];
}

export default function NewsletterSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NewsletterSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newImageType, setNewImageType] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('newsletter_settings' as any)
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings(data as NewsletterSettings);
      } else {
        // Create default settings if none exist
        await createDefaultSettings();
      }
    } catch (error) {
      console.error('Error fetching newsletter settings:', error);
      toast({
        title: "Error",
        description: "Failed to load newsletter settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSettings = async () => {
    try {
      const defaultSettings = {
        allow_user_newsletters: true,
        max_newsletters_per_user: 5,
        require_email_verification: true,
        max_subject_length: 100,
        max_content_length: 50000,
        allow_html_content: true,
        require_content_approval: false,
        allow_images: true,
        max_image_size_mb: 10,
        auto_generate_thumbnails: true,
        image_compression_quality: 85,
        require_category: true,
        max_recipients_per_campaign: 1000,
        send_rate_limit_per_hour: 100,
        enable_unsubscribe_link: true,
        enable_tracking: true,
        auto_schedule_enabled: false,
        default_send_time: '09:00:00',
        enable_a_b_testing: false,
        default_template: 'standard',
        from_email: 'noreply@example.com',
        from_name: 'Newsletter',
        reply_to_email: null,
        timezone: 'UTC',
        categories: ['general', 'marketing', 'updates', 'announcements'],
        allowed_image_types: ['jpg', 'jpeg', 'png', 'webp', 'gif']
      };

      const { data, error } = await supabase
        .from('newsletter_settings' as any)
        .insert([defaultSettings])
        .select()
        .single();

      if (error) throw error;
      setSettings(data as NewsletterSettings);
    } catch (error) {
      console.error('Error creating default settings:', error);
      toast({
        title: "Error",
        description: "Failed to create default settings",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('newsletter_settings' as any)
        .upsert({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Newsletter settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save newsletter settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    if (newCategory.trim() && settings && !settings.categories.includes(newCategory.trim())) {
      setSettings({
        ...settings,
        categories: [...settings.categories, newCategory.trim()]
      });
      setNewCategory('');
    }
  };

  const removeCategory = (category: string) => {
    if (settings) {
      setSettings({
        ...settings,
        categories: settings.categories.filter(cat => cat !== category)
      });
    }
  };

  const addImageType = () => {
    if (newImageType.trim() && settings && !settings.allowed_image_types.includes(newImageType.trim())) {
      setSettings({
        ...settings,
        allowed_image_types: [...settings.allowed_image_types, newImageType.trim()]
      });
      setNewImageType('');
    }
  };

  const removeImageType = (type: string) => {
    if (settings) {
      setSettings({
        ...settings,
        allowed_image_types: settings.allowed_image_types.filter(t => t !== type)
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No settings found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Newsletter Settings
          </h1>
          <p className="text-muted-foreground">Configure newsletter management and user permissions</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Basic newsletter configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow User Newsletters</Label>
                <p className="text-sm text-muted-foreground">
                  Allow users to create and send newsletters
                </p>
              </div>
              <Switch
                checked={settings.allow_user_newsletters}
                onCheckedChange={(checked) => 
                  setSettings({...settings, allow_user_newsletters: checked})
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Email Verification</Label>
                <p className="text-sm text-muted-foreground">
                  Verify email addresses before adding to lists
                </p>
              </div>
              <Switch
                checked={settings.require_email_verification}
                onCheckedChange={(checked) => 
                  setSettings({...settings, require_email_verification: checked})
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Content Approval Required</Label>
                <p className="text-sm text-muted-foreground">
                  Require admin approval before sending
                </p>
              </div>
              <Switch
                checked={settings.require_content_approval}
                onCheckedChange={(checked) => 
                  setSettings({...settings, require_content_approval: checked})
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Tracking</Label>
                <p className="text-sm text-muted-foreground">
                  Track email opens and clicks
                </p>
              </div>
              <Switch
                checked={settings.enable_tracking}
                onCheckedChange={(checked) => 
                  setSettings({...settings, enable_tracking: checked})
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Content Limits</CardTitle>
          <CardDescription>Control content length and format restrictions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="max_subject_length">Max Subject Length</Label>
              <Input
                id="max_subject_length"
                type="number"
                value={settings.max_subject_length}
                onChange={(e) => setSettings({
                  ...settings,
                  max_subject_length: parseInt(e.target.value) || 100
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_content_length">Max Content Length</Label>
              <Input
                id="max_content_length"
                type="number"
                value={settings.max_content_length}
                onChange={(e) => setSettings({
                  ...settings,
                  max_content_length: parseInt(e.target.value) || 50000
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_newsletters_per_user">Max Newsletters Per User</Label>
              <Input
                id="max_newsletters_per_user"
                type="number"
                value={settings.max_newsletters_per_user}
                onChange={(e) => setSettings({
                  ...settings,
                  max_newsletters_per_user: parseInt(e.target.value) || 5
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_recipients">Max Recipients Per Campaign</Label>
              <Input
                id="max_recipients"
                type="number"
                value={settings.max_recipients_per_campaign}
                onChange={(e) => setSettings({
                  ...settings,
                  max_recipients_per_campaign: parseInt(e.target.value) || 1000
                })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow HTML Content</Label>
              <p className="text-sm text-muted-foreground">
                Allow rich text formatting in newsletters
              </p>
            </div>
            <Switch
              checked={settings.allow_html_content}
              onCheckedChange={(checked) => 
                setSettings({...settings, allow_html_content: checked})
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Email Configuration</CardTitle>
          <CardDescription>Configure sender information and email settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="from_email">From Email</Label>
              <Input
                id="from_email"
                type="email"
                value={settings.from_email}
                onChange={(e) => setSettings({
                  ...settings,
                  from_email: e.target.value
                })}
                placeholder="noreply@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="from_name">From Name</Label>
              <Input
                id="from_name"
                value={settings.from_name}
                onChange={(e) => setSettings({
                  ...settings,
                  from_name: e.target.value
                })}
                placeholder="Newsletter Team"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reply_to_email">Reply To Email (Optional)</Label>
              <Input
                id="reply_to_email"
                type="email"
                value={settings.reply_to_email || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  reply_to_email: e.target.value || null
                })}
                placeholder="support@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="send_rate_limit">Send Rate Limit (per hour)</Label>
              <Input
                id="send_rate_limit"
                type="number"
                value={settings.send_rate_limit_per_hour}
                onChange={(e) => setSettings({
                  ...settings,
                  send_rate_limit_per_hour: parseInt(e.target.value) || 100
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Image Settings</CardTitle>
          <CardDescription>Configure image upload and processing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Images</Label>
              <p className="text-sm text-muted-foreground">
                Allow image uploads in newsletters
              </p>
            </div>
            <Switch
              checked={settings.allow_images}
              onCheckedChange={(checked) => 
                setSettings({...settings, allow_images: checked})
              }
            />
          </div>

          {settings.allow_images && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="max_image_size">Max Image Size (MB)</Label>
                  <Input
                    id="max_image_size"
                    type="number"
                    value={settings.max_image_size_mb}
                    onChange={(e) => setSettings({
                      ...settings,
                      max_image_size_mb: parseInt(e.target.value) || 10
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compression_quality">Compression Quality (%)</Label>
                  <Input
                    id="compression_quality"
                    type="number"
                    min="1"
                    max="100"
                    value={settings.image_compression_quality}
                    onChange={(e) => setSettings({
                      ...settings,
                      image_compression_quality: parseInt(e.target.value) || 85
                    })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Allowed Image Types</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {settings.allowed_image_types.map((type) => (
                    <Badge key={type} variant="secondary" className="gap-1">
                      {type}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeImageType(type)}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add image type (e.g., jpg)"
                    value={newImageType}
                    onChange={(e) => setNewImageType(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addImageType()}
                  />
                  <Button variant="outline" onClick={addImageType}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Newsletter Categories</CardTitle>
          <CardDescription>Manage available newsletter categories</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Category</Label>
              <p className="text-sm text-muted-foreground">
                Make category selection mandatory
              </p>
            </div>
            <Switch
              checked={settings.require_category}
              onCheckedChange={(checked) => 
                setSettings({...settings, require_category: checked})
              }
            />
          </div>

          <div className="space-y-4">
            <Label>Available Categories</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {settings.categories.map((category) => (
                <Badge key={category} variant="secondary" className="gap-1">
                  {category}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeCategory(category)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add new category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCategory()}
              />
              <Button variant="outline" onClick={addCategory}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}