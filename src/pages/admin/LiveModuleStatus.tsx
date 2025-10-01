import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, AlertCircle, XCircle, Activity, RefreshCw,
  BookOpen, Newspaper, Calendar, Award, HelpCircle, Mail, 
  MessageSquare, Lock, Users, BarChart3, Palette, Crown,
  Shield, Cloud, Database, Grid3x3, Table as TableIcon,
  Zap, Network, HardDrive, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ModuleStatus {
  id: string;
  name: string;
  icon: any;
  status: 'online' | 'warning' | 'offline';
  lastUpdate: Date;
  recordCount?: number;
  errorCount?: number;
  hasSettings?: boolean;
  settingsConfigured?: boolean;
  dbSynced?: boolean;
  details?: string;
  rlsEnabled?: boolean;
  responseTime?: number;
  troubleshootingSteps?: string[];
}

export default function LiveModuleStatus() {
  const [modules, setModules] = useState<ModuleStatus[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [systemMetrics, setSystemMetrics] = useState({
    avgResponseTime: 0,
    totalRequests: 0,
    activeConnections: 0
  });

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
    const startTime = Date.now();
    
    const moduleChecks: ModuleStatus[] = [
      await checkAuthModule(),
      await checkModuleWithSettings('books', 'Book Management', BookOpen, 'book_field_settings'),
      await checkModuleWithSettings('blog_posts', 'Blog', Newspaper, 'blog_settings'),
      await checkModuleWithSettings('events', 'Events', Calendar, 'event_settings'),
      await checkModuleWithSettings('awards', 'Awards', Award, 'awards_settings'),
      await checkModuleWithSettings('faqs', 'FAQ', HelpCircle, 'faq_settings'),
      await checkModuleWithSettings('newsletter_campaigns', 'Newsletter', Mail, 'newsletter_settings'),
      await checkModuleWithSettings('contact_submissions', 'Contact Forms', MessageSquare, 'admin_contact_form_settings'),
      await checkModuleWithSettings('tickets', 'Help Desk', Users, 'helpdesk_settings'),
      await checkModule('user_subscriptions', 'Subscriptions', Crown),
      await checkModule('themes', 'Themes', Palette),
      await checkModuleWithSettings('backup_jobs', 'Backup & Security', Shield, 'backup_settings'),
      await checkModuleWithSettings('aws_deployments', 'AWS Deployment', Cloud, 'aws_settings'),
      await checkDatabaseModule(),
      await checkStorageModule(),
      await checkRLSModule()
    ];

    const endTime = Date.now();
    const avgResponseTime = (endTime - startTime) / moduleChecks.length;
    
    setSystemMetrics({
      avgResponseTime: Math.round(avgResponseTime),
      totalRequests: moduleChecks.length,
      activeConnections: moduleChecks.filter(m => m.status === 'online').length
    });

    setModules(moduleChecks);
  };

  const checkAuthModule = async (): Promise<ModuleStatus> => {
    const startTime = Date.now();
    try {
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true });
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const responseTime = Date.now() - startTime;

      if (rolesError || profilesError) {
        return {
          id: 'auth',
          name: 'Authentication',
          icon: Lock,
          status: 'warning',
          lastUpdate: new Date(),
          dbSynced: false,
          responseTime,
          details: 'Role/Profile sync issues detected',
          troubleshootingSteps: [
            '1. Check if user_roles table exists and has RLS enabled',
            '2. Verify profiles table has proper foreign key to auth.users',
            '3. Check RLS policies on both tables',
            '4. Test with: SELECT * FROM user_roles LIMIT 1'
          ]
        };
      }

      return {
        id: 'auth',
        name: 'Authentication',
        icon: Lock,
        status: 'online',
        lastUpdate: new Date(),
        dbSynced: true,
        responseTime,
        details: 'Auth system operational'
      };
    } catch (error) {
      return {
        id: 'auth',
        name: 'Authentication',
        icon: Lock,
        status: 'offline',
        lastUpdate: new Date(),
        dbSynced: false,
        errorCount: 1,
        troubleshootingSteps: [
          '1. Check database connection',
          '2. Verify Supabase project is running',
          '3. Check auth service status in Supabase dashboard',
          '4. Review error logs in browser console'
        ]
      };
    }
  };

  const checkStorageModule = async (): Promise<ModuleStatus> => {
    try {
      const { data, error } = await supabase
        .storage
        .listBuckets();

      const avatarBucket = data?.find(b => b.id === 'avatars');

      return {
        id: 'storage',
        name: 'Storage & Files',
        icon: HardDrive,
        status: error ? 'warning' : 'online',
        lastUpdate: new Date(),
        recordCount: data?.length || 0,
        dbSynced: !error,
        details: avatarBucket ? `${data?.length || 0} buckets configured` : 'Buckets not configured',
        troubleshootingSteps: error ? [
          '1. Check storage service is enabled in Supabase',
          '2. Verify storage policies are configured',
          '3. Check bucket permissions',
          '4. Review storage limits in project settings'
        ] : undefined
      };
    } catch (error) {
      return {
        id: 'storage',
        name: 'Storage & Files',
        icon: HardDrive,
        status: 'offline',
        lastUpdate: new Date(),
        errorCount: 1,
        troubleshootingSteps: [
          '1. Enable storage in Supabase dashboard',
          '2. Create required storage buckets',
          '3. Configure storage policies',
          '4. Check API permissions'
        ]
      };
    }
  };

  const checkRLSModule = async (): Promise<ModuleStatus> => {
    try {
      // Check if RLS is enabled on critical tables
      const criticalTables = [
        'profiles', 'books', 'blog_posts', 'events', 
        'awards', 'contact_submissions', 'user_subscriptions'
      ];

      let rlsIssues = 0;
      const issueDetails: string[] = [];

      for (const table of criticalTables) {
        try {
          // Try to access the table
          const { error } = await supabase
            .from(table as any)
            .select('id', { count: 'exact', head: true })
            .limit(1);

          if (error && error.message.includes('policy')) {
            rlsIssues++;
            issueDetails.push(`${table}: RLS policy issue`);
          }
        } catch (err) {
          rlsIssues++;
        }
      }

      return {
        id: 'rls',
        name: 'Row Level Security',
        icon: Network,
        status: rlsIssues > 0 ? 'warning' : 'online',
        lastUpdate: new Date(),
        recordCount: criticalTables.length - rlsIssues,
        errorCount: rlsIssues,
        rlsEnabled: rlsIssues === 0,
        details: rlsIssues > 0 
          ? `${rlsIssues} tables with RLS issues` 
          : 'All tables properly secured',
        troubleshootingSteps: rlsIssues > 0 ? [
          '1. Run: ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY',
          '2. Create appropriate RLS policies for each table',
          '3. Test policies with different user roles',
          '4. Check Supabase dashboard > Authentication > Policies',
          ...issueDetails.map(d => `   - ${d}`)
        ] : undefined
      };
    } catch (error) {
      return {
        id: 'rls',
        name: 'Row Level Security',
        icon: Network,
        status: 'warning',
        lastUpdate: new Date(),
        errorCount: 1,
        troubleshootingSteps: [
          '1. Check database permissions',
          '2. Verify RLS is enabled on all user-facing tables',
          '3. Review security policies documentation'
        ]
      };
    }
  };

  const checkDatabaseModule = async (): Promise<ModuleStatus> => {
    const startTime = Date.now();
    try {
      // Check if we can connect to database
      const { error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .limit(1);

      const responseTime = Date.now() - startTime;

      return {
        id: 'database',
        name: 'Database',
        icon: Database,
        status: error ? 'warning' : 'online',
        lastUpdate: new Date(),
        dbSynced: !error,
        responseTime,
        details: error ? 'Connection issues' : `Response time: ${responseTime}ms`,
        troubleshootingSteps: error ? [
          '1. Check Supabase project status in dashboard',
          '2. Verify database is not paused',
          '3. Check connection pooling settings',
          '4. Review database logs for errors',
          '5. Test connection with: SELECT 1'
        ] : undefined
      };
    } catch (error) {
      return {
        id: 'database',
        name: 'Database',
        icon: Database,
        status: 'offline',
        lastUpdate: new Date(),
        dbSynced: false,
        troubleshootingSteps: [
          '1. Verify Supabase project is active',
          '2. Check API keys are correct',
          '3. Review network/firewall settings',
          '4. Check project billing status',
          '5. Contact Supabase support if issue persists'
        ]
      };
    }
  };

  const checkModuleWithSettings = async (
    table: string, 
    name: string, 
    icon: any, 
    settingsTable: string
  ): Promise<ModuleStatus> => {
    const startTime = Date.now();
    try {
      // Check main table
      const { count: dataCount, error: dataError } = await supabase
        .from(table as any)
        .select('*', { count: 'exact', head: true });

      // Check settings table
      const { data: settings, error: settingsError } = await supabase
        .from(settingsTable as any)
        .select('*')
        .limit(1)
        .single();

      const responseTime = Date.now() - startTime;
      const hasData = !dataError;
      const hasSettings = !settingsError && settings !== null;
      
      let status: 'online' | 'warning' | 'offline' = 'online';
      let details = 'Fully configured and synced';
      let troubleshootingSteps: string[] | undefined;

      if (!hasData && !hasSettings) {
        status = 'offline';
        details = 'Module offline - table and settings missing';
        troubleshootingSteps = [
          '1. Verify table exists in database',
          '2. Check RLS policies allow access',
          '3. Create settings table if missing',
          '4. Run database migrations',
          `5. Test query: SELECT * FROM ${table} LIMIT 1`
        ];
      } else if (!hasData) {
        status = 'warning';
        details = 'Table access issues';
        troubleshootingSteps = [
          '1. Check RLS policies on table',
          '2. Verify user has proper permissions',
          `3. Test: SELECT * FROM ${table} LIMIT 1`,
          '4. Check if table has any data'
        ];
      } else if (!hasSettings) {
        status = 'warning';
        details = 'Admin settings not configured';
        troubleshootingSteps = [
          '1. Navigate to admin settings page',
          `2. Configure ${name} settings`,
          '3. Save default configuration',
          `4. Verify settings in ${settingsTable} table`
        ];
      }

      return {
        id: table,
        name,
        icon,
        status,
        lastUpdate: new Date(),
        recordCount: dataCount || 0,
        hasSettings: true,
        settingsConfigured: hasSettings,
        dbSynced: hasData,
        responseTime,
        details,
        errorCount: (!hasData || !hasSettings) ? 1 : 0,
        troubleshootingSteps
      };
    } catch (error) {
      console.error(`Error checking ${table}:`, error);
      return {
        id: table,
        name,
        icon,
        status: 'offline',
        lastUpdate: new Date(),
        hasSettings: true,
        settingsConfigured: false,
        dbSynced: false,
        errorCount: 1,
        details: 'Module offline',
        troubleshootingSteps: [
          '1. Check database connection',
          '2. Verify table exists',
          '3. Review error logs',
          '4. Run database migrations',
          '5. Contact system administrator'
        ]
      };
    }
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
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="px-3"
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="px-3"
            >
              <TableIcon className="w-4 h-4" />
            </Button>
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
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-3xl font-bold text-blue-600">{systemMetrics.avgResponseTime}ms</p>
              </div>
              <Zap className="w-10 h-10 text-blue-500/20" />
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

      {/* Module Views */}
      {viewMode === 'cards' ? (
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

                  {module.hasSettings && (
                    <div className="pt-2 border-t border-border space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Admin Settings</span>
                        {module.settingsConfigured ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-500" />
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">DB Synced</span>
                        {module.dbSynced ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-500" />
                        )}
                      </div>
                    </div>
                  )}

                  {module.details && (
                    <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                      {module.details}
                    </p>
                  )}

                  {module.responseTime && (
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-muted-foreground">Response Time</span>
                      <span className="font-medium">{module.responseTime}ms</span>
                    </div>
                  )}

                  {module.troubleshootingSteps && module.troubleshootingSteps.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <span className="text-xs font-medium">Troubleshooting Steps:</span>
                      </div>
                      <div className="space-y-1">
                        {module.troubleshootingSteps.map((step, idx) => (
                          <p key={idx} className="text-xs text-muted-foreground pl-2">
                            {step}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Module Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Settings</TableHead>
                  <TableHead className="text-center">DB Sync</TableHead>
                  <TableHead className="text-right">Records</TableHead>
                  <TableHead className="text-right">Errors</TableHead>
                  <TableHead>Last Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((module) => (
                  <>
                    <TableRow key={module.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="p-2 bg-primary/10 rounded-lg inline-block">
                          <module.icon className="w-4 h-4 text-primary" />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{module.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(module.status)}
                          {getStatusBadge(module.status)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {module.hasSettings ? (
                          module.settingsConfigured ? (
                            <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {module.dbSynced !== undefined ? (
                          module.dbSynced ? (
                            <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {module.recordCount !== undefined ? module.recordCount : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {module.errorCount !== undefined && module.errorCount > 0 ? (
                          <span className="text-red-600 font-medium">{module.errorCount}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div>{module.lastUpdate.toLocaleTimeString()}</div>
                        {module.details && (
                          <div className="text-xs text-muted-foreground">{module.details}</div>
                        )}
                        {module.responseTime && (
                          <div className="text-xs text-blue-600">⚡ {module.responseTime}ms</div>
                        )}
                      </TableCell>
                    </TableRow>
                    {module.troubleshootingSteps && module.troubleshootingSteps.length > 0 && (
                      <TableRow className="bg-orange-50 dark:bg-orange-950/20">
                        <TableCell colSpan={8} className="py-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-2">
                                Troubleshooting Steps for {module.name}:
                              </p>
                              <div className="space-y-1">
                                {module.troubleshootingSteps.map((step, idx) => (
                                  <p key={idx} className="text-xs text-muted-foreground">
                                    {step}
                                  </p>
                                ))}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
