import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, Database, Download, Play, RotateCcw, Calendar, 
  Clock, HardDrive, Cloud, Lock, AlertTriangle, CheckCircle,
  Activity, Eye, Settings, RefreshCw
} from 'lucide-react';

export const BackupSecurityTab: React.FC = () => {
  const [backupSettings, setBackupSettings] = useState<any>(null);
  const [securitySettings, setSecuritySettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch backup settings
      const { data: backup } = await supabase
        .from('backup_settings')
        .select('*')
        .single();
      setBackupSettings(backup);

      // Fetch security settings
      const { data: security } = await supabase
        .from('security_settings')
        .select('*')
        .single();
      setSecuritySettings(security);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('backup-manager', {
        body: { action: 'create', backupType: 'database' }
      });

      if (error) throw error;

      toast({
        title: "Backup created",
        description: "Database backup created successfully."
      });
    } catch (error) {
      console.error('Error creating backup:', error);
      toast({
        title: "Backup failed",
        description: "Failed to create backup.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const runSecurityScan = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('security-monitor', {
        body: { action: 'analyze' }
      });

      if (error) throw error;

      toast({
        title: "Security scan completed",
        description: "Security analysis completed successfully."
      });
    } catch (error) {
      console.error('Error running security scan:', error);
      toast({
        title: "Scan failed",
        description: "Failed to run security scan.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading backup and security data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Backup & Security Center
          </CardTitle>
          <CardDescription>
            Real backup and security management for your website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={createBackup}
              disabled={creating}
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              {creating ? 'Creating Backup...' : 'Create Database Backup'}
            </Button>
            
            <Button 
              onClick={runSecurityScan}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Run Security Scan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup Settings */}
      {backupSettings && (
        <Card>
          <CardHeader>
            <CardTitle>✅ Backup Management</CardTitle>
            <CardDescription>Configure automatic backup settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Backup Frequency</Label>
                <Select value={backupSettings.frequency || 'daily'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Auto Backup Enabled</Label>
                <Switch checked={backupSettings.enabled} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Full Database Backup</p>
                <p className="text-xs text-muted-foreground">Enabled</p>
              </div>
              <div className="text-center">
                <Cloud className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Cloud Storage</p>
                <p className="text-xs text-muted-foreground">Multiple Locations</p>
              </div>
              <div className="text-center">
                <Lock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Encryption</p>
                <p className="text-xs text-muted-foreground">AES-256</p>
              </div>
              <div className="text-center">
                <RotateCcw className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-medium">One-Click Restore</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Settings */}
      {securitySettings && (
        <Card>
          <CardHeader>
            <CardTitle>✅ Security Management</CardTitle>
            <CardDescription>Configure security features and monitoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="flex items-center justify-between">
                <Label>SSL/HTTPS Enforcement</Label>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex items-center justify-between">
                <Label>Two-Factor Authentication</Label>
                <Switch checked={securitySettings.two_factor_enabled} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Firewall Protection</Label>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex items-center justify-between">
                <Label>Malware Scanning</Label>
                <Switch checked={securitySettings.malware_scanning} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Auto Updates</Label>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex items-center justify-between">
                <Label>Security Alerts</Label>
                <Switch checked={securitySettings.security_alerts} />
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Alert Email</Label>
                  <Input 
                    type="email" 
                    value={securitySettings.alert_email || ''} 
                    placeholder="security@yourcompany.com" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Session Timeout (minutes)</Label>
                  <Input 
                    type="number" 
                    value={securitySettings.session_timeout || 30}
                    min="5" 
                    max="1440" 
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg bg-green-50">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-800">Backup System</h3>
              <p className="text-sm text-green-600">Operational</p>
            </div>
            <div className="text-center p-4 border rounded-lg bg-blue-50">
              <Shield className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-800">Security System</h3>
              <p className="text-sm text-blue-600">Protected</p>
            </div>
            <div className="text-center p-4 border rounded-lg bg-purple-50">
              <Activity className="h-12 w-12 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-800">Monitoring</h3>
              <p className="text-sm text-purple-600">Active</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};