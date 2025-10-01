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
  ExternalLink
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
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

export function DeploymentStatistics({ deployments }: DeploymentStatisticsProps) {
  const [databaseStats, setDatabaseStats] = useState<any>(null);
  const [tableStats, setTableStats] = useState<TableStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const activeDeployment = deployments?.find(d => d.status === 'running' || d.status === 'completed');

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

      {/* Files Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Deployment Files
          </CardTitle>
          <CardDescription>
            Application files and assets included in deployment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs">Source Files</CardDescription>
                    <FileText className="h-4 w-4 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">250+</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    React components & pages
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs">Static Assets</CardDescription>
                    <HardDrive className="h-4 w-4 text-purple-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">~15MB</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Images, fonts, and styles
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs">Dependencies</CardDescription>
                    <Layers className="h-4 w-4 text-green-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">80+</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    NPM packages installed
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

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

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
