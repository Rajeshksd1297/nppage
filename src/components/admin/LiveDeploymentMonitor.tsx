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
  Loader2,
  Package,
  Shield,
  Globe,
  Database,
  Settings,
  Wrench
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface LiveDeploymentMonitorProps {
  deployments: any[];
}

interface ComponentStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  message: string;
}

interface DeploymentStep {
  name: string;
  status: 'complete' | 'in_progress' | 'pending' | 'failed';
  message: string;
  icon: any;
}

interface InstanceHealth {
  instanceId: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'checking';
  httpAccessible: boolean;
  responseTime: number | null;
  lastChecked: Date;
  details: any;
  components: ComponentStatus[];
}

export function LiveDeploymentMonitor({ deployments }: LiveDeploymentMonitorProps) {
  const [healthStatuses, setHealthStatuses] = useState<Map<string, InstanceHealth>>(new Map());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [fixingHttp, setFixingHttp] = useState<Set<string>>(new Set());

  const activeDeployments = deployments?.filter(d => 
    d.status === 'running' && 
    d.ec2_instance_id && 
    d.ec2_public_ip
  ) || [];

  const pendingDeployments = deployments?.filter(d => 
    d.status === 'pending'
  ) || [];

  // Parse deployment log to extract component status
  const parseDeploymentSteps = (log: string): DeploymentStep[] => {
    const steps: DeploymentStep[] = [
      {
        name: 'EC2 Instance',
        status: 'pending',
        message: 'Waiting to start',
        icon: Server
      },
      {
        name: 'Security Configuration',
        status: 'pending',
        message: 'Pending',
        icon: Shield
      },
      {
        name: 'HTTP Access',
        status: 'pending',
        message: 'Pending',
        icon: Globe
      },
      {
        name: 'Application Setup',
        status: 'pending',
        message: 'Pending',
        icon: Package
      },
      {
        name: 'Database Migration',
        status: 'pending',
        message: 'Pending',
        icon: Database
      }
    ];

    if (!log) return steps;

    // EC2 Instance
    if (log.includes('✓ Instance created successfully') || log.includes('✓ Instance found')) {
      steps[0].status = 'complete';
      steps[0].message = log.includes('Instance found') ? 'Existing instance found' : 'Instance created';
    } else if (log.includes('Launching EC2 Instance') || log.includes('Using Existing EC2 Instance')) {
      steps[0].status = 'in_progress';
      steps[0].message = 'Setting up instance...';
    }

    // Security Configuration
    if (log.includes('Secure Deployment Configuration') || log.includes('Security Features')) {
      steps[1].status = 'complete';
      steps[1].message = 'Security configured';
    } else if (steps[0].status === 'complete') {
      steps[1].status = 'in_progress';
      steps[1].message = 'Configuring security...';
    }

    // HTTP Access
    if (log.includes('HTTP port 80 automatically configured') || log.includes('✓ Your website is now accessible')) {
      steps[2].status = 'complete';
      steps[2].message = 'HTTP access enabled';
    } else if (log.includes('Auto-Configuring HTTP Access')) {
      steps[2].status = 'in_progress';
      steps[2].message = 'Enabling HTTP access...';
    } else if (steps[1].status === 'complete') {
      steps[2].status = 'in_progress';
      steps[2].message = 'Setting up web access...';
    }

    // Application Setup
    if (log.includes('Application Stack:') || log.includes('Express.js application')) {
      steps[3].status = 'complete';
      steps[3].message = 'Application configured';
    } else if (log.includes('installing:') || log.includes('setup time:')) {
      steps[3].status = 'in_progress';
      steps[3].message = 'Installing application...';
    } else if (steps[2].status === 'complete') {
      steps[3].status = 'in_progress';
      steps[3].message = 'Setting up application...';
    }

    // Database Migration
    if (log.includes('✓ Database initialization: Enabled') || log.includes('✓ Database migrations: Enabled')) {
      steps[4].status = 'complete';
      steps[4].message = 'Database ready';
    } else if (log.includes('Database') && !log.includes('Pending')) {
      steps[4].status = 'in_progress';
      steps[4].message = 'Running migrations...';
    } else if (steps[3].status === 'complete') {
      steps[4].status = 'in_progress';
      steps[4].message = 'Initializing database...';
    }

    // Check for failures
    if (log.includes('❌') || log.includes('failed') || log.includes('error')) {
      steps.forEach(step => {
        if (step.status === 'in_progress') {
          step.status = 'failed';
          step.message = 'Failed';
        }
      });
    }

    return steps;
  };

  const checkInstanceHealth = async (deployment: any) => {
    const instanceId = deployment.ec2_instance_id;
    
    setHealthStatuses(prev => new Map(prev).set(instanceId, {
      ...(prev.get(instanceId) || {}),
      instanceId,
      status: 'checking',
      httpAccessible: false,
      responseTime: null,
      lastChecked: new Date(),
      details: null,
      components: []
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
      const components: ComponentStatus[] = [];
      
      if (data?.success && data?.status) {
        const isRunning = data.status.state === 'running';
        const systemOk = data.status.systemStatus === 'ok';
        const instanceOk = data.status.instanceStatus === 'ok';
        const httpOk = data.httpAccessible === true;

        // EC2 Instance Component
        components.push({
          name: 'EC2 Instance',
          status: isRunning ? 'healthy' : 'unhealthy',
          message: isRunning ? 'Running' : 'Not running'
        });

        // System Status Component
        components.push({
          name: 'System Health',
          status: systemOk ? 'healthy' : 'degraded',
          message: systemOk ? 'All checks passed' : 'System checks failing'
        });

        // Instance Status Component
        components.push({
          name: 'Instance Health',
          status: instanceOk ? 'healthy' : 'degraded',
          message: instanceOk ? 'All checks passed' : 'Instance checks failing'
        });

        // HTTP/Web Server Component - Check deployment age for better status
        const deploymentAge = deployment.created_at ? 
          (Date.now() - new Date(deployment.created_at).getTime()) / 1000 / 60 : 999;
        
        if (httpOk) {
          components.push({
            name: 'Web Server (Nginx)',
            status: 'healthy',
            message: 'Accessible on port 80'
          });
        } else if (deploymentAge < 5) {
          // Within 5 minutes of deployment - likely still setting up
          components.push({
            name: 'Web Server (Nginx)',
            status: 'degraded',
            message: `Setup in progress (~${Math.ceil(5 - deploymentAge)} min remaining)`
          });
        } else {
          components.push({
            name: 'Web Server (Nginx)',
            status: 'unhealthy',
            message: 'Not accessible - check security group'
          });
        }

        // Application Component (inferred from HTTP + response time)
        if (httpOk && responseTime < 5000) {
          components.push({
            name: 'Application',
            status: responseTime < 2000 ? 'healthy' : 'degraded',
            message: responseTime < 2000 ? 'Responding quickly' : 'Slow response time'
          });
        } else if (httpOk) {
          components.push({
            name: 'Application',
            status: 'degraded',
            message: 'Very slow response'
          });
        } else if (deploymentAge < 5) {
          components.push({
            name: 'Application',
            status: 'degraded',
            message: 'Installing... (3-5 min setup time)'
          });
        } else {
          components.push({
            name: 'Application',
            status: 'unknown',
            message: 'Cannot verify - HTTP not accessible'
          });
        }

        // Overall health status
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
        details: data,
        components
      }));

    } catch (error) {
      console.error('Health check failed:', error);
      setHealthStatuses(prev => new Map(prev).set(instanceId, {
        instanceId,
        status: 'unhealthy',
        httpAccessible: false,
        responseTime: null,
        lastChecked: new Date(),
        details: null,
        components: [
          { name: 'EC2 Instance', status: 'unknown', message: 'Check failed' },
          { name: 'System Health', status: 'unknown', message: 'Check failed' },
          { name: 'Instance Health', status: 'unknown', message: 'Check failed' },
          { name: 'Web Server (Nginx)', status: 'unknown', message: 'Check failed' },
          { name: 'Application', status: 'unknown', message: 'Check failed' }
        ]
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
      {/* Pending Deployments with Process Status */}
      {pendingDeployments.length > 0 && (
        <div className="space-y-4">
          {pendingDeployments.map((deployment) => {
            const steps = parseDeploymentSteps(deployment.deployment_log || '');
            const completedSteps = steps.filter(s => s.status === 'complete').length;
            const totalSteps = steps.length;
            const progressPercent = (completedSteps / totalSteps) * 100;

            return (
              <Card key={deployment.id} className="border-2 border-blue-500/50 bg-blue-50/20 dark:bg-blue-950/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                      <div>
                        <CardTitle className="text-lg">{deployment.deployment_name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Deployment in progress • {deployment.region}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-blue-500 text-blue-600">
                      Deploying
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Overall Progress */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-medium">Deployment Progress</span>
                      <span className="text-muted-foreground">
                        {completedSteps} of {totalSteps} steps complete
                      </span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>

                  {/* Component-wise Status */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Deployment Steps
                    </h4>
                    
                    {steps.map((step, idx) => {
                      const StepIcon = step.icon;
                      return (
                        <div 
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-lg border"
                          style={{
                            backgroundColor: 
                              step.status === 'complete' ? 'rgba(34, 197, 94, 0.05)' :
                              step.status === 'in_progress' ? 'rgba(59, 130, 246, 0.05)' :
                              step.status === 'failed' ? 'rgba(239, 68, 68, 0.05)' :
                              'rgba(148, 163, 184, 0.03)',
                            borderColor:
                              step.status === 'complete' ? 'rgba(34, 197, 94, 0.2)' :
                              step.status === 'in_progress' ? 'rgba(59, 130, 246, 0.2)' :
                              step.status === 'failed' ? 'rgba(239, 68, 68, 0.2)' :
                              'rgba(148, 163, 184, 0.1)'
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {step.status === 'complete' ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : step.status === 'in_progress' ? (
                              <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                            ) : step.status === 'failed' ? (
                              <XCircle className="h-5 w-5 text-red-500" />
                            ) : (
                              <StepIcon className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div>
                              <p className="text-sm font-medium">{step.name}</p>
                              <p className="text-xs text-muted-foreground">{step.message}</p>
                            </div>
                          </div>
                          <Badge 
                            variant={
                              step.status === 'complete' ? 'default' :
                              step.status === 'in_progress' ? 'secondary' :
                              step.status === 'failed' ? 'destructive' :
                              'outline'
                            }
                            className="capitalize"
                          >
                            {step.status === 'in_progress' ? 'In Progress' : step.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>

                  {/* Estimated Time */}
                  <div className="mt-4 p-3 bg-muted rounded-lg flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Estimated completion time: 3-5 minutes
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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

                {/* Setup Progress Notice */}
                {(() => {
                  const deploymentAge = deployment.created_at ? 
                    (Date.now() - new Date(deployment.created_at).getTime()) / 1000 / 60 : 999;
                  const isNewDeployment = deploymentAge < 5;
                  const hasWebServerIssue = health?.components.some(c => 
                    c.name === 'Web Server (Nginx)' && (c.status === 'unhealthy' || c.status === 'degraded')
                  );

                  if (isNewDeployment && hasWebServerIssue) {
                    return (
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Loader2 className="h-5 w-5 text-blue-500 animate-spin mt-0.5" />
                          <div className="flex-1">
                            <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                              Initial Setup in Progress
                            </h5>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                              Your deployment is installing Nginx, Node.js, and security features. This takes 3-5 minutes.
                            </p>
                            <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                              <p>• Estimated completion: {Math.ceil(5 - deploymentAge)} minutes</p>
                              <p>• The instance will automatically become accessible when ready</p>
                              <p>• Check back in a few minutes or wait for the status to update</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  } else if (!isNewDeployment && hasWebServerIssue) {
                    const isFixing = fixingHttp.has(deployment.ec2_instance_id);
                    
                    return (
                      <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                          <div className="flex-1">
                            <h5 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                              Web Server Not Responding
                            </h5>
                            <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                              Connection refused - Nginx may not be installed or running on the instance.
                            </p>
                            <div className="text-xs text-red-600 dark:text-red-400 space-y-1 mb-3">
                              <p><strong>Possible Issues:</strong></p>
                              <p>• Nginx not installed or not running</p>
                              <p>• Application not deployed correctly</p>
                              <p>• Port 80 not configured in Nginx</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                className="text-xs"
                                disabled={isFixing}
                                onClick={async () => {
                                  setFixingHttp(prev => new Set(prev).add(deployment.ec2_instance_id));
                                  try {
                                    toast.info('Checking setup progress...');
                                    
                                    const { data, error } = await supabase.functions.invoke('aws-ssh-diagnostic', {
                                      body: {
                                        instanceId: deployment.ec2_instance_id,
                                        region: deployment.region,
                                      },
                                    });

                                    if (error) throw error;

                                    if (data.success) {
                                      const diag = data.diagnostics;
                                      
                                      if (diag.setupComplete) {
                                        toast.success('Setup is complete! Checking status...');
                                        setTimeout(() => checkInstanceHealth(deployment), 2000);
                                      } else if (diag.setupStarted) {
                                        toast.info(`Setup in progress: ${diag.currentStep} (${diag.progressPercent}%)`);
                                      } else {
                                        toast.warning('Setup has not started yet. Please wait a few more minutes.');
                                      }

                                      if (diag.errors.length > 0) {
                                        console.error('Setup errors:', diag.errors);
                                        toast.error(`Setup errors detected: ${diag.errors[0]}`);
                                      }
                                    } else {
                                      throw new Error(data.error || 'Diagnostic failed');
                                    }
                                  } catch (error: any) {
                                    console.error('Diagnostic error:', error);
                                    toast.error(error.message || 'Failed to check setup progress');
                                  } finally {
                                    setFixingHttp(prev => {
                                      const next = new Set(prev);
                                      next.delete(deployment.ec2_instance_id);
                                      return next;
                                    });
                                  }
                                }}
                              >
                                {isFixing ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Checking...
                                  </>
                                ) : (
                                  <>
                                    <Wrench className="h-3 w-3 mr-1" />
                                    Check Setup Progress
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => window.open(
                                  `https://console.aws.amazon.com/ec2/home?region=${deployment.region}#Instances:instanceId=${deployment.ec2_instance_id}`,
                                  '_blank'
                                )}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                AWS Console
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Component Status Grid */}
                {health?.components && health.components.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="text-sm font-semibold mb-3">Component Health</h4>
                    <div className="grid gap-3">
                      {health.components.map((component, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-lg border"
                          style={{
                            backgroundColor: 
                              component.status === 'healthy' ? 'rgba(34, 197, 94, 0.05)' :
                              component.status === 'degraded' ? 'rgba(234, 179, 8, 0.05)' :
                              component.status === 'unhealthy' ? 'rgba(239, 68, 68, 0.05)' :
                              'rgba(148, 163, 184, 0.05)',
                            borderColor:
                              component.status === 'healthy' ? 'rgba(34, 197, 94, 0.2)' :
                              component.status === 'degraded' ? 'rgba(234, 179, 8, 0.2)' :
                              component.status === 'unhealthy' ? 'rgba(239, 68, 68, 0.2)' :
                              'rgba(148, 163, 184, 0.2)'
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {component.status === 'healthy' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : component.status === 'degraded' ? (
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            ) : component.status === 'unhealthy' ? (
                              <XCircle className="h-4 w-4 text-red-500" />
                            ) : (
                              <Server className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div>
                              <p className="text-sm font-medium">{component.name}</p>
                              <p className="text-xs text-muted-foreground">{component.message}</p>
                            </div>
                          </div>
                          <Badge 
                            variant={
                              component.status === 'healthy' ? 'default' :
                              component.status === 'degraded' ? 'secondary' :
                              component.status === 'unhealthy' ? 'destructive' :
                              'outline'
                            }
                            className="capitalize"
                          >
                            {component.status}
                          </Badge>
                        </div>
                      ))}
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