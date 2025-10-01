import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Settings, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ConfigurationTabProps {
  settings: any;
  settingsLoading: boolean;
}

export const ConfigurationTab = ({ settings, settingsLoading }: ConfigurationTabProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Configuration Alert */}
      {!settings && !settingsLoading && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Required</AlertTitle>
          <AlertDescription>
            You need to configure your GoDaddy FTP settings before deploying.
            <Button variant="link" className="p-0 h-auto ml-2" onClick={() => navigate('/admin/godaddy-settings')}>
              Configure Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Current Configuration */}
      {settings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Current Configuration
            </CardTitle>
            <CardDescription>
              Your active GoDaddy FTP settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">FTP Host</p>
                <p className="font-mono text-sm font-medium">{settings.ftp_host}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">FTP Port</p>
                <p className="font-mono text-sm font-medium">{settings.ftp_port}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="font-mono text-sm font-medium">{settings.ftp_username}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Deployment Path</p>
                <p className="font-mono text-sm font-medium">{settings.deployment_path}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Domain</p>
                <p className="font-mono text-sm font-medium">{settings.domain}</p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => navigate('/admin/godaddy-settings')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Edit Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
