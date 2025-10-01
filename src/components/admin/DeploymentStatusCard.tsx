import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Server, ExternalLink, CheckCircle2, Clock, AlertTriangle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeploymentStatusCardProps {
  deployment: {
    id: string;
    deployment_name: string;
    ec2_instance_id: string;
    ec2_public_ip: string;
    region: string;
    last_deployed_at: string | null;
  };
}

interface SetupStatus {
  phase: string;
  status: string;
  message: string;
  timestamp: string;
  phases?: {
    security: { status: string; message: string };
    packages: { status: string; message: string };
    nginx: { status: string; message: string };
    application: { status: string; message: string };
    services: { status: string; message: string };
  };
}

export function DeploymentStatusCard({ deployment }: DeploymentStatusCardProps) {
  const [healthStatus, setHealthStatus] = useState<{
    http: 'checking' | 'online' | 'offline';
    responseTime: number | null;
    lastChecked: Date | null;
  }>({
    http: 'checking',
    responseTime: null,
    lastChecked: null,
  });

  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [awsStatus, setAwsStatus] = useState<any>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const checkAwsStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const { data, error } = await supabase.functions.invoke('aws-instance-status', {
        body: {
          instanceId: deployment.ec2_instance_id,
          region: deployment.region,
        },
      });

      if (error) throw error;

      if (data.success) {
        setAwsStatus(data);
        if (data.recommendations?.length > 0) {
          console.log('AWS Status Recommendations:', data.recommendations);
        }
      } else if (data.needsPermissions) {
        toast.error('IAM Permissions Required', {
          description: `Add these permissions: ${data.requiredPermissions?.join(', ')}`,
        });
      }
    } catch (error) {
      console.error('Failed to check AWS status:', error);
      toast.error('Failed to check instance status');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  useEffect(() => {
    // Check AWS status on mount and every 30 seconds
    checkAwsStatus();
    const interval = setInterval(checkAwsStatus, 30000);
    return () => clearInterval(interval);
  }, [deployment.ec2_instance_id, deployment.region]);

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await fetch(`http://${deployment.ec2_public_ip}/api/setup-status`, {
          mode: 'cors',
          cache: 'no-cache',
        });
        if (response.ok) {
          const status = await response.json();
          setSetupStatus(status);
        }
      } catch (error) {
        // Setup status not available yet - this is normal during initial deployment
        console.log('Setup status not yet available');
      }
    };

    // Check setup status more frequently initially
    checkSetupStatus();
    const interval = setInterval(checkSetupStatus, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [deployment.ec2_public_ip]);

  useEffect(() => {
    const checkHealth = async () => {
      const startTime = Date.now();
      
      // Try multiple endpoints to determine if the server is online
      const endpoints = [
        `/api/health`,  // Primary health check endpoint
        `/`,            // Fallback to root
        `/favicon.ico`  // Last resort
      ];
      
      let isOnline = false;
      let responseTime: number | null = null;

      for (const endpoint of endpoints) {
        try {
          const img = new Image();
          
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              img.src = ''; // Cancel the request
              reject(new Error('Timeout'));
            }, 10000); // 10 second timeout per endpoint

            img.onload = () => {
              clearTimeout(timeout);
              isOnline = true;
              responseTime = Date.now() - startTime;
              resolve();
            };

            img.onerror = () => {
              clearTimeout(timeout);
              // For API endpoints, an error might mean CORS but server is still up
              // Try to detect if it's a network error vs CORS error
              if (endpoint === '/api/health' || endpoint === '/') {
                // Assume online if we get any response (even CORS error means server responded)
                isOnline = true;
                responseTime = Date.now() - startTime;
              }
              reject(new Error('Load failed'));
            };

            img.src = `http://${deployment.ec2_public_ip}${endpoint}?t=${Date.now()}`;
          });

          // If we got here, one endpoint worked
          if (isOnline) break;
        } catch (error) {
          // Continue to next endpoint
          continue;
        }
      }

      setHealthStatus({
        http: isOnline ? 'online' : 'offline',
        responseTime,
        lastChecked: new Date(),
      });
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [deployment.ec2_public_ip]);

  const uptime = deployment.last_deployed_at 
    ? Math.floor((Date.now() - new Date(deployment.last_deployed_at).getTime()) / 1000 / 60)
    : 0;

  const getPhaseIcon = (status: string) => {
    if (status === 'completed') return '✓';
    if (status === 'running') return '⏳';
    if (status === 'failed') return '✗';
    return '○';
  };

  const getPhaseColor = (status: string) => {
    if (status === 'completed') return 'text-green-600 dark:text-green-400';
    if (status === 'running') return 'text-yellow-600 dark:text-yellow-400';
    if (status === 'failed') return 'text-red-600 dark:text-red-400';
    return 'text-gray-400';
  };

  const isSetupInProgress = setupStatus && setupStatus.phase !== 'complete' && setupStatus.status !== 'success';

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Server className="h-5 w-5" />
            <div>
              <CardTitle className="text-lg">{deployment.deployment_name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1">
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    healthStatus.http === 'online' ? 'bg-green-500' : 
                    healthStatus.http === 'offline' ? 'bg-red-500' : 
                    'bg-yellow-500 animate-pulse'
                  }`} />
                  {healthStatus.http === 'online' ? 'Online' : 
                   healthStatus.http === 'offline' ? 'Offline' : 
                   'Checking...'}
                </span>
                <span>•</span>
                <span>{deployment.ec2_public_ip}</span>
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => checkAwsStatus()}
            disabled={isCheckingStatus}
            className="mr-2"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isCheckingStatus ? 'animate-spin' : ''}`} />
            Check Status
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a
              href={`http://${deployment.ec2_public_ip}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Visit Site
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* System Status */}
        <div>
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Server className="h-4 w-4" />
            System Status
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* HTTP Status */}
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">HTTP Server</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  healthStatus.http === 'online' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                  healthStatus.http === 'offline' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' :
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                }`}>
                  {healthStatus.http === 'online' ? 'Running' : 
                   healthStatus.http === 'offline' ? 'Down' : 
                   'Checking'}
                </span>
              </div>
              <div className="text-2xl font-bold">
                {healthStatus.http === 'online' ? '✓' : 
                 healthStatus.http === 'offline' ? '✗' : 
                 '...'}
              </div>
              <p className="text-xs text-muted-foreground">
                {healthStatus.http === 'online' ? 'Server responding' : 
                 healthStatus.http === 'offline' ? 'Cannot connect - check Security Group' : 
                 'Testing connection'}
              </p>
            </div>

            {/* Response Time */}
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Response Time</span>
                {healthStatus.responseTime !== null && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    healthStatus.responseTime < 1000 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                    healthStatus.responseTime < 3000 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                  }`}>
                    {healthStatus.responseTime < 1000 ? 'Fast' : 
                     healthStatus.responseTime < 3000 ? 'Slow' : 
                     'Very Slow'}
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold">
                {healthStatus.responseTime !== null 
                  ? `${healthStatus.responseTime}ms` 
                  : '—'}
              </div>
              <p className="text-xs text-muted-foreground">
                {healthStatus.responseTime !== null 
                  ? 'Average latency' 
                  : 'Not measured yet'}
              </p>
            </div>

            {/* Uptime */}
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Uptime</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                  Active
                </span>
              </div>
              <div className="text-2xl font-bold">
                {uptime > 60 ? `${Math.floor(uptime / 60)}h` : `${uptime}m`}
              </div>
              <p className="text-xs text-muted-foreground">
                Since last deployment
              </p>
            </div>

            {/* Instance Status */}
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">EC2 Instance</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  awsStatus?.status?.state === 'running' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                }`}>
                  {awsStatus?.status?.state || 'Checking...'}
                </span>
              </div>
              <div className="text-2xl font-bold">
                {awsStatus?.status?.state === 'running' ? '✓' : '...'}
              </div>
              <p className="text-xs text-muted-foreground">
                {deployment.region}
              </p>
              {awsStatus?.status?.availabilityZone && (
                <p className="text-xs text-muted-foreground">
                  AZ: {awsStatus.status.availabilityZone}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Application Components */}
        <div>
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Application Components
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  healthStatus.http === 'online' ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <div>
                  <p className="font-medium">Web Server (Nginx)</p>
                  <p className="text-xs text-muted-foreground">HTTP server handling requests</p>
                </div>
              </div>
              <span className={`text-xs font-medium ${
                healthStatus.http === 'online' ? 'text-green-600' : 'text-gray-500'
              }`}>
                {healthStatus.http === 'online' ? 'Active' : 'Unknown'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  healthStatus.http === 'online' ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <div>
                  <p className="font-medium">Node.js Runtime</p>
                  <p className="text-xs text-muted-foreground">Application runtime environment</p>
                </div>
              </div>
              <span className={`text-xs font-medium ${
                healthStatus.http === 'online' ? 'text-green-600' : 'text-gray-500'
              }`}>
                {healthStatus.http === 'online' ? 'Running' : 'Unknown'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  healthStatus.http === 'online' ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <div>
                  <p className="font-medium">Database (Supabase)</p>
                  <p className="text-xs text-muted-foreground">PostgreSQL database connection</p>
                </div>
              </div>
              <span className={`text-xs font-medium ${
                healthStatus.http === 'online' ? 'text-green-600' : 'text-gray-500'
              }`}>
                {healthStatus.http === 'online' ? 'Connected' : 'Unknown'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  healthStatus.http === 'online' ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <div>
                  <p className="font-medium">Security (Fail2ban)</p>
                  <p className="text-xs text-muted-foreground">Intrusion prevention system</p>
                </div>
              </div>
              <span className={`text-xs font-medium ${
                healthStatus.http === 'online' ? 'text-green-600' : 'text-gray-500'
              }`}>
                {healthStatus.http === 'online' ? 'Protected' : 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* AWS Diagnostics */}
        {awsStatus?.status && (
          <div className="p-4 border rounded-lg space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Server className="h-4 w-4" />
              AWS Instance Diagnostics
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <span>System Status</span>
                <span className={awsStatus.status.diagnostics?.systemChecksOk ? 'text-green-600' : 'text-yellow-600'}>
                  {awsStatus.status.systemStatus || 'Initializing'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <span>Instance Status</span>
                <span className={awsStatus.status.diagnostics?.instanceChecksOk ? 'text-green-600' : 'text-yellow-600'}>
                  {awsStatus.status.instanceStatus || 'Initializing'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <span>Public IP</span>
                <span className={awsStatus.status.diagnostics?.hasPublicIp ? 'text-green-600' : 'text-red-600'}>
                  {awsStatus.status.diagnostics?.hasPublicIp ? 'Assigned' : 'Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <span>HTTP Access</span>
                <span className={awsStatus.httpAccessible ? 'text-green-600' : 'text-red-600'}>
                  {awsStatus.httpAccessible ? 'Open' : 'Blocked'}
                </span>
              </div>
            </div>
            
            {awsStatus.status.securityGroups && awsStatus.status.securityGroups.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium mb-2">Security Groups:</p>
                <div className="space-y-1">
                  {awsStatus.status.securityGroups.map((sg: any) => (
                    <div key={sg.id} className="text-xs p-2 bg-muted/30 rounded">
                      {sg.name} ({sg.id})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recommendations */}
        {awsStatus?.recommendations && awsStatus.recommendations.length > 0 && (
          <div className={`p-4 border rounded-lg ${
            awsStatus.httpAccessible 
              ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
              : 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800'
          }`}>
            <h4 className={`font-semibold mb-2 flex items-center gap-2 ${
              awsStatus.httpAccessible ? 'text-green-900 dark:text-green-100' : 'text-amber-900 dark:text-amber-100'
            }`}>
              {awsStatus.httpAccessible ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Status: Healthy
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  Diagnostics
                </>
              )}
            </h4>
            <ul className={`space-y-1 text-sm ${
              awsStatus.httpAccessible 
                ? 'text-green-800 dark:text-green-200'
                : 'text-amber-800 dark:text-amber-200'
            }`}>
              {awsStatus.recommendations.map((rec: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-0.5">{rec.startsWith('✓') ? '' : '•'}</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Status Message */}
        {isSetupInProgress && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
              <Clock className="h-5 w-5 animate-spin" />
              Application Setup In Progress
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
              Your EC2 instance is running, but the application setup (Nginx, Node.js, security tools) is in progress.
            </p>
            
            {setupStatus?.phases && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">Installation Progress:</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded">
                    <span className="text-sm flex items-center gap-2">
                      <span className={getPhaseColor(setupStatus.phases.security.status)}>
                        {getPhaseIcon(setupStatus.phases.security.status)}
                      </span>
                      Security Tools (Firewall, Fail2ban)
                    </span>
                    <span className="text-xs text-muted-foreground">{setupStatus.phases.security.message}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded">
                    <span className="text-sm flex items-center gap-2">
                      <span className={getPhaseColor(setupStatus.phases.packages.status)}>
                        {getPhaseIcon(setupStatus.phases.packages.status)}
                      </span>
                      Node.js Runtime & Dependencies
                    </span>
                    <span className="text-xs text-muted-foreground">{setupStatus.phases.packages.message}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded">
                    <span className="text-sm flex items-center gap-2">
                      <span className={getPhaseColor(setupStatus.phases.nginx.status)}>
                        {getPhaseIcon(setupStatus.phases.nginx.status)}
                      </span>
                      Nginx Web Server
                    </span>
                    <span className="text-xs text-muted-foreground">{setupStatus.phases.nginx.message}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded">
                    <span className="text-sm flex items-center gap-2">
                      <span className={getPhaseColor(setupStatus.phases.application.status)}>
                        {getPhaseIcon(setupStatus.phases.application.status)}
                      </span>
                      Application Deployment
                    </span>
                    <span className="text-xs text-muted-foreground">{setupStatus.phases.application.message}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded">
                    <span className="text-sm flex items-center gap-2">
                      <span className={getPhaseColor(setupStatus.phases.services.status)}>
                        {getPhaseIcon(setupStatus.phases.services.status)}
                      </span>
                      Service Startup & Verification
                    </span>
                    <span className="text-xs text-muted-foreground">{setupStatus.phases.services.message}</span>
                  </div>
                </div>
                
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-4">
                  Last updated: {setupStatus.timestamp ? new Date(setupStatus.timestamp).toLocaleTimeString() : 'Unknown'}
                </p>
              </div>
            )}
          </div>
        )}
        
        {healthStatus.http === 'offline' && !isSetupInProgress && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
            <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">⚠️ Unable to Connect</h4>
            <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
              The health check cannot reach your server. This usually means:
            </p>
            <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200 ml-4">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Security Group is blocking HTTP traffic (port 80)</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Application setup is still in progress (wait 3-5 minutes after deployment)</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Web server (Nginx) is not running on the instance</span>
              </li>
            </ul>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                className="text-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-700"
                onClick={() => window.open(`http://${deployment.ec2_public_ip}`, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-2" />
                Try Opening Website Directly
              </Button>
            </div>
          </div>
        )}

        {healthStatus.http === 'online' && (
          <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">✓ Website is Live</h4>
            <p className="text-sm text-green-800 dark:text-green-200">
              Your application is successfully deployed and accessible. All systems are operational.
            </p>
          </div>
        )}

        {/* Last Checked */}
        {healthStatus.lastChecked && (
          <div className="flex items-center justify-between pt-4 border-t text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Last checked: {healthStatus.lastChecked.toLocaleTimeString()}
            </span>
            <span className="text-xs">Auto-refreshes every 30 seconds</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
