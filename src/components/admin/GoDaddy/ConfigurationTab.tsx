import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Settings, AlertCircle, Server } from 'lucide-react';
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

      {/* SOP Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Standard Operating Procedure (SOP)
          </CardTitle>
          <CardDescription>
            Follow these steps to deploy your application to GoDaddy shared hosting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                1
              </div>
              <div>
                <h4 className="font-medium">Configure FTP Settings</h4>
                <p className="text-sm text-muted-foreground">
                  Add your GoDaddy FTP credentials (host, username, password, port) in the settings page
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                2
              </div>
              <div>
                <h4 className="font-medium">Build Application</h4>
                <p className="text-sm text-muted-foreground">
                  The system will build your application for production with optimized assets
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                3
              </div>
              <div>
                <h4 className="font-medium">Upload via FTP</h4>
                <p className="text-sm text-muted-foreground">
                  Files are uploaded to your specified deployment path (default: /public_html)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                4
              </div>
              <div>
                <h4 className="font-medium">Configure .htaccess</h4>
                <p className="text-sm text-muted-foreground">
                  Automatically creates .htaccess file for SPA routing support
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                5
              </div>
              <div>
                <h4 className="font-medium">Verify Deployment</h4>
                <p className="text-sm text-muted-foreground">
                  Test your application at your domain and verify all functionality
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requirements & Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Requirements & Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Requirements:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>GoDaddy shared hosting account with FTP access</li>
              <li>FTP credentials (host, username, password)</li>
              <li>Domain configured and pointing to your hosting</li>
              <li>Sufficient disk space for application files</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Tips:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Test deployments on a subdomain first</li>
              <li>Ensure SSL/HTTPS is enabled in your GoDaddy cPanel</li>
              <li>The .htaccess file enables client-side routing</li>
              <li>Keep backup of FTP credentials secure</li>
              <li>Monitor deployment logs for any errors</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Troubleshooting:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>If deployment fails, check FTP credentials</li>
              <li>Verify deployment path exists on server</li>
              <li>Ensure proper file permissions (644 for files, 755 for directories)</li>
              <li>Check if domain DNS is properly configured</li>
              <li>Contact GoDaddy support for hosting-specific issues</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
