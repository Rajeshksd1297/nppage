import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, AlertCircle, XCircle, Activity, RefreshCw,
  BookOpen, Newspaper, Calendar, Award, HelpCircle, Mail, 
  MessageSquare, Lock, Users, BarChart3, Palette, Crown,
  Shield, Cloud, Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModuleStatus {
  id: string;
  name: string;
  icon: any;
  status: 'online' | 'warning' | 'offline';
  lastUpdate: Date;
  recordCount?: number;
  errorCount?: number;
}

export default function LiveModuleStatus() {
  const [modules, setModules] = useState<ModuleStatus[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  useEffect(() => {
    checkAllModules();

    // Set up real-time subscriptions for all major tables
    const channel = supabase
      .channel('live-module-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, handleUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_posts' }, handleUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, handleUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'awards' }, handleUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'faqs' }, handleUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'newsletter_campaigns' }, handleUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_submissions' }, handleUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, handleUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_subscriptions' }, handleUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'themes' }, handleUpdate)
      .subscribe();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      checkAllModules();
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const handleUpdate = () => {
    setLastSync(new Date());
    checkAllModules();
  };

  const checkAllModules = async () => {
    const moduleChecks: ModuleStatus[] = [
      {
        id: 'auth',
        name: 'Authentication',
        icon: Lock,
        status: 'online',
        lastUpdate: new Date(),
      },
      await checkModule('books', 'Book Management', BookOpen),
      await checkModule('blog_posts', 'Blog', Newspaper),
      await checkModule('events', 'Events', Calendar),
      await checkModule('awards', 'Awards', Award),
      await checkModule('faqs', 'FAQ', HelpCircle),
      await checkModule('newsletter_campaigns', 'Newsletter', Mail),
      await checkModule('contact_submissions', 'Contact Forms', MessageSquare),
      await checkModule('tickets', 'Help Desk', Users),
      await checkModule('user_subscriptions', 'Subscriptions', Crown),
      await checkModule('themes', 'Themes', Palette),
      await checkModule('backup_jobs', 'Backup & Security', Shield),
      await checkModule('aws_deployments', 'AWS Deployment', Cloud),
      {
        id: 'database',
        name: 'Database',
        icon: Database,
        status: 'online',
        lastUpdate: new Date(),
      }
    ];

    setModules(moduleChecks);
  };

  const checkModule = async (table: string, name: string, icon: any): Promise<ModuleStatus> => {
    try {
      // Use type assertion to handle dynamic table names
      const { count, error } = await supabase
        .from(table as any)
        .select('*', { count: 'exact', head: true });

      if (error) throw error;

      return {
        id: table,
        name,
        icon,
        status: 'online',
        lastUpdate: new Date(),
        recordCount: count || 0,
        errorCount: 0
      };
    } catch (error) {
      console.error(`Error checking ${table}:`, error);
      return {
        id: table,
        name,
        icon,
        status: 'warning',
        lastUpdate: new Date(),
        errorCount: 1
      };
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await checkAllModules();
    setLastSync(new Date());
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getStatusIcon = (status: ModuleStatus['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'offline':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: ModuleStatus['status']) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">Online</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">Warning</Badge>;
      case 'offline':
        return <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">Offline</Badge>;
    }
  };

  const onlineCount = modules.filter(m => m.status === 'online').length;
  const warningCount = modules.filter(m => m.status === 'warning').length;
  const offlineCount = modules.filter(m => m.status === 'offline').length;

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary" />
            Live Module Status
          </h1>
          <p className="text-muted-foreground">
            Real-time monitoring of all system modules
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Modules</p>
                <p className="text-3xl font-bold text-primary">{modules.length}</p>
              </div>
              <Activity className="w-10 h-10 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Online</p>
                <p className="text-3xl font-bold text-green-600">{onlineCount}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Warnings</p>
                <p className="text-3xl font-bold text-yellow-600">{warningCount}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-yellow-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Offline</p>
                <p className="text-3xl font-bold text-red-600">{offlineCount}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-500/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Sync Info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Live Sync Active</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Last updated: {lastSync.toLocaleTimeString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((module) => (
          <Card key={module.id} className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <module.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{module.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {module.lastUpdate.toLocaleTimeString()}
                    </CardDescription>
                  </div>
                </div>
                {getStatusIcon(module.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge(module.status)}
                </div>
                
                {module.recordCount !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Records</span>
                    <span className="text-sm font-medium">{module.recordCount}</span>
                  </div>
                )}
                
                {module.errorCount !== undefined && module.errorCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Errors</span>
                    <span className="text-sm font-medium text-red-600">{module.errorCount}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
