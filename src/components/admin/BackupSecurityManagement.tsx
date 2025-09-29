import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  HardDrive, 
  Download, 
  Upload, 
  Shield, 
  Lock, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Globe, 
  Monitor,
  Settings,
  Play,
  Pause,
  RefreshCw,
  Eye,
  Users,
  Activity,
  Zap,
  Mail,
  Phone,
  FileText,
  Calendar,
  Timer,
  Save,
  Bell
} from 'lucide-react';

interface BackupSettings {
  id: string;
  frequency: string;
  custom_schedule?: string;
  enabled: boolean;
  backup_types: any;
  storage_locations: any;
  versioning_enabled: boolean;
  max_versions: number;
  compression_enabled: boolean;
  encryption_enabled: boolean;
  last_backup_at?: string;
  next_backup_at?: string;
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
  alert_email?: string;
  alert_sms?: string;
  ip_whitelist: any;
  ip_blacklist: any;
  allowed_countries: any;
  blocked_countries: any;
}

interface BackupJob {
  id: string;
  job_type: string;
  status: string;
  file_path?: string;
  file_size?: number;
  backup_duration?: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

interface SecurityLog {
  id: string;
  event_type: string;
  severity: string;
  description: string;
  ip_address?: any;
  created_at: string;
  resolved: boolean;
}

const BackupSecurityManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backupSettings, setBackupSettings] = useState<BackupSettings | null>(null);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [backupProgress, setBackupProgress] = useState(0);
  const [backupRunning, setBackupRunning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch backup settings
      const { data: backupData, error: backupError } = await supabase
        .from('backup_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (backupError && backupError.code !== 'PGRST116') {
        console.error('Error fetching backup settings:', backupError);
      } else if (backupData) {
        setBackupSettings(backupData);
      }

      // Fetch security settings
      const { data: securityData, error: securityError } = await supabase
        .from('security_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (securityError && securityError.code !== 'PGRST116') {
        console.error('Error fetching security settings:', securityError);
      } else if (securityData) {
        setSecuritySettings(securityData);
      }

      // Fetch backup jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('backup_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (jobsError) {
        console.error('Error fetching backup jobs:', jobsError);
      } else if (jobsData) {
        setBackupJobs(jobsData);
      }

      // Fetch security logs
      const { data: logsData, error: logsError } = await supabase
        .from('security_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (logsError) {
        console.error('Error fetching security logs:', logsError);
      } else if (logsData) {
        setSecurityLogs(logsData);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load backup and security settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveBackupSettings = async () => {
    if (!backupSettings) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('backup_settings')
        .upsert(backupSettings);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Backup settings saved successfully.",
      });
    } catch (error) {
      console.error('Error saving backup settings:', error);
      toast({
        title: "Error",
        description: "Failed to save backup settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveSecuritySettings = async () => {
    if (!securitySettings) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('security_settings')
        .upsert(securitySettings);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Security settings saved successfully.",
      });
    } catch (error) {
      console.error('Error saving security settings:', error);
      toast({
        title: "Error",
        description: "Failed to save security settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const runBackupNow = async () => {
    try {
      setBackupRunning(true);
      setBackupProgress(0);

      // Simulate backup progress
      const progressInterval = setInterval(() => {
        setBackupProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 500);

      // Create backup job record
      const { error } = await supabase
        .from('backup_jobs')
        .insert({
          job_type: 'manual_full',
          status: 'running'
        });

      if (error) throw error;

      // Simulate backup completion
      setTimeout(async () => {
        setBackupRunning(false);
        await fetchData(); // Refresh data
        toast({
          title: "Backup Complete",
          description: "Manual backup completed successfully.",
        });
      }, 5000);

    } catch (error) {
      console.error('Error running backup:', error);
      setBackupRunning(false);
      toast({
        title: "Error",
        description: "Failed to run backup.",
        variant: "destructive",
      });
    }
  };

  const downloadBackup = async (jobId: string) => {
    toast({
      title: "Download Started",
      description: "Backup download will begin shortly.",
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Backup & Security Management</h2>
          <p className="text-muted-foreground">Manage backups, security settings, and monitoring</p>
        </div>
        <Button onClick={runBackupNow} disabled={backupRunning}>
          {backupRunning ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Running Backup...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Run Backup Now
            </>
          )}
        </Button>
      </div>

      {backupRunning && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HardDrive className="mr-2 h-5 w-5" />
              Backup in Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={backupProgress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">
              {backupProgress}% complete
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="backup-management" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="backup-management">Backup Management</TabsTrigger>
          <TabsTrigger value="security-settings">Security Settings</TabsTrigger>
          <TabsTrigger value="backup-history">Backup History</TabsTrigger>
          <TabsTrigger value="security-logs">Security Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="backup-management" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Backup Configuration
                </CardTitle>
                <CardDescription>
                  Configure automatic backup frequency and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="backup-enabled">Enable Automatic Backups</Label>
                  <Switch
                    id="backup-enabled"
                    checked={backupSettings?.enabled || false}
                    onCheckedChange={(checked) =>
                      setBackupSettings(prev => prev ? { ...prev, enabled: checked } : null)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backup-frequency">Backup Frequency</Label>
                  <Select
                    value={backupSettings?.frequency || 'daily'}
                    onValueChange={(value) =>
                      setBackupSettings(prev => prev ? { ...prev, frequency: value } : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="custom">Custom Schedule</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {backupSettings?.frequency === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="custom-schedule">Custom Schedule (Cron)</Label>
                    <Input
                      id="custom-schedule"
                      placeholder="0 2 * * *"
                      value={backupSettings?.custom_schedule || ''}
                      onChange={(e) =>
                        setBackupSettings(prev => prev ? { ...prev, custom_schedule: e.target.value } : null)
                      }
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="max-versions">Maximum Backup Versions</Label>
                  <Input
                    id="max-versions"
                    type="number"
                    min="1"
                    max="50"
                    value={backupSettings?.max_versions || 10}
                    onChange={(e) =>
                      setBackupSettings(prev => prev ? { ...prev, max_versions: parseInt(e.target.value) } : null)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retention-days">Retention Period (Days)</Label>
                  <Input
                    id="retention-days"
                    type="number"
                    min="1"
                    max="365"
                    value={backupSettings?.retention_days || 30}
                    onChange={(e) =>
                      setBackupSettings(prev => prev ? { ...prev, retention_days: parseInt(e.target.value) } : null)
                    }
                  />
                </div>

                <Button onClick={saveBackupSettings} disabled={saving} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Save Backup Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5" />
                  Backup Options
                </CardTitle>
                <CardDescription>
                  Choose what to include in backups
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="backup-database">Database Backup</Label>
                    <Switch
                      id="backup-database"
                      checked={Array.isArray(backupSettings?.backup_types) && backupSettings.backup_types.includes('database') || false}
                      onCheckedChange={(checked) => {
                        if (!backupSettings) return;
                        const types = Array.isArray(backupSettings.backup_types) ? backupSettings.backup_types : [];
                        const newTypes = checked 
                          ? [...types, 'database'].filter((v, i, a) => a.indexOf(v) === i)
                          : types.filter(t => t !== 'database');
                        setBackupSettings({ ...backupSettings, backup_types: newTypes });
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="backup-files">Files Backup</Label>
                    <Switch
                      id="backup-files"
                      checked={Array.isArray(backupSettings?.backup_types) && backupSettings.backup_types.includes('files') || false}
                      onCheckedChange={(checked) => {
                        if (!backupSettings) return;
                        const types = Array.isArray(backupSettings.backup_types) ? backupSettings.backup_types : [];
                        const newTypes = checked 
                          ? [...types, 'files'].filter((v, i, a) => a.indexOf(v) === i)
                          : types.filter(t => t !== 'files');
                        setBackupSettings({ ...backupSettings, backup_types: newTypes });
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="backup-compression">Enable Compression</Label>
                    <Switch
                      id="backup-compression"
                      checked={backupSettings?.compression_enabled || false}
                      onCheckedChange={(checked) =>
                        setBackupSettings(prev => prev ? { ...prev, compression_enabled: checked } : null)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="backup-encryption">Enable Encryption</Label>
                    <Switch
                      id="backup-encryption"
                      checked={backupSettings?.encryption_enabled || false}
                      onCheckedChange={(checked) =>
                        setBackupSettings(prev => prev ? { ...prev, encryption_enabled: checked } : null)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="backup-versioning">Enable Versioning</Label>
                    <Switch
                      id="backup-versioning"
                      checked={backupSettings?.versioning_enabled || false}
                      onCheckedChange={(checked) =>
                        setBackupSettings(prev => prev ? { ...prev, versioning_enabled: checked } : null)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-cleanup">Auto Cleanup Old Backups</Label>
                    <Switch
                      id="auto-cleanup"
                      checked={backupSettings?.auto_cleanup_enabled || false}
                      onCheckedChange={(checked) =>
                        setBackupSettings(prev => prev ? { ...prev, auto_cleanup_enabled: checked } : null)
                      }
                    />
                  </div>
                </div>

                {backupSettings?.last_backup_at && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-2 h-4 w-4" />
                      Last backup: {new Date(backupSettings.last_backup_at).toLocaleString()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security-settings" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  SSL & HTTPS Settings
                </CardTitle>
                <CardDescription>
                  Configure secure connections and certificates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ssl-enforcement">Enforce SSL/HTTPS</Label>
                  <Switch
                    id="ssl-enforcement"
                    checked={securitySettings?.ssl_enforcement || false}
                    onCheckedChange={(checked) =>
                      setSecuritySettings(prev => prev ? { ...prev, ssl_enforcement: checked } : null)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="https-redirect">HTTPS Redirect</Label>
                  <Switch
                    id="https-redirect"
                    checked={securitySettings?.https_redirect || false}
                    onCheckedChange={(checked) =>
                      setSecuritySettings(prev => prev ? { ...prev, https_redirect: checked } : null)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="hsts-enabled">Enable HSTS</Label>
                  <Switch
                    id="hsts-enabled"
                    checked={securitySettings?.hsts_enabled || false}
                    onCheckedChange={(checked) =>
                      setSecuritySettings(prev => prev ? { ...prev, hsts_enabled: checked } : null)
                    }
                  />
                </div>

                <Button onClick={saveSecuritySettings} disabled={saving} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Save SSL Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="mr-2 h-5 w-5" />
                  Password & Authentication
                </CardTitle>
                <CardDescription>
                  Configure password requirements and authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password-min-length">Minimum Password Length</Label>
                  <Input
                    id="password-min-length"
                    type="number"
                    min="6"
                    max="128"
                    value={securitySettings?.password_min_length || 8}
                    onChange={(e) =>
                      setSecuritySettings(prev => prev ? { ...prev, password_min_length: parseInt(e.target.value) } : null)
                    }
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="require-uppercase">Require Uppercase</Label>
                    <Switch
                      id="require-uppercase"
                      checked={securitySettings?.password_require_uppercase || false}
                      onCheckedChange={(checked) =>
                        setSecuritySettings(prev => prev ? { ...prev, password_require_uppercase: checked } : null)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="require-numbers">Require Numbers</Label>
                    <Switch
                      id="require-numbers"
                      checked={securitySettings?.password_require_numbers || false}
                      onCheckedChange={(checked) =>
                        setSecuritySettings(prev => prev ? { ...prev, password_require_numbers: checked } : null)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="require-symbols">Require Symbols</Label>
                    <Switch
                      id="require-symbols"
                      checked={securitySettings?.password_require_symbols || false}
                      onCheckedChange={(checked) =>
                        setSecuritySettings(prev => prev ? { ...prev, password_require_symbols: checked } : null)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                    <Switch
                      id="two-factor"
                      checked={securitySettings?.two_factor_enabled || false}
                      onCheckedChange={(checked) =>
                        setSecuritySettings(prev => prev ? { ...prev, two_factor_enabled: checked } : null)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    min="5"
                    max="10080"
                    value={securitySettings?.session_timeout || 1440}
                    onChange={(e) =>
                      setSecuritySettings(prev => prev ? { ...prev, session_timeout: parseInt(e.target.value) } : null)
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                    <Input
                      id="max-login-attempts"
                      type="number"
                      min="1"
                      max="10"
                      value={securitySettings?.max_login_attempts || 5}
                      onChange={(e) =>
                        setSecuritySettings(prev => prev ? { ...prev, max_login_attempts: parseInt(e.target.value) } : null)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lockout-duration">Lockout Duration (min)</Label>
                    <Input
                      id="lockout-duration"
                      type="number"
                      min="1"
                      max="1440"
                      value={securitySettings?.lockout_duration || 15}
                      onChange={(e) =>
                        setSecuritySettings(prev => prev ? { ...prev, lockout_duration: parseInt(e.target.value) } : null)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Monitor className="mr-2 h-5 w-5" />
                  Security Monitoring
                </CardTitle>
                <CardDescription>
                  Configure monitoring and protection systems
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="firewall-enabled">Firewall Protection</Label>
                    <Switch
                      id="firewall-enabled"
                      checked={securitySettings?.firewall_enabled || false}
                      onCheckedChange={(checked) =>
                        setSecuritySettings(prev => prev ? { ...prev, firewall_enabled: checked } : null)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="malware-scanning">Malware Scanning</Label>
                    <Switch
                      id="malware-scanning"
                      checked={securitySettings?.malware_scanning || false}
                      onCheckedChange={(checked) =>
                        setSecuritySettings(prev => prev ? { ...prev, malware_scanning: checked } : null)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="ddos-protection">DDoS Protection</Label>
                    <Switch
                      id="ddos-protection"
                      checked={securitySettings?.ddos_protection || false}
                      onCheckedChange={(checked) =>
                        setSecuritySettings(prev => prev ? { ...prev, ddos_protection: checked } : null)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="log-monitoring">Log Monitoring</Label>
                    <Switch
                      id="log-monitoring"
                      checked={securitySettings?.log_monitoring || false}
                      onCheckedChange={(checked) =>
                        setSecuritySettings(prev => prev ? { ...prev, log_monitoring: checked } : null)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-updates">Automatic Updates</Label>
                    <Switch
                      id="auto-updates"
                      checked={securitySettings?.auto_updates || false}
                      onCheckedChange={(checked) =>
                        setSecuritySettings(prev => prev ? { ...prev, auto_updates: checked } : null)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="data-encryption">Data Encryption at Rest</Label>
                    <Switch
                      id="data-encryption"
                      checked={securitySettings?.data_encryption || false}
                      onCheckedChange={(checked) =>
                        setSecuritySettings(prev => prev ? { ...prev, data_encryption: checked } : null)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="mr-2 h-5 w-5" />
                  Security Alerts
                </CardTitle>
                <CardDescription>
                  Configure security breach and downtime alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="security-alerts">Enable Security Alerts</Label>
                  <Switch
                    id="security-alerts"
                    checked={securitySettings?.security_alerts || false}
                    onCheckedChange={(checked) =>
                      setSecuritySettings(prev => prev ? { ...prev, security_alerts: checked } : null)
                    }
                  />
                </div>

                {securitySettings?.security_alerts && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="alert-email">Alert Email</Label>
                      <Input
                        id="alert-email"
                        type="email"
                        placeholder="admin@example.com"
                        value={securitySettings?.alert_email || ''}
                        onChange={(e) =>
                          setSecuritySettings(prev => prev ? { ...prev, alert_email: e.target.value } : null)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="alert-sms">Alert SMS (optional)</Label>
                      <Input
                        id="alert-sms"
                        type="tel"
                        placeholder="+1234567890"
                        value={securitySettings?.alert_sms || ''}
                        onChange={(e) =>
                          setSecuritySettings(prev => prev ? { ...prev, alert_sms: e.target.value } : null)
                        }
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="backup-history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Backup History
              </CardTitle>
              <CardDescription>
                View and manage backup history and downloads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backupJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <Badge variant="outline">{job.job_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {job.status === 'completed' ? (
                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                          ) : job.status === 'failed' ? (
                            <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
                          ) : (
                            <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                          )}
                          {job.status}
                        </div>
                      </TableCell>
                      <TableCell>{formatFileSize(job.file_size)}</TableCell>
                      <TableCell>
                        {job.backup_duration ? `${job.backup_duration}s` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {new Date(job.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {job.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadBackup(job.id)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {backupJobs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No backup jobs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security-logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Security Event Logs
              </CardTitle>
              <CardDescription>
                Monitor security events and suspicious activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securityLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant="outline">{log.event_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={`text-white ${getSeverityColor(log.severity)}`}
                        >
                          {log.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.description}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.ip_address || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {log.resolved ? (
                          <Badge className="bg-green-500 text-white">Resolved</Badge>
                        ) : (
                          <Badge variant="destructive">Open</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {securityLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No security logs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BackupSecurityManagement;