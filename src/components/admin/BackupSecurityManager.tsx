import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, Database, Download, Play, RotateCcw, Calendar, 
  Clock, HardDrive, Cloud, Lock, AlertTriangle, CheckCircle,
  Activity, Eye, Settings, RefreshCw, Zap, Server, Globe, Key
} from 'lucide-react';

interface BackupSettings {
  id: string;
  frequency: string;
  custom_schedule: string;
  enabled: boolean;
  backup_types: string[];
  storage_locations: string[];
  versioning_enabled: boolean;
  max_versions: number;
  compression_enabled: boolean;
  encryption_enabled: boolean;
  last_backup_at: string;
  next_backup_at: string;
  auto_cleanup_enabled: boolean;
  retention_days: number;
}

interface SecuritySettings {
  id: string;
  ssl_enforcement: boolean;
  https_redirect: boolean;
  hsts_enabled: boolean;
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_lowercase: boolean;
  password_require_numbers: boolean;
  password_require_symbols: boolean;
  two_factor_enabled: boolean;
  session_timeout: number;
  max_login_attempts: number;
  lockout_duration: number;
  firewall_enabled: boolean;
  malware_scanning: boolean;
  auto_updates: boolean;
  ddos_protection: boolean;
  log_monitoring: boolean;
  data_encryption: boolean;
  security_alerts: boolean;
  alert_email: string;
  alert_sms: string;
}

interface BackupJob {
  id: string;
  job_type: string;
  status: string;
  file_path: string;
  file_size: number;
  backup_duration: number;
  checksum: string;
  error_message: string;
  metadata: any;
  created_at: string;
  completed_at: string;
}

interface SecurityLog {
  id: string;
  event_type: string;
  severity: string;
  user_id: string;
  ip_address: string;
  user_agent: string;
  description: string;
  metadata: any;
  resolved: boolean;
  resolved_by: string;
  resolved_at: string;
  created_at: string;
}

export const BackupSecurityManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('backup');
  const [backupSettings, setBackupSettings] = useState<BackupSettings | null>(null);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [backupStats, setBackupStats] = useState<any>(null);
  const [securityReport, setSecurityReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBackupSettings(),
        fetchSecuritySettings(),
        fetchBackupJobs(),
        fetchSecurityLogs(),
        fetchBackupStats(),
        fetchSecurityReport()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error loading data",
        description: "Failed to load backup and security data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBackupSettings = async () => {
    const { data, error } = await (supabase as any)
      .from('backup_settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching backup settings:', error);
      return;
    }
    setBackupSettings(data as unknown as BackupSettings);
  };

  const fetchSecuritySettings = async () => {
    const { data, error } = await (supabase as any)
      .from('security_settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching security settings:', error);
      return;
    }
    setSecuritySettings(data as unknown as SecuritySettings);
  };

  const fetchBackupJobs = async () => {
    const { data, error } = await (supabase as any)
      .from('backup_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching backup jobs:', error);
      return;
    }
    setBackupJobs((data || []) as unknown as BackupJob[]);
  };

  const fetchSecurityLogs = async () => {
    const { data, error } = await (supabase as any)
      .from('security_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching security logs:', error);
      return;
    }
    setSecurityLogs((data || []) as unknown as SecurityLog[]);
  };

  const fetchBackupStats = async () => {
    try {
      // For now, calculate basic stats from backup jobs
      const { data: jobs } = await (supabase as any)
        .from('backup_jobs')
        .select('*');
      
      const stats = {
        total_backups: jobs?.length || 0,
        successful_backups: jobs?.filter((j: any) => j.status === 'completed').length || 0,
        failed_backups: jobs?.filter((j: any) => j.status === 'failed').length || 0,
        total_storage_used: jobs?.reduce((sum: number, j: any) => sum + (j.file_size || 0), 0) || 0
      };
      setBackupStats(stats);
    } catch (error) {
      console.error('Error fetching backup stats:', error);
    }
  };

  const fetchSecurityReport = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('security-monitor', {
        body: { action: 'monitor' }
      });

      if (error) throw error;
      setSecurityReport(data);
    } catch (error) {
      console.error('Error fetching security report:', error);
    }
  };

  const saveBackupSettings = async () => {
    if (!backupSettings) return;

    try {
      const { error } = await (supabase as any)
        .from('backup_settings')
        .upsert(backupSettings);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Backup settings have been updated successfully."
      });
    } catch (error) {
      console.error('Error saving backup settings:', error);
      toast({
        title: "Save failed",
        description: "Failed to save backup settings.",
        variant: "destructive"
      });
    }
  };

  const saveSecuritySettings = async () => {
    if (!securitySettings) return;

    try {
      const { data, error } = await supabase.functions.invoke('security-monitor', {
        body: { 
          action: 'update_settings',
          data: securitySettings
        }
      });

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Security settings have been updated successfully."
      });
    } catch (error) {
      console.error('Error saving security settings:', error);
      toast({
        title: "Save failed",
        description: "Failed to save security settings.",
        variant: "destructive"
      });
    }
  };

  const createBackup = async (backupType: 'database' | 'files' | 'full' = 'database') => {
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('backup-manager', {
        body: { 
          action: 'create',
          backupType
        }
      });

      if (error) throw error;

      toast({
        title: "Backup created",
        description: `${backupType} backup created successfully.`
      });

      await fetchBackupJobs();
      await fetchBackupStats();
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

  const testBackup = async (backupId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('backup-manager', {
        body: { 
          action: 'test',
          backupId
        }
      });

      if (error) throw error;

      toast({
        title: data.valid ? "Backup valid" : "Backup invalid",
        description: data.valid ? "Backup passed all validation tests." : "Backup validation failed.",
        variant: data.valid ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Error testing backup:', error);
      toast({
        title: "Test failed",
        description: "Failed to test backup.",
        variant: "destructive"
      });
    }
  };

  const restoreBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to restore from this backup? This will overwrite current data.')) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('backup-manager', {
        body: { 
          action: 'restore',
          backupId
        }
      });

      if (error) throw error;

      toast({
        title: "Restore initiated",
        description: "Backup restore has been started. This may take several minutes."
      });
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast({
        title: "Restore failed",
        description: "Failed to restore backup.",
        variant: "destructive"
      });
    }
  };

  const runSecurityScan = async () => {
    setMonitoring(true);
    try {
      const { data, error } = await supabase.functions.invoke('security-monitor', {
        body: { action: 'analyze' }
      });

      if (error) throw error;

      setSecurityReport(data);
      toast({
        title: "Security scan completed",
        description: "Security analysis has been completed."
      });
    } catch (error) {
      console.error('Error running security scan:', error);
      toast({
        title: "Scan failed",
        description: "Failed to run security scan.",
        variant: "destructive"
      });
    } finally {
      setMonitoring(false);
    }
  };

  const downloadBackup = async (backupId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('backup-manager', {
        body: { 
          action: 'download',
          backupId
        }
      });

      if (error) throw error;

      // In a real implementation, this would trigger a file download
      toast({
        title: "Download prepared",
        description: "Backup download has been prepared."
      });
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast({
        title: "Download failed",
        description: "Failed to prepare backup download.",
        variant: "destructive"
      });
    }
  };

  const resolveSecurityLog = async (logId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('security_logs')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', logId);

      if (error) throw error;

      await fetchSecurityLogs();
      toast({
        title: "Log resolved",
        description: "Security log has been marked as resolved."
      });
    } catch (error) {
      console.error('Error resolving security log:', error);
      toast({
        title: "Update failed",
        description: "Failed to resolve security log.",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'running': return 'warning';
      case 'failed': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'secondary';
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Backup & Security Management
          </h2>
          <p className="text-muted-foreground">
            Comprehensive backup and security management for your website
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAllData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="backup">Backup Management</TabsTrigger>
          <TabsTrigger value="security">Security Settings</TabsTrigger>
          <TabsTrigger value="monitoring">Security Monitoring</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="backup" className="space-y-6">
          {/* Backup Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Backups</p>
                    <p className="text-2xl font-bold">{backupStats?.total_backups || 0}</p>
                  </div>
                  <Database className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold text-green-600">
                      {backupStats?.total_backups > 0 ? 
                        Math.round((backupStats.successful_backups / backupStats.total_backups) * 100) : 0}%
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Storage Used</p>
                    <p className="text-2xl font-bold">{formatFileSize(backupStats?.total_storage_used || 0)}</p>
                  </div>
                  <HardDrive className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Next Backup</p>
                    <p className="text-sm font-bold">
                      {backupStats?.next_backup_date ? 
                        new Date(backupStats.next_backup_date).toLocaleDateString() : 'Not scheduled'}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Backup Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Create and manage backups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={() => createBackup('database')}
                  disabled={creating}
                  className="flex items-center gap-2"
                >
                  <Database className="h-4 w-4" />
                  {creating ? 'Creating...' : 'Create Database Backup'}
                </Button>
                
                <Button 
                  onClick={() => createBackup('full')}
                  disabled={creating}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <HardDrive className="h-4 w-4" />
                  Create Full Backup
                </Button>

                <Button 
                  onClick={runSecurityScan}
                  disabled={monitoring}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  {monitoring ? 'Scanning...' : 'Security Scan'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Backup Settings */}
          {backupSettings && (
            <Card>
              <CardHeader>
                <CardTitle>Backup Configuration</CardTitle>
                <CardDescription>Configure automatic backup settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Enable Automatic Backups</Label>
                      <Switch
                        checked={backupSettings.enabled}
                        onCheckedChange={(checked) => 
                          setBackupSettings(prev => prev ? {...prev, enabled: checked} : null)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Backup Frequency</Label>
                      <Select
                        value={backupSettings.frequency}
                        onValueChange={(value) => 
                          setBackupSettings(prev => prev ? {...prev, frequency: value} : null)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="custom">Custom Schedule</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Maximum Versions to Keep</Label>
                      <Input
                        type="number"
                        value={backupSettings.max_versions}
                        onChange={(e) => 
                          setBackupSettings(prev => prev ? 
                            {...prev, max_versions: parseInt(e.target.value)} : null
                          )
                        }
                        min="1"
                        max="50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Retention Period (Days)</Label>
                      <Input
                        type="number"
                        value={backupSettings.retention_days}
                        onChange={(e) => 
                          setBackupSettings(prev => prev ? 
                            {...prev, retention_days: parseInt(e.target.value)} : null
                          )
                        }
                        min="1"
                        max="365"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Enable Compression</Label>
                      <Switch
                        checked={backupSettings.compression_enabled}
                        onCheckedChange={(checked) => 
                          setBackupSettings(prev => prev ? {...prev, compression_enabled: checked} : null)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Enable Encryption</Label>
                      <Switch
                        checked={backupSettings.encryption_enabled}
                        onCheckedChange={(checked) => 
                          setBackupSettings(prev => prev ? {...prev, encryption_enabled: checked} : null)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Auto Cleanup Old Backups</Label>
                      <Switch
                        checked={backupSettings.auto_cleanup_enabled}
                        onCheckedChange={(checked) => 
                          setBackupSettings(prev => prev ? {...prev, auto_cleanup_enabled: checked} : null)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Enable Versioning</Label>
                      <Switch
                        checked={backupSettings.versioning_enabled}
                        onCheckedChange={(checked) => 
                          setBackupSettings(prev => prev ? {...prev, versioning_enabled: checked} : null)
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={saveBackupSettings}>
                    Save Backup Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Backups */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Backups</CardTitle>
              <CardDescription>View and manage your backup history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backupJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">{job.job_type} backup</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(job.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={getStatusColor(job.status) as any}>
                        {job.status}
                      </Badge>
                      {job.file_size && (
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(job.file_size)}
                        </p>
                      )}
                    </div>
                    
                    {job.status === 'completed' && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testBackup(job.id)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Test
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadBackup(job.id)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => restoreBackup(job.id)}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restore
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

                {backupJobs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No backups found. Create your first backup to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {securitySettings && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* SSL & HTTPS Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    SSL & HTTPS Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>SSL Enforcement</Label>
                    <Switch
                      checked={securitySettings.ssl_enforcement}
                      onCheckedChange={(checked) => 
                        setSecuritySettings(prev => prev ? {...prev, ssl_enforcement: checked} : null)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Force HTTPS Redirect</Label>
                    <Switch
                      checked={securitySettings.https_redirect}
                      onCheckedChange={(checked) => 
                        setSecuritySettings(prev => prev ? {...prev, https_redirect: checked} : null)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>HSTS Enabled</Label>
                    <Switch
                      checked={securitySettings.hsts_enabled}
                      onCheckedChange={(checked) => 
                        setSecuritySettings(prev => prev ? {...prev, hsts_enabled: checked} : null)
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Password Policy */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Password Policy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Minimum Password Length</Label>
                    <Input
                      type="number"
                      value={securitySettings.password_min_length}
                      onChange={(e) => 
                        setSecuritySettings(prev => prev ? 
                          {...prev, password_min_length: parseInt(e.target.value)} : null
                        )
                      }
                      min="8"
                      max="32"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Require Uppercase</Label>
                    <Switch
                      checked={securitySettings.password_require_uppercase}
                      onCheckedChange={(checked) => 
                        setSecuritySettings(prev => prev ? {...prev, password_require_uppercase: checked} : null)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Require Numbers</Label>
                    <Switch
                      checked={securitySettings.password_require_numbers}
                      onCheckedChange={(checked) => 
                        setSecuritySettings(prev => prev ? {...prev, password_require_numbers: checked} : null)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Require Symbols</Label>
                    <Switch
                      checked={securitySettings.password_require_symbols}
                      onCheckedChange={(checked) => 
                        setSecuritySettings(prev => prev ? {...prev, password_require_symbols: checked} : null)
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Authentication Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Authentication & Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Two-Factor Authentication</Label>
                    <Switch
                      checked={securitySettings.two_factor_enabled}
                      onCheckedChange={(checked) => 
                        setSecuritySettings(prev => prev ? {...prev, two_factor_enabled: checked} : null)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Session Timeout (minutes)</Label>
                    <Input
                      type="number"
                      value={securitySettings.session_timeout}
                      onChange={(e) => 
                        setSecuritySettings(prev => prev ? 
                          {...prev, session_timeout: parseInt(e.target.value)} : null
                        )
                      }
                      min="5"
                      max="1440"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Max Login Attempts</Label>
                    <Input
                      type="number"
                      value={securitySettings.max_login_attempts}
                      onChange={(e) => 
                        setSecuritySettings(prev => prev ? 
                          {...prev, max_login_attempts: parseInt(e.target.value)} : null
                        )
                      }
                      min="3"
                      max="10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Lockout Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={securitySettings.lockout_duration}
                      onChange={(e) => 
                        setSecuritySettings(prev => prev ? 
                          {...prev, lockout_duration: parseInt(e.target.value)} : null
                        )
                      }
                      min="5"
                      max="60"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Security Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Firewall Protection</Label>
                    <Switch
                      checked={securitySettings.firewall_enabled}
                      onCheckedChange={(checked) => 
                        setSecuritySettings(prev => prev ? {...prev, firewall_enabled: checked} : null)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Malware Scanning</Label>
                    <Switch
                      checked={securitySettings.malware_scanning}
                      onCheckedChange={(checked) => 
                        setSecuritySettings(prev => prev ? {...prev, malware_scanning: checked} : null)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>DDoS Protection</Label>
                    <Switch
                      checked={securitySettings.ddos_protection}
                      onCheckedChange={(checked) => 
                        setSecuritySettings(prev => prev ? {...prev, ddos_protection: checked} : null)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Automatic Updates</Label>
                    <Switch
                      checked={securitySettings.auto_updates}
                      onCheckedChange={(checked) => 
                        setSecuritySettings(prev => prev ? {...prev, auto_updates: checked} : null)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Data Encryption at Rest</Label>
                    <Switch
                      checked={securitySettings.data_encryption}
                      onCheckedChange={(checked) => 
                        setSecuritySettings(prev => prev ? {...prev, data_encryption: checked} : null)
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Security Alerts */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Security Alerts & Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable Security Alerts</Label>
                    <Switch
                      checked={securitySettings.security_alerts}
                      onCheckedChange={(checked) => 
                        setSecuritySettings(prev => prev ? {...prev, security_alerts: checked} : null)
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Alert Email</Label>
                      <Input
                        type="email"
                        value={securitySettings.alert_email || ''}
                        onChange={(e) => 
                          setSecuritySettings(prev => prev ? {...prev, alert_email: e.target.value} : null)
                        }
                        placeholder="security@yourcompany.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Alert SMS (Optional)</Label>
                      <Input
                        type="tel"
                        value={securitySettings.alert_sms || ''}
                        onChange={(e) => 
                          setSecuritySettings(prev => prev ? {...prev, alert_sms: e.target.value} : null)
                        }
                        placeholder="+1234567890"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={saveSecuritySettings}>
                      Save Security Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          {securityReport && (
            <>
              {/* Security Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Security Events</p>
                        <p className="text-2xl font-bold">{securityReport.totalEvents || 0}</p>
                        <p className="text-xs text-muted-foreground">Last 24 hours</p>
                      </div>
                      <Activity className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Critical Events</p>
                        <p className="text-2xl font-bold text-red-600">
                          {securityReport.severityBreakdown?.critical || 0}
                        </p>
                        <p className="text-xs text-red-600">Requires attention</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Active Threats</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {securityReport.threats?.length || 0}
                        </p>
                        <p className="text-xs text-orange-600">Under monitoring</p>
                      </div>
                      <Shield className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Security Score</p>
                        <p className="text-2xl font-bold text-green-600">
                          {securityReport.securityScore || 'N/A'}
                        </p>
                        <p className="text-xs text-green-600">Overall health</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Active Threats */}
              {securityReport.threats?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Active Security Threats</CardTitle>
                    <CardDescription>Threats requiring immediate attention</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {securityReport.threats.map((threat: any, index: number) => (
                        <div key={index} className="p-4 border border-red-200 rounded-lg bg-red-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="destructive">{threat.severity}</Badge>
                                <h4 className="font-medium">{threat.type}</h4>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {threat.description}
                              </p>
                              {threat.ip_address && (
                                <p className="text-sm font-mono mt-1">IP: {threat.ip_address}</p>
                              )}
                            </div>
                            <Button variant="outline" size="sm">
                              Investigate
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Security Recommendations */}
              {securityReport.recommendations?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Security Recommendations</CardTitle>
                    <CardDescription>Suggested improvements for your security posture</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {securityReport.recommendations.map((rec: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                                  {rec.priority}
                                </Badge>
                                <h4 className="font-medium">{rec.action}</h4>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {rec.description}
                              </p>
                            </div>
                            <Button variant="outline" size="sm">
                              Apply
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          <div className="flex justify-center">
            <Button onClick={runSecurityScan} disabled={monitoring}>
              <Shield className="h-4 w-4 mr-2" />
              {monitoring ? 'Running Security Scan...' : 'Run Security Scan'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Activity Logs</CardTitle>
              <CardDescription>Monitor security events and user activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant={getSeverityColor(log.severity) as any}>
                        {log.severity}
                      </Badge>
                      <div>
                        <p className="font-medium">{log.event_type}</p>
                        <p className="text-sm text-muted-foreground">{log.description}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                          {log.ip_address && (
                            <span className="text-xs font-mono text-muted-foreground">
                              {log.ip_address}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!log.resolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveSecurityLog(log.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {securityLogs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No security logs found.
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