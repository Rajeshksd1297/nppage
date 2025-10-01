import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, Eye } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeploymentTabProps {
  settings: any;
  deployments: any[];
  deploymentsLoading: boolean;
}

export const DeploymentTab = ({ settings, deployments, deploymentsLoading }: DeploymentTabProps) => {
  const [deploymentName, setDeploymentName] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const queryClient = useQueryClient();

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
    onSuccess: () => {
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
    <div className="space-y-6">
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
              <h4 className="font-medium text-sm">Deployment Target</h4>
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

          <Button
            onClick={handleDeploy}
            disabled={isDeploying || !settings || !deploymentName.trim()}
            className="w-full"
          >
            {isDeploying ? 'Deploying...' : 'Deploy to GoDaddy'}
          </Button>
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
    </div>
  );
};
