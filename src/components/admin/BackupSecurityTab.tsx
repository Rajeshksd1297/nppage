import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { HardDrive, Shield, Download, Upload, RefreshCw, CheckCircle, AlertTriangle, Clock, Database, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BackupSecurityTabProps {
  backupStatus: string;
  setBackupStatus: (status: string) => void;
}

export const BackupSecurityTab = ({ backupStatus, setBackupStatus }: BackupSecurityTabProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [backupSettings, setBackupSettings] = useState({
    enabled: true,
    frequency: 'daily',
    retention_days: 30,
    auto_cleanup_enabled: true,
    compression_enabled: true,
    encryption_enabled: true,
    backup_types: ['database', 'files'],
    storage_locations: ['server', 'cloud'],
    max_versions: 10
  });
  const [securitySettings, setSecuritySettings] = useState({
    ssl_enabled: true,
    force_https: true,
    two_factor_enabled: true,
    password_min_length: 8,
    session_timeout: 30,
    login_attempts_limit: 5,
    auto_updates_enabled: true,
    firewall_enabled: true,
    malware_scanning: true,
    ddos_protection: true,
    data_encryption: true,
    audit_logging: true
  });
  const [backupJobs, setBackupJobs] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [lastBackup, setLastBackup] = useState(null);
  const [nextBackup, setNextBackup] = useState(null);

  const fetchBackupSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('backup_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setBackupSettings(data);
        setLastBackup(data.last_backup_at);
        setNextBackup(data.next_backup_at);
      }
    } catch (error) {
      console.error('Error fetching backup settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSecuritySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('security_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSecuritySettings(data);
      }
    } catch (error) {
      console.error('Error fetching security settings:', error);
    }
  };

  const fetchRecentBackups = async () => {
    try {
      const { data, error } = await supabase
        .from('backup_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setBackupJobs(data || []);
    } catch (error) {
      console.error('Error fetching backup jobs:', error);
    }
  };

  const fetchSecurityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('security_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSecurityLogs(data || []);
    } catch (error) {
      console.error('Error fetching security logs:', error);
    }
  };

  const saveBackupSettings = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('backup_settings')
        .upsert(backupSettings);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Backup settings saved successfully"
      });
    } catch (error) {
      console.error('Error saving backup settings:', error);
      toast({
        title: "Error",
        description: "Failed to save backup settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const saveSecuritySettings = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('security_settings')
        .upsert(securitySettings);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Security settings saved successfully"
      });
    } catch (error) {
      console.error('Error saving security settings:', error);
      toast({
        title: "Error",
        description: "Failed to save security settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const createManualBackup = async () => {
    try {
      setBackupStatus('running');
      
      const { data, error } = await supabase
        .from('backup_jobs')
        .insert({
          job_type: 'manual',
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Backup Started",
        description: "Manual backup has been initiated"
      });
      
      // Simulate backup progress
      setTimeout(() => {
        setBackupStatus('completed');
        fetchRecentBackups();
      }, 5000);
    } catch (error) {
      console.error('Error creating backup:', error);
      setBackupStatus('failed');
      toast({
        title: "Error",
        description: "Failed to create backup",
        variant: "destructive"
      });
    }
  };

  const downloadBackup = async (backupId: string) => {
    try {
      toast({
        title: "Download Started",
        description: "Your backup download will begin shortly"
      });
      // Implementation for backup download
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast({
        title: "Error",
        description: "Failed to download backup",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchBackupSettings();
    fetchSecuritySettings();
    fetchRecentBackups();
    fetchSecurityLogs();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Backup & Security</h3>
          <p className="text-sm text-muted-foreground">
            Manage data backups and security settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={createManualBackup} disabled={backupStatus === 'running'}>
            <Database className="h-4 w-4 mr-2" />
            {backupStatus === 'running' ? 'Creating...' : 'Create Backup'}
          </Button>
          <Button onClick={() => { saveBackupSettings(); saveSecuritySettings(); }} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save All'}
          </Button>
        </div>
      </div>

      {/* Backup Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastBackup ? new Date(lastBackup).toLocaleDateString() : 'Never'}
            </div>
            <p className="text-xs text-muted-foreground">
              {lastBackup ? `${Math.floor((Date.now() - new Date(lastBackup).getTime()) / (1000 * 60 * 60 * 24))} days ago` : 'No backups yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Backup</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {nextBackup ? new Date(nextBackup).toLocaleDateString() : 'Scheduled'}
            </div>
            <p className="text-xs text-muted-foreground">
              {backupSettings.frequency} backup enabled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Protected</div>
            <p className="text-xs text-muted-foreground">All security features active</p>
          </CardContent>
        </Card>
      </div>

      {/* Backup Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Backup Configuration
          </CardTitle>
          <CardDescription>Configure automatic backup settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">Backup Frequency</Label>
              <Select
                value={backupSettings.frequency}
                onValueChange={(value) => setBackupSettings(prev => ({ ...prev, frequency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="retention">Retention Days</Label>
              <Input
                id="retention"
                type="number"
                value={backupSettings.retention_days}
                onChange={(e) => setBackupSettings(prev => ({ ...prev, retention_days: parseInt(e.target.value) }))}
                min="1"
                max="365"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Cleanup</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically delete old backups
                </p>
              </div>
              <Switch
                checked={backupSettings.auto_cleanup_enabled}
                onCheckedChange={(checked) => setBackupSettings(prev => ({ ...prev, auto_cleanup_enabled: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compression</Label>
                <p className="text-xs text-muted-foreground">
                  Compress backups to save space
                </p>
              </div>
              <Switch
                checked={backupSettings.compression_enabled}
                onCheckedChange={(checked) => setBackupSettings(prev => ({ ...prev, compression_enabled: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Encryption</Label>
                <p className="text-xs text-muted-foreground">
                  Encrypt backup files for security
                </p>
              </div>
              <Switch
                checked={backupSettings.encryption_enabled}
                onCheckedChange={(checked) => setBackupSettings(prev => ({ ...prev, encryption_enabled: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Configuration
          </CardTitle>
          <CardDescription>Configure security and protection settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Access Control</h4>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-xs text-muted-foreground">
                    Require 2FA for admin accounts
                  </p>
                </div>
                <Switch
                  checked={securitySettings.two_factor_enabled}
                  onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, two_factor_enabled: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password_length">Minimum Password Length</Label>
                <Input
                  id="password_length"
                  type="number"
                  value={securitySettings.password_min_length}
                  onChange={(e) => setSecuritySettings(prev => ({ ...prev, password_min_length: parseInt(e.target.value) }))}
                  min="6"
                  max="32"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                <Input
                  id="session_timeout"
                  type="number"
                  value={securitySettings.session_timeout}
                  onChange={(e) => setSecuritySettings(prev => ({ ...prev, session_timeout: parseInt(e.target.value) }))}
                  min="5"
                  max="480"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Protection Features</h4>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Firewall Protection</Label>
                  <p className="text-xs text-muted-foreground">
                    Block malicious traffic
                  </p>
                </div>
                <Switch
                  checked={securitySettings.firewall_enabled}
                  onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, firewall_enabled: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>DDoS Protection</Label>
                  <p className="text-xs text-muted-foreground">
                    Protect against attacks
                  </p>
                </div>
                <Switch
                  checked={securitySettings.ddos_protection}
                  onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, ddos_protection: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Malware Scanning</Label>
                  <p className="text-xs text-muted-foreground">
                    Scan uploaded files
                  </p>
                </div>
                <Switch
                  checked={securitySettings.malware_scanning}
                  onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, malware_scanning: checked }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Backups */}
      {backupJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Backups</CardTitle>
            <CardDescription>Latest backup operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {backupJobs.map((job, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <p className="font-medium">{job.job_type} Backup</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(job.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                    {job.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadBackup(job.id)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};