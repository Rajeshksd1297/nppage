import { useState, useEffect } from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, UserPlus, UserMinus, RefreshCw, BookOpen, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Publisher {
  id: string;
  name: string;
  owner_id: string;
}

interface Author {
  id: string;
  full_name: string;
  email: string;
  publisher_id: string | null;
  created_at: string;
  book_count?: number;
  publisher_name?: string;
}

export default function AuthorManagement() {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [filteredAuthors, setFilteredAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPublisher, setSelectedPublisher] = useState<string>('all');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  const [newPublisherId, setNewPublisherId] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentPublisherId, setCurrentPublisherId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkUserRole();
  }, []);

  useEffect(() => {
    if (currentUserRole !== null) {
      fetchData();
    }
  }, [currentUserRole]);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if admin
      const { data: roleData } = await supabase.rpc('get_current_user_role');
      setCurrentUserRole(roleData);
      setIsAdmin(roleData === 'admin');

      // Check if user is a publisher owner
      if (roleData !== 'admin') {
        const { data: publisherData } = await supabase
          .from('publishers')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();
        
        if (publisherData) {
          setCurrentPublisherId(publisherData.id);
          setSelectedPublisher(publisherData.id); // Auto-select for publishers
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  useEffect(() => {
    filterAuthors();
  }, [authors, searchTerm, selectedPublisher]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch publishers
      let publishersQuery = supabase
        .from('publishers')
        .select('id, name, owner_id')
        .eq('status', 'active')
        .order('name');

      // If not admin, only fetch their own publisher
      if (!isAdmin && currentPublisherId) {
        publishersQuery = publishersQuery.eq('id', currentPublisherId);
      }

      const { data: publishersData, error: publishersError } = await publishersQuery;

      if (publishersError) throw publishersError;
      setPublishers(publishersData || []);

      // Fetch authors (profiles)
      let authorsQuery = supabase
        .from('profiles')
        .select(`
          id, 
          full_name, 
          email, 
          publisher_id, 
          created_at,
          publishers:publisher_id (name)
        `)
        .order('created_at', { ascending: false });

      // If not admin, only fetch authors from their publisher
      if (!isAdmin && currentPublisherId) {
        authorsQuery = authorsQuery.eq('publisher_id', currentPublisherId);
      }

      const { data: authorsData, error: authorsError } = await authorsQuery;

      if (authorsError) throw authorsError;

      // Get book counts for each author and format data
      const authorsWithCounts = await Promise.all(
        (authorsData || []).map(async (author: any) => {
          const { count } = await supabase
            .from('books')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', author.id);

          return {
            id: author.id,
            full_name: author.full_name,
            email: author.email,
            publisher_id: author.publisher_id,
            created_at: author.created_at,
            book_count: count || 0,
            publisher_name: author.publishers?.name || null,
          };
        })
      );

      setAuthors(authorsWithCounts);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAuthors = () => {
    let filtered = authors;

    if (searchTerm) {
      filtered = filtered.filter(
        (author) =>
          author.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          author.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedPublisher !== 'all') {
      if (selectedPublisher === 'unassigned') {
        filtered = filtered.filter((author) => !author.publisher_id);
      } else {
        filtered = filtered.filter((author) => author.publisher_id === selectedPublisher);
      }
    }

    setFilteredAuthors(filtered);
  };

  const handleAssignPublisher = async () => {
    if (!selectedAuthor) return;
    
    // For publishers, use their own publisher ID
    const publisherIdToAssign = isAdmin ? newPublisherId : currentPublisherId;
    
    if (!publisherIdToAssign) {
      toast({
        title: 'Error',
        description: 'No publisher selected',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ publisher_id: publisherIdToAssign })
        .eq('id', selectedAuthor.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Author assigned to publisher successfully',
      });

      setIsAssignDialogOpen(false);
      setSelectedAuthor(null);
      setNewPublisherId('');
      fetchData();
    } catch (error: any) {
      console.error('Error assigning publisher:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign publisher',
        variant: 'destructive',
      });
    }
  };

  const handleRemovePublisher = async (authorId: string) => {
    // Publishers cannot remove authors, only admins
    if (!isAdmin) {
      toast({
        title: 'Permission Denied',
        description: 'Only administrators can remove authors from publishers',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm('Remove this author from their publisher?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ publisher_id: null })
        .eq('id', authorId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Author removed from publisher',
      });

      fetchData();
    } catch (error: any) {
      console.error('Error removing publisher:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove publisher',
        variant: 'destructive',
      });
    }
  };

  const getPublisherName = (author: Author) => {
    if (!author.publisher_id) return <Badge variant="secondary">Unassigned</Badge>;
    return (
      <div className="flex items-center gap-2">
        <Building2 className="h-3 w-3" />
        <Badge variant="default">{author.publisher_name || 'Unknown'}</Badge>
      </div>
    );
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
            <CardTitle>
              {isAdmin ? 'Author Management' : 'My Authors'}
            </CardTitle>
            <CardDescription>
              {isAdmin 
                ? 'Assign authors to publishers and manage their associations'
                : 'Manage authors associated with your publisher'
              }
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-lg">
            {filteredAuthors.length} Authors
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select 
            value={selectedPublisher} 
            onValueChange={setSelectedPublisher}
            disabled={!isAdmin} // Publishers can't change filter
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by publisher" />
            </SelectTrigger>
            <SelectContent>
              {isAdmin && (
                <>
                  <SelectItem value="all">All Authors</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </>
              )}
              {publishers.map((pub) => (
                <SelectItem key={pub.id} value={pub.id}>
                  {pub.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Authors Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Author Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Publisher</TableHead>
                <TableHead>Books</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAuthors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No authors found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAuthors.map((author) => (
                  <TableRow key={author.id}>
                    <TableCell className="font-medium">{author.full_name || 'N/A'}</TableCell>
                    <TableCell>{author.email}</TableCell>
                    <TableCell>{getPublisherName(author)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <BookOpen className="h-3 w-3" />
                        {author.book_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {isAdmin && author.publisher_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemovePublisher(author.id)}
                            title="Remove from publisher"
                          >
                            <UserMinus className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedAuthor(author);
                            setNewPublisherId(author.publisher_id || '');
                            setIsAssignDialogOpen(true);
                          }}
                          title={author.publisher_id ? 'Change publisher' : 'Assign to publisher'}
                        >
                          <UserPlus className="h-4 w-4" />
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

      {/* Assign Publisher Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isAdmin ? 'Assign Publisher' : 'Add Author'}
            </DialogTitle>
            <DialogDescription>
              {isAdmin 
                ? `Assign ${selectedAuthor?.full_name} to a publisher`
                : `Add ${selectedAuthor?.full_name} to your publisher`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {isAdmin && (
              <div>
                <Label>Select Publisher</Label>
                <Select value={newPublisherId} onValueChange={setNewPublisherId}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose a publisher" />
                  </SelectTrigger>
                  <SelectContent>
                    {publishers.map((pub) => (
                      <SelectItem key={pub.id} value={pub.id}>
                        {pub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {!isAdmin && currentPublisherId && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  This author will be added to{' '}
                  <span className="font-semibold">
                    {publishers.find(p => p.id === currentPublisherId)?.name}
                  </span>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignPublisher} 
              disabled={isAdmin && !newPublisherId}
            >
              {isAdmin ? 'Assign' : 'Add Author'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
