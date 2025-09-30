import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2,
  Search,
  UserPlus,
  DollarSign,
  BookOpen,
  Building2,
  Crown,
  AlertCircle,
  Settings,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Mail,
  Globe,
  Palette,
  Shield,
  TrendingUp,
  Activity,
  CalendarDays,
  FileText,
  MoreHorizontal
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
  access_level: string;
  permissions: string[];
  last_active?: string;
  profiles: {
    full_name?: string;
    email?: string;
    slug?: string;
    avatar_url?: string;
  };
  books_count?: number;
  total_revenue?: number;
  monthly_earnings?: number;
}

interface PublisherInfo {
  id: string;
  name: string;
  subdomain: string;
  contact_email: string;
  website_url?: string;
  description?: string;
  revenue_share_percentage: number;
  status: string;
  max_authors: number;
  brand_colors: any;
  logo_url?: string;
  social_links?: any;
}

interface PublisherSettings {
  allow_author_submissions: boolean;
  require_approval_for_books: boolean;
  default_revenue_share: number;
  max_books_per_author: number;
  author_onboarding_enabled: boolean;
}

export default function PublisherDashboard() {
  const [publisherInfo, setPublisherInfo] = useState<PublisherInfo | null>(null);
  const [publisherSettings, setPublisherSettings] = useState<PublisherSettings>({
    allow_author_submissions: true,
    require_approval_for_books: false,
    default_revenue_share: 50,
    max_books_per_author: 10,
    author_onboarding_enabled: true,
  });
  const [authors, setAuthors] = useState<PublisherAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<PublisherAuthor | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [isAddAuthorDialogOpen, setIsAddAuthorDialogOpen] = useState(false);
  const [isEditPublisherDialogOpen, setIsEditPublisherDialogOpen] = useState(false);
  const [isAuthorDetailDialogOpen, setIsAuthorDetailDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [deleteConfirmAuthor, setDeleteConfirmAuthor] = useState<string | null>(null);
  const { toast } = useToast();
  const { subscription, isPro } = useSubscription();

  const [newAuthor, setNewAuthor] = useState({
    email: '',
    role: 'author',
    revenue_share_percentage: 50,
    access_level: 'author',
    permissions: ['read', 'write'],
  });

  const [editPublisher, setEditPublisher] = useState({
    name: '',
    subdomain: '',
    contact_email: '',
    website_url: '',
    description: '',
    brand_colors: { primary: '#000000', secondary: '#666666', accent: '#0066cc' },
    social_links: { twitter: '', linkedin: '', website: '' }
  });

  useEffect(() => {
    fetchPublisherData();
    fetchPublisherSettings();
    
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
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'publisher_settings'
      }, () => {
        console.log('⚙️ Publisher settings changed - refreshing settings...');
        fetchPublisherSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPublisherSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('publisher_settings')
        .select('*')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setPublisherSettings({
          allow_author_submissions: (data as any).allow_author_submissions ?? true,
          require_approval_for_books: (data as any).require_approval_for_books ?? false,
          default_revenue_share: data.default_revenue_share ?? 50,
          max_books_per_author: (data as any).max_books_per_author ?? 10,
          author_onboarding_enabled: (data as any).author_onboarding_enabled ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching publisher settings:', error);
    }
  };

  const fetchPublisherData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has publisher plan access
      if (!subscription?.subscription_plans?.name?.toLowerCase().includes('pro')) {
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
        const maxAuthors = (subscription?.subscription_plans as any)?.max_authors || 25;
        setPublisherInfo({
          ...publisherData,
          max_authors: maxAuthors
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
            status: (author as any).status || 'active',
            access_level: (author as any).access_level || 'author',
            permissions: (author as any).permissions || ['read', 'write'],
            last_active: (author as any).last_active || new Date().toISOString(),
            books_count: booksData?.length || 0,
            total_revenue: Math.random() * 1000, // Placeholder for revenue calculation
            monthly_earnings: Math.random() * 200 // Placeholder for monthly earnings
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

      // Validate required fields
      if (!editPublisher.name || !editPublisher.subdomain || !editPublisher.contact_email) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields (Name, Subdomain, Contact Email)',
          variant: 'destructive',
        });
        return;
      }

      // Validate subdomain format
      const subdomainRegex = /^[a-z0-9-]+$/;
      if (!subdomainRegex.test(editPublisher.subdomain)) {
        toast({
          title: 'Invalid Subdomain',
          description: 'Subdomain can only contain lowercase letters, numbers, and hyphens',
          variant: 'destructive',
        });
        return;
      }

      // Check if subdomain already exists
      const { data: existingPublisher } = await supabase
        .from('publishers')
        .select('id')
        .eq('subdomain', editPublisher.subdomain)
        .maybeSingle();

      if (existingPublisher) {
        toast({
          title: 'Subdomain Taken',
          description: 'This subdomain is already in use. Please choose another one.',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('publishers')
        .insert([{
          name: editPublisher.name.trim(),
          subdomain: editPublisher.subdomain.toLowerCase().trim(),
          contact_email: editPublisher.contact_email.trim(),
          website_url: editPublisher.website_url?.trim() || null,
          description: editPublisher.description?.trim() || null,
          brand_colors: editPublisher.brand_colors,
          social_links: editPublisher.social_links,
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
      // Reset form
      setEditPublisher({
        name: '',
        subdomain: '',
        contact_email: '',
        website_url: '',
        description: '',
        brand_colors: { primary: '#000000', secondary: '#666666', accent: '#0066cc' },
        social_links: { twitter: '', linkedin: '', website: '' }
      });
      fetchPublisherData();
    } catch (error: any) {
      console.error('Error creating publisher:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create publisher profile',
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
          ...(newAuthor.access_level && { access_level: newAuthor.access_level } as any),
          ...(newAuthor.permissions && { permissions: newAuthor.permissions } as any)
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
        access_level: 'author',
        permissions: ['read', 'write'],
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

  const updateAuthorStatus = async (authorId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('publisher_authors')
        .update({ 
          ...(newStatus && { status: newStatus })
        } as any)
        .eq('id', authorId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Author ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
      });

      fetchAuthors();
    } catch (error) {
      console.error('Error updating author status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update author status',
        variant: 'destructive',
      });
    }
  };

  const removeAuthor = async (authorId: string) => {
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

      setDeleteConfirmAuthor(null);
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

  const giveProAccess = async (authorId: string) => {
    try {
      const { error } = await supabase
        .from('publisher_authors')
        .update({ 
          access_level: 'pro',
          permissions: ['read', 'write', 'publish', 'analytics']
        } as any)
        .eq('id', authorId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Pro access granted successfully',
      });

      fetchAuthors();
    } catch (error) {
      console.error('Error granting pro access:', error);
      toast({
        title: 'Error',
        description: 'Failed to grant pro access',
        variant: 'destructive',
      });
    }
  };

  const filteredAuthors = authors.filter(author => {
    const matchesSearch = author.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      author.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      author.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || author.status === filterStatus;
    const matchesRole = filterRole === 'all' || author.role === filterRole;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  // Check if user has publisher plan access
  if (!subscription?.subscription_plans?.name?.toLowerCase().includes('pro') && !(subscription?.subscription_plans as any)?.is_publisher_plan) {
    return (
      <div className="space-y-6">
        <UpgradeBanner 
          message="Publisher features require a Pro plan with Publisher option enabled"
          feature="multi-author management and publisher tools"
        />
        <FeatureGate feature="custom_domain">
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
        <div className="flex gap-2">
          {publisherInfo && (
            <Button variant="outline" onClick={() => setIsSettingsDialogOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          )}
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
              Create your publisher profile to start managing authors and books. Get access to advanced features like multi-author management, revenue sharing, and custom branding.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <Users className="w-8 h-8" />
                <span>Manage Authors</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <DollarSign className="w-8 h-8" />
                <span>Revenue Sharing</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Globe className="w-8 h-8" />
                <span>Custom Branding</span>
              </div>
            </div>
            <Button onClick={() => setIsEditPublisherDialogOpen(true)} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Create Publisher Profile
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="authors">Authors</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Publisher Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Authors</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{authors.filter(a => a.status === 'active').length}</div>
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
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${authors.reduce((sum, author) => sum + (author.monthly_earnings || 0), 0).toFixed(0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {publisherInfo.revenue_share_percentage}% platform share
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

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your publishing operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => setIsAddAuthorDialogOpen(true)}
                    disabled={authors.length >= publisherInfo.max_authors}
                  >
                    <UserPlus className="h-6 w-6" />
                    <span>Add Author</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => setIsEditPublisherDialogOpen(true)}
                  >
                    <Edit className="h-6 w-6" />
                    <span>Edit Profile</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => setIsSettingsDialogOpen(true)}
                  >
                    <Settings className="h-6 w-6" />
                    <span>Settings</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                  >
                    <TrendingUp className="h-6 w-6" />
                    <span>Analytics</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="authors" className="space-y-6">
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
                {/* Filters */}
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
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="author">Author</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="contributor">Contributor</SelectItem>
                    </SelectContent>
                  </Select>
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
                      <div key={author.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            {author.profiles?.avatar_url ? (
                              <img src={author.profiles.avatar_url} alt="Avatar" className="w-12 h-12 rounded-lg object-cover" />
                            ) : (
                              <Users className="h-6 w-6 text-primary" />
                            )}
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
                              <span>${(author.total_revenue || 0).toFixed(2)} total</span>
                              <span>${(author.monthly_earnings || 0).toFixed(2)}/month</span>
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
                            onClick={() => {
                              setSelectedAuthor(author);
                              setIsAuthorDetailDialogOpen(true);
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateAuthorStatus(author.id, author.status === 'active' ? 'inactive' : 'active')}
                          >
                            {author.status === 'active' ? <EyeOff className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => giveProAccess(author.id)}
                            disabled={author.access_level === 'pro'}
                          >
                            <Crown className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteConfirmAuthor(author.id)}
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
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>Track your publishing performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Analytics Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Detailed analytics and revenue tracking will be available soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Publisher Settings</CardTitle>
                <CardDescription>Configure your publishing preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="author-submissions">Allow Author Submissions</Label>
                    <p className="text-sm text-muted-foreground">Allow authors to submit books for review</p>
                  </div>
                  <Switch
                    id="author-submissions"
                    checked={publisherSettings.allow_author_submissions}
                    onCheckedChange={(checked) => 
                      setPublisherSettings(prev => ({ ...prev, allow_author_submissions: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="require-approval">Require Book Approval</Label>
                    <p className="text-sm text-muted-foreground">All books must be approved before publishing</p>
                  </div>
                  <Switch
                    id="require-approval"
                    checked={publisherSettings.require_approval_for_books}
                    onCheckedChange={(checked) => 
                      setPublisherSettings(prev => ({ ...prev, require_approval_for_books: checked }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default-revenue">Default Revenue Share (%)</Label>
                  <Input
                    id="default-revenue"
                    type="number"
                    min="0"
                    max="100"
                    value={publisherSettings.default_revenue_share}
                    onChange={(e) => 
                      setPublisherSettings(prev => ({ ...prev, default_revenue_share: parseFloat(e.target.value) }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-books">Max Books per Author</Label>
                  <Input
                    id="max-books"
                    type="number"
                    min="1"
                    value={publisherSettings.max_books_per_author}
                    onChange={(e) => 
                      setPublisherSettings(prev => ({ ...prev, max_books_per_author: parseInt(e.target.value) }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Add Author Dialog */}
      <Dialog open={isAddAuthorDialogOpen} onOpenChange={setIsAddAuthorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Author</DialogTitle>
            <DialogDescription>
              Add an existing user as an author to your publishing house
            </DialogDescription>
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

            <div>
              <Label htmlFor="access_level">Access Level</Label>
              <Select
                value={newAuthor.access_level}
                onValueChange={(value) => setNewAuthor(prev => ({ ...prev, access_level: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="author">Author</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
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

      {/* Author Detail Dialog */}
      <Dialog open={isAuthorDetailDialogOpen} onOpenChange={setIsAuthorDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Author Details</DialogTitle>
          </DialogHeader>
          {selectedAuthor && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                  {selectedAuthor.profiles?.avatar_url ? (
                    <img src={selectedAuthor.profiles.avatar_url} alt="Avatar" className="w-16 h-16 rounded-lg object-cover" />
                  ) : (
                    <Users className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedAuthor.profiles?.full_name}</h3>
                  <p className="text-muted-foreground">{selectedAuthor.profiles?.email}</p>
                  <Badge variant={selectedAuthor.status === 'active' ? 'default' : 'secondary'}>
                    {selectedAuthor.status}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Role</Label>
                  <p className="capitalize">{selectedAuthor.role}</p>
                </div>
                <div>
                  <Label>Revenue Share</Label>
                  <p>{selectedAuthor.revenue_share_percentage}%</p>
                </div>
                <div>
                  <Label>Books Published</Label>
                  <p>{selectedAuthor.books_count || 0}</p>
                </div>
                <div>
                  <Label>Total Revenue</Label>
                  <p>${(selectedAuthor.total_revenue || 0).toFixed(2)}</p>
                </div>
                <div>
                  <Label>Joined Date</Label>
                  <p>{new Date(selectedAuthor.joined_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Access Level</Label>
                  <p className="capitalize">{selectedAuthor.access_level}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Publisher Dialog */}
      <Dialog open={isEditPublisherDialogOpen} onOpenChange={setIsEditPublisherDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {publisherInfo ? 'Edit Publisher Profile' : 'Create Publisher Profile'}
            </DialogTitle>
            <DialogDescription>
              {publisherInfo ? 'Update your publisher information' : 'Set up your publishing house profile'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">
                  Publisher Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={editPublisher.name}
                  onChange={(e) => setEditPublisher(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your Publishing House"
                  required
                />
              </div>
              <div>
                <Label htmlFor="subdomain">
                  Subdomain <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="subdomain"
                  value={editPublisher.subdomain}
                  onChange={(e) => setEditPublisher(prev => ({ ...prev, subdomain: e.target.value.toLowerCase() }))}
                  placeholder="yourpublisher"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Lowercase letters, numbers, and hyphens only
                </p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="contact_email">
                Contact Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact_email"
                type="email"
                value={editPublisher.contact_email}
                onChange={(e) => setEditPublisher(prev => ({ ...prev, contact_email: e.target.value }))}
                placeholder="contact@yourpublisher.com"
                required
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

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editPublisher.description}
                onChange={(e) => setEditPublisher(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Tell us about your publishing house..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditPublisherDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={publisherInfo ? () => {} : createPublisher}>
                {publisherInfo ? 'Update' : 'Create'} Publisher
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmAuthor} onOpenChange={() => setDeleteConfirmAuthor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Author</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this author from your publishing house? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmAuthor && removeAuthor(deleteConfirmAuthor)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Author
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}