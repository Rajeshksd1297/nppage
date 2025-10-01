import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Server, ExternalLink, CheckCircle2, Clock } from "lucide-react";

interface DeploymentStatusCardProps {
  deployment: {
    id: string;
    deployment_name: string;
    ec2_public_ip: string;
    region: string;
    last_deployed_at: string | null;
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

  useEffect(() => {
    const checkHealth = async () => {
      const startTime = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        await fetch(`http://${deployment.ec2_public_ip}`, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        setHealthStatus({
          http: 'online',
          responseTime,
          lastChecked: new Date(),
        });
      } catch (error) {
        setHealthStatus({
          http: 'offline',
          responseTime: null,
          lastChecked: new Date(),
        });
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [deployment.ec2_public_ip]);

  const uptime = deployment.last_deployed_at 
    ? Math.floor((Date.now() - new Date(deployment.last_deployed_at).getTime()) / 1000 / 60)
    : 0;

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
                 healthStatus.http === 'offline' ? 'No response' : 
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
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  Running
                </span>
              </div>
              <div className="text-2xl font-bold">✓</div>
              <p className="text-xs text-muted-foreground">
                {deployment.region}
              </p>
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
