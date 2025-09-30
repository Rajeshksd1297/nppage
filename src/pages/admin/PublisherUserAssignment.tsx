import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, UserCog, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  publisher_id: string | null;
}

interface Publisher {
  id: string;
  name: string;
  owner_id: string | null;
  status: string;
}

export default function PublisherUserAssignment() {
  const [users, setUsers] = useState<User[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, email, full_name, publisher_id')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch publishers
      const { data: publishersData, error: publishersError } = await supabase
        .from('publishers')
        .select('id, name, owner_id, status')
        .order('name');

      if (publishersError) throw publishersError;

      setUsers(usersData || []);
      setPublishers(publishersData || []);

      // Initialize assignments with current owners
      const currentAssignments: Record<string, string> = {};
      (publishersData || []).forEach(pub => {
        if (pub.owner_id) {
          currentAssignments[pub.id] = pub.owner_id;
        }
      });
      setAssignments(currentAssignments);
    } catch (error) {
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

  const handleAssignment = (publisherId: string, userId: string) => {
    setAssignments({ ...assignments, [publisherId]: userId });
  };

  const handleSave = async (publisherId: string) => {
    try {
      const ownerId = assignments[publisherId] || null;

      const { error } = await supabase
        .from('publishers')
        .update({ owner_id: ownerId })
        .eq('id', publisherId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Publisher owner assigned successfully',
      });

      fetchData();
    } catch (error: any) {
      console.error('Error saving assignment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save assignment',
        variant: 'destructive',
      });
    }
  };

  const getOwnerInfo = (ownerId: string | null) => {
    if (!ownerId) return <Badge variant="outline">Not Assigned</Badge>;
    const owner = users.find(u => u.id === ownerId);
    return owner ? (
      <Badge variant="default">{owner.email}</Badge>
    ) : (
      <Badge variant="secondary">Unknown User</Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Publisher Owner Assignment
          </CardTitle>
          <CardDescription>
            Assign users as publisher owners to grant them access to Publisher Dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Publisher Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Current Owner</TableHead>
                  <TableHead>Assign Owner</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {publishers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No publishers found. Create a publisher first in Publisher Management.
                    </TableCell>
                  </TableRow>
                ) : (
                  publishers.map((publisher) => (
                    <TableRow key={publisher.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {publisher.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={publisher.status === 'active' ? 'default' : 'secondary'}>
                          {publisher.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getOwnerInfo(publisher.owner_id)}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={assignments[publisher.id] || ''}
                          onValueChange={(value) => handleAssignment(publisher.id, value)}
                        >
                          <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Select user..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None (Clear Assignment)</SelectItem>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.email} {user.full_name ? `(${user.full_name})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleSave(publisher.id)}
                          disabled={assignments[publisher.id] === publisher.owner_id}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">How it works:</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Assign a user as the owner of a publisher</li>
              <li>The assigned user will see "Publisher Dashboard" in their sidebar</li>
              <li>They can manage their publisher profile, authors, and public page</li>
              <li>Only active publishers are accessible by their owners</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
