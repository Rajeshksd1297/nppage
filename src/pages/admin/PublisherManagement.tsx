import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  Users, 
  Plus, 
  Edit, 
  Trash2,
  Search,
  Globe,
  DollarSign,
  UserPlus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Publisher {
  id: string;
  name: string;
  subdomain: string;
  logo_url?: string;
  brand_colors: any; // Using any for now since it's JSONB
  contact_email: string;
  website_url?: string;
  revenue_share_percentage: number;
  status: string;
  created_at: string;
  author_count?: number;
}

interface PublisherAuthor {
  id: string;
  publisher_id: string;
  user_id: string;
  role: string;
  revenue_share_percentage: number;
  joined_at: string;
  profiles: {
    full_name?: string;
    email?: string;
  };
}

export default function PublisherManagement() {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [publisherAuthors, setPublisherAuthors] = useState<PublisherAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPublisher, setSelectedPublisher] = useState<Publisher | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newPublisher, setNewPublisher] = useState({
    name: '',
    subdomain: '',
    contact_email: '',
    website_url: '',
    revenue_share_percentage: 30,
  });

  useEffect(() => {
    fetchPublishers();
  }, []);

  const fetchPublishers = async () => {
    try {
      const { data: publishersData, error: publishersError } = await supabase
        .from('publishers')
        .select(`
          *,
          publisher_authors(count)
        `)
        .order('created_at', { ascending: false });

      if (publishersError) throw publishersError;

      // Process the data to include author count
      const processedPublishers = publishersData?.map(publisher => ({
        ...publisher,
        author_count: Array.isArray(publisher.publisher_authors) ? publisher.publisher_authors.length : 0
      })) || [];

      setPublishers(processedPublishers);
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

  const fetchPublisherAuthors = async (publisherId: string) => {
    try {
      const { data, error } = await supabase
        .from('publisher_authors')
        .select(`
          *,
          profiles(full_name, email)
        `)
        .eq('publisher_id', publisherId)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      setPublisherAuthors(data || []);
    } catch (error) {
      console.error('Error fetching publisher authors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load publisher authors',
        variant: 'destructive',
      });
    }
  };

  const createPublisher = async () => {
    try {
      const { error } = await supabase
        .from('publishers')
        .insert([{
          ...newPublisher,
          brand_colors: {
            primary: '#000000',
            secondary: '#666666',
            accent: '#0066cc'
          }
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Publisher created successfully',
      });

      setIsCreateDialogOpen(false);
      setNewPublisher({
        name: '',
        subdomain: '',
        contact_email: '',
        website_url: '',
        revenue_share_percentage: 30,
      });
      fetchPublishers();
    } catch (error) {
      console.error('Error creating publisher:', error);
      toast({
        title: 'Error',
        description: 'Failed to create publisher',
        variant: 'destructive',
      });
    }
  };

  const updatePublisherStatus = async (publisherId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('publishers')
        .update({ status })
        .eq('id', publisherId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Publisher status updated to ${status}`,
      });

      fetchPublishers();
    } catch (error) {
      console.error('Error updating publisher status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update publisher status',
        variant: 'destructive',
      });
    }
  };

  const deletePublisher = async (publisherId: string) => {
    if (!confirm('Are you sure you want to delete this publisher? This action cannot be undone.')) {
      return;
    }

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
    } catch (error) {
      console.error('Error deleting publisher:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete publisher',
        variant: 'destructive',
      });
    }
  };

  const filteredPublishers = publishers.filter(publisher =>
    publisher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    publisher.subdomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    publisher.contact_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Publisher Management</h1>
          <p className="text-muted-foreground">Manage publisher accounts and author assignments</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Publisher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Publisher</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Publisher Name</Label>
                  <Input
                    id="name"
                    value={newPublisher.name}
                    onChange={(e) => setNewPublisher(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Penguin Random House"
                  />
                </div>
                <div>
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <Input
                    id="subdomain"
                    value={newPublisher.subdomain}
                    onChange={(e) => setNewPublisher(prev => ({ ...prev, subdomain: e.target.value }))}
                    placeholder="penguin"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={newPublisher.contact_email}
                  onChange={(e) => setNewPublisher(prev => ({ ...prev, contact_email: e.target.value }))}
                  placeholder="contact@publisher.com"
                />
              </div>
              
              <div>
                <Label htmlFor="website_url">Website URL</Label>
                <Input
                  id="website_url"
                  value={newPublisher.website_url}
                  onChange={(e) => setNewPublisher(prev => ({ ...prev, website_url: e.target.value }))}
                  placeholder="https://publisher.com"
                />
              </div>
              
              <div>
                <Label htmlFor="revenue_share">Revenue Share (%)</Label>
                <Input
                  id="revenue_share"
                  type="number"
                  min="0"
                  max="100"
                  value={newPublisher.revenue_share_percentage}
                  onChange={(e) => setNewPublisher(prev => ({ ...prev, revenue_share_percentage: parseFloat(e.target.value) }))}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createPublisher}>Create Publisher</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search publishers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Publishers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Publishers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {publishers.filter(p => p.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Authors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {publishers.reduce((sum, p) => sum + (p.author_count || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Revenue Share</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {publishers.length > 0
                ? (publishers.reduce((sum, p) => sum + p.revenue_share_percentage, 0) / publishers.length).toFixed(1)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Publishers List */}
      <Card>
        <CardHeader>
          <CardTitle>All Publishers</CardTitle>
          <CardDescription>Manage publisher accounts and settings</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPublishers.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No publishers found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search terms' : 'Create your first publisher to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPublishers.map((publisher) => (
                <div key={publisher.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{publisher.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        <span>{publisher.subdomain}.namyapage.com</span>
                        <span>•</span>
                        <Users className="h-3 w-3" />
                        <span>{publisher.author_count || 0} authors</span>
                        <span>•</span>
                        <DollarSign className="h-3 w-3" />
                        <span>{publisher.revenue_share_percentage}% revenue share</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created {new Date(publisher.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        publisher.status === 'active' ? 'default' :
                        publisher.status === 'inactive' ? 'secondary' : 'destructive'
                      }
                    >
                      {publisher.status}
                    </Badge>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPublisher(publisher);
                          fetchPublisherAuthors(publisher.id);
                        }}
                      >
                        <Users className="h-3 w-3 mr-1" />
                        Authors
                      </Button>
                      
                      <Select
                        value={publisher.status}
                        onValueChange={(value) => updatePublisherStatus(publisher.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePublisher(publisher.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Publisher Authors Dialog */}
      {selectedPublisher && (
        <Dialog open={!!selectedPublisher} onOpenChange={() => setSelectedPublisher(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedPublisher.name} - Authors</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-muted-foreground">
                  Manage authors under this publisher
                </p>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Author
                </Button>
              </div>
              
              {publisherAuthors.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No authors assigned</h3>
                  <p className="text-muted-foreground">
                    Add authors to this publisher to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {publisherAuthors.map((authorRel) => (
                    <div key={authorRel.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">
                          {authorRel.profiles?.full_name || 'Unnamed Author'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {authorRel.profiles?.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{authorRel.role}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {authorRel.revenue_share_percentage}% share
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}