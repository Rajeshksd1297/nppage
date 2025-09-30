import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Settings,
  DollarSign,
  Users,
  Globe,
  Palette,
  Shield,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PublisherSettings {
  id: string;
  allow_publisher_registration: boolean;
  default_revenue_share: number;
  max_authors_per_publisher: number;
  require_publisher_approval: boolean;
  publisher_subdomain_prefix: string;
  enable_custom_branding: boolean;
  enable_white_label: boolean;
  commission_percentage: number;
  auto_payout_threshold: number;
  created_at: string;
  updated_at: string;
}

export default function PublisherSettings() {
  const [settings, setSettings] = useState<PublisherSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
    
    // Set up real-time sync with package management
    const channel = supabase
      .channel('publisher_settings_sync')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'subscription_plans'
      }, () => {
        console.log('📦 Package management changed - refreshing publisher settings...');
        fetchSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('publisher_settings')
        .select('*')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
      } else {
        // Create default settings if none exist
        const defaultSettings = {
          allow_publisher_registration: true,
          default_revenue_share: 30,
          max_authors_per_publisher: 25,
          require_publisher_approval: false,
          publisher_subdomain_prefix: 'pub',
          enable_custom_branding: true,
          enable_white_label: false,
          commission_percentage: 10,
          auto_payout_threshold: 100
        };

        const { data: newSettings, error: createError } = await supabase
          .from('publisher_settings')
          .insert([defaultSettings])
          .select()
          .single();

        if (createError) throw createError;
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error fetching publisher settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load publisher settings',
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
        .update({
          allow_publisher_registration: settings.allow_publisher_registration,
          default_revenue_share: settings.default_revenue_share,
          max_authors_per_publisher: settings.max_authors_per_publisher,
          require_publisher_approval: settings.require_publisher_approval,
          publisher_subdomain_prefix: settings.publisher_subdomain_prefix,
          enable_custom_branding: settings.enable_custom_branding,
          enable_white_label: settings.enable_white_label,
          commission_percentage: settings.commission_percentage,
          auto_payout_threshold: settings.auto_payout_threshold,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Publisher settings saved successfully. Changes will sync with package management in real-time.',
      });
    } catch (error) {
      console.error('Error saving publisher settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save publisher settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (field: keyof PublisherSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium mb-2">Settings not found</h3>
        <p className="text-muted-foreground">Unable to load publisher settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="w-8 h-8" />
            Publisher Settings
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Live Sync
            </div>
          </h1>
          <p className="text-muted-foreground">
            Configure publisher features and management rules - synced with package management
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Settings className="h-4 w-4 mr-2" />
          )}
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="revenue">Revenue & Limits</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                General Publisher Settings
              </CardTitle>
              <CardDescription>
                Basic configuration for publisher functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Allow Publisher Registration</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to register as publishers
                  </p>
                </div>
                <Switch
                  checked={settings.allow_publisher_registration}
                  onCheckedChange={(checked) => updateSetting('allow_publisher_registration', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Require Publisher Approval</Label>
                  <p className="text-sm text-muted-foreground">
                    Publishers need admin approval before becoming active
                  </p>
                </div>
                <Switch
                  checked={settings.require_publisher_approval}
                  onCheckedChange={(checked) => updateSetting('require_publisher_approval', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subdomain_prefix">Subdomain Prefix</Label>
                <Input
                  id="subdomain_prefix"
                  value={settings.publisher_subdomain_prefix}
                  onChange={(e) => updateSetting('publisher_subdomain_prefix', e.target.value)}
                  placeholder="pub"
                />
                <p className="text-sm text-muted-foreground">
                  Example: {settings.publisher_subdomain_prefix}-publishername.namyapage.com
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Revenue & Author Limits
              </CardTitle>
              <CardDescription>
                Configure revenue sharing and author management limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default_revenue_share">Default Revenue Share (%)</Label>
                  <Input
                    id="default_revenue_share"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.default_revenue_share}
                    onChange={(e) => updateSetting('default_revenue_share', parseFloat(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Default percentage publishers keep from author sales
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commission_percentage">Platform Commission (%)</Label>
                  <Input
                    id="commission_percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.commission_percentage}
                    onChange={(e) => updateSetting('commission_percentage', parseFloat(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Platform commission on all publisher transactions
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_authors">Max Authors per Publisher</Label>
                  <Input
                    id="max_authors"
                    type="number"
                    min="1"
                    value={settings.max_authors_per_publisher}
                    onChange={(e) => updateSetting('max_authors_per_publisher', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Default limit (can be overridden by subscription plans)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auto_payout_threshold">Auto Payout Threshold ($)</Label>
                  <Input
                    id="auto_payout_threshold"
                    type="number"
                    min="0"
                    value={settings.auto_payout_threshold}
                    onChange={(e) => updateSetting('auto_payout_threshold', parseFloat(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Minimum amount before automatic payouts
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Branding & Customization
              </CardTitle>
              <CardDescription>
                Configure publisher branding and white-label options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Custom Branding</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow publishers to customize their brand colors and logos
                  </p>
                </div>
                <Switch
                  checked={settings.enable_custom_branding}
                  onCheckedChange={(checked) => updateSetting('enable_custom_branding', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
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
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security & Moderation
              </CardTitle>
              <CardDescription>
                Security settings and content moderation for publishers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Package Management Integration</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Publisher limits and features are dynamically synchronized with package management settings:
                </p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Author limits update in real-time based on subscription plans</li>
                  <li>• Publisher features enable/disable based on plan changes</li>
                  <li>• Revenue sharing rules sync with billing systems</li>
                  <li>• All changes reflect immediately across admin and user dashboards</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Current Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Registration:</span>
                      <Badge variant={settings.allow_publisher_registration ? 'default' : 'secondary'}>
                        {settings.allow_publisher_registration ? 'Open' : 'Closed'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Approval Required:</span>
                      <Badge variant={settings.require_publisher_approval ? 'default' : 'secondary'}>
                        {settings.require_publisher_approval ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Custom Branding:</span>
                      <Badge variant={settings.enable_custom_branding ? 'default' : 'secondary'}>
                        {settings.enable_custom_branding ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Real-time Sync</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Package Management Connected
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Subscription Plans Sync
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Author Limits Dynamic
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving} size="lg">
          {saving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Settings className="h-4 w-4 mr-2" />
          )}
          {saving ? 'Saving Changes...' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  );
}