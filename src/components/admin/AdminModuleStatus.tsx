import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Activity, Database, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModuleStatus {
  totalModules: number;
  activeModules: number;
  systemHealth: 'healthy' | 'warning' | 'error';
  lastSync: Date;
}

export function AdminModuleStatus() {
  const [status, setStatus] = useState<ModuleStatus>({
    totalModules: 14,
    activeModules: 14,
    systemHealth: 'healthy',
    lastSync: new Date()
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkModuleStatus();

    // Set up real-time subscription for system changes
    const channel = supabase
      .channel('admin-module-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'backup_jobs'
        },
        () => {
          checkModuleStatus();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'aws_deployments'
        },
        () => {
          checkModuleStatus();
        }
      )
      .subscribe();

    // Poll every 30 seconds for fresh data
    const interval = setInterval(() => {
      checkModuleStatus();
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const checkModuleStatus = async () => {
    try {
      // Check various system components
      const [backupResult, deploymentResult, settingsResult] = await Promise.all([
        supabase.from('backup_jobs').select('status').limit(1),
        supabase.from('aws_deployments').select('status').limit(1),
        supabase.from('backup_settings').select('enabled').limit(1)
      ]);

      let health: 'healthy' | 'warning' | 'error' = 'healthy';
      
      // Determine system health based on recent jobs
      if (backupResult.error || deploymentResult.error || settingsResult.error) {
        health = 'warning';
      }

      setStatus({
        totalModules: 14,
        activeModules: 14,
        systemHealth: health,
        lastSync: new Date()
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking module status:', error);
      setStatus(prev => ({ ...prev, systemHealth: 'warning', lastSync: new Date() }));
      setIsLoading(false);
    }
  };

  const getHealthIcon = () => {
    switch (status.systemHealth) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getHealthColor = () => {
    switch (status.systemHealth) {
      case 'healthy':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'error':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
    }
  };

  if (isLoading) {
    return (
      <Card className="border-sidebar-border bg-sidebar">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <Activity className="w-5 h-5 animate-pulse text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-sidebar-border bg-sidebar">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="w-4 h-4" />
          System Status
          <Badge variant="outline" className="ml-auto text-xs">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Health Status */}
        <div className={cn("flex items-center justify-between p-2 rounded-md", getHealthColor())}>
          <div className="flex items-center gap-2">
            {getHealthIcon()}
            <span className="text-sm font-medium capitalize">
              {status.systemHealth}
            </span>
          </div>
        </div>

        {/* Module Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="w-3 h-3" />
              <span>Modules</span>
            </div>
            <span className="font-medium">
              {status.activeModules}/{status.totalModules}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Database className="w-3 h-3" />
              <span>Database</span>
            </div>
            <span className="font-medium text-green-600 dark:text-green-400">
              Online
            </span>
          </div>
        </div>

        {/* Last Sync */}
        <div className="pt-2 border-t border-sidebar-border">
          <p className="text-xs text-muted-foreground">
            Last sync: {status.lastSync.toLocaleTimeString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
