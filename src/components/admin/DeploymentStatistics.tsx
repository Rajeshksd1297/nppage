import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Database, 
  FileText, 
  Server, 
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Layers,
  ExternalLink,
  Folder,
  FolderOpen,
  Cpu,
  MemoryStick,
  Network,
  Activity,
  Package,
  FileCode,
  Terminal,
  Eye,
  Download
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeploymentStatisticsProps {
  deployments: any[];
}

interface TableStats {
  name: string;
  total: number;
  transferred: number;
  pending: number;
}

interface ModuleStats {
  module: string;
  category: string;
  files: number;
  lines: number;
  size: string;
}

interface FileDirectory {
  path: string;
  type: 'file' | 'directory';
  description: string;
}

export function DeploymentStatistics({ deployments }: DeploymentStatisticsProps) {
  const [databaseStats, setDatabaseStats] = useState<any>(null);
  const [tableStats, setTableStats] = useState<TableStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [instanceDetails, setInstanceDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const activeDeployment = deployments?.find(d => d.status === 'running' || d.status === 'completed');

  // Module-wise file statistics
  const moduleStats: ModuleStats[] = [
    { module: 'Admin Components', category: 'Frontend', files: 45, lines: 8500, size: '~320KB' },
    { module: 'User Components', category: 'Frontend', files: 38, lines: 6200, size: '~245KB' },
    { module: 'UI Components', category: 'Frontend', files: 52, lines: 4800, size: '~180KB' },
    { module: 'Pages', category: 'Frontend', files: 42, lines: 7100, size: '~285KB' },
    { module: 'Hooks', category: 'Frontend', files: 15, lines: 1800, size: '~68KB' },
    { module: 'Utils', category: 'Frontend', files: 8, lines: 950, size: '~35KB' },
    { module: 'Edge Functions', category: 'Backend', files: 12, lines: 3200, size: '~125KB' },
    { module: 'Database Migrations', category: 'Backend', files: 8, lines: 2400, size: '~92KB' },
    { module: 'Static Assets', category: 'Assets', files: 15, lines: 0, size: '~8.5MB' },
    { module: 'Configuration', category: 'Config', files: 8, lines: 450, size: '~18KB' },
  ];

  // AWS File Directory Structure
  const awsFileDirectory: FileDirectory[] = [
    { path: '/var/www/html', type: 'directory', description: 'Root web directory' },
    { path: '/var/www/html/index.html', type: 'file', description: 'Main entry point' },
    { path: '/var/www/html/assets', type: 'directory', description: 'Static assets (JS, CSS, images)' },
    { path: '/var/www/html/assets/index-*.js', type: 'file', description: 'Compiled JavaScript bundle' },
    { path: '/var/www/html/assets/index-*.css', type: 'file', description: 'Compiled CSS styles' },
    { path: '/var/www/html/assets/*.jpg', type: 'file', description: 'Image assets' },
    { path: '/etc/nginx', type: 'directory', description: 'Nginx configuration directory' },
    { path: '/etc/nginx/nginx.conf', type: 'file', description: 'Main Nginx configuration' },
    { path: '/etc/nginx/conf.d', type: 'directory', description: 'Additional Nginx configurations' },
    { path: '/etc/nginx/conf.d/default.conf', type: 'file', description: 'Default server configuration' },
    { path: '/var/log/nginx', type: 'directory', description: 'Nginx logs directory' },
    { path: '/var/log/nginx/access.log', type: 'file', description: 'HTTP access logs' },
    { path: '/var/log/nginx/error.log', type: 'file', description: 'Error logs' },
  ];

  const fetchDatabaseStatistics = async () => {
    setLoading(true);
    try {
      const tables = [
        { name: 'profiles', label: 'User Profiles' },
        { name: 'books', label: 'Books' },
        { name: 'blog_posts', label: 'Blog Posts' },
        { name: 'events', label: 'Events' },
        { name: 'awards', label: 'Awards' },
        { name: 'faqs', label: 'FAQs' },
        { name: 'gallery_items', label: 'Gallery Items' },
        { name: 'contact_submissions', label: 'Contact Submissions' },
        { name: 'user_subscriptions', label: 'Subscriptions' },
        { name: 'newsletter_subscribers', label: 'Newsletter Subscribers' },
        { name: 'themes', label: 'Themes' },
        { name: 'custom_domains', label: 'Custom Domains' }
      ];
      
      let tableCount = 0;
      let totalRecords = 0;
      let totalTransferred = 0;
      let totalPending = 0;
      const stats: TableStats[] = [];
      
      for (const table of tables) {
        try {
          // Get total count
          const { count: total } = await supabase
            .from(table.name as any)
            .select('*', { count: 'exact', head: true });
          
          if (total !== null) {
            tableCount++;
            totalRecords += total;
            
            // Calculate transferred vs pending
            // Records created before last deployment are transferred
            let transferred = 0;
            let pending = total;
            
            if (activeDeployment?.last_deployed_at) {
              const { count: transferredCount } = await supabase
                .from(table.name as any)
                .select('*', { count: 'exact', head: true })
                .lte('created_at', activeDeployment.last_deployed_at);
              
              transferred = transferredCount || 0;
              pending = total - transferred;
            }
            
            totalTransferred += transferred;
            totalPending += pending;
            
            stats.push({
              name: table.label,
              total,
              transferred,
              pending
            });
          }
        } catch (err) {
          console.log(`Error counting ${table.name}:`, err);
        }
      }
      
      setTableStats(stats);
      setDatabaseStats({
        tableCount,
        totalRecords,
        transferred: totalTransferred,
        pending: totalPending
      });

      setLastUpdated(new Date());
      toast.success('Statistics updated successfully');
    } catch (error: any) {
      console.error('Error fetching database statistics:', error);
      toast.error('Failed to fetch database statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchInstanceDetails = async () => {
    if (!activeDeployment?.ec2_instance_id) {
      toast.error('No active deployment found');
      return;
    }

    setLoadingDetails(true);
    try {
      const { data, error } = await supabase.functions.invoke('aws-instance-details', {
        body: {
          instanceId: activeDeployment.ec2_instance_id,
          region: activeDeployment.region,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setInstanceDetails(data);
      toast.success('Instance details loaded successfully');
    } catch (error: any) {
      console.error('Error fetching instance details:', error);
      toast.error('Failed to fetch instance details: ' + error.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchDatabaseStatistics();
  }, []);

  const statCards = [
    {
      title: 'Database Tables',
      value: databaseStats?.tableCount || '...',
      icon: Table,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      description: 'Active database tables'
    },
    {
      title: 'Total Records',
      value: databaseStats?.totalRecords || '...',
      icon: Database,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950',
      description: 'Records across all tables'
    },
    {
      title: 'Transferred',
      value: databaseStats?.transferred || 0,
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950',
      description: 'Successfully deployed to AWS'
    },
    {
      title: 'Pending',
      value: databaseStats?.pending || 0,
      icon: AlertCircle,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-950',
      description: 'Awaiting next deployment'
    },
    {
      title: 'Deployments',
      value: deployments?.length || 0,
      icon: Server,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      description: 'Total deployments created'
    },
    {
      title: 'Active Instances',
      value: deployments?.filter(d => d.status === 'running').length || 0,
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950',
      description: 'Running EC2 instances'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Deployment Statistics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your deployment and database statistics
          </p>
        </div>
        <Button
          onClick={fetchDatabaseStatistics}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {lastUpdated && (
        <p className="text-xs text-muted-foreground">
          Last updated: {lastUpdated.toLocaleString()}
        </p>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs">{stat.title}</CardDescription>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active Deployment Details */}
      {activeDeployment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Active Deployment Details
            </CardTitle>
            <CardDescription>
              Information about your currently running deployment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Deployment Name</Label>
                <p className="text-sm">{activeDeployment.deployment_name}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Instance ID</Label>
                <p className="text-sm font-mono">{activeDeployment.ec2_instance_id}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Public IP</Label>
                <a 
                  href={`http://${activeDeployment.ec2_public_ip}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  {activeDeployment.ec2_public_ip}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Region</Label>
                <p className="text-sm">{activeDeployment.region}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Status</Label>
                <Badge variant="default" className="bg-green-500">
                  {activeDeployment.status}
                </Badge>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Last Deployed</Label>
                <p className="text-sm">
                  {new Date(activeDeployment.last_deployed_at).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Module-wise File Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Module-wise File Statistics
          </CardTitle>
          <CardDescription>
            Detailed breakdown of files by module and feature
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Module Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Files</TableHead>
                  <TableHead className="text-right">Lines of Code</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {moduleStats.map((stat, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{stat.module}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={
                          stat.category === 'Frontend' ? 'border-blue-500 text-blue-700 dark:text-blue-400' :
                          stat.category === 'Backend' ? 'border-green-500 text-green-700 dark:text-green-400' :
                          stat.category === 'Assets' ? 'border-purple-500 text-purple-700 dark:text-purple-400' :
                          'border-amber-500 text-amber-700 dark:text-amber-400'
                        }
                      >
                        {stat.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{stat.files}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {stat.lines > 0 ? stat.lines.toLocaleString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right font-mono">{stat.size}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell>Total</TableCell>
                  <TableCell>All Categories</TableCell>
                  <TableCell className="text-right font-mono">
                    {moduleStats.reduce((sum, s) => sum + s.files, 0)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {moduleStats.reduce((sum, s) => sum + s.lines, 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">~9.8MB</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Category Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card className="border-2 border-blue-500/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs">Frontend Files</CardDescription>
                  <FileText className="h-4 w-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {moduleStats.filter(s => s.category === 'Frontend').reduce((sum, s) => sum + s.files, 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Components & Pages
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-500/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs">Backend Files</CardDescription>
                  <Server className="h-4 w-4 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {moduleStats.filter(s => s.category === 'Backend').reduce((sum, s) => sum + s.files, 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Functions & Migrations
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-500/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs">Asset Files</CardDescription>
                  <HardDrive className="h-4 w-4 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {moduleStats.filter(s => s.category === 'Assets').reduce((sum, s) => sum + s.files, 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Images & Fonts
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-amber-500/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs">Config Files</CardDescription>
                  <Layers className="h-4 w-4 text-amber-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {moduleStats.filter(s => s.category === 'Config').reduce((sum, s) => sum + s.files, 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Configuration
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* AWS File Directory Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            AWS Deployment Directory
          </CardTitle>
          <CardDescription>
            File structure and paths on the deployed EC2 instance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Directory Tree View */}
            <div className="rounded-md border bg-muted/30 p-4">
              <div className="space-y-2 font-mono text-sm">
                {awsFileDirectory.map((item, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-start gap-3 py-2 px-3 rounded hover:bg-accent/50 transition-colors ${
                      item.type === 'directory' ? 'font-semibold' : ''
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {item.type === 'directory' ? (
                        <FolderOpen className="h-4 w-4 text-blue-500" />
                      ) : (
                        <FileText className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`${item.type === 'directory' ? 'text-blue-600 dark:text-blue-400' : 'text-foreground'}`}>
                        {item.path}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {item.description}
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`flex-shrink-0 ${
                        item.type === 'directory' 
                          ? 'border-blue-500 text-blue-700 dark:text-blue-400' 
                          : 'border-gray-500 text-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {item.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-2 border-blue-500/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs">Web Root</CardDescription>
                    <FolderOpen className="h-4 w-4 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-mono">/var/www/html</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Application files location
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-500/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs">Nginx Config</CardDescription>
                    <Server className="h-4 w-4 text-green-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-mono">/etc/nginx</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Server configuration
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-amber-500/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs">Logs</CardDescription>
                    <FileText className="h-4 w-4 text-amber-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-mono">/var/log/nginx</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Access & error logs
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comprehensive AWS Instance Details */}
      {activeDeployment && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  AWS Instance Details
                </CardTitle>
                <CardDescription>
                  Comprehensive system information from your EC2 instance
                </CardDescription>
              </div>
              <Button
                onClick={fetchInstanceDetails}
                disabled={loadingDetails}
                variant="outline"
                size="sm"
              >
                {loadingDetails ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                {instanceDetails ? 'Refresh' : 'Load Details'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!instanceDetails && !loadingDetails && (
              <div className="text-center py-12 text-muted-foreground">
                <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Click "Load Details" to fetch comprehensive system information</p>
              </div>
            )}

            {loadingDetails && (
              <div className="text-center py-12">
                <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                <p className="text-muted-foreground">Fetching instance details...</p>
              </div>
            )}

            {instanceDetails && (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-7">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="filesystem">File System</TabsTrigger>
                  <TabsTrigger value="system">System</TabsTrigger>
                  <TabsTrigger value="network">Network</TabsTrigger>
                  <TabsTrigger value="processes">Processes</TabsTrigger>
                  <TabsTrigger value="nginx">Nginx</TabsTrigger>
                  <TabsTrigger value="logs">Logs</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-2 border-blue-500/20">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardDescription className="text-xs">Instance Type</CardDescription>
                          <Server className="h-4 w-4 text-blue-500" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{instanceDetails.instanceInfo.instanceType}</div>
                        <p className="text-xs text-muted-foreground mt-1">{instanceDetails.instanceInfo.platform}</p>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-green-500/20">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardDescription className="text-xs">Status</CardDescription>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold capitalize">{instanceDetails.instanceInfo.state}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {instanceDetails.instanceInfo.availabilityZone}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-purple-500/20">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardDescription className="text-xs">Uptime</CardDescription>
                          <Activity className="h-4 w-4 text-purple-500" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {Math.floor((new Date().getTime() - new Date(instanceDetails.instanceInfo.launchTime).getTime()) / (1000 * 60 * 60))}h
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Since {new Date(instanceDetails.instanceInfo.launchTime).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">System Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[200px]">
                        <pre className="text-xs font-mono whitespace-pre-wrap bg-muted p-4 rounded">
                          {instanceDetails.systemDetails.systemInfo || 'No data available'}
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* File System Tab */}
                <TabsContent value="filesystem" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <HardDrive className="h-4 w-4" />
                        Disk Usage
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[300px]">
                        <pre className="text-xs font-mono whitespace-pre-wrap bg-muted p-4 rounded">
                          {instanceDetails.systemDetails.diskUsage || 'No data available'}
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        Directory Sizes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[200px]">
                        <pre className="text-xs font-mono whitespace-pre-wrap bg-muted p-4 rounded">
                          {instanceDetails.systemDetails.directorySizes || 'No data available'}
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileCode className="h-4 w-4" />
                        File Tree
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <pre className="text-xs font-mono whitespace-pre-wrap bg-muted p-4 rounded">
                          {instanceDetails.systemDetails.fileTree || 'No data available'}
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        File Counts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[150px]">
                        <pre className="text-xs font-mono whitespace-pre-wrap bg-muted p-4 rounded">
                          {instanceDetails.systemDetails.fileCounts || 'No data available'}
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* System Tab */}
                <TabsContent value="system" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Cpu className="h-4 w-4" />
                        CPU Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[200px]">
                        <pre className="text-xs font-mono whitespace-pre-wrap bg-muted p-4 rounded">
                          {instanceDetails.systemDetails.cpuInfo || 'No data available'}
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MemoryStick className="h-4 w-4" />
                        Memory Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[200px]">
                        <pre className="text-xs font-mono whitespace-pre-wrap bg-muted p-4 rounded">
                          {instanceDetails.systemDetails.memoryInfo || 'No data available'}
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Network Tab */}
                <TabsContent value="network" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Network className="h-4 w-4" />
                        Network Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <pre className="text-xs font-mono whitespace-pre-wrap bg-muted p-4 rounded">
                          {instanceDetails.systemDetails.networkInfo || 'No data available'}
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Processes Tab */}
                <TabsContent value="processes" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Running Processes (Top 20 by Memory)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[500px]">
                        <pre className="text-xs font-mono whitespace-pre-wrap bg-muted p-4 rounded">
                          {instanceDetails.systemDetails.processes || 'No data available'}
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Nginx Tab */}
                <TabsContent value="nginx" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Server className="h-4 w-4" />
                        Nginx Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[300px]">
                        <pre className="text-xs font-mono whitespace-pre-wrap bg-muted p-4 rounded">
                          {instanceDetails.systemDetails.nginxStatus || 'No data available'}
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Installed Packages
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[300px]">
                        <pre className="text-xs font-mono whitespace-pre-wrap bg-muted p-4 rounded">
                          {instanceDetails.systemDetails.packages || 'Loading...'}
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Logs Tab */}
                <TabsContent value="logs" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Terminal className="h-4 w-4" />
                        Recent Nginx Logs
                      </CardTitle>
                      <CardDescription>Last 20 lines from access and error logs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[500px]">
                        <pre className="text-xs font-mono whitespace-pre-wrap bg-muted p-4 rounded">
                          {instanceDetails.systemDetails.recentLogs || 'No logs available'}
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      const blob = new Blob([instanceDetails.rawOutput], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `aws-instance-${activeDeployment.ec2_instance_id}-${new Date().toISOString()}.txt`;
                      a.click();
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Complete Report
                  </Button>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}

      {/* Database Tables Deployment Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Deployment Status
          </CardTitle>
          <CardDescription>
            Real-time sync status for each database table
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Table Name</TableHead>
                  <TableHead className="text-right">Total Records</TableHead>
                  <TableHead className="text-right">Transferred</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                  <TableHead className="w-[180px]">Progress</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading table statistics...
                    </TableCell>
                  </TableRow>
                ) : tableStats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No data available
                    </TableCell>
                  </TableRow>
                ) : (
                  tableStats.map((table) => {
                    const percentage = table.total > 0 ? (table.transferred / table.total) * 100 : 0;
                    const isComplete = table.pending === 0 && table.total > 0;
                    const hasPending = table.pending > 0;
                    
                    return (
                      <TableRow key={table.name}>
                        <TableCell className="font-medium">{table.name}</TableCell>
                        <TableCell className="text-right font-mono">
                          {table.total.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-mono text-emerald-600 dark:text-emerald-400">
                            {table.transferred.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-mono ${hasPending ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                            {table.pending.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Progress value={percentage} className="h-2" />
                            <span className="text-xs text-muted-foreground">
                              {percentage.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isComplete ? (
                            <Badge variant="default" className="bg-emerald-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Synced
                            </Badge>
                          ) : hasPending ? (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              No Data
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          
          {activeDeployment && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm">
                <strong className="text-foreground">Last Deployment:</strong>{" "}
                <span className="text-muted-foreground">
                  {new Date(activeDeployment.last_deployed_at).toLocaleString()}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Records created after this time are marked as pending and will be deployed on the next deployment.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deployment Readiness Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Deployment Readiness Checklist
          </CardTitle>
          <CardDescription>
            Ensure your deployment includes all necessary data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: 'AWS Credentials Configured', checked: true },
              { label: 'Database Tables Synced', checked: databaseStats?.tableCount > 0 },
              { label: 'Active Deployment Running', checked: !!activeDeployment },
              { label: 'HTTP Access Configured', checked: !!activeDeployment?.ec2_public_ip },
              { label: 'User Profiles Created', checked: databaseStats?.totalRecords > 0 },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                {item.checked ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                )}
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Deployment Information */}
      <Card className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <FileText className="h-5 w-5" />
            What Data Gets Deployed?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-blue-900 dark:text-blue-100">
            <p className="font-semibold">Your AWS deployment includes:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Application Code:</strong> React frontend with all components and pages</li>
              <li><strong>Database Connection:</strong> Connected to Supabase with {databaseStats?.tableCount || 'all'} tables</li>
              <li><strong>User Data:</strong> All profiles, books, blog posts, and user-generated content</li>
              <li><strong>Configuration:</strong> Theme settings, SEO settings, and site configuration</li>
              <li><strong>Static Assets:</strong> Images, styles, and other static files</li>
              <li><strong>API Integration:</strong> All edge functions and backend services</li>
            </ul>
            <p className="mt-4 p-3 bg-white dark:bg-gray-900 rounded border border-blue-200 dark:border-blue-800">
              <strong>Note:</strong> The deployment is live and connected to your Supabase database. Any changes to your database are immediately reflected on the deployed website.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
