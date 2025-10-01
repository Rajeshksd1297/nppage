import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Server, 
  Wifi, 
  WifiOff, 
  Clock, 
  Cpu, 
  HardDrive,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface LiveDeploymentMonitorProps {
  deployments: any[];
}

interface InstanceHealth {
  instanceId: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'checking';
  httpAccessible: boolean;
  responseTime: number | null;
  lastChecked: Date;
  details: any;
}

export function LiveDeploymentMonitor({ deployments }: LiveDeploymentMonitorProps) {
  const [healthStatuses, setHealthStatuses] = useState<Map<string, InstanceHealth>>(new Map());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  const activeDeployments = deployments?.filter(d => 
    d.status === 'running' && 
    d.ec2_instance_id && 
    d.ec2_public_ip
  ) || [];

  const checkInstanceHealth = async (deployment: any) => {
    const instanceId = deployment.ec2_instance_id;
    
    setHealthStatuses(prev => new Map(prev).set(instanceId, {
      ...(prev.get(instanceId) || {}),
      instanceId,
      status: 'checking',
      httpAccessible: false,
      responseTime: null,
      lastChecked: new Date(),
      details: null
    } as InstanceHealth));

    try {
      const startTime = Date.now();
      
      const { data, error } = await supabase.functions.invoke('aws-instance-status', {
        body: {
          instanceId: deployment.ec2_instance_id,
          region: deployment.region,
        },
      });

      const responseTime = Date.now() - startTime;

      if (error) {
        throw error;
      }

      let healthStatus: 'healthy' | 'degraded' | 'unhealthy' = 'unhealthy';
      
      if (data?.success && data?.status) {
        const isRunning = data.status.state === 'running';
        const systemOk = data.status.systemStatus === 'ok';
        const instanceOk = data.status.instanceStatus === 'ok';
        const httpOk = data.httpAccessible === true;

        if (isRunning && systemOk && instanceOk && httpOk) {
          healthStatus = 'healthy';
        } else if (isRunning && (systemOk || instanceOk)) {
          healthStatus = 'degraded';
        } else {
          healthStatus = 'unhealthy';
        }
      }

      setHealthStatuses(prev => new Map(prev).set(instanceId, {
        instanceId,
        status: healthStatus,
        httpAccessible: data?.httpAccessible || false,
        responseTime,
        lastChecked: new Date(),
        details: data
      }));

    } catch (error) {
      console.error('Health check failed:', error);
      setHealthStatuses(prev => new Map(prev).set(instanceId, {
        instanceId,
        status: 'unhealthy',
        httpAccessible: false,
        responseTime: null,
        lastChecked: new Date(),
        details: null
      }));
    }
  };

  const checkAllInstances = async () => {
    if (activeDeployments.length === 0) return;
    
    for (const deployment of activeDeployments) {
      await checkInstanceHealth(deployment);
    }
  };

  useEffect(() => {
    // Initial check
    checkAllInstances();

    // Set up auto-refresh
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        checkAllInstances();
      }, refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [activeDeployments.length, autoRefresh, refreshInterval]);

  const getHealthIcon = (status: InstanceHealth['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'checking':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    }
  };

  const getHealthBadge = (status: InstanceHealth['status']) => {
    const variants: Record<InstanceHealth['status'], any> = {
      healthy: 'default',
      degraded: 'secondary',
      unhealthy: 'destructive',
      checking: 'outline'
    };

    return (
      <Badge variant={variants[status]} className="capitalize">
        {status}
      </Badge>
    );
  };

  if (activeDeployments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Health Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Server className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No active deployments to monitor</p>
            <p className="text-sm mt-1">Deploy an instance to see live health metrics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const healthySummary = Array.from(healthStatuses.values()).reduce((acc, health) => {
    acc[health.status] = (acc[health.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      {/* Summary Dashboard */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Live Health Monitor
              <Badge variant="outline" className="ml-2">
                {activeDeployments.length} Active
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={checkAllInstances}
                disabled={Array.from(healthStatuses.values()).some(h => h.status === 'checking')}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Health Summary Grid */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-600">Healthy</span>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold mt-1">{healthySummary.healthy || 0}</p>
            </div>
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-yellow-600">Degraded</span>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold mt-1">{healthySummary.degraded || 0}</p>
            </div>
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-red-600">Unhealthy</span>
                <XCircle className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-2xl font-bold mt-1">{healthySummary.unhealthy || 0}</p>
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-600">Checking</span>
                <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
              </div>
              <p className="text-2xl font-bold mt-1">{healthySummary.checking || 0}</p>
            </div>
          </div>

          {/* Auto-refresh Control */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Auto-refresh every {refreshInterval}s</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Instance Health Cards */}
      <div className="grid gap-4">
        {activeDeployments.map((deployment) => {
          const health = healthStatuses.get(deployment.ec2_instance_id);
          const details = health?.details;

          return (
            <Card key={deployment.id} className="border-l-4" style={{
              borderLeftColor: 
                health?.status === 'healthy' ? 'rgb(34 197 94)' : 
                health?.status === 'degraded' ? 'rgb(234 179 8)' : 
                health?.status === 'unhealthy' ? 'rgb(239 68 68)' : 
                'rgb(148 163 184)'
            }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {health && getHealthIcon(health.status)}
                    <div>
                      <CardTitle className="text-lg">{deployment.deployment_name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {deployment.ec2_instance_id} • {deployment.region}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {health && getHealthBadge(health.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => checkInstanceHealth(deployment)}
                      disabled={health?.status === 'checking'}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* HTTP Status */}
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      {health?.httpAccessible ? (
                        <Wifi className="h-4 w-4 text-green-500" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-xs font-medium">HTTP</span>
                    </div>
                    <p className="text-sm font-semibold">
                      {health?.httpAccessible ? 'Online' : 'Offline'}
                    </p>
                  </div>

                  {/* Response Time */}
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium">Response</span>
                    </div>
                    <p className="text-sm font-semibold">
                      {health?.responseTime ? `${health.responseTime}ms` : 'N/A'}
                    </p>
                  </div>

                  {/* Instance State */}
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Server className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium">EC2 State</span>
                    </div>
                    <p className="text-sm font-semibold capitalize">
                      {details?.status?.state || 'Unknown'}
                    </p>
                  </div>

                  {/* Instance Type */}
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Cpu className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium">Type</span>
                    </div>
                    <p className="text-sm font-semibold">
                      {details?.status?.instanceType || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* System Status */}
                {details?.status && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">System Status</span>
                      <Badge variant={details.status.systemStatus === 'ok' ? 'default' : 'destructive'}>
                        {details.status.systemStatus}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Instance Checks</span>
                      <Badge variant={details.status.instanceStatus === 'ok' ? 'default' : 'destructive'}>
                        {details.status.instanceStatus}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(`http://${deployment.ec2_public_ip}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Website
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(
                      `https://console.aws.amazon.com/ec2/home?region=${deployment.region}#Instances:instanceId=${deployment.ec2_instance_id}`,
                      '_blank'
                    )}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    AWS Console
                  </Button>
                </div>

                {/* Last Checked */}
                {health?.lastChecked && (
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    Last checked: {health.lastChecked.toLocaleTimeString()}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}