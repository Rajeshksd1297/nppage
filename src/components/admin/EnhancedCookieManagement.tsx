import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Cookie, Save, Eye, Settings, Shield, Users, CheckCircle, 
  AlertTriangle, BarChart3, Trash2, Plus, Edit, Monitor,
  Smartphone, Globe, RefreshCw, Download, Calendar, Clock
} from 'lucide-react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

interface CookieCategory {
  id: string;
  name: string;
  display_name: string;
  description: string;
  is_required: boolean;
  is_enabled: boolean;
  sort_order: number;
}

interface CookieSettings {
  id: string;
  banner_title: string;
  banner_message: string;
  consent_mode: string;
  show_banner: boolean;
  banner_position: string;
  auto_hide_after: number;
  theme: string;
  primary_color: string;
  accept_all_button_text: string;
  reject_all_button_text: string;
  settings_button_text: string;
  save_preferences_text: string;
  privacy_policy_url: string;
}

interface ConsentLog {
  id: string;
  consent_action: string;
  accepted_categories: string[];
  rejected_categories: string[];
  created_at: string;
  ip_address: string;
  user_agent: string;
}

interface AnalyticsData {
  totalVisitors: number;
  consentRate: number;
  rejectionRate: number;
  categoryStats: Record<string, { accepted: number; rejected: number }>;
  dailyConsent: { labels: string[]; data: number[] };
}

export const EnhancedCookieManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [categories, setCategories] = useState<CookieCategory[]>([]);
  const [settings, setSettings] = useState<CookieSettings | null>(null);
  const [consentLogs, setConsentLogs] = useState<ConsentLog[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCategories(),
        fetchSettings(),
        fetchConsentLogs(),
        fetchAnalytics()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error loading data",
        description: "Failed to load cookie management data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('cookie_categories')
      .select('*')
      .order('sort_order');

    if (error) throw error;
    setCategories(data || []);
  };

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('cookie_settings')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    setSettings(data);
  };

  const fetchConsentLogs = async () => {
    const { data, error } = await supabase
      .from('cookie_consent_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    
    // Transform data to match our interface
    const transformedData = data?.map(log => ({
      ...log,
      accepted_categories: Array.isArray(log.accepted_categories) ? log.accepted_categories as string[] : [],
      rejected_categories: Array.isArray(log.rejected_categories) ? log.rejected_categories as string[] : [],
      ip_address: log.ip_address ? String(log.ip_address) : ''
    })) || [];
    
    setConsentLogs(transformedData);
  };

  const fetchAnalytics = async () => {
    const { data: logs, error } = await supabase
      .from('cookie_consent_log')
      .select('*')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    // Calculate analytics
    const totalVisitors = logs?.length || 0;
    const acceptedAll = logs?.filter(log => log.consent_action === 'accept-all').length || 0;
    const rejectedAll = logs?.filter(log => log.consent_action === 'reject-all').length || 0;
    
    const consentRate = totalVisitors > 0 ? (acceptedAll / totalVisitors) * 100 : 0;
    const rejectionRate = totalVisitors > 0 ? (rejectedAll / totalVisitors) * 100 : 0;

    // Category stats
    const categoryStats: Record<string, { accepted: number; rejected: number }> = {};
    categories.forEach(category => {
      categoryStats[category.name] = { accepted: 0, rejected: 0 };
    });

    logs?.forEach(log => {
      const acceptedCats = Array.isArray(log.accepted_categories) ? log.accepted_categories as string[] : [];
      const rejectedCats = Array.isArray(log.rejected_categories) ? log.rejected_categories as string[] : [];
      
      acceptedCats.forEach((cat: string) => {
        if (categoryStats[cat]) categoryStats[cat].accepted++;
      });
      rejectedCats.forEach((cat: string) => {
        if (categoryStats[cat]) categoryStats[cat].rejected++;
      });
    });

    // Daily consent data
    const dailyData: Record<string, number> = {};
    logs?.forEach(log => {
      const date = new Date(log.created_at).toDateString();
      dailyData[date] = (dailyData[date] || 0) + 1;
    });

    const labels = Object.keys(dailyData).slice(-7);
    const data = labels.map(label => dailyData[label] || 0);

    setAnalytics({
      totalVisitors,
      consentRate,
      rejectionRate,
      categoryStats,
      dailyConsent: { labels, data }
    });
  };

  const saveCookieSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('cookie_settings')
        .upsert(settings);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Cookie settings have been updated successfully."
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Save failed",
        description: "Failed to save cookie settings.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateCategory = async (categoryId: string, updates: Partial<CookieCategory>) => {
    try {
      const { error } = await supabase
        .from('cookie_categories')
        .update(updates)
        .eq('id', categoryId);

      if (error) throw error;

      setCategories(prev => prev.map(cat => 
        cat.id === categoryId ? { ...cat, ...updates } : cat
      ));

      toast({
        title: "Category updated",
        description: "Cookie category has been updated successfully."
      });
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Update failed",
        description: "Failed to update cookie category.",
        variant: "destructive"
      });
    }
  };

  const exportConsentData = async () => {
    try {
      const csvContent = [
        ['Date', 'Action', 'IP Address', 'Accepted Categories', 'Rejected Categories'].join(','),
        ...consentLogs.map(log => [
          new Date(log.created_at).toLocaleDateString(),
          log.consent_action,
          log.ip_address,
          log.accepted_categories?.join(';') || '',
          log.rejected_categories?.join(';') || ''
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cookie-consent-data-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();

      toast({
        title: "Export successful",
        description: "Consent data has been exported successfully."
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export consent data.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading cookie management data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Cookie className="h-6 w-6" />
            Cookie Management & Analytics
          </h2>
          <p className="text-muted-foreground">
            Comprehensive cookie consent management with real-time analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportConsentData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={() => setPreviewMode(!previewMode)}>
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Hide Preview' : 'Preview Banner'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Banner Settings</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="logs">Consent Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Visitors</p>
                    <p className="text-2xl font-bold">{analytics?.totalVisitors?.toLocaleString() || 0}</p>
                    <p className="text-xs text-muted-foreground">Last 30 days</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Consent Rate</p>
                    <p className="text-2xl font-bold text-green-600">
                      {analytics?.consentRate?.toFixed(1) || 0}%
                    </p>
                    <p className="text-xs text-green-600">Accept all cookies</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Rejection Rate</p>
                    <p className="text-2xl font-bold text-red-600">
                      {analytics?.rejectionRate?.toFixed(1) || 0}%
                    </p>
                    <p className="text-xs text-red-600">Reject all cookies</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">GDPR Status</p>
                    <p className="text-2xl font-bold text-green-600">Compliant</p>
                    <p className="text-xs text-green-600">All requirements met</p>
                  </div>
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Consent Rates</CardTitle>
                <CardDescription>Breakdown of consent by cookie category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.map(category => {
                    const stats = analytics?.categoryStats?.[category.name];
                    const total = (stats?.accepted || 0) + (stats?.rejected || 0);
                    const acceptRate = total > 0 ? ((stats?.accepted || 0) / total) * 100 : 0;
                    
                    return (
                      <div key={category.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded ${
                            category.is_required ? 'bg-green-500' : 
                            acceptRate > 70 ? 'bg-blue-500' :
                            acceptRate > 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <div>
                            <p className="font-medium">{category.display_name}</p>
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            category.is_required ? 'text-green-600' :
                            acceptRate > 70 ? 'text-blue-600' :
                            acceptRate > 40 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {category.is_required ? '100%' : `${acceptRate.toFixed(1)}%`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {category.is_required ? 'Required' : `${stats?.accepted || 0} accepted`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Consent Trend</CardTitle>
                <CardDescription>Consent activity over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.dailyConsent && (
                  <Line
                    data={{
                      labels: analytics.dailyConsent.labels,
                      datasets: [{
                        label: 'Daily Consents',
                        data: analytics.dailyConsent.data,
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: { beginAtZero: true }
                      }
                    }}
                    height={200}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {settings && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Banner Configuration</CardTitle>
                  <CardDescription>Customize your cookie consent banner</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Banner Title</Label>
                      <Input
                        value={settings.banner_title}
                        onChange={(e) => setSettings(prev => prev ? {...prev, banner_title: e.target.value} : null)}
                        placeholder="Cookie Consent"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Consent Mode</Label>
                      <Select
                        value={settings.consent_mode}
                        onValueChange={(value) => setSettings(prev => prev ? {...prev, consent_mode: value} : null)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="opt-in">Opt-in (Reject all by default)</SelectItem>
                          <SelectItem value="opt-out">Opt-out (Accept all by default)</SelectItem>
                          <SelectItem value="necessary-only">Necessary only (No optional cookies)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Banner Position</Label>
                      <Select
                        value={settings.banner_position}
                        onValueChange={(value) => setSettings(prev => prev ? {...prev, banner_position: value} : null)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bottom">Bottom Banner</SelectItem>
                          <SelectItem value="top">Top Banner</SelectItem>
                          <SelectItem value="modal">Modal Dialog</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.primary_color}
                          onChange={(e) => setSettings(prev => prev ? {...prev, primary_color: e.target.value} : null)}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={settings.primary_color}
                          onChange={(e) => setSettings(prev => prev ? {...prev, primary_color: e.target.value} : null)}
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Banner Message</Label>
                    <Textarea
                      value={settings.banner_message}
                      onChange={(e) => setSettings(prev => prev ? {...prev, banner_message: e.target.value} : null)}
                      rows={3}
                      placeholder="We use cookies to enhance your browsing experience..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Accept All Button Text</Label>
                      <Input
                        value={settings.accept_all_button_text}
                        onChange={(e) => setSettings(prev => prev ? {...prev, accept_all_button_text: e.target.value} : null)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Reject All Button Text</Label>
                      <Input
                        value={settings.reject_all_button_text}
                        onChange={(e) => setSettings(prev => prev ? {...prev, reject_all_button_text: e.target.value} : null)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Settings Button Text</Label>
                      <Input
                        value={settings.settings_button_text}
                        onChange={(e) => setSettings(prev => prev ? {...prev, settings_button_text: e.target.value} : null)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Privacy Policy URL</Label>
                      <Input
                        value={settings.privacy_policy_url || ''}
                        onChange={(e) => setSettings(prev => prev ? {...prev, privacy_policy_url: e.target.value} : null)}
                        placeholder="https://yoursite.com/privacy"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>Show Cookie Banner</Label>
                      <p className="text-sm text-muted-foreground">Enable cookie consent banner on your website</p>
                    </div>
                    <Switch
                      checked={settings.show_banner}
                      onCheckedChange={(checked) => setSettings(prev => prev ? {...prev, show_banner: checked} : null)}
                    />
                  </div>

                  <Button onClick={saveCookieSettings} disabled={saving} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Settings'}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cookie Categories</CardTitle>
              <CardDescription>Manage cookie categories and their settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories.map(category => (
                  <div key={category.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{category.display_name}</h3>
                        {category.is_required && (
                          <Badge variant="secondary">Required</Badge>
                        )}
                        {!category.is_enabled && (
                          <Badge variant="outline">Disabled</Badge>
                        )}
                      </div>
                      <Switch
                        checked={category.is_enabled}
                        onCheckedChange={(checked) => updateCategory(category.id, { is_enabled: checked })}
                        disabled={category.is_required}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                    <div className="flex gap-2">
                      <Input
                        value={category.display_name}
                        onChange={(e) => {
                          setCategories(prev => prev.map(cat =>
                            cat.id === category.id ? { ...cat, display_name: e.target.value } : cat
                          ));
                        }}
                        onBlur={() => updateCategory(category.id, { display_name: category.display_name })}
                        className="max-w-xs"
                      />
                      <Input
                        value={category.description}
                        onChange={(e) => {
                          setCategories(prev => prev.map(cat =>
                            cat.id === category.id ? { ...cat, description: e.target.value } : cat
                          ));
                        }}
                        onBlur={() => updateCategory(category.id, { description: category.description })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Consent Distribution</CardTitle>
                <CardDescription>Overview of consent choices</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <Doughnut
                    data={{
                      labels: ['Accepted All', 'Rejected All', 'Custom'],
                      datasets: [{
                        data: [
                          analytics.totalVisitors * (analytics.consentRate / 100),
                          analytics.totalVisitors * (analytics.rejectionRate / 100),
                          analytics.totalVisitors * ((100 - analytics.consentRate - analytics.rejectionRate) / 100)
                        ],
                        backgroundColor: ['#10b981', '#ef4444', '#f59e0b']
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false
                    }}
                    height={250}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>Acceptance rates by category</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.categoryStats && (
                  <Bar
                    data={{
                      labels: categories.map(cat => cat.display_name),
                      datasets: [{
                        label: 'Accepted',
                        data: categories.map(cat => analytics.categoryStats[cat.name]?.accepted || 0),
                        backgroundColor: '#10b981'
                      }, {
                        label: 'Rejected',
                        data: categories.map(cat => analytics.categoryStats[cat.name]?.rejected || 0),
                        backgroundColor: '#ef4444'
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: { y: { beginAtZero: true } }
                    }}
                    height={250}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Consent Activity</CardTitle>
              <CardDescription>Latest consent actions from visitors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {consentLogs.slice(0, 20).map(log => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        log.consent_action === 'accept-all' ? 'bg-green-500' :
                        log.consent_action === 'reject-all' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                      <div>
                        <p className="font-medium capitalize">{log.consent_action.replace('-', ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>IP: {log.ip_address}</p>
                      {log.accepted_categories?.length > 0 && (
                        <p>Accepted: {log.accepted_categories.join(', ')}</p>
                      )}
                    </div>
                  </div>
                ))}
                {consentLogs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No consent logs available yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedCookieManagement;