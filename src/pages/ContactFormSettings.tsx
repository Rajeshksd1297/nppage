import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Mail, Shield, MessageSquare, Save } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ContactFormSettings {
  id?: string;
  form_title: string;
  form_description: string;
  collect_phone: boolean;
  collect_company: boolean;
  require_subject: boolean;
  enabled: boolean;
  max_message_length: number;
  spam_protection: boolean;
}

interface AdminSettings {
  max_submissions_per_hour: number;
  max_message_length: number;
  required_fields: string[];
}

export default function ContactFormSettings() {
  const [settings, setSettings] = useState<ContactFormSettings>({
    form_title: 'Contact Me',
    form_description: 'Send me a message and I\'ll get back to you soon!',
    collect_phone: false,
    collect_company: false,
    require_subject: false,
    enabled: true,
    max_message_length: 1000,
    spam_protection: true,
  });
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    loadAdminSettings();
    loadUserEmail();
  }, []);

  const loadUserEmail = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    } catch (error) {
      console.error('Error loading user email:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_contact_form_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          id: data.id,
          form_title: data.form_title || 'Contact Me',
          form_description: data.form_description || 'Send me a message and I\'ll get back to you soon!',
          collect_phone: data.collect_phone ?? false,
          collect_company: data.collect_company ?? false,
          require_subject: data.require_subject ?? false,
          enabled: data.enabled ?? true,
          max_message_length: data.max_message_length || 1000,
          spam_protection: data.spam_protection ?? true,
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load contact form settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAdminSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_contact_form_settings')
        .select('*')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setAdminSettings({
          max_submissions_per_hour: data.max_submissions_per_hour || 5,
          max_message_length: data.max_message_length || 2000,
          required_fields: Array.isArray(data.required_fields) ? data.required_fields as string[] : ['name', 'email', 'message'],
        });
      }
    } catch (error) {
      console.error('Error loading admin settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Validate against admin settings
      if (adminSettings) {
        if (settings.max_message_length > adminSettings.max_message_length) {
          toast({
            title: "Validation Error",
            description: `Maximum message length cannot exceed ${adminSettings.max_message_length} characters (admin limit)`,
            variant: "destructive",
          });
          return;
        }
      }

      const settingsData = {
        user_id: user.id,
        form_title: settings.form_title,
        form_description: settings.form_description,
        collect_phone: settings.collect_phone,
        collect_company: settings.collect_company,
        require_subject: settings.require_subject,
        enabled: settings.enabled,
        max_message_length: settings.max_message_length,
        spam_protection: settings.spam_protection,
      };

      const { error } = await supabase
        .from('user_contact_form_settings')
        .upsert(settingsData, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Your contact form settings have been updated successfully",
      });

      // Reload settings to get the ID if it was an insert
      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save contact form settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setSettings({
      form_title: 'Contact Me',
      form_description: 'Send me a message and I\'ll get back to you soon!',
      collect_phone: false,
      collect_company: false,
      require_subject: false,
      enabled: true,
      max_message_length: 1000,
      spam_protection: true,
    });
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Contact Form Settings</h1>
        <p className="text-muted-foreground">
          Customize how your contact form works and appears to visitors
        </p>
      </div>

      <div className="space-y-6">
        {/* Form Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Form Appearance
            </CardTitle>
            <CardDescription>
              Customize how your contact form appears to visitors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="form_title">Form Title</Label>
                <Input
                  id="form_title"
                  value={settings.form_title}
                  onChange={(e) => setSettings({ ...settings, form_title: e.target.value })}
                  placeholder="Contact Me"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
                />
                <Label htmlFor="enabled">Enable Contact Form</Label>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="form_description">Form Description</Label>
              <Textarea
                id="form_description"
                value={settings.form_description}
                onChange={(e) => setSettings({ ...settings, form_description: e.target.value })}
                placeholder="Send me a message and I'll get back to you soon!"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Fields */}
        <Card>
          <CardHeader>
            <CardTitle>Form Fields</CardTitle>
            <CardDescription>
              Configure which fields to collect from visitors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="require_subject"
                  checked={settings.require_subject}
                  onCheckedChange={(checked) => setSettings({ ...settings, require_subject: checked })}
                />
                <Label htmlFor="require_subject">Require Subject</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="collect_phone"
                  checked={settings.collect_phone}
                  onCheckedChange={(checked) => setSettings({ ...settings, collect_phone: checked })}
                />
                <Label htmlFor="collect_phone">Collect Phone Number</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="collect_company"
                  checked={settings.collect_company}
                  onCheckedChange={(checked) => setSettings({ ...settings, collect_company: checked })}
                />
                <Label htmlFor="collect_company">Collect Company</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_message_length">Maximum Message Length</Label>
              <Input
                id="max_message_length"
                type="number"
                value={settings.max_message_length}
                onChange={(e) => setSettings({ ...settings, max_message_length: parseInt(e.target.value) || 1000 })}
                min="100"
                max={adminSettings?.max_message_length || 2000}
              />
              {adminSettings && (
                <p className="text-xs text-muted-foreground">
                  Maximum allowed by admin: {adminSettings.max_message_length} characters
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security & Protection
            </CardTitle>
            <CardDescription>
              Protect your contact form from spam and abuse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="spam_protection"
                checked={settings.spam_protection}
                onCheckedChange={(checked) => setSettings({ ...settings, spam_protection: checked })}
              />
              <Label htmlFor="spam_protection">Enable Spam Protection</Label>
            </div>
            
            {adminSettings && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Admin Limits</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Max submissions per hour: {adminSettings.max_submissions_per_hour}</p>
                  <p>• Max message length: {adminSettings.max_message_length} characters</p>
                  <p>• Required fields: {adminSettings.required_fields.join(', ')}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
          
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}