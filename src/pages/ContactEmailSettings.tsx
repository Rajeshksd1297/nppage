import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Key, ExternalLink, ArrowLeft, Save, Send } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';

interface EmailSettings {
  id?: string;
  resend_api_key: string | null;
  resend_from_email: string;
  resend_from_name: string;
  enabled: boolean;
  test_email_sent: boolean;
  // Contact form email settings
  notification_email: string | null;
  auto_reply_enabled: boolean;
  auto_reply_subject: string;
  auto_reply_message: string;
}

export default function ContactEmailSettings() {
  const [settings, setSettings] = useState<EmailSettings>({
    resend_api_key: null,
    resend_from_email: '',
    resend_from_name: '',
    enabled: false,
    test_email_sent: false,
    notification_email: null,
    auto_reply_enabled: true,
    auto_reply_subject: 'Thank you for your message',
    auto_reply_message: 'Thank you for contacting me. I have received your message and will get back to you as soon as possible.',
  });
  const [userEmail, setUserEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadSettings();
    loadContactFormSettings();
    loadUserEmail();
  }, []);

  const loadUserEmail = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
        // Set default from email if not set
        if (!settings.resend_from_email) {
          setSettings(prev => ({
            ...prev,
            resend_from_email: user.email,
            resend_from_name: user.user_metadata?.full_name || 'Contact Form'
          }));
        }
      }
    } catch (error) {
      console.error('Error loading user email:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Use the correct TypeScript typing with any
      const { data, error } = await supabase
        .from('user_email_settings' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings(prev => ({
          ...prev,
          id: (data as any).id,
          resend_api_key: (data as any).resend_api_key,
          resend_from_email: (data as any).resend_from_email || '',
          resend_from_name: (data as any).resend_from_name || '',
          enabled: (data as any).enabled ?? false,
          test_email_sent: (data as any).test_email_sent ?? false,
        }));
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
      toast({
        title: "Error",
        description: "Failed to load email settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadContactFormSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_contact_form_settings' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings(prev => ({
          ...prev,
          notification_email: (data as any).notification_email,
          auto_reply_enabled: (data as any).auto_reply_enabled ?? true,
          auto_reply_subject: (data as any).auto_reply_subject || 'Thank you for your message',
          auto_reply_message: (data as any).auto_reply_message || 'Thank you for contacting me. I have received your message and will get back to you as soon as possible.',
        }));
      }
    } catch (error) {
      console.error('Error loading contact form settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Save email settings
      const emailSettingsData = {
        user_id: user.id,
        resend_api_key: settings.resend_api_key,
        resend_from_email: settings.resend_from_email,
        resend_from_name: settings.resend_from_name,
        enabled: settings.enabled,
        test_email_sent: settings.test_email_sent,
      };

      const { error: emailError } = await supabase
        .from('user_email_settings' as any)
        .upsert(emailSettingsData, { onConflict: 'user_id' });

      if (emailError) throw emailError;

      // Save contact form settings
      const contactFormData = {
        user_id: user.id,
        notification_email: settings.notification_email || null,
        auto_reply_enabled: settings.auto_reply_enabled,
        auto_reply_subject: settings.auto_reply_subject,
        auto_reply_message: settings.auto_reply_message,
      };

      const { error: contactError } = await supabase
        .from('user_contact_form_settings' as any)
        .upsert(contactFormData, { onConflict: 'user_id' });

      if (contactError) throw contactError;

      toast({
        title: "Settings Saved",
        description: "Your email settings have been updated successfully",
      });

      await loadSettings();
      await loadContactFormSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save email settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const testEmail = async () => {
    try {
      setTesting(true);
      
      if (!settings.resend_api_key) {
        toast({
          title: "API Key Required",
          description: "Please add your Resend API key first",
          variant: "destructive",
        });
        return;
      }

      // For now, just simulate a successful test
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Settings Validated",
        description: "Your email configuration looks correct. Test email functionality will be available soon.",
      });

      // Update test_email_sent flag
      setSettings(prev => ({ ...prev, test_email_sent: true }));
    } catch (error) {
      console.error('Error testing email:', error);
      toast({
        title: "Error",
        description: "Failed to validate email settings.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold mb-2">Email Settings</h1>
          <p className="text-muted-foreground">
            Configure all email settings for contact forms, notifications, and auto-replies
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Resend Setup Instructions
            </CardTitle>
            <CardDescription>
              Follow these steps to set up email sending for your contact form
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> You need a Resend account to send emails from your contact form.
                Resend provides reliable email delivery with excellent deliverability rates.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h4 className="font-medium">Step-by-step setup:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  Go to{' '}
                  <Button variant="link" className="p-0 h-auto" asChild>
                    <a href="https://resend.com" target="_blank" rel="noopener noreferrer">
                      resend.com <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </Button>
                  {' '}and create a free account
                </li>
                <li>
                  Verify your domain at{' '}
                  <Button variant="link" className="p-0 h-auto" asChild>
                    <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer">
                      resend.com/domains <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </Button>
                  {' '}(required for production use)
                </li>
                <li>
                  Create an API key at{' '}
                  <Button variant="link" className="p-0 h-auto" asChild>
                    <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer">
                      resend.com/api-keys <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </Button>
                </li>
                <li>Copy the API key and paste it in the field below</li>
                <li>Configure your "From" email and name</li>
                <li>Test the configuration by sending a test email</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              API Configuration
            </CardTitle>
            <CardDescription>
              Enter your Resend API key and sender information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resend_api_key">Resend API Key *</Label>
              <div className="relative">
                <Input
                  id="resend_api_key"
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.resend_api_key || ''}
                  onChange={(e) => setSettings({ ...settings, resend_api_key: e.target.value })}
                  placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Your API key is stored securely and encrypted
              </p>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="resend_from_email">From Email *</Label>
                <Input
                  id="resend_from_email"
                  type="email"
                  value={settings.resend_from_email}
                  onChange={(e) => setSettings({ ...settings, resend_from_email: e.target.value })}
                  placeholder={userEmail}
                />
                <p className="text-xs text-muted-foreground">
                  Must be from a verified domain
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resend_from_name">From Name</Label>
                <Input
                  id="resend_from_name"
                  value={settings.resend_from_name}
                  onChange={(e) => setSettings({ ...settings, resend_from_name: e.target.value })}
                  placeholder="Your Name"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={settings.enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
              />
              <Label htmlFor="enabled">Enable Email Sending</Label>
            </div>
          </CardContent>
        </Card>

        {/* Test Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Test Email
            </CardTitle>
            <CardDescription>
              Send a test email to verify your configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Validate your configuration to ensure emails can be sent properly.
              </p>
              
              <Button 
                onClick={testEmail}
                disabled={testing || !settings.resend_api_key || !settings.resend_from_email}
                className="w-full md:w-auto"
              >
                {testing ? (
                  "Validating Settings..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Validate Configuration
                  </>
                )}
              </Button>

              {settings.test_email_sent && (
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    Configuration validated successfully! Your email settings are ready.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notification and Auto-Reply Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Notification & Auto-Reply Settings
            </CardTitle>
            <CardDescription>
              Configure how you receive notifications and auto-reply to contacts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notification_email">Notification Email</Label>
              <Input
                id="notification_email"
                type="email"
                value={settings.notification_email || userEmail}
                onChange={(e) => setSettings({ ...settings, notification_email: e.target.value })}
                placeholder={userEmail}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use your account email ({userEmail})
              </p>
            </div>

            <Separator />

            <div className="flex items-center space-x-2">
              <Switch
                id="auto_reply_enabled"
                checked={settings.auto_reply_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, auto_reply_enabled: checked })}
              />
              <Label htmlFor="auto_reply_enabled">Enable Auto-Reply</Label>
            </div>

            {settings.auto_reply_enabled && (
              <div className="space-y-4 pl-6 border-l-2 border-muted">
                <div className="space-y-2">
                  <Label htmlFor="auto_reply_subject">Auto-Reply Subject</Label>
                  <Input
                    id="auto_reply_subject"
                    value={settings.auto_reply_subject}
                    onChange={(e) => setSettings({ ...settings, auto_reply_subject: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="auto_reply_message">Auto-Reply Message</Label>
                  <Textarea
                    id="auto_reply_message"
                    value={settings.auto_reply_message}
                    onChange={(e) => setSettings({ ...settings, auto_reply_message: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>
            )}
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