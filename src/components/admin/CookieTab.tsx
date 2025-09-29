import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import EnhancedCookieManagement from '@/components/admin/EnhancedCookieManagement';
import { Cookie, Save, RefreshCw, Shield, Eye, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CookieTabProps {
  cookieSettings: any;
  setCookieSettings: (settings: any) => void;
}

export const CookieTab = ({ cookieSettings, setCookieSettings }: CookieTabProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [consentLogs, setConsentLogs] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);

  const fetchCookieSettings = async () => {
    try {
      setLoading(true);
      
      // Fetch cookie settings
      const { data: settings, error: settingsError } = await supabase
        .from('cookie_settings')
        .select('*')
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

      // Fetch cookie categories
      const { data: categories, error: categoriesError } = await supabase
        .from('cookie_categories')
        .select('*')
        .order('sort_order');

      if (categoriesError) throw categoriesError;

      setCookieSettings({
        ...settings,
        categories: categories || []
      });

    } catch (error) {
      console.error('Error fetching cookie settings:', error);
      toast({
        title: "Error",
        description: "Failed to load cookie settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchConsentLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('cookie_consent_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setConsentLogs(data || []);
    } catch (error) {
      console.error('Error fetching consent logs:', error);
    }
  };

  const saveCookieSettings = async () => {
    try {
      setSaving(true);
      
      // Save cookie settings
      const { error } = await supabase
        .from('cookie_settings')
        .upsert(cookieSettings);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Cookie settings saved successfully"
      });
    } catch (error) {
      console.error('Error saving cookie settings:', error);
      toast({
        title: "Error",
        description: "Failed to save cookie settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const previewCookieBanner = () => {
    setPreviewMode(!previewMode);
    if (!previewMode) {
      // Simulate cookie banner preview
      toast({
        title: "Preview Mode",
        description: "Cookie banner preview would be shown here",
      });
    }
  };

  useEffect(() => {
    fetchCookieSettings();
    fetchConsentLogs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Cookie Management</h3>
          <p className="text-sm text-muted-foreground">
            Configure cookie consent and manage privacy settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={previewCookieBanner}>
            <Eye className="h-4 w-4 mr-2" />
            Preview Banner
          </Button>
          <Button variant="outline" onClick={fetchCookieSettings} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={saveCookieSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Enhanced Cookie Management Component */}
      <EnhancedCookieManagement />

      {/* Cookie Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Cookie Consent Analytics
          </CardTitle>
          <CardDescription>Monitor cookie consent statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {consentLogs.filter(log => log.consent_action === 'accepted').length}
              </div>
              <p className="text-sm text-muted-foreground">Accepted</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {consentLogs.filter(log => log.consent_action === 'rejected').length}
              </div>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {consentLogs.length}
              </div>
              <p className="text-sm text-muted-foreground">Total Interactions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Consent Logs */}
      {consentLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Consent Activity</CardTitle>
            <CardDescription>Latest cookie consent interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {consentLogs.slice(0, 10).map((log, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      log.consent_action === 'accepted' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm font-medium capitalize">
                      {log.consent_action}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {log.ip_address}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Compliance Information
          </CardTitle>
          <CardDescription>Ensure your cookie setup meets legal requirements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900">GDPR Compliance</h4>
              <p className="text-sm text-blue-700 mt-1">
                Ensure you have proper consent mechanisms for EU visitors
              </p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900">CCPA Compliance</h4>
              <p className="text-sm text-green-700 mt-1">
                Provide clear opt-out options for California residents
              </p>
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-900">Best Practices</h4>
              <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside">
                <li>Clear and concise cookie descriptions</li>
                <li>Easy-to-access cookie preferences</li>
                <li>Regular privacy policy updates</li>
                <li>Transparent data collection practices</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};