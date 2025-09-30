import { useState, useEffect } from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Users, Globe, Palette, Shield, Save, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Settings {
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
        })
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
              Configure global publisher settings and rules
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
                <Label className="text-base">Require Approval</Label>
                <p className="text-sm text-muted-foreground">
                  New publishers need admin approval
                </p>
              </div>
              <Switch
                checked={settings.require_publisher_approval}
                onCheckedChange={(checked) => updateSetting('require_publisher_approval', checked)}
              />
            </div>

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
          </CardContent>
        </Card>

        {/* Revenue & Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Revenue & Limits
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="revenue_share">Default Revenue Share (%)</Label>
              <Input
                id="revenue_share"
                type="number"
                min="0"
                max="100"
                value={settings.default_revenue_share}
                onChange={(e) => updateSetting('default_revenue_share', parseFloat(e.target.value))}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Publisher's share from sales
              </p>
            </div>

            <div>
              <Label htmlFor="commission">Platform Commission (%)</Label>
              <Input
                id="commission"
                type="number"
                min="0"
                max="100"
                value={settings.commission_percentage}
                onChange={(e) => updateSetting('commission_percentage', parseFloat(e.target.value))}
              />
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

            <div>
              <Label htmlFor="payout_threshold">Auto Payout Threshold ($)</Label>
              <Input
                id="payout_threshold"
                type="number"
                min="0"
                value={settings.auto_payout_threshold}
                onChange={(e) => updateSetting('auto_payout_threshold', parseFloat(e.target.value))}
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
                <Label className="text-base">White Label</Label>
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

        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
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
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Custom Branding:</span>
                  <Badge variant={settings.enable_custom_branding ? 'default' : 'secondary'}>
                    {settings.enable_custom_branding ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">White Label:</span>
                  <Badge variant={settings.enable_white_label ? 'default' : 'secondary'}>
                    {settings.enable_white_label ? 'Enabled' : 'Disabled'}
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