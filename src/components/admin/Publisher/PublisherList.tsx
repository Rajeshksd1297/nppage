import { useState, useEffect } from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Eye, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Publisher {
  id: string;
  name: string;
  slug: string;
  contact_email: string;
  status: string;
  revenue_share_percentage: number;
  max_authors?: number;
  created_at: string;
  owner_id: string;
}

export default function PublisherList() {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [filteredPublishers, setFilteredPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPublisher, setSelectedPublisher] = useState<Publisher | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPublishers();
  }, []);

  useEffect(() => {
    filterPublishers();
  }, [publishers, searchTerm, statusFilter]);

  const fetchPublishers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('publishers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPublishers(data || []);
    } catch (error) {
      console.error('Error fetching publishers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load publishers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPublishers = () => {
    let filtered = publishers;

    if (searchTerm) {
      filtered = filtered.filter(pub => 
        pub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pub.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pub.contact_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(pub => pub.status === statusFilter);
    }

    setFilteredPublishers(filtered);
  };

  const handleStatusChange = async (publisherId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('publishers')
        .update({ status: newStatus })
        .eq('id', publisherId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Publisher status updated to ${newStatus}`,
      });

      fetchPublishers();
    } catch (error: any) {
      console.error('Error updating publisher status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update publisher status',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (publisherId: string) => {
    if (!confirm('Are you sure you want to delete this publisher?')) return;

    try {
      const { error } = await supabase
        .from('publishers')
        .delete()
        .eq('id', publisherId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Publisher deleted successfully',
      });

      fetchPublishers();
    } catch (error: any) {
      console.error('Error deleting publisher:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete publisher',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: 'default',
      pending: 'secondary',
      suspended: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <CardContent className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </CardContent>
    );
  }

  return (
    <>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>All Publishers</CardTitle>
            <CardDescription>
              Manage all registered publishers and their status
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-lg">
            {filteredPublishers.length} Publishers
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, slug, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Publishers Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Contact Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Revenue Share</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPublishers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No publishers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPublishers.map((publisher) => (
                  <TableRow key={publisher.id}>
                    <TableCell className="font-medium">{publisher.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{publisher.slug}</code>
                    </TableCell>
                    <TableCell>{publisher.contact_email}</TableCell>
                    <TableCell>{getStatusBadge(publisher.status)}</TableCell>
                    <TableCell>{publisher.revenue_share_percentage}%</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPublisher(publisher);
                            setIsDetailsOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {publisher.status === 'active' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(publisher.id, 'suspended')}
                          >
                            <XCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(publisher.id, 'active')}
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(publisher.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Publisher Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Publisher Details</DialogTitle>
            <DialogDescription>
              View complete information about this publisher
            </DialogDescription>
          </DialogHeader>
          {selectedPublisher && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <p className="text-sm font-medium mt-1">{selectedPublisher.name}</p>
                </div>
                <div>
                  <Label>Slug</Label>
                  <p className="text-sm font-medium mt-1">
                    <code className="bg-muted px-2 py-1 rounded">{selectedPublisher.slug}</code>
                  </p>
                </div>
                <div>
                  <Label>Contact Email</Label>
                  <p className="text-sm font-medium mt-1">{selectedPublisher.contact_email}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedPublisher.status)}</div>
                </div>
                <div>
                  <Label>Revenue Share</Label>
                  <p className="text-sm font-medium mt-1">{selectedPublisher.revenue_share_percentage}%</p>
                </div>
                <div>
                  <Label>Max Authors</Label>
                  <p className="text-sm font-medium mt-1">{selectedPublisher.max_authors || 'Unlimited'}</p>
                </div>
                <div className="col-span-2">
                  <Label>Created At</Label>
                  <p className="text-sm font-medium mt-1">
                    {new Date(selectedPublisher.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}