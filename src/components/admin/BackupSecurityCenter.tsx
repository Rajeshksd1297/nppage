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
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, Database, Download, Play, RotateCcw, Calendar, 
  Clock, HardDrive, Cloud, Lock, AlertTriangle, CheckCircle,
  Activity, Eye, Settings, RefreshCw, Zap, Server, Globe, Key,
  FileText, Users, Wifi, Monitor, Bell, Mail, Smartphone, Upload
} from 'lucide-react';

interface BackupSettings {
  id?: string;
  frequency: 'daily' | 'weekly' | 'custom';
  custom_schedule: string;
  enabled: boolean;
  backup_database: boolean;
  backup_files: boolean;
  storage_locations: string[];
  versioning_enabled: boolean;
  max_versions: number;
  compression_enabled: boolean;
  encryption_enabled: boolean;
  retention_days: number;
  auto_cleanup_enabled: boolean;
  last_backup_at?: string;
  next_backup_at?: string;
}

interface SecuritySettings {
  id?: string;
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
  status: 'pending' | 'running' | 'completed' | 'failed';
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
  severity: 'low' | 'medium' | 'high' | 'critical';
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

export const BackupSecurityCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [backupSettings, setBackupSettings] = useState<BackupSettings>({
    frequency: 'daily',
    custom_schedule: '',
    enabled: true,
    backup_database: true,
    backup_files: true,
    storage_locations: ['server', 'cloud'],
    versioning_enabled: true,
    max_versions: 10,
    compression_enabled: true,
    encryption_enabled: true,
    retention_days: 30,
    auto_cleanup_enabled: true,
  });
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    ssl_enforcement: true,
    https_redirect: true,
    hsts_enabled: true,
    password_min_length: 8,
    password_require_uppercase: true,
    password_require_lowercase: true,
    password_require_numbers: true,
    password_require_symbols: true,
    two_factor_enabled: false,
    session_timeout: 3600,
    max_login_attempts: 5,
    lockout_duration: 900,
    firewall_enabled: true,
    malware_scanning: true,
    auto_updates: true,
    ddos_protection: true,
    log_monitoring: true,
    data_encryption: true,
    security_alerts: true,
    alert_email: '',
    alert_sms: '',
  });
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [stats, setStats] = useState({
    totalBackups: 0,
    successfulBackups: 0,
    failedBackups: 0,
    totalStorageUsed: 0,
    securityScore: 0,
    activeThreats: 0,
    criticalEvents: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadBackupSettings(),
        loadSecuritySettings(),
        loadBackupJobs(),
        loadSecurityLogs(),
        calculateStats(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error loading data",
        description: "Failed to load backup and security data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBackupSettings = async () => {
    const { data } = await (supabase as any)
      .from('backup_settings')
      .select('*')
      .maybeSingle();
    
    if (data) {
      setBackupSettings({
        ...backupSettings,
        ...data,
        storage_locations: data.storage_locations || ['server', 'cloud'],
        backup_types: data.backup_types || ['database', 'files'],
      });
    }
  };

  const loadSecuritySettings = async () => {
    const { data } = await (supabase as any)
      .from('security_settings')
      .select('*')
      .maybeSingle();
    
    if (data) {
      setSecuritySettings({
        ...securitySettings,
        ...data,
      });
    }
  };

  const loadBackupJobs = async () => {
    const { data } = await (supabase as any)
      .from('backup_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    setBackupJobs(data || []);
  };

  const loadSecurityLogs = async () => {
    const { data } = await (supabase as any)
      .from('security_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    setSecurityLogs(data || []);
  };

  const calculateStats = async () => {
    const { data: jobs } = await (supabase as any)
      .from('backup_jobs')
      .select('*');
    
    const { data: logs } = await (supabase as any)
      .from('security_logs')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const successful = jobs?.filter((j: any) => j.status === 'completed').length || 0;
    const failed = jobs?.filter((j: any) => j.status === 'failed').length || 0;
    const total = jobs?.length || 0;
    const storage = jobs?.reduce((sum: number, j: any) => sum + (j.file_size || 0), 0) || 0;
    
    const criticalEvents = logs?.filter((l: any) => l.severity === 'critical' && !l.resolved).length || 0;
    const activeThreats = logs?.filter((l: any) => l.severity === 'high' && !l.resolved).length || 0;
    
    // Calculate security score based on enabled features
    let securityScore = 0;
    const securityFeatures = [
      securitySettings.ssl_enforcement,
      securitySettings.https_redirect,
      securitySettings.two_factor_enabled,
      securitySettings.firewall_enabled,
      securitySettings.malware_scanning,
      securitySettings.auto_updates,
      securitySettings.ddos_protection,
      securitySettings.log_monitoring,
      securitySettings.data_encryption,
      securitySettings.security_alerts,
    ];
    securityScore = Math.round((securityFeatures.filter(Boolean).length / securityFeatures.length) * 100);

    setStats({
      totalBackups: total,
      successfulBackups: successful,
      failedBackups: failed,
      totalStorageUsed: storage,
      securityScore,
      activeThreats,
      criticalEvents,
    });
  };

  const saveBackupSettings = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('backup_settings')
        .upsert({
          ...backupSettings,
          updated_at: new Date().toISOString(),
        });

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
    } finally {
      setSaving(false);
    }
  };

  const saveSecuritySettings = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('security_settings')
        .upsert({
          ...securitySettings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Security settings have been updated successfully."
      });
      
      await calculateStats();
    } catch (error) {
      console.error('Error saving security settings:', error);
      toast({
        title: "Save failed",
        description: "Failed to save security settings.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 50MB.",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const uploadBackupFile = async () => {
    if (!selectedFile) return;

    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('action', 'upload');
      formData.append('file', selectedFile);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`https://kovlbxzqasqhigygfiyj.supabase.co/functions/v1/backup-manager`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      toast({
        title: "Backup uploaded",
        description: `Backup file "${selectedFile.name}" uploaded successfully.`
      });

      setSelectedFile(null);
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      await loadBackupJobs();
      await calculateStats();
    } catch (error) {
      console.error('Error uploading backup:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload backup file.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const createBackup = async (type: 'database' | 'files' | 'full' = 'full') => {
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('backup-manager', {
        body: { 
          action: 'create',
          backupType: type,
          settings: backupSettings
        }
      });

      if (error) throw error;

      toast({
        title: "Backup started",
        description: `${type} backup has been initiated successfully.`
      });

      await loadBackupJobs();
      await calculateStats();
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

  const testRestore = async (backupId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('backup-manager', {
        body: { 
          action: 'test',
          backupId
        }
      });

      if (error) throw error;

      toast({
        title: data.valid ? "Test passed" : "Test failed",
        description: data.valid ? "Backup integrity verified." : "Backup validation failed.",
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

  const downloadBackup = async (backupId: string) => {
    try {
      // Find the backup job details
      const backupJob = backupJobs.find(job => job.id === backupId);
      if (!backupJob) {
        throw new Error('Backup not found');
      }

      const { data, error } = await supabase.functions.invoke('backup-manager', {
        body: { 
          action: 'download',
          backupId
        }
      });

      if (error) throw error;

      // Create a blob from the response data
      let blob;
      let filename = data.filename || `backup-${backupJob.job_type}-${new Date().toISOString().split('T')[0]}.txt`;
      
      if (data.content) {
        // Handle text content (comprehensive backup file)
        const contentType = data.contentType || 'text/plain';
        blob = new Blob([data.content], { type: contentType });
        
        if (data.filename) {
          filename = data.filename;
        }
      } else {
        // Fallback: create a backup info file
        const backupInfo = {
          id: backupJob.id,
          type: backupJob.job_type,
          created_at: backupJob.created_at,
          file_size: backupJob.file_size,
          file_path: backupJob.file_path,
          checksum: backupJob.checksum,
          metadata: backupJob.metadata,
          download_info: 'This is a backup information file. The actual backup content was not available.'
        };
        blob = new Blob([JSON.stringify(backupInfo, null, 2)], { type: 'application/json' });
        filename = `backup-info-${backupJob.id}.json`;
      }

      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download completed",
        description: `${data.backup_type === 'full' ? 'Full backup' : `${data.backup_type} backup`} "${filename}" downloaded successfully.`
      });
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast({
        title: "Download failed",
        description: "Failed to download backup file.",
        variant: "destructive"
      });
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
        description: "Security analysis has been completed."
      });

      await loadSecurityLogs();
      await calculateStats();
    } catch (error) {
      console.error('Error running security scan:', error);
      toast({
        title: "Scan failed",
        description: "Failed to run security scan.",
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
          resolved_at: new Date().toISOString(),
          resolved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', logId);

      if (error) throw error;

      await loadSecurityLogs();
      await calculateStats();
      
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
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'running': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading backup and security data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            Backup & Security Center
          </h2>
          <p className="text-muted-foreground mt-2">
            Comprehensive backup management and security monitoring for your website
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => createBackup('full')} disabled={creating} className="gap-2">
            <Database className="h-4 w-4" />
            {creating ? 'Creating...' : 'Full Backup'}
          </Button>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Backups</p>
                <p className="text-2xl font-bold">{stats.totalBackups}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.successfulBackups} successful, {stats.failedBackups} failed
                </p>
              </div>
              <Database className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security Score</p>
                <p className="text-2xl font-bold text-green-600">{stats.securityScore}%</p>
                <Progress value={stats.securityScore} className="mt-2" />
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Storage Used</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatFileSize(stats.totalStorageUsed)}
                </p>
              </div>
              <HardDrive className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Threats</p>
                <p className="text-2xl font-bold text-orange-600">{stats.activeThreats}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.criticalEvents} critical events
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="backup" className="gap-2">
            <Database className="h-4 w-4" />
            Backup
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="gap-2">
            <Eye className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <FileText className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Recent Backups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {backupJobs.slice(0, 5).map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{job.job_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(job.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={`${getStatusColor(job.status)} text-white`}>
                        {job.status}
                      </Badge>
                    </div>
                  ))}
                  {backupJobs.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No backups yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Security Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {securityLogs.filter(log => !log.resolved && log.severity === 'high').slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{log.event_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={`${getSeverityColor(log.severity)} text-white`}>
                        {log.severity}
                      </Badge>
                    </div>
                  ))}
                  {securityLogs.filter(log => !log.resolved && log.severity === 'high').length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No active alerts</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Backup Settings</CardTitle>
                <CardDescription>Configure automated backup schedule and options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Backup Frequency</Label>
                  <Select value={backupSettings.frequency} onValueChange={(value: any) => 
                    setBackupSettings(prev => ({...prev, frequency: value}))}>
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

                {backupSettings.frequency === 'custom' && (
                  <div className="space-y-2">
                    <Label>Custom Schedule (Cron)</Label>
                    <Input 
                      value={backupSettings.custom_schedule}
                      onChange={(e) => setBackupSettings(prev => ({...prev, custom_schedule: e.target.value}))}
                      placeholder="0 2 * * *"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label>Enable Automated Backups</Label>
                  <Switch 
                    checked={backupSettings.enabled}
                    onCheckedChange={(checked) => setBackupSettings(prev => ({...prev, enabled: checked}))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Backup Database</Label>
                  <Switch 
                    checked={backupSettings.backup_database}
                    onCheckedChange={(checked) => setBackupSettings(prev => ({...prev, backup_database: checked}))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Backup Files</Label>
                  <Switch 
                    checked={backupSettings.backup_files}
                    onCheckedChange={(checked) => setBackupSettings(prev => ({...prev, backup_files: checked}))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Enable Versioning</Label>
                  <Switch 
                    checked={backupSettings.versioning_enabled}
                    onCheckedChange={(checked) => setBackupSettings(prev => ({...prev, versioning_enabled: checked}))}
                  />
                </div>

                {backupSettings.versioning_enabled && (
                  <div className="space-y-2">
                    <Label>Maximum Versions</Label>
                    <Input 
                      type="number"
                      value={backupSettings.max_versions}
                      onChange={(e) => setBackupSettings(prev => ({...prev, max_versions: parseInt(e.target.value)}))}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label>Enable Compression</Label>
                  <Switch 
                    checked={backupSettings.compression_enabled}
                    onCheckedChange={(checked) => setBackupSettings(prev => ({...prev, compression_enabled: checked}))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Enable Encryption</Label>
                  <Switch 
                    checked={backupSettings.encryption_enabled}
                    onCheckedChange={(checked) => setBackupSettings(prev => ({...prev, encryption_enabled: checked}))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Retention Period (Days)</Label>
                  <Input 
                    type="number"
                    value={backupSettings.retention_days}
                    onChange={(e) => setBackupSettings(prev => ({...prev, retention_days: parseInt(e.target.value)}))}
                  />
                </div>

                <Button onClick={saveBackupSettings} disabled={saving} className="w-full">
                  {saving ? 'Saving...' : 'Save Backup Settings'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Manual Backup</CardTitle>
                <CardDescription>Create instant backups of your data or upload backup files</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <Button 
                    onClick={() => createBackup('database')} 
                    disabled={creating}
                    variant="outline"
                    className="gap-2 h-12"
                  >
                    <Database className="h-4 w-4" />
                    Database Only
                  </Button>
                  <Button 
                    onClick={() => createBackup('files')} 
                    disabled={creating}
                    variant="outline"
                    className="gap-2 h-12"
                  >
                    <FileText className="h-4 w-4" />
                    Files Only
                  </Button>
                  <Button 
                    onClick={() => createBackup('full')} 
                    disabled={creating}
                    className="gap-2 h-12"
                  >
                    <HardDrive className="h-4 w-4" />
                    Full Backup (Database + Files)
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <Label className="text-sm font-medium mb-2 block">Upload Backup File</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept=".sql,.txt,.json,.zip"
                      onChange={handleFileUpload}
                      className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-primary file:text-primary-foreground"
                    />
                    <Button 
                      onClick={uploadBackupFile}
                      disabled={!selectedFile || creating}
                      variant="outline"
                      size="sm"
                      className="gap-1"
                    >
                      <Upload className="h-3 w-3" />
                      Upload
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supported formats: .sql, .txt, .json, .zip (Max 50MB)
                  </p>
                </div>

                {creating && (
                  <div className="flex items-center justify-center py-4">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    {selectedFile ? 'Uploading backup...' : 'Creating backup...'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Backup History</CardTitle>
              <CardDescription>Manage and restore from previous backups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {backupJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{job.job_type}</p>
                        <Badge className={`${getStatusColor(job.status)} text-white`}>
                          {job.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(job.created_at).toLocaleString()}
                        {job.file_size && ` • ${formatFileSize(job.file_size)}`}
                        {job.backup_duration && ` • ${job.backup_duration}s`}
                      </p>
                      {job.error_message && (
                        <p className="text-sm text-red-600">{job.error_message}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {job.status === 'completed' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => testRestore(job.id)}
                            className="gap-1"
                          >
                            <Play className="h-3 w-3" />
                            Test
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadBackup(job.id)}
                            className="gap-1"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => restoreBackup(job.id)}
                            className="gap-1"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Restore
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {backupJobs.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No backups found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  SSL/HTTPS Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>SSL Enforcement</Label>
                  <Switch 
                    checked={securitySettings.ssl_enforcement}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({...prev, ssl_enforcement: checked}))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>HTTPS Redirect</Label>
                  <Switch 
                    checked={securitySettings.https_redirect}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({...prev, https_redirect: checked}))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>HSTS Enabled</Label>
                  <Switch 
                    checked={securitySettings.hsts_enabled}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({...prev, hsts_enabled: checked}))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Password Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Minimum Length</Label>
                  <Input 
                    type="number"
                    value={securitySettings.password_min_length}
                    onChange={(e) => setSecuritySettings(prev => ({...prev, password_min_length: parseInt(e.target.value)}))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Require Uppercase</Label>
                  <Switch 
                    checked={securitySettings.password_require_uppercase}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({...prev, password_require_uppercase: checked}))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Require Lowercase</Label>
                  <Switch 
                    checked={securitySettings.password_require_lowercase}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({...prev, password_require_lowercase: checked}))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Require Numbers</Label>
                  <Switch 
                    checked={securitySettings.password_require_numbers}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({...prev, password_require_numbers: checked}))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Require Symbols</Label>
                  <Switch 
                    checked={securitySettings.password_require_symbols}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({...prev, password_require_symbols: checked}))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Two-Factor Authentication</Label>
                  <Switch 
                    checked={securitySettings.two_factor_enabled}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({...prev, two_factor_enabled: checked}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Session Timeout (seconds)</Label>
                  <Input 
                    type="number"
                    value={securitySettings.session_timeout}
                    onChange={(e) => setSecuritySettings(prev => ({...prev, session_timeout: parseInt(e.target.value)}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Login Attempts</Label>
                  <Input 
                    type="number"
                    value={securitySettings.max_login_attempts}
                    onChange={(e) => setSecuritySettings(prev => ({...prev, max_login_attempts: parseInt(e.target.value)}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lockout Duration (seconds)</Label>
                  <Input 
                    type="number"
                    value={securitySettings.lockout_duration}
                    onChange={(e) => setSecuritySettings(prev => ({...prev, lockout_duration: parseInt(e.target.value)}))}
                  />
                </div>
              </CardContent>
            </Card>

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
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({...prev, firewall_enabled: checked}))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Malware Scanning</Label>
                  <Switch 
                    checked={securitySettings.malware_scanning}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({...prev, malware_scanning: checked}))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Automatic Updates</Label>
                  <Switch 
                    checked={securitySettings.auto_updates}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({...prev, auto_updates: checked}))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>DDoS Protection</Label>
                  <Switch 
                    checked={securitySettings.ddos_protection}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({...prev, ddos_protection: checked}))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Log Monitoring</Label>
                  <Switch 
                    checked={securitySettings.log_monitoring}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({...prev, log_monitoring: checked}))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Data Encryption</Label>
                  <Switch 
                    checked={securitySettings.data_encryption}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({...prev, data_encryption: checked}))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Security Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Security Alerts</Label>
                  <Switch 
                    checked={securitySettings.security_alerts}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({...prev, security_alerts: checked}))}
                  />
                </div>
                {securitySettings.security_alerts && (
                  <>
                    <div className="space-y-2">
                      <Label>Alert Email</Label>
                      <Input 
                        type="email"
                        value={securitySettings.alert_email}
                        onChange={(e) => setSecuritySettings(prev => ({...prev, alert_email: e.target.value}))}
                        placeholder="admin@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Alert SMS (Optional)</Label>
                      <Input 
                        type="tel"
                        value={securitySettings.alert_sms}
                        onChange={(e) => setSecuritySettings(prev => ({...prev, alert_sms: e.target.value}))}
                        placeholder="+1234567890"
                      />
                    </div>
                  </>
                )}
                
                <Button onClick={saveSecuritySettings} disabled={saving} className="w-full">
                  {saving ? 'Saving...' : 'Save Security Settings'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Security Monitoring</h3>
              <p className="text-muted-foreground">Real-time security analysis and threat detection</p>
            </div>
            <Button onClick={runSecurityScan} className="gap-2">
              <Activity className="h-4 w-4" />
              Run Security Scan
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Security Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{stats.securityScore}%</span>
                    </div>
                  </div>
                </div>
                <Progress value={stats.securityScore} className="mt-4" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Active Threats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-orange-600">{stats.activeThreats}</p>
                    <p className="text-sm text-muted-foreground">Unresolved</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Critical Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600">{stats.criticalEvents}</p>
                    <p className="text-sm text-muted-foreground">Last 24h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Security Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {!securitySettings.two_factor_enabled && (
                  <div className="flex items-start gap-3 p-3 border border-orange-200 rounded-lg bg-orange-50">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Enable Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to user accounts</p>
                    </div>
                  </div>
                )}
                {!securitySettings.ssl_enforcement && (
                  <div className="flex items-start gap-3 p-3 border border-red-200 rounded-lg bg-red-50">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Enable SSL Enforcement</p>
                      <p className="text-sm text-muted-foreground">Encrypt all connections to your website</p>
                    </div>
                  </div>
                )}
                {securitySettings.password_min_length < 8 && (
                  <div className="flex items-start gap-3 p-3 border border-orange-200 rounded-lg bg-orange-50">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Increase Minimum Password Length</p>
                      <p className="text-sm text-muted-foreground">Set minimum password length to at least 8 characters</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Activity Logs</CardTitle>
              <CardDescription>Monitor security events and threats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{log.event_type}</p>
                        <Badge className={`${getSeverityColor(log.severity)} text-white`}>
                          {log.severity}
                        </Badge>
                        {log.resolved && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Resolved
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{log.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                        {log.ip_address && ` • IP: ${log.ip_address}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!log.resolved && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => resolveSecurityLog(log.id)}
                          className="gap-1"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Resolve
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
                {securityLogs.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No security logs found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};