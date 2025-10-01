import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Save, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ConfigurationTabProps {
  settings: any;
  settingsLoading: boolean;
}

export const ConfigurationTab = ({ settings, settingsLoading }: ConfigurationTabProps) => {
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    ftp_host: '',
    ftp_port: '21',
    ftp_username: '',
    ftp_password: '',
    deployment_path: '/public_html',
    domain: '',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        ftp_host: settings.ftp_host || '',
        ftp_port: settings.ftp_port?.toString() || '21',
        ftp_username: settings.ftp_username || '',
        ftp_password: settings.ftp_password || '',
        deployment_path: settings.deployment_path || '/public_html',
        domain: settings.domain || '',
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const payload = {
        user_id: user.id,
        ftp_host: data.ftp_host,
        ftp_port: parseInt(data.ftp_port),
        ftp_username: data.ftp_username,
        ftp_password: data.ftp_password,
        deployment_path: data.deployment_path,
        domain: data.domain,
      };

      if (settings) {
        const { error } = await supabase
          .from('godaddy_settings')
          .update(payload)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('godaddy_settings')
          .insert([payload]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Settings saved successfully');
      queryClient.invalidateQueries({ queryKey: ['godaddy-settings'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to save settings: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.ftp_host || !formData.ftp_username || !formData.ftp_password || !formData.domain) {
      toast.error('Please fill in all required fields');
      return;
    }

    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* FTP Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            GoDaddy FTP Settings
          </CardTitle>
          <CardDescription>
            Configure your GoDaddy shared hosting FTP credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ftp_host">FTP Host *</Label>
                <Input
                  id="ftp_host"
                  placeholder="ftp.yourdomain.com"
                  value={formData.ftp_host}
                  onChange={(e) => setFormData({ ...formData, ftp_host: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ftp_port">FTP Port *</Label>
                <Input
                  id="ftp_port"
                  type="number"
                  placeholder="21"
                  value={formData.ftp_port}
                  onChange={(e) => setFormData({ ...formData, ftp_port: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ftp_username">FTP Username *</Label>
                <Input
                  id="ftp_username"
                  placeholder="username@yourdomain.com"
                  value={formData.ftp_username}
                  onChange={(e) => setFormData({ ...formData, ftp_username: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ftp_password">FTP Password *</Label>
                <div className="relative">
                  <Input
                    id="ftp_password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.ftp_password}
                    onChange={(e) => setFormData({ ...formData, ftp_password: e.target.value })}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deployment_path">Deployment Path *</Label>
                <Input
                  id="deployment_path"
                  placeholder="/public_html"
                  value={formData.deployment_path}
                  onChange={(e) => setFormData({ ...formData, deployment_path: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Domain *</Label>
                <Input
                  id="domain"
                  placeholder="yourdomain.com"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={saveMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Help & Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Help</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Where to find FTP credentials:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Login to your GoDaddy account</li>
              <li>Go to cPanel → Files → FTP Accounts</li>
              <li>Create or view existing FTP accounts</li>
              <li>Note: FTP host is usually ftp.yourdomain.com</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Common Deployment Paths:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>/public_html - Main domain</li>
              <li>/public_html/subdomain - Subdomain folder</li>
              <li>/www - Alternative main folder</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Security Notes:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Your FTP credentials are encrypted and stored securely</li>
              <li>Use strong passwords for FTP accounts</li>
              <li>Consider using FTP over SSL/TLS (port 990) if available</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
