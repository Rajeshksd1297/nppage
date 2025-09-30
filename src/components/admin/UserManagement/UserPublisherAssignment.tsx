import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Publisher {
  id: string;
  name: string;
  slug: string;
  status: string;
}

interface PublisherAuthor {
  id: string;
  publisher_id: string;
  status: string;
  role: string;
  publishers: Publisher;
}

interface UserPublisherAssignmentProps {
  userId: string;
}

export default function UserPublisherAssignment({ userId }: UserPublisherAssignmentProps) {
  const { toast } = useToast();
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [assignedPublishers, setAssignedPublishers] = useState<PublisherAuthor[]>([]);
  const [selectedPublisher, setSelectedPublisher] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPublishers();
    fetchAssignedPublishers();
  }, [userId]);

  const fetchPublishers = async () => {
    try {
      const { data, error } = await supabase
        .from('publishers')
        .select('id, name, slug, status')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setPublishers(data || []);
    } catch (error) {
      console.error('Error fetching publishers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load publishers',
        variant: 'destructive',
      });
    }
  };

  const fetchAssignedPublishers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('publisher_authors')
        .select(`
          id,
          publisher_id,
          status,
          role,
          publishers (
            id,
            name,
            slug,
            status
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;
      setAssignedPublishers(data || []);
    } catch (error) {
      console.error('Error fetching assigned publishers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assigned publishers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const assignPublisher = async () => {
    if (!selectedPublisher) {
      toast({
        title: 'Error',
        description: 'Please select a publisher',
        variant: 'destructive',
      });
      return;
    }

    // Check if already assigned
    const alreadyAssigned = assignedPublishers.some(
      (pa) => pa.publisher_id === selectedPublisher
    );

    if (alreadyAssigned) {
      toast({
        title: 'Already Assigned',
        description: 'This user is already assigned to the selected publisher',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      
      // Check if user exists
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        throw new Error('User not found');
      }

      const { error } = await supabase.from('publisher_authors').insert({
        user_id: userId,
        publisher_id: selectedPublisher,
        status: 'active',
        role: 'author',
      });

      if (error) {
        // Handle duplicate email or constraint violations
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          throw new Error('This assignment already exists');
        }
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Publisher assigned successfully',
      });

      setSelectedPublisher('');
      await fetchAssignedPublishers();
    } catch (error: any) {
      console.error('Error assigning publisher:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign publisher',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const unassignPublisher = async (publisherAuthorId: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('publisher_authors')
        .delete()
        .eq('id', publisherAuthorId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Publisher unassigned successfully',
      });

      await fetchAssignedPublishers();
    } catch (error) {
      console.error('Error unassigning publisher:', error);
      toast({
        title: 'Error',
        description: 'Failed to unassign publisher',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      pending: 'secondary',
      inactive: 'outline',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Assign New Publisher */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Assign Publisher
          </CardTitle>
          <CardDescription>
            Link this user to a publisher as an author
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={selectedPublisher} onValueChange={setSelectedPublisher}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a publisher" />
                </SelectTrigger>
                <SelectContent>
                  {publishers.map((publisher) => (
                    <SelectItem key={publisher.id} value={publisher.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {publisher.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={assignPublisher} disabled={saving || !selectedPublisher}>
              <Plus className="h-4 w-4 mr-2" />
              Assign
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Currently Assigned Publishers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Assigned Publishers
          </CardTitle>
          <CardDescription>
            Publishers this user is currently associated with
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignedPublishers.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This user is not assigned to any publisher yet.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {assignedPublishers.map((pa) => (
                <div
                  key={pa.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <h4 className="font-semibold">{pa.publishers.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {pa.role}
                        </Badge>
                        {getStatusBadge(pa.status)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unassignPublisher(pa.id)}
                    disabled={saving}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Unassign
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          When assigned to a publisher, the user can manage books and content under that
          publisher's account. They will appear in the publisher's author list and can
          collaborate on publishing activities.
        </AlertDescription>
      </Alert>
    </div>
  );
}
