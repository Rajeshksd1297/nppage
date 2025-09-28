import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Shield, Users, Save, AlertTriangle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface AdminContactFormSettings {
  id?: string;
  max_submissions_per_hour: number;
  max_message_length: number;
  required_fields: string[];
  blocked_domains: string[];
  auto_moderation: boolean;
  allow_attachments: boolean;
  max_attachment_size_mb: number;
  retention_days: number;
  enable_honeypot: boolean;
}

export default function AdminContactFormSettings() {
  const [settings, setSettings] = useState<AdminContactFormSettings>({
    max_submissions_per_hour: 5,
    max_message_length: 2000,
    required_fields: ['name', 'email', 'message'],
    blocked_domains: [],
    auto_moderation: true,
    allow_attachments: false,
    max_attachment_size_mb: 5,
    retention_days: 365,
    enable_honeypot: true,
  });
  const [stats, setStats] = useState({
    total_submissions: 0,
    active_users: 0,
    spam_blocked: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blockedDomainsText, setBlockedDomainsText] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    loadStats();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_contact_form_settings')
        .select('*')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const loadedSettings = {
          id: data.id,
          max_submissions_per_hour: data.max_submissions_per_hour || 5,
          max_message_length: data.max_message_length || 2000,
          required_fields: Array.isArray(data.required_fields) ? data.required_fields as string[] : ['name', 'email', 'message'],
          blocked_domains: Array.isArray(data.blocked_domains) ? data.blocked_domains as string[] : [],
          auto_moderation: data.auto_moderation ?? true,
          allow_attachments: data.allow_attachments ?? false,
          max_attachment_size_mb: data.max_attachment_size_mb || 5,
          retention_days: data.retention_days || 365,
          enable_honeypot: data.enable_honeypot ?? true,
        };
        setSettings(loadedSettings);
        setBlockedDomainsText(Array.isArray(loadedSettings.blocked_domains) ? loadedSettings.blocked_domains.join('\n') : '');
      }
    } catch (error) {
      console.error('Error loading admin settings:', error);
      toast({
        title: "Error",
        description: "Failed to load admin contact form settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get total submissions
      const { count: totalSubmissions } = await supabase
        .from('contact_submissions')
        .select('*', { count: 'exact', head: true });

      // Get active users with contact forms
      const { count: activeUsers } = await supabase
        .from('user_contact_form_settings')
        .select('*', { count: 'exact', head: true })
        .eq('enabled', true);

      // For now, set spam blocked to 0 (would need spam tracking)
      setStats({
        total_submissions: totalSubmissions || 0,
        active_users: activeUsers || 0,
        spam_blocked: 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      // Parse blocked domains
      const blockedDomains = blockedDomainsText
        .split('\n')
        .map(domain => domain.trim())
        .filter(domain => domain.length > 0);

      const settingsData = {
        max_submissions_per_hour: settings.max_submissions_per_hour,
        max_message_length: settings.max_message_length,
        required_fields: settings.required_fields,
        blocked_domains: blockedDomains,
        auto_moderation: settings.auto_moderation,
        allow_attachments: settings.allow_attachments,
        max_attachment_size_mb: settings.max_attachment_size_mb,
        retention_days: settings.retention_days,
        enable_honeypot: settings.enable_honeypot,
      };

      const { error } = await supabase
        .from('admin_contact_form_settings')
        .upsert(settingsData);

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Global contact form settings have been updated successfully",
      });

      // Reload settings
      await loadSettings();
    } catch (error) {
      console.error('Error saving admin settings:', error);
      toast({
        title: "Error",
        description: "Failed to save admin contact form settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleRequiredField = (field: string) => {
    const newFields = settings.required_fields.includes(field)
      ? settings.required_fields.filter(f => f !== field)
      : [...settings.required_fields, field];
    setSettings({ ...settings, required_fields: newFields });
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Contact Form Settings</h1>
        <p className="text-muted-foreground">
          Manage global settings and limits for all user contact forms
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Submissions</p>
                <p className="text-2xl font-bold">{stats.total_submissions}</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Forms</p>
                <p className="text-2xl font-bold">{stats.active_users}</p>
              </div>
              <Settings className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Spam Blocked</p>
                <p className="text-2xl font-bold">{stats.spam_blocked}</p>
              </div>
              <Shield className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {/* Rate Limiting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Rate Limiting & Security
            </CardTitle>
            <CardDescription>
              Protect against spam and abuse
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_submissions_per_hour">Max Submissions Per Hour</Label>
                <Input
                  id="max_submissions_per_hour"
                  type="number"
                  value={settings.max_submissions_per_hour}
                  onChange={(e) => setSettings({ ...settings, max_submissions_per_hour: parseInt(e.target.value) || 5 })}
                  min="1"
                  max="100"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max_message_length">Max Message Length</Label>
                <Input
                  id="max_message_length"
                  type="number"
                  value={settings.max_message_length}
                  onChange={(e) => setSettings({ ...settings, max_message_length: parseInt(e.target.value) || 2000 })}
                  min="100"
                  max="10000"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto_moderation"
                  checked={settings.auto_moderation}
                  onCheckedChange={(checked) => setSettings({ ...settings, auto_moderation: checked })}
                />
                <Label htmlFor="auto_moderation">Enable Auto-Moderation</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="enable_honeypot"
                  checked={settings.enable_honeypot}
                  onCheckedChange={(checked) => setSettings({ ...settings, enable_honeypot: checked })}
                />
                <Label htmlFor="enable_honeypot">Enable Honeypot Protection</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="blocked_domains">Blocked Email Domains</Label>
              <Textarea
                id="blocked_domains"
                value={blockedDomainsText}
                onChange={(e) => setBlockedDomainsText(e.target.value)}
                placeholder="example.com&#10;spam-domain.com&#10;One domain per line"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Enter one domain per line. These domains will be blocked from submitting contact forms.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Required Fields */}
        <Card>
          <CardHeader>
            <CardTitle>Required Fields</CardTitle>
            <CardDescription>
              Set which fields must be collected by all contact forms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <AlertTriangle className="w-4 h-4" />
                Name, email, and message are always required for functionality
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['name', 'email', 'message', 'subject', 'phone', 'company'].map((field) => (
                  <div key={field} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`field_${field}`}
                      checked={settings.required_fields.includes(field)}
                      onChange={() => toggleRequiredField(field)}
                      disabled={['name', 'email', 'message'].includes(field)}
                      className="rounded"
                    />
                    <Label 
                      htmlFor={`field_${field}`}
                      className={['name', 'email', 'message'].includes(field) ? 'text-muted-foreground' : ''}
                    >
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </Label>
                    {['name', 'email', 'message'].includes(field) && (
                      <Badge variant="secondary" className="text-xs">Required</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Attachments */}
        <Card>
          <CardHeader>
            <CardTitle>File Attachments</CardTitle>
            <CardDescription>
              Configure file attachment settings for contact forms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="allow_attachments"
                checked={settings.allow_attachments}
                onCheckedChange={(checked) => setSettings({ ...settings, allow_attachments: checked })}
              />
              <Label htmlFor="allow_attachments">Allow File Attachments</Label>
            </div>

            {settings.allow_attachments && (
              <div className="space-y-2 pl-6 border-l-2 border-muted">
                <Label htmlFor="max_attachment_size_mb">Max Attachment Size (MB)</Label>
                <Input
                  id="max_attachment_size_mb"
                  type="number"
                  value={settings.max_attachment_size_mb}
                  onChange={(e) => setSettings({ ...settings, max_attachment_size_mb: parseInt(e.target.value) || 5 })}
                  min="1"
                  max="50"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card>
          <CardHeader>
            <CardTitle>Data Retention</CardTitle>
            <CardDescription>
              Configure how long contact form data is stored
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="retention_days">Retention Period (Days)</Label>
              <Input
                id="retention_days"
                type="number"
                value={settings.retention_days}
                onChange={(e) => setSettings({ ...settings, retention_days: parseInt(e.target.value) || 365 })}
                min="30"
                max="3650"
              />
              <p className="text-xs text-muted-foreground">
                Contact submissions will be automatically deleted after this period. Minimum 30 days.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end">
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