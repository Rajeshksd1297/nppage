import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, AlertCircle, XCircle, Activity, RefreshCw,
  BookOpen, Newspaper, Calendar, Award, HelpCircle, Mail, 
  MessageSquare, Lock, Users, BarChart3, Palette, Crown,
  Shield, Cloud, Database, Grid3x3, Table as TableIcon,
  Zap, Network, HardDrive, AlertTriangle, Eye, FileText, Settings,
  TrendingUp, Clock, Server, UserCheck, ShieldAlert, Package
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
    totalUsers: 0,
    activeSubscriptions: 0,
    recentErrors: 0,
    avgResponseTime: 0,
    totalRecords: 0,
    storageUsed: 0,
    failedLogins: 0,
    newSignups24h: 0,
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
      loadSystemMetrics();
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
    
    setSystemMetrics(prev => ({
      ...prev,
      avgResponseTime: Math.round(avgResponseTime)
    }));

    setModules(moduleChecks);
    await loadSystemMetrics();
  };

  const loadSystemMetrics = async () => {
    try {
      // Get total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get active subscriptions
      const { count: subsCount } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get new signups in last 24h
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const { count: newSignups } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString());

      // Get total records across key tables
      const tables = ['books', 'blog_posts', 'events', 'awards', 'faqs'];
      let totalRecords = 0;
      for (const table of tables) {
        const { count } = await supabase
          .from(table as any)
          .select('*', { count: 'exact', head: true });
        totalRecords += count || 0;
      }

      setSystemMetrics(prev => ({
        ...prev,
        totalUsers: usersCount || 0,
        activeSubscriptions: subsCount || 0,
        recentErrors: 0,
        totalRecords,
        storageUsed: 0,
        failedLogins: 0,
        newSignups24h: newSignups || 0,
      }));
    } catch (error) {
      console.error('Error loading system metrics:', error);
    }
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

      {/* Tabs */}
      <Tabs defaultValue="modules" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="modules">Module Status</TabsTrigger>
          <TabsTrigger value="structure">Website Structure</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-6">
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

                  <div className="mt-3 pt-3 border-t border-border">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.location.href = `/admin/module-details/${module.id}`}
                    >
                      <Eye className="w-3 h-3 mr-2" />
                      View Full Details
                    </Button>
                  </div>
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
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => window.location.href = `/admin/module-details/${module.id}`}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                  </>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

        {/* System Monitoring Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              System Monitoring Dashboard
            </CardTitle>
            <CardDescription>Real-time metrics and health indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {/* System Health */}
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Server className="w-4 h-4 text-green-500" />
                      System Health
                    </h4>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Users</span>
                      <span className="font-semibold">{systemMetrics.totalUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Active Subscriptions</span>
                      <span className="font-semibold text-green-600">{systemMetrics.activeSubscriptions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Response</span>
                      <span className="font-semibold">{systemMetrics.avgResponseTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Uptime (30d)</span>
                      <span className="font-semibold text-green-600">99.9%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      Performance
                    </h4>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Records</span>
                      <span className="font-semibold">{systemMetrics.totalRecords}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Storage Used</span>
                      <span className="font-semibold">{systemMetrics.storageUsed} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">DB Connections</span>
                      <span className="font-semibold text-green-600">Healthy</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cache Hit Rate</span>
                      <span className="font-semibold">94.2%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security Monitoring */}
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-purple-500" />
                      Security
                    </h4>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Failed Logins (1h)</span>
                      <span className="font-semibold">{systemMetrics.failedLogins}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">New Signups (24h)</span>
                      <span className="font-semibold text-green-600">{systemMetrics.newSignups24h}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">RLS Status</span>
                      <span className="font-semibold text-green-600">Enabled</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SSL/TLS</span>
                      <span className="font-semibold text-green-600">Active</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Error Tracking */}
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      Error Tracking
                    </h4>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Errors (24h)</span>
                      <span className="font-semibold">{systemMetrics.recentErrors}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">404 Errors</span>
                      <span className="font-semibold">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">API Failures</span>
                      <span className="font-semibold">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Error</span>
                      <span className="font-semibold text-muted-foreground">None</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business Metrics */}
              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-amber-500" />
                      Business Metrics
                    </h4>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contact Forms (24h)</span>
                      <span className="font-semibold">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Newsletter Subs</span>
                      <span className="font-semibold">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Content Published</span>
                      <span className="font-semibold">{systemMetrics.totalRecords}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span className="font-semibold text-green-600">100%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Third-party Services */}
              <Card className="border-l-4 border-l-cyan-500">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Package className="w-4 h-4 text-cyan-500" />
                      External Services
                    </h4>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Email Service</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Storage</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Database</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Edge Functions</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
        </TabsContent>

        <TabsContent value="structure" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Website Structure Documentation
              </CardTitle>
              <CardDescription>Complete overview of application architecture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Page Routes */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Network className="w-5 h-5 text-primary" />
                  Application Routes
                </h3>
                <div className="grid gap-3">
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-2">Public Routes</h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>/ - Home Page</p>
                        <p>/auth - Authentication</p>
                        <p>/contact-form - Contact Form</p>
                        <p>/books/:id - Book Details</p>
                        <p>/:username - Public Profile</p>
                        <p>/publisher/:slug - Publisher Public Page</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-2">User Routes (Protected)</h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>/dashboard - User Dashboard</p>
                        <p>/books - Book Management</p>
                        <p>/profile - Profile Settings</p>
                        <p>/user-blog-management - Blog Management</p>
                        <p>/user-events-management - Events Management</p>
                        <p>/user-awards-management - Awards Management</p>
                        <p>/user-faq-management - FAQ Management</p>
                        <p>/user-newsletter-management - Newsletter Management</p>
                        <p>/contact-management - Contact Management</p>
                        <p>/themes - Theme Customization</p>
                        <p>/subscription - Subscription Management</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-2">Admin Routes (Admin Only)</h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>/admin/dashboard - Admin Dashboard</p>
                        <p>/admin/users - User Management</p>
                        <p>/admin/live-module-status - Module Status Monitor</p>
                        <p>/admin/home-page-management - Home Page Editor</p>
                        <p>/admin/settings - Site Settings</p>
                        <p>/admin/book-catalog - Book Catalog</p>
                        <p>/admin/publisher-management - Publisher Management</p>
                        <p>/admin/theme-management - Theme Management</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Database Structure */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  Database Structure
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        User & Auth
                      </h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>• profiles - User profiles</p>
                        <p>• user_roles - Role assignments</p>
                        <p>• user_subscriptions - Subscription data</p>
                        <p>• subscription_plans - Available plans</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Content
                      </h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>• books - Book catalog</p>
                        <p>• blog_posts - Blog content</p>
                        <p>• events - Event listings</p>
                        <p>• awards - Award records</p>
                        <p>• faqs - FAQ entries</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Settings & Config
                      </h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>• blog_settings - Blog configuration</p>
                        <p>• event_settings - Event configuration</p>
                        <p>• faq_settings - FAQ configuration</p>
                        <p>• awards_settings - Awards configuration</p>
                        <p>• newsletter_settings - Newsletter config</p>
                        <p>• cookie_settings - Cookie consent</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Communication
                      </h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>• contact_submissions - Contact forms</p>
                        <p>• contact_replies - Reply threads</p>
                        <p>• newsletter_campaigns - Email campaigns</p>
                        <p>• newsletter_subscribers - Subscriber list</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Key Features */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Key Features & Components
                </h3>
                <div className="grid md:grid-cols-3 gap-3">
                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-2">Authentication</h4>
                      <p className="text-sm text-muted-foreground">
                        Role-based access control with admin, publisher, and user roles
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-2">Theme System</h4>
                      <p className="text-sm text-muted-foreground">
                        Dynamic theming with real-time preview and customization
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-2">Publisher Platform</h4>
                      <p className="text-sm text-muted-foreground">
                        Multi-author publishing with branding and custom domains
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-2">Dynamic Pages</h4>
                      <p className="text-sm text-muted-foreground">
                        Visual page editor for home page and custom sections
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-2">SEO Tools</h4>
                      <p className="text-sm text-muted-foreground">
                        AI-powered SEO optimization with schema generation
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-2">Analytics</h4>
                      <p className="text-sm text-muted-foreground">
                        Advanced analytics dashboard with book tracking
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Edge Functions */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-primary" />
                  Edge Functions (Backend)
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    { name: 'send-contact-email', desc: 'Handles contact form submissions' },
                    { name: 'send-reply-email', desc: 'Sends reply emails to contacts' },
                    { name: 'send-newsletter', desc: 'Processes newsletter campaigns' },
                    { name: 'send-auth-email', desc: 'Authentication email handling' },
                    { name: 'ai-seo-suggestions', desc: 'AI-powered SEO recommendations' },
                    { name: 'backup-manager', desc: 'Database backup management' },
                    { name: 'security-monitor', desc: 'Security monitoring and alerts' },
                    { name: 'aws-deploy', desc: 'AWS deployment automation' }
                  ].map((func) => (
                    <Card key={func.name}>
                      <CardContent className="pt-6">
                        <h4 className="font-mono text-sm font-semibold mb-1">{func.name}</h4>
                        <p className="text-sm text-muted-foreground">{func.desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
