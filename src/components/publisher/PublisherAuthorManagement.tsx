import { useState, useEffect } from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, UserPlus, Edit, UserMinus, BookOpen, Crown, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Author {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  book_count: number;
  subscription_plan?: string;
}

interface Props {
  publisherId: string;
}

export default function PublisherAuthorManagement({ publisherId }: Props) {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [filteredAuthors, setFilteredAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  const [newAuthorEmail, setNewAuthorEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [plans, setPlans] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchAuthors();
    fetchPlans();

    // Real-time sync
    const channel = supabase
      .channel('publisher_authors_sync')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `publisher_id=eq.${publisherId}`
      }, () => {
        fetchAuthors();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [publisherId]);

  useEffect(() => {
    filterAuthors();
  }, [authors, searchTerm]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly');

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchAuthors = async () => {
    try {
      setLoading(true);

      const { data: authorsData, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          created_at,
          user_subscriptions(plan_id, subscription_plans(name))
        `)
        .eq('publisher_id', publisherId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get book counts
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
            created_at: author.created_at,
            book_count: count || 0,
            subscription_plan: author.user_subscriptions?.[0]?.subscription_plans?.name || 'Free',
          };
        })
      );

      setAuthors(authorsWithCounts);
    } catch (error: any) {
      console.error('Error fetching authors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load authors',
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

    setFilteredAuthors(filtered);
  };

  const handleAddAuthor = async () => {
    if (!newAuthorEmail.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter author email',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Find author by email
      const { data: authorData, error: findError } = await supabase
        .from('profiles')
        .select('id, publisher_id')
        .eq('email', newAuthorEmail.trim())
        .maybeSingle();

      if (findError) throw findError;

      if (!authorData) {
        toast({
          title: 'Author Not Found',
          description: 'No user found with this email address',
          variant: 'destructive',
        });
        return;
      }

      if (authorData.publisher_id) {
        toast({
          title: 'Already Assigned',
          description: 'This author is already assigned to a publisher',
          variant: 'destructive',
        });
        return;
      }

      // Assign author to this publisher
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ publisher_id: publisherId })
        .eq('id', authorData.id);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: 'Author added to your publisher successfully',
      });

      setIsAddDialogOpen(false);
      setNewAuthorEmail('');
      fetchAuthors();
    } catch (error: any) {
      console.error('Error adding author:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add author',
        variant: 'destructive',
      });
    }
  };

  const handleAssignPlan = async () => {
    if (!selectedAuthor) return;

    try {
      const plan = plans.find(p => p.name.toLowerCase() === selectedPlan.toLowerCase());
      if (!plan) throw new Error('Plan not found');

      // Check existing subscription
      const { data: existing } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', selectedAuthor.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            plan_id: plan.id,
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', selectedAuthor.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_subscriptions')
          .insert([{
            user_id: selectedAuthor.id,
            plan_id: plan.id,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }]);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: `${selectedPlan} plan assigned to ${selectedAuthor.full_name}`,
      });

      setIsEditDialogOpen(false);
      setSelectedAuthor(null);
      fetchAuthors();
    } catch (error: any) {
      console.error('Error assigning plan:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign plan',
        variant: 'destructive',
      });
    }
  };

  const handleDeactivateAuthor = async (authorId: string) => {
    if (!confirm('Remove this author from your publisher?')) return;

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

      fetchAuthors();
    } catch (error: any) {
      console.error('Error removing author:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove author',
        variant: 'destructive',
      });
    }
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
            <CardTitle>Manage Authors</CardTitle>
            <CardDescription>
              Add, edit, and manage authors under your publisher
            </CardDescription>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Author
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search authors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Authors Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
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
                    <TableCell>
                      <Badge variant={author.subscription_plan === 'Pro' ? 'default' : 'secondary'}>
                        {author.subscription_plan === 'Pro' && <Crown className="h-3 w-3 mr-1" />}
                        {author.subscription_plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <BookOpen className="h-3 w-3" />
                        {author.book_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedAuthor(author);
                            setSelectedPlan(author.subscription_plan?.toLowerCase() || 'free');
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivateAuthor(author.id)}
                        >
                          <UserMinus className="h-4 w-4 text-destructive" />
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

      {/* Add Author Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Author</DialogTitle>
            <DialogDescription>
              Enter the email of the author you want to add to your publisher
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Author Email</Label>
              <Input
                type="email"
                value={newAuthorEmail}
                onChange={(e) => setNewAuthorEmail(e.target.value)}
                placeholder="author@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAuthor}>
              Add Author
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Author / Assign Plan Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Plan to {selectedAuthor?.full_name}</DialogTitle>
            <DialogDescription>
              Select a subscription plan for this author
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subscription Plan</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {plans.filter(plan => plan.name && plan.name.trim()).map(plan => (
                    <SelectItem key={plan.id} value={plan.name.toLowerCase()}>
                      {plan.name} - ${plan.price_monthly}/month
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignPlan}>
              Assign Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
