import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, TestTube } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const GoDaddySettings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [ftpHost, setFtpHost] = useState('');
  const [ftpUsername, setFtpUsername] = useState('');
  const [ftpPassword, setFtpPassword] = useState('');
  const [ftpPort, setFtpPort] = useState('21');
  const [deploymentPath, setDeploymentPath] = useState('/public_html');
  const [domain, setDomain] = useState('');

  // Fetch existing settings
  const { isLoading } = useQuery({
    queryKey: ['godaddy-settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('godaddy_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setFtpHost(data.ftp_host);
        setFtpUsername(data.ftp_username);
        setFtpPort(data.ftp_port.toString());
        setDeploymentPath(data.deployment_path);
        setDomain(data.domain);
        // Don't set password for security
      }
      
      return data;
    },
  });

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const settingsData = {
        user_id: user.id,
        ftp_host: ftpHost,
        ftp_username: ftpUsername,
        ftp_password: ftpPassword,
        ftp_port: parseInt(ftpPort),
        deployment_path: deploymentPath,
        domain: domain,
      };

      const { data: existing } = await supabase
        .from('godaddy_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('godaddy_settings')
          .update(settingsData)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('godaddy_settings')
          .insert(settingsData);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Settings saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['godaddy-settings'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to save settings: ${error.message}`);
    },
  });

  const handleSave = async () => {
    if (!ftpHost || !ftpUsername || !domain) {
      toast.error('Please fill in all required fields');
      return;
    }

    await saveMutation.mutateAsync();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/godaddy-deployment')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">GoDaddy FTP Settings</h1>
            <p className="text-muted-foreground">Configure your GoDaddy hosting connection details</p>
          </div>
        </div>
      </div>

      <Separator />

      <Alert>
        <AlertDescription>
          Your FTP credentials are securely stored and encrypted. They are only used for deployment purposes.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>FTP Connection Details</CardTitle>
          <CardDescription>
            Enter your GoDaddy FTP credentials. You can find these in your GoDaddy cPanel under "FTP Accounts"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ftp-host">FTP Host *</Label>
              <Input
                id="ftp-host"
                placeholder="ftp.yourdomain.com"
                value={ftpHost}
                onChange={(e) => setFtpHost(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Usually: ftp.yourdomain.com or your server IP
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ftp-port">FTP Port</Label>
              <Input
                id="ftp-port"
                type="number"
                placeholder="21"
                value={ftpPort}
                onChange={(e) => setFtpPort(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Default: 21 (use 22 for SFTP if supported)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ftp-username">FTP Username *</Label>
              <Input
                id="ftp-username"
                placeholder="username@yourdomain.com"
                value={ftpUsername}
                onChange={(e) => setFtpUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ftp-password">FTP Password *</Label>
              <Input
                id="ftp-password"
                type="password"
                placeholder="Enter FTP password"
                value={ftpPassword}
                onChange={(e) => setFtpPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deployment-path">Deployment Path</Label>
              <Input
                id="deployment-path"
                placeholder="/public_html"
                value={deploymentPath}
                onChange={(e) => setDeploymentPath(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Path where files will be uploaded (default: /public_html)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domain *</Label>
              <Input
                id="domain"
                placeholder="yourdomain.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Your website domain (without https://)
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={isLoading || saveMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/admin/godaddy-deployment')}
            >
              Back to Deployment
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to Find Your FTP Credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-medium">1. Log in to GoDaddy</h4>
            <p className="text-sm text-muted-foreground">
              Go to godaddy.com and sign in to your account
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">2. Access cPanel</h4>
            <p className="text-sm text-muted-foreground">
              Navigate to your hosting account and click "Manage" then "cPanel"
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">3. Find FTP Accounts</h4>
            <p className="text-sm text-muted-foreground">
              In cPanel, look for "FTP Accounts" under the Files section
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">4. Create or View FTP Account</h4>
            <p className="text-sm text-muted-foreground">
              Create a new FTP account or view existing ones. The FTP server/host will be shown
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">5. Copy Credentials</h4>
            <p className="text-sm text-muted-foreground">
              Copy the FTP host, username, and use your chosen password. Port is usually 21.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Your FTP password is encrypted before storage</li>
            <li>Credentials are only accessible by administrators</li>
            <li>Use a strong, unique password for your FTP account</li>
            <li>Consider creating a dedicated FTP user with limited permissions</li>
            <li>Enable two-factor authentication on your GoDaddy account</li>
            <li>Regularly update your FTP password</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoDaddySettings;
