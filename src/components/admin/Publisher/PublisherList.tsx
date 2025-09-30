import { useState, useEffect } from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, UserPlus, UserMinus, RefreshCw, BookOpen, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronRight, CheckCircle, XCircle, Trash2, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Publisher {
  id: string;
  name: string;
  slug: string;
  contact_email: string;
  status: string;
  max_authors?: number;
  created_at: string;
  owner_id: string;
  author_count?: number;
  book_count?: number;
}

type SortField = 'name' | 'contact_email' | 'status' | 'author_count' | 'book_count' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function PublisherList() {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [filteredPublishers, setFilteredPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Publisher>>({});
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const { toast } = useToast();

  useEffect(() => {
    fetchPublishers();
  }, []);

  useEffect(() => {
    filterPublishers();
  }, [publishers, searchTerm, statusFilter, sortField, sortDirection]);

  const fetchPublishers = async () => {
    try {
      setLoading(true);
      const { data: publishersData, error } = await supabase
        .from('publishers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch author and book counts for each publisher
      const publishersWithCounts = await Promise.all(
        (publishersData || []).map(async (publisher) => {
          // Get author count
          const { count: authorCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('publisher_id', publisher.id);

          // Get book count
          const { count: bookCount } = await supabase
            .from('books')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', publisher.owner_id);

          return {
            ...publisher,
            author_count: authorCount || 0,
            book_count: bookCount || 0,
          };
        })
      );

      setPublishers(publishersWithCounts);
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
        pub.contact_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(pub => pub.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle undefined values
      if (aValue === undefined) aValue = 0;
      if (bValue === undefined) bValue = 0;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    setFilteredPublishers(filtered);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />;
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

  const handleEdit = (publisher: Publisher) => {
    setEditingRow(publisher.id);
    setEditForm({
      id: publisher.id,
      name: publisher.name,
      contact_email: publisher.contact_email,
      status: publisher.status,
    });
  };

  const handleSaveEdit = async () => {
    if (!editForm.id) return;

    try {
      const { error } = await supabase
        .from('publishers')
        .update({
          name: editForm.name,
          contact_email: editForm.contact_email,
          status: editForm.status,
        })
        .eq('id', editForm.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Publisher updated successfully',
      });

      setEditingRow(null);
      setEditForm({});
      fetchPublishers();
    } catch (error: any) {
      console.error('Error updating publisher:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update publisher',
        variant: 'destructive',
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditForm({});
  };

  const toggleExpand = (publisherId: string) => {
    setExpandedRow(expandedRow === publisherId ? null : publisherId);
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
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('name')}
                    className="h-8 flex items-center hover:bg-transparent p-0 font-semibold"
                  >
                    Name
                    <SortIcon field="name" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('contact_email')}
                    className="h-8 flex items-center hover:bg-transparent p-0 font-semibold"
                  >
                    Contact Email
                    <SortIcon field="contact_email" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('author_count')}
                    className="h-8 flex items-center hover:bg-transparent p-0 font-semibold"
                  >
                    Authors
                    <SortIcon field="author_count" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('book_count')}
                    className="h-8 flex items-center hover:bg-transparent p-0 font-semibold"
                  >
                    Books
                    <SortIcon field="book_count" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('status')}
                    className="h-8 flex items-center hover:bg-transparent p-0 font-semibold"
                  >
                    Status
                    <SortIcon field="status" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPublishers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No publishers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPublishers.map((publisher) => {
                  const isExpanded = expandedRow === publisher.id;
                  const isEditing = editingRow === publisher.id;

                  return (
                    <>
                      <TableRow key={publisher.id}>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(publisher.id)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">
                          {isEditing ? (
                            <Input
                              value={editForm.name || ''}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="h-8"
                            />
                          ) : (
                            publisher.name
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="email"
                              value={editForm.contact_email || ''}
                              onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
                              className="h-8"
                            />
                          ) : (
                            publisher.contact_email
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{publisher.author_count || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{publisher.book_count || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Select
                              value={editForm.status}
                              onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                            >
                              <SelectTrigger className="h-8 w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            getStatusBadge(publisher.status)
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {isEditing ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleSaveEdit}
                                >
                                  <Save className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCancelEdit}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(publisher)}
                                  title="Edit"
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                                {publisher.status === 'active' ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleStatusChange(publisher.id, 'suspended')}
                                    title="Suspend"
                                  >
                                    <XCircle className="h-4 w-4 text-destructive" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleStatusChange(publisher.id, 'active')}
                                    title="Activate"
                                  >
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(publisher.id)}
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/50">
                            <div className="p-4 space-y-3">
                              <h4 className="font-semibold text-sm">Publisher Details</h4>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <Label className="text-muted-foreground">Publisher ID</Label>
                                  <p className="font-mono text-xs mt-1">{publisher.id}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Authors</Label>
                                  <p className="mt-1">{publisher.author_count || 0} authors</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Books</Label>
                                  <p className="mt-1">{publisher.book_count || 0} books</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Max Authors</Label>
                                  <p className="mt-1">{publisher.max_authors || 'Unlimited'}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Created At</Label>
                                  <p className="mt-1">
                                    {new Date(publisher.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </>
  );
}