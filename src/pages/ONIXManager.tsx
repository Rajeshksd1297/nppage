import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Upload, 
  Download, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  RefreshCw,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePageAnalytics } from '@/hooks/useAnalytics';

interface ONIXJob {
  id: string;
  job_type: 'import' | 'export';
  filename: string;
  file_url?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  total_records: number;
  processed_records: number;
  successful_records: number;
  failed_records: number;
  error_log: any[];
  result_data?: any;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export default function ONIXManager() {
  const [jobs, setJobs] = useState<ONIXJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ONIXJob | null>(null);
  const { toast } = useToast();
  
  usePageAnalytics('dashboard', 'onix-manager');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('onix_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data?.map(job => ({
        ...job,
        job_type: job.job_type as 'import' | 'export',
        status: job.status as 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled',
        error_log: Array.isArray(job.error_log) ? job.error_log : []
      })) || []);
    } catch (error) {
      console.error('Error fetching ONIX jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ONIX jobs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/xml' || file.name.endsWith('.xml')) {
        setSelectedFile(file);
      } else {
        toast({
          title: 'Invalid file type',
          description: 'Please select an XML file for ONIX import',
          variant: 'destructive',
        });
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create a new ONIX job record
      const { data: jobData, error: jobError } = await supabase
        .from('onix_jobs')
        .insert({
          job_type: 'import' as const,
          filename: selectedFile.name,
          status: 'pending' as const,
          user_id: user.id,
          total_records: 0,
          processed_records: 0,
          successful_records: 0,
          failed_records: 0
        })
        .select()
        .single();

      if (jobError) throw jobError;

      toast({
        title: 'Import Started',
        description: 'Your ONIX file is being processed. This may take a while.',
      });

      setSelectedFile(null);
      fetchJobs();
    } catch (error) {
      console.error('Error starting ONIX import:', error);
      toast({
        title: 'Error',
        description: 'Failed to start ONIX import',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleExport = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: jobData, error: jobError } = await supabase
        .from('onix_jobs')
        .insert({
          job_type: 'export' as const,
          filename: `books_export_${new Date().toISOString().split('T')[0]}.xml`,
          status: 'pending' as const,
          user_id: user.id,
          total_records: 0,
          processed_records: 0,
          successful_records: 0,
          failed_records: 0
        })
        .select()
        .single();

      if (jobError) throw jobError;

      toast({
        title: 'Export Started',
        description: 'Your books are being exported to ONIX format.',
      });

      fetchJobs();
    } catch (error) {
      console.error('Error starting ONIX export:', error);
      toast({
        title: 'Error',
        description: 'Failed to start ONIX export',
        variant: 'destructive',
      });
    }
  };

  const cancelJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('onix_jobs')
        .update({ status: 'cancelled' })
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: 'Job Cancelled',
        description: 'The ONIX job has been cancelled',
      });

      fetchJobs();
    } catch (error) {
      console.error('Error cancelling job:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel job',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'processing':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">ONIX Manager</h1>
          <p className="text-muted-foreground">
            Import and export book metadata in ONIX format for distributors and retailers
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import ONIX
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import ONIX File</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="onix-file">Select ONIX XML File</Label>
                  <Input
                    id="onix-file"
                    type="file"
                    accept=".xml"
                    onChange={handleFileSelect}
                    className="mt-2"
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">ONIX import will:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Parse your ONIX XML file</li>
                    <li>Create or update book records</li>
                    <li>Import metadata like ISBN, title, description, etc.</li>
                    <li>Generate a detailed import report</li>
                  </ul>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    onClick={handleImport}
                    disabled={!selectedFile || uploading}
                  >
                    {uploading ? 'Starting Import...' : 'Start Import'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export ONIX
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobs.filter(j => j.status === 'completed').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobs.filter(j => j.status === 'processing').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Records Processed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobs.reduce((sum, job) => sum + job.successful_records, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="jobs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="jobs">Job History</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle>ONIX Jobs</CardTitle>
              <CardDescription>Track your import and export operations</CardDescription>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No ONIX jobs yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Import or export your first ONIX file to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div key={job.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(job.status)}
                          <div>
                            <h4 className="font-medium flex items-center gap-2">
                              {job.job_type === 'import' ? (
                                <Upload className="h-4 w-4" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                              {job.filename}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {job.job_type === 'import' ? 'Import' : 'Export'} • 
                              Started {new Date(job.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(job.status) as any}>
                            {job.status}
                          </Badge>
                          
                          {job.status === 'processing' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cancelJob(job.id)}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedJob(job)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Details
                          </Button>
                        </div>
                      </div>

                      {job.status === 'processing' && job.total_records > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{job.processed_records} / {job.total_records}</span>
                          </div>
                          <Progress 
                            value={(job.processed_records / job.total_records) * 100}
                            className="h-2"
                          />
                        </div>
                      )}

                      {job.status === 'completed' && (
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Total Records:</span>
                            <div className="font-medium">{job.total_records}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Successful:</span>
                            <div className="font-medium text-green-600">{job.successful_records}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Failed:</span>
                            <div className="font-medium text-red-600">{job.failed_records}</div>
                          </div>
                        </div>
                      )}

                      {job.status === 'failed' && job.error_log.length > 0 && (
                        <div className="mt-3 p-3 bg-destructive/10 rounded border border-destructive/20">
                          <p className="text-sm text-destructive font-medium mb-1">Errors:</p>
                          <ul className="text-xs text-destructive space-y-1">
                            {job.error_log.slice(0, 3).map((error, index) => (
                              <li key={index}>• {error.message || error}</li>
                            ))}
                            {job.error_log.length > 3 && (
                              <li>• ...and {job.error_log.length - 3} more errors</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>ONIX Templates</CardTitle>
              <CardDescription>Download sample ONIX files and documentation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">ONIX 3.0 Sample</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    A sample ONIX 3.0 file with common book metadata fields
                  </p>
                  <Button variant="outline" size="sm">
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">ONIX 2.1 Sample</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    A sample ONIX 2.1 file for legacy systems
                  </p>
                  <Button variant="outline" size="sm">
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Field Mapping Guide</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Documentation on how book fields map to ONIX elements
                  </p>
                  <Button variant="outline" size="sm">
                    <FileText className="h-3 w-3 mr-1" />
                    View Guide
                  </Button>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Bulk Upload Template</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    CSV template for bulk book uploads
                  </p>
                  <Button variant="outline" size="sm">
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Job Details Dialog */}
      {selectedJob && (
        <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Job Details: {selectedJob.filename}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Job Type</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedJob.job_type === 'import' ? (
                      <Upload className="h-4 w-4" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span className="capitalize">{selectedJob.job_type}</span>
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedJob.status)}
                    <Badge variant={getStatusColor(selectedJob.status) as any}>
                      {selectedJob.status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Total Records</Label>
                  <div className="text-2xl font-bold mt-1">{selectedJob.total_records}</div>
                </div>
                <div>
                  <Label>Processed</Label>
                  <div className="text-2xl font-bold mt-1">{selectedJob.processed_records}</div>
                </div>
                <div>
                  <Label>Successful</Label>
                  <div className="text-2xl font-bold text-green-600 mt-1">{selectedJob.successful_records}</div>
                </div>
                <div>
                  <Label>Failed</Label>
                  <div className="text-2xl font-bold text-red-600 mt-1">{selectedJob.failed_records}</div>
                </div>
              </div>

              {selectedJob.error_log.length > 0 && (
                <div>
                  <Label>Error Log</Label>
                  <div className="mt-2 max-h-40 overflow-y-auto p-3 bg-muted rounded border">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(selectedJob.error_log, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <Label>Created</Label>
                  <div className="mt-1">{new Date(selectedJob.created_at).toLocaleString()}</div>
                </div>
                {selectedJob.completed_at && (
                  <div>
                    <Label>Completed</Label>
                    <div className="mt-1">{new Date(selectedJob.completed_at).toLocaleString()}</div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}