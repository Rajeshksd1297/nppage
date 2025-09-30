import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2,
  Search,
  UserPlus,
  DollarSign,
  BookOpen,
  TrendingUp,
  Building2,
  Crown,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { FeatureGate } from '@/components/FeatureGate';
import { UpgradeBanner } from '@/components/UpgradeBanner';

interface PublisherAuthor {
  id: string;
  user_id: string;
  role: string;
  revenue_share_percentage: number;
  joined_at: string;
  status: string;
  profiles: {
    full_name?: string;
    email?: string;
    slug?: string;
  };
  books_count?: number;
  total_revenue?: number;
}

interface PublisherInfo {
  id: string;
  name: string;
  subdomain: string;
  contact_email: string;
  website_url?: string;
  revenue_share_percentage: number;
  status: string;
  max_authors: number;
  brand_colors: any;
}

export default function PublisherDashboard() {
  const [publisherInfo, setPublisherInfo] = useState<PublisherInfo | null>(null);
  const [authors, setAuthors] = useState<PublisherAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddAuthorDialogOpen, setIsAddAuthorDialogOpen] = useState(false);
  const [isEditPublisherDialogOpen, setIsEditPublisherDialogOpen] = useState(false);
  const { toast } = useToast();
  const { hasFeature, subscription, isPro } = useSubscription();

  const [newAuthor, setNewAuthor] = useState({
    email: '',
    role: 'author',
    revenue_share_percentage: 50,
  });

  const [editPublisher, setEditPublisher] = useState({
    name: '',
    subdomain: '',
    contact_email: '',
    website_url: '',
    brand_colors: { primary: '#000000', secondary: '#666666', accent: '#0066cc' }
  });

  useEffect(() => {
    fetchPublisherData();
    
    // Set up real-time sync for publisher plan changes
    const channel = supabase
      .channel('publisher_real_time_sync')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'subscription_plans'
      }, () => {
        console.log('📦 Package Management changed - refreshing publisher data...');
        fetchPublisherData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'publisher_authors'
      }, () => {
        console.log('👥 Publisher authors changed - refreshing data...');
        fetchAuthors();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPublisherData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has publisher plan access
      if (!hasFeature('multi_author_management')) {
        setLoading(false);
        return;
      }

      // Fetch publisher info for current user
      const { data: publisherData, error: publisherError } = await supabase
        .from('publishers')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (publisherError) throw publisherError;

      if (publisherData) {
        // Get max authors from subscription plan
        const maxAuthors = subscription?.subscription_plans?.max_authors || 0;
        setPublisherInfo({
          ...publisherData,
          max_authors: maxAuthors
        });
        setEditPublisher({
          name: publisherData.name,
          subdomain: publisherData.subdomain,
          contact_email: publisherData.contact_email,
          website_url: publisherData.website_url || '',
          brand_colors: publisherData.brand_colors || { primary: '#000000', secondary: '#666666', accent: '#0066cc' }
        });
        
        fetchAuthors();
      }
    } catch (error) {
      console.error('Error fetching publisher data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load publisher data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAuthors = async () => {
    if (!publisherInfo?.id) return;

    try {
      const { data, error } = await supabase
        .from('publisher_authors')
        .select(`
          *,
          profiles(full_name, email, slug)
        `)
        .eq('publisher_id', publisherInfo.id)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      // Fetch book counts for each author
      const authorsWithStats = await Promise.all(
        (data || []).map(async (author) => {
          const { data: booksData } = await supabase
            .from('books')
            .select('id')
            .eq('user_id', author.user_id);

          return {
            ...author,
            books_count: booksData?.length || 0,
            total_revenue: Math.random() * 1000 // Placeholder for revenue calculation
          };
        })
      );

      setAuthors(authorsWithStats);
    } catch (error) {
      console.error('Error fetching authors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load authors',
        variant: 'destructive',
      });
    }
  };

  const createPublisher = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('publishers')
        .insert([{
          ...editPublisher,
          owner_id: user.id,
          status: 'active',
          revenue_share_percentage: 30
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Publisher profile created successfully',
      });

      setIsEditPublisherDialogOpen(false);
      fetchPublisherData();
    } catch (error) {
      console.error('Error creating publisher:', error);
      toast({
        title: 'Error',
        description: 'Failed to create publisher profile',
        variant: 'destructive',
      });
    }
  };

  const updatePublisher = async () => {
    if (!publisherInfo?.id) return;

    try {
      const { error } = await supabase
        .from('publishers')
        .update(editPublisher)
        .eq('id', publisherInfo.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Publisher profile updated successfully',
      });

      setIsEditPublisherDialogOpen(false);
      fetchPublisherData();
    } catch (error) {
      console.error('Error updating publisher:', error);
      toast({
        title: 'Error',
        description: 'Failed to update publisher profile',
        variant: 'destructive',
      });
    }
  };

  const addAuthor = async () => {
    if (!publisherInfo?.id) return;

    try {
      // Check author limit
      if (authors.length >= publisherInfo.max_authors) {
        toast({
          title: 'Author Limit Reached',
          description: `Your plan allows up to ${publisherInfo.max_authors} authors. Upgrade to add more.`,
          variant: 'destructive',
        });
        return;
      }

      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newAuthor.email)
        .maybeSingle();

      if (userError) throw userError;
      if (!userData) {
        toast({
          title: 'User Not Found',
          description: 'No user found with this email address',
          variant: 'destructive',
        });
        return;
      }

      // Add author to publisher
      const { error } = await supabase
        .from('publisher_authors')
        .insert([{
          publisher_id: publisherInfo.id,
          user_id: userData.id,
          role: newAuthor.role,
          revenue_share_percentage: newAuthor.revenue_share_percentage,
          status: 'active'
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Author added successfully',
      });

      setIsAddAuthorDialogOpen(false);
      setNewAuthor({
        email: '',
        role: 'author',
        revenue_share_percentage: 50,
      });
      fetchAuthors();
    } catch (error) {
      console.error('Error adding author:', error);
      toast({
        title: 'Error',
        description: 'Failed to add author',
        variant: 'destructive',
      });
    }
  };

  const removeAuthor = async (authorId: string) => {
    if (!confirm('Are you sure you want to remove this author?')) return;

    try {
      const { error } = await supabase
        .from('publisher_authors')
        .delete()
        .eq('id', authorId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Author removed successfully',
      });

      fetchAuthors();
    } catch (error) {
      console.error('Error removing author:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove author',
        variant: 'destructive',
      });
    }
  };

  const filteredAuthors = authors.filter(author =>
    author.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    author.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    author.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if user has publisher plan access
  if (!hasFeature('multi_author_management')) {
    return (
      <div className="space-y-6">
        <UpgradeBanner 
          message="Publisher features require a Pro plan"
          feature="multi-author management and publisher tools"
        />
        <FeatureGate feature="multi_author_management">
          <div>Publisher Dashboard Content</div>
        </FeatureGate>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="w-8 h-8" />
            Publisher Dashboard
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              Real-time Sync
            </div>
          </h1>
          <p className="text-muted-foreground">
            {publisherInfo 
              ? `Manage your publishing house and ${authors.length}/${publisherInfo.max_authors} authors`
              : 'Set up your publisher profile and manage authors'
            }
          </p>
        </div>
        {publisherInfo ? (
          <Button onClick={() => setIsEditPublisherDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <Button onClick={() => setIsEditPublisherDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Setup Publisher
          </Button>
        )}
      </div>

      {!publisherInfo ? (
        /* Setup Publisher Card */
        <Card className="border-dashed border-primary/50">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Building2 className="w-6 h-6" />
              Set Up Your Publisher Profile
            </CardTitle>
            <CardDescription>
              Create your publisher profile to start managing authors and books
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setIsEditPublisherDialogOpen(true)} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Create Publisher Profile
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Publisher Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Authors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{authors.length}</div>
                <p className="text-xs text-muted-foreground">
                  of {publisherInfo.max_authors} allowed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Books</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {authors.reduce((sum, author) => sum + (author.books_count || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all authors
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue Share</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{publisherInfo.revenue_share_percentage}%</div>
                <p className="text-xs text-muted-foreground">
                  Average rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Plan Status</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-primary">
                  {subscription?.subscription_plans?.name || 'Free'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {publisherInfo.max_authors} authors max
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Author Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Author Management</CardTitle>
                  <CardDescription>
                    Manage authors under your publishing house ({authors.length}/{publisherInfo.max_authors} slots used)
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setIsAddAuthorDialogOpen(true)}
                  disabled={authors.length >= publisherInfo.max_authors}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Author
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search authors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Author Limit Warning */}
              {authors.length >= publisherInfo.max_authors * 0.8 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900">
                      Approaching Author Limit
                    </p>
                    <p className="text-sm text-amber-700">
                      You're using {authors.length} of {publisherInfo.max_authors} author slots. 
                      {authors.length >= publisherInfo.max_authors 
                        ? ' Upgrade your plan to add more authors.'
                        : ' Consider upgrading if you need more capacity.'
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Authors List */}
              {filteredAuthors.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {authors.length === 0 ? 'No authors yet' : 'No authors found'}
                  </h3>
                  <p className="text-muted-foreground">
                    {authors.length === 0 
                      ? 'Add your first author to start building your publishing network'
                      : 'Try adjusting your search terms'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAuthors.map((author) => (
                    <div key={author.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{author.profiles?.full_name || 'Unknown Author'}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{author.profiles?.email}</span>
                            <span>•</span>
                            <span className="capitalize">{author.role}</span>
                            <span>•</span>
                            <span>{author.revenue_share_percentage}% share</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <span>{author.books_count || 0} books</span>
                            <span>${(author.total_revenue || 0).toFixed(2)} revenue</span>
                            <span>Joined {new Date(author.joined_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={author.status === 'active' ? 'default' : 'secondary'}
                        >
                          {author.status}
                        </Badge>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeAuthor(author.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Add Author Dialog */}
      <Dialog open={isAddAuthorDialogOpen} onOpenChange={setIsAddAuthorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Author</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Author Email</Label>
              <Input
                id="email"
                type="email"
                value={newAuthor.email}
                onChange={(e) => setNewAuthor(prev => ({ ...prev, email: e.target.value }))}
                placeholder="author@example.com"
              />
              <p className="text-xs text-muted-foreground mt-1">
                The author must already be registered on the platform
              </p>
            </div>
            
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={newAuthor.role}
                onValueChange={(value) => setNewAuthor(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="author">Author</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="contributor">Contributor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="revenue_share">Revenue Share (%)</Label>
              <Input
                id="revenue_share"
                type="number"
                min="0"
                max="100"
                value={newAuthor.revenue_share_percentage}
                onChange={(e) => setNewAuthor(prev => ({ ...prev, revenue_share_percentage: parseFloat(e.target.value) }))}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddAuthorDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addAuthor}>
                Add Author
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Publisher Dialog */}
      <Dialog open={isEditPublisherDialogOpen} onOpenChange={setIsEditPublisherDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {publisherInfo ? 'Edit Publisher Profile' : 'Create Publisher Profile'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Publisher Name</Label>
                <Input
                  id="name"
                  value={editPublisher.name}
                  onChange={(e) => setEditPublisher(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your Publishing House"
                />
              </div>
              <div>
                <Label htmlFor="subdomain">Subdomain</Label>
                <Input
                  id="subdomain"
                  value={editPublisher.subdomain}
                  onChange={(e) => setEditPublisher(prev => ({ ...prev, subdomain: e.target.value }))}
                  placeholder="yourpublisher"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  yourpublisher.namyapage.com
                </p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={editPublisher.contact_email}
                onChange={(e) => setEditPublisher(prev => ({ ...prev, contact_email: e.target.value }))}
                placeholder="contact@yourpublisher.com"
              />
            </div>
            
            <div>
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                value={editPublisher.website_url}
                onChange={(e) => setEditPublisher(prev => ({ ...prev, website_url: e.target.value }))}
                placeholder="https://yourpublisher.com"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditPublisherDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={publisherInfo ? updatePublisher : createPublisher}>
                {publisherInfo ? 'Update' : 'Create'} Publisher
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}