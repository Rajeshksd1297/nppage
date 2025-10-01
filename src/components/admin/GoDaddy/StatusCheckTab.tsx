import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, RefreshCw, ExternalLink, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StatusCheckTabProps {
  settings: any;
  deployments: any[];
}

export const StatusCheckTab = ({ settings, deployments }: StatusCheckTabProps) => {
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [hostingStatus, setHostingStatus] = useState<any>(null);

  const latestSuccessfulDeployment = deployments?.find(d => d.status === 'success');

  const checkHostingStatus = async () => {
    if (!settings?.domain) {
      toast.error('No domain configured');
      return;
    }

    setCheckingStatus(true);
    try {
      const response = await fetch(`https://${settings.domain}`, {
        method: 'HEAD',
        mode: 'no-cors',
      });

      setHostingStatus({
        available: true,
        ssl: settings.domain.startsWith('https://'),
        lastChecked: new Date(),
      });
      
      toast.success('Website is accessible');
    } catch (error) {
      setHostingStatus({
        available: false,
        error: 'Unable to reach website',
        lastChecked: new Date(),
      });
      toast.error('Website is not accessible');
    } finally {
      setCheckingStatus(false);
    }
  };

  const { data: ftpTestResult, refetch: testFtpConnection } = useQuery({
    queryKey: ['godaddy-ftp-test'],
    queryFn: async () => {
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
            test_connection: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('FTP connection test failed');
      }

      return response.json();
    },
    enabled: false,
  });

  return (
    <div className="space-y-6">
      {/* Hosting Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Hosting Status
          </CardTitle>
          <CardDescription>
            Check your GoDaddy hosting and website availability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Domain</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-medium">{settings.domain}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://${settings.domain}`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">FTP Host</p>
                  <p className="font-mono text-sm font-medium">{settings.ftp_host}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={checkHostingStatus}
                  disabled={checkingStatus}
                  variant="outline"
                >
                  {checkingStatus ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Check Website
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => testFtpConnection()}
                  variant="outline"
                >
                  Test FTP Connection
                </Button>
              </div>

              {hostingStatus && (
                <div className={`p-4 rounded-lg ${hostingStatus.available ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
                  <div className="flex items-center gap-2">
                    {hostingStatus.available ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <p className="font-medium text-green-900 dark:text-green-100">Website is accessible</p>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <p className="font-medium text-red-900 dark:text-red-100">Website is not accessible</p>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Last checked: {hostingStatus.lastChecked.toLocaleString()}
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No configuration found. Please configure your settings first.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Deployment Status */}
      <Card>
        <CardHeader>
          <CardTitle>Latest Deployment Status</CardTitle>
          <CardDescription>Information about your most recent deployment</CardDescription>
        </CardHeader>
        <CardContent>
          {latestSuccessfulDeployment ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium">{latestSuccessfulDeployment.deployment_name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Deployed on {new Date(latestSuccessfulDeployment.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge variant="default">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Success
                </Badge>
              </div>

              {latestSuccessfulDeployment.domain && (
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground mb-1">Deployed to</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-medium">{latestSuccessfulDeployment.domain}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://${latestSuccessfulDeployment.domain}`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Clock className="h-5 w-5 mr-2" />
              <p>No successful deployments yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FTP Connection Status */}
      {ftpTestResult && (
        <Card>
          <CardHeader>
            <CardTitle>FTP Connection Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-lg ${ftpTestResult.success ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
              <div className="flex items-center gap-2">
                {ftpTestResult.success ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <p className="font-medium text-green-900 dark:text-green-100">FTP connection successful</p>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <p className="font-medium text-red-900 dark:text-red-100">FTP connection failed</p>
                  </>
                )}
              </div>
              {ftpTestResult.message && (
                <p className="text-sm text-muted-foreground mt-1">{ftpTestResult.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
