import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Circle,
  Server,
  Shield,
  Key,
  Globe,
  Package,
  Database,
  Settings,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DeploymentProgressTrackerProps {
  deploymentId: string;
  onComplete?: () => void;
}

interface ProgressStep {
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  message: string;
  timestamp?: string;
  icon: any;
  error?: string;
}

export function DeploymentProgressTracker({ deploymentId, onComplete }: DeploymentProgressTrackerProps) {
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [overallStatus, setOverallStatus] = useState<'deploying' | 'completed' | 'failed'>('deploying');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Parse deployment log to extract progress
  const parseDeploymentLog = (log: string): ProgressStep[] => {
    const defaultSteps: ProgressStep[] = [
      { name: 'Initialize Deployment', status: 'pending', message: 'Setting up deployment', icon: Settings },
      { name: 'Security Group', status: 'pending', message: 'Creating security group', icon: Shield },
      { name: 'SSH Key Pair', status: 'pending', message: 'Generating key pair', icon: Key },
      { name: 'EC2 Instance', status: 'pending', message: 'Launching instance', icon: Server },
      { name: 'System Setup', status: 'pending', message: 'Installing packages', icon: Package },
      { name: 'Web Server', status: 'pending', message: 'Configuring Nginx', icon: Globe },
      { name: 'Database', status: 'pending', message: 'Running migrations', icon: Database },
      { name: 'Finalize', status: 'pending', message: 'Starting services', icon: CheckCircle2 }
    ];

    if (!log) return defaultSteps;

    // Initialize Deployment
    if (log.includes('Deployment Started:') || log.includes('Deployment record created:')) {
      defaultSteps[0].status = 'completed';
      defaultSteps[0].message = 'Deployment initialized';
      const match = log.match(/Deployment Started: (.+)/);
      if (match) defaultSteps[0].timestamp = match[1];
    }

    // Security Group
    if (log.includes('Auto-Created Security Group')) {
      defaultSteps[1].status = 'completed';
      defaultSteps[1].message = 'Security group created with HTTP/HTTPS rules';
      const match = log.match(/Security Group ID: (sg-[a-z0-9]+)/);
      if (match) defaultSteps[1].message += ` (${match[1]})`;
    } else if (log.includes('Using Security Group:')) {
      defaultSteps[1].status = 'completed';
      defaultSteps[1].message = 'Using existing security group';
    } else if (log.includes('Creating security group')) {
      defaultSteps[1].status = 'in_progress';
      defaultSteps[1].message = 'Creating security group...';
    } else if (log.includes('security group') && !log.includes('Failed')) {
      defaultSteps[1].status = 'skipped';
      defaultSteps[1].message = 'Using default security group';
    }

    // SSH Key Pair
    if (log.includes('Auto-Created SSH Key Pair')) {
      defaultSteps[2].status = 'completed';
      defaultSteps[2].message = 'SSH key pair generated';
      const match = log.match(/Key Pair Name: ([^\n]+)/);
      if (match) defaultSteps[2].message += ` (${match[1].trim()})`;
    } else if (log.includes('Using Key Pair:')) {
      defaultSteps[2].status = 'completed';
      defaultSteps[2].message = 'Using existing key pair';
    } else if (log.includes('Creating key pair')) {
      defaultSteps[2].status = 'in_progress';
      defaultSteps[2].message = 'Generating key pair...';
    } else if (defaultSteps[1].status === 'completed') {
      defaultSteps[2].status = 'skipped';
      defaultSteps[2].message = 'No SSH key pair configured';
    }

    // EC2 Instance
    if (log.includes('✓ Instance created successfully') || log.includes('✓ Instance found')) {
      defaultSteps[3].status = 'completed';
      const match = log.match(/Instance ID: (i-[a-z0-9]+)/);
      const ipMatch = log.match(/Public IP[:\s]+([0-9.]+)/);
      defaultSteps[3].message = match ? `Instance ${match[1]}` : 'Instance launched';
      if (ipMatch) defaultSteps[3].message += ` (${ipMatch[1]})`;
    } else if (log.includes('Launching EC2 Instance') || log.includes('Polling AWS for status')) {
      defaultSteps[3].status = 'in_progress';
      defaultSteps[3].message = 'Launching EC2 instance...';
    }

    // System Setup
    if (log.includes('📦 Updating all system packages') || log.includes('Installing security tools')) {
      defaultSteps[4].status = 'in_progress';
      defaultSteps[4].message = 'Installing system packages...';
    }
    if (log.includes('Node.js 18') || log.includes('System packages updated')) {
      defaultSteps[4].status = 'completed';
      defaultSteps[4].message = 'System packages installed';
    }

    // Web Server
    if (log.includes('Nginx with security headers') || log.includes('Configuring Nginx')) {
      defaultSteps[5].status = 'in_progress';
      defaultSteps[5].message = 'Setting up Nginx...';
    }
    if (log.includes('✅ Nginx started successfully') || log.includes('Nginx running')) {
      defaultSteps[5].status = 'completed';
      defaultSteps[5].message = 'Nginx web server running';
    }

    // Database
    if (log.includes('Database initialization') || log.includes('Database migrations')) {
      if (log.includes('Enabled')) {
        defaultSteps[6].status = 'completed';
        defaultSteps[6].message = 'Database ready';
      } else {
        defaultSteps[6].status = 'skipped';
        defaultSteps[6].message = 'Database not configured';
      }
    }

    // Finalize
    if (log.includes('SECURE DEPLOYMENT COMPLETE') || log.includes('Deployment completed at:')) {
      defaultSteps[7].status = 'completed';
      defaultSteps[7].message = 'Deployment complete';
      const match = log.match(/completed at: (.+)/);
      if (match) defaultSteps[7].timestamp = match[1];
    } else if (log.includes('Starting services') || defaultSteps[5].status === 'completed') {
      defaultSteps[7].status = 'in_progress';
      defaultSteps[7].message = 'Starting services...';
    }

    // Check for errors
    const errorMatch = log.match(/❌ (.+)/g);
    if (errorMatch) {
      defaultSteps.forEach((step, idx) => {
        if (step.status === 'in_progress') {
          defaultSteps[idx].status = 'failed';
          defaultSteps[idx].error = errorMatch[0].replace('❌', '').trim();
        }
      });
    }

    return defaultSteps;
  };

  useEffect(() => {
    if (!deploymentId) return;

    const fetchProgress = async () => {
      const { data, error } = await supabase
        .from('aws_deployments')
        .select('*')
        .eq('id', deploymentId)
        .single();

      if (error) {
        console.error('Error fetching deployment:', error);
        return;
      }

      if (!data) return;

      // Parse the log to extract progress
      const parsedSteps = parseDeploymentLog(data.deployment_log || '');
      setSteps(parsedSteps);

      // Extract start time
      const startMatch = data.deployment_log?.match(/Deployment Started: (.+)/);
      if (startMatch && !startTime) {
        setStartTime(new Date(startMatch[1]));
      }

      // Determine overall status
      if (data.status === 'running') {
        setOverallStatus('completed');
        if (onComplete) onComplete();
      } else if (data.status === 'failed' || parsedSteps.some(s => s.status === 'failed')) {
        setOverallStatus('failed');
        if (onComplete) onComplete();
      } else {
        setOverallStatus('deploying');
      }
    };

    // Initial fetch
    fetchProgress();

    // Poll for updates every 3 seconds
    const interval = setInterval(fetchProgress, 3000);

    return () => clearInterval(interval);
  }, [deploymentId, onComplete]);

  // Update elapsed time
  useEffect(() => {
    if (!startTime || overallStatus !== 'deploying') return;

    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, overallStatus]);

  // Calculate progress percentage
  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const failedSteps = steps.filter(s => s.status === 'failed').length;
  const totalSteps = steps.filter(s => s.status !== 'skipped').length;
  const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (steps.length === 0) {
    return null;
  }

  return (
    <Card className={`border-2 ${
      overallStatus === 'completed' ? 'border-green-500/50 bg-green-50/20 dark:bg-green-950/20' :
      overallStatus === 'failed' ? 'border-red-500/50 bg-red-50/20 dark:bg-red-950/20' :
      'border-blue-500/50 bg-blue-50/20 dark:bg-blue-950/20'
    }`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {overallStatus === 'deploying' && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
            {overallStatus === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            {overallStatus === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
            Deployment Progress Report
          </CardTitle>
          <div className="flex items-center gap-3">
            {startTime && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{formatTime(elapsedTime)}</span>
              </div>
            )}
            <Badge variant={
              overallStatus === 'completed' ? 'default' :
              overallStatus === 'failed' ? 'destructive' :
              'secondary'
            }>
              {overallStatus === 'deploying' ? 'In Progress' : overallStatus}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium">
              {overallStatus === 'completed' ? 'Deployment Complete' : 
               overallStatus === 'failed' ? 'Deployment Failed' : 
               'Deploying...'}
            </span>
            <span className="text-muted-foreground">
              {completedSteps} of {totalSteps} steps complete
              {failedSteps > 0 && ` • ${failedSteps} failed`}
            </span>
          </div>
          <Progress 
            value={progressPercent} 
            className={`h-3 ${overallStatus === 'failed' ? '[&>div]:bg-destructive' : ''}`}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round(progressPercent)}% complete
          </p>
        </div>

        {/* Step-by-Step Progress */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold mb-3">Deployment Steps</h4>
          {steps.map((step, idx) => {
            const StepIcon = step.icon;
            return (
              <div
                key={idx}
                className={`flex items-start justify-between p-3 rounded-lg border transition-all ${
                  step.status === 'completed' ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800' :
                  step.status === 'in_progress' ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' :
                  step.status === 'failed' ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800' :
                  step.status === 'skipped' ? 'bg-muted/30 border-muted' :
                  'bg-muted/10 border-muted'
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-shrink-0 mt-0.5">
                    {step.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    {step.status === 'in_progress' && <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />}
                    {step.status === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
                    {step.status === 'skipped' && <Circle className="h-5 w-5 text-muted-foreground" />}
                    {step.status === 'pending' && <Circle className="h-5 w-5 text-muted-foreground/40" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <StepIcon className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">{step.name}</p>
                    </div>
                    <p className={`text-xs mt-1 ${
                      step.status === 'failed' ? 'text-red-600 dark:text-red-400' :
                      step.status === 'in_progress' ? 'text-blue-600 dark:text-blue-400' :
                      'text-muted-foreground'
                    }`}>
                      {step.message}
                    </p>
                    {step.error && (
                      <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs text-red-800 dark:text-red-200 flex items-start gap-2">
                        <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>{step.error}</span>
                      </div>
                    )}
                    {step.timestamp && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(step.timestamp).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
                <Badge 
                  variant={
                    step.status === 'completed' ? 'default' :
                    step.status === 'in_progress' ? 'secondary' :
                    step.status === 'failed' ? 'destructive' :
                    'outline'
                  }
                  className="capitalize text-xs"
                >
                  {step.status === 'in_progress' ? 'Running' : step.status}
                </Badge>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t">
          <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium text-green-600 dark:text-green-400">Complete</span>
            </div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{completedSteps}</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Circle className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium">Pending</span>
            </div>
            <p className="text-2xl font-bold">{steps.filter(s => s.status === 'pending').length}</p>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs font-medium text-red-600 dark:text-red-400">Failed</span>
            </div>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{failedSteps}</p>
          </div>
        </div>

        {/* Estimated Time */}
        {overallStatus === 'deploying' && (
          <div className="p-3 bg-muted rounded-lg flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Estimated total time: 3-5 minutes • Elapsed: {formatTime(elapsedTime)}
            </span>
          </div>
        )}

        {/* Completion Message */}
        {overallStatus === 'completed' && (
          <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h5 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                  Deployment Successful!
                </h5>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your application has been deployed successfully. It may take 2-3 minutes for all services to be fully operational.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {overallStatus === 'failed' && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h5 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                  Deployment Failed
                </h5>
                <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                  The deployment encountered errors. Please check the logs above for details.
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  Common causes: Invalid AWS credentials, insufficient IAM permissions, or network issues.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
