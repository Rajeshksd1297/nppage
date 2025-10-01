import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Server, Upload, Settings, Eye, Trash2, ArrowLeft, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const GoDaddyDeployment = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deploymentName, setDeploymentName] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);

  // Fetch GoDaddy settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
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
      return data;
    },
  });

  // Fetch deployment history
  const { data: deployments, isLoading: deploymentsLoading } = useQuery({
    queryKey: ['godaddy-deployments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('godaddy_deployments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Deploy mutation
  const deployMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `https://kovlbxzqasqhigygfiyj.supabase.co/functions/v1/godaddy-deploy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            deployment_name: deploymentName,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Deployment failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Deployment completed successfully!');
      queryClient.invalidateQueries({ queryKey: ['godaddy-deployments'] });
      setDeploymentName('');
    },
    onError: (error: Error) => {
      toast.error(`Deployment failed: ${error.message}`);
    },
  });

  const handleDeploy = async () => {
    if (!deploymentName.trim()) {
      toast.error('Please enter a deployment name');
      return;
    }

    if (!settings) {
      toast.error('Please configure GoDaddy settings first');
      return;
    }

    setIsDeploying(true);
    try {
      await deployMutation.mutateAsync();
    } finally {
      setIsDeploying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      success: 'default',
      failed: 'destructive',
      in_progress: 'secondary',
      pending: 'outline',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">GoDaddy Shared Hosting Deployment</h1>
            <p className="text-muted-foreground">Deploy your application to GoDaddy shared hosting via FTP</p>
          </div>
        </div>
      </div>

      <Separator />

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

      {/* Deployment Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            GoDaddy Deployment Process
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
                  Add your GoDaddy FTP credentials (host, username, password, port)
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

      {/* New Deployment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Start New Deployment
          </CardTitle>
          <CardDescription>
            Deploy your application to GoDaddy shared hosting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deployment-name">Deployment Name</Label>
            <Input
              id="deployment-name"
              placeholder="e.g., Production v1.0"
              value={deploymentName}
              onChange={(e) => setDeploymentName(e.target.value)}
              disabled={isDeploying || !settings}
            />
          </div>

          {settings && (
            <div className="p-4 rounded-lg bg-muted space-y-2">
              <h4 className="font-medium text-sm">Current Configuration</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">FTP Host:</span>
                  <span className="ml-2 font-mono">{settings.ftp_host}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Port:</span>
                  <span className="ml-2 font-mono">{settings.ftp_port}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Path:</span>
                  <span className="ml-2 font-mono">{settings.deployment_path}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Domain:</span>
                  <span className="ml-2 font-mono">{settings.domain}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleDeploy}
              disabled={isDeploying || !settings || !deploymentName.trim()}
              className="flex-1"
            >
              {isDeploying ? 'Deploying...' : 'Deploy to GoDaddy'}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/admin/godaddy-settings')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Deployment History */}
      <Card>
        <CardHeader>
          <CardTitle>Deployment History</CardTitle>
          <CardDescription>View past deployments and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {deploymentsLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading deployments...</p>
          ) : deployments && deployments.length > 0 ? (
            <div className="space-y-3">
              {deployments.map((deployment) => (
                <div key={deployment.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{deployment.deployment_name}</h4>
                      {getStatusBadge(deployment.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(deployment.created_at).toLocaleString()}
                    </p>
                    {deployment.domain && (
                      <p className="text-sm font-mono text-muted-foreground">
                        {deployment.domain}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {deployment.deployment_log && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const logWindow = window.open('', '_blank');
                          if (logWindow) {
                            logWindow.document.write(`<pre>${deployment.deployment_log}</pre>`);
                          }
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No deployments yet</p>
          )}
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

export default GoDaddyDeployment;
