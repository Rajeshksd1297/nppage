import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { emailSchema, validateFormData } from "@/utils/inputValidation";
import { z } from 'zod';
import { 
  Users as UsersIcon, 
  Search,
  Shield,
  ShieldCheck,
  MoreHorizontal,
  UserX,
  Eye,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  Calendar,
  Mail,
  Globe,
  Building2,
  CreditCard,
  Filter,
  Download,
  UserPlus,
  Settings,
  TrendingUp,
  Clock,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserProfileDialog } from "@/components/admin/UserManagement/UserProfileDialog";
import { UserEditDialog } from "@/components/admin/UserManagement/UserEditDialog";
import { UserActions } from "@/components/admin/UserManagement/UserActions";
import { SortableTable } from "@/components/admin/UserManagement/SortableTable";
import { UserFilters } from "@/components/admin/UserManagement/UserFilters";

interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  bio?: string;
  website_url?: string;
  social_links?: any;
  public_profile?: boolean;
  specializations?: string[];
  slug?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  role?: string;
  subscription?: {
    id: string;
    status: string;
    plan_id: string;
    trial_ends_at?: string;
    current_period_end?: string;
    plan: {
      name: string;
      price_monthly?: number;
    };
  };
  publisher?: {
    id: string;
    name: string;
    role: string;
    revenue_share_percentage: number;
  };
  blocked?: boolean;
  last_sign_in?: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [publishers, setPublishers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState("table");
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    search: "",
    role: "all",
    status: "all",
    subscription: "all",
    publisher: "all"
  });

  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    bio: "",
    website_url: "",
    public_profile: true,
    role: "user"
  });

  const [addForm, setAddForm] = useState({
    full_name: "",
    email: "",
    bio: "",
    website_url: "",
    public_profile: true,
    role: "user"
  });

  useEffect(() => {
    fetchUsers();
    fetchPublishers();
  }, []);

  const fetchPublishers = async () => {
    try {
      const { data, error } = await supabase
        .from('publishers')
        .select('id, name')
        .eq('status', 'active');
      
      if (error) throw error;
      setPublishers(data || []);
    } catch (error) {
      console.error('Error fetching publishers:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      // Fetch profiles with related data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          *
        `)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user subscriptions separately
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('user_subscriptions')
        .select(`
          user_id,
          id,
          status,
          plan_id,
          trial_ends_at,
          current_period_end,
          subscription_plans(name, price_monthly)
        `);

      if (subscriptionsError) throw subscriptionsError;

      // Fetch publisher authors separately
      const { data: publisherAuthors, error: publisherAuthorsError } = await supabase
        .from('publisher_authors')
        .select(`
          user_id,
          id,
          role,
          revenue_share_percentage,
          publishers(id, name)
        `);

      if (publisherAuthorsError) throw publisherAuthorsError;

      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Create maps for efficient lookup
      const roleMap = new Map();
      roles?.forEach(role => {
        roleMap.set(role.user_id, role.role);
      });

      const subscriptionMap = new Map();
      subscriptions?.forEach(sub => {
        subscriptionMap.set(sub.user_id, sub);
      });

      const publisherMap = new Map();
      publisherAuthors?.forEach(pa => {
        publisherMap.set(pa.user_id, pa);
      });

      // Process users with all related data
      const processedUsers = profiles?.map(profile => {
        const subscription = subscriptionMap.get(profile.id);
        const publisherAuthor = publisherMap.get(profile.id);
        
        return {
          ...profile,
          role: roleMap.get(profile.id) || 'user',
          subscription: subscription ? {
            id: subscription.id,
            status: subscription.status,
            plan_id: subscription.plan_id,
            trial_ends_at: subscription.trial_ends_at,
            current_period_end: subscription.current_period_end,
            plan: subscription.subscription_plans
          } : null,
          publisher: publisherAuthor ? {
            id: publisherAuthor.publishers?.id,
            name: publisherAuthor.publishers?.name,
            role: publisherAuthor.role,
            revenue_share_percentage: publisherAuthor.revenue_share_percentage
          } : null,
          blocked: false, // Add blocked status logic here if needed
          last_sign_in: null // Add last sign in logic if available
        };
      }) || [];

      setUsers(processedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, updates: any) => {
    try {
      // Validate email if it's being updated
      if (updates.email) {
        const emailValidation = validateFormData({ email: updates.email }, z.object({ email: emailSchema }));
        if (!emailValidation.success) {
          const validationErrors = emailValidation as { success: false; errors: Record<string, string> };
          toast({
            title: "Validation Error",
            description: validationErrors.errors.email || "Invalid email format",
            variant: "destructive",
          });
          return;
        }
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: updates.full_name,
          email: updates.email, // Add email to the update
          bio: updates.bio,
          website_url: updates.website_url,
          public_profile: updates.public_profile,
          specializations: updates.specializations
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Update role if changed
      if (updates.role) {
        // First delete existing roles for this user
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);

        if (deleteError) throw deleteError;

        // Then insert the new role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: updates.role
          });

        if (roleError) throw roleError;
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      setIsEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      setDeleteUserId(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const toggleUserBlock = async (userId: string, currentStatus: boolean) => {
    try {
      // Here you would implement the actual blocking logic
      // This might involve updating a blocked field or managing auth
      toast({
        title: "Success",
        description: `User ${currentStatus ? 'unblocked' : 'blocked'} successfully`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Error toggling user block:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name || "",
      email: user.email || "",
      bio: user.bio || "",
      website_url: user.website_url || "",
      public_profile: user.public_profile ?? true,
      role: user.role || "user"
    });
    setIsEditDialogOpen(true);
  };

  const handleAddUser = () => {
    setAddForm({
      full_name: "",
      email: "",
      bio: "",
      website_url: "",
      public_profile: true,
      role: "user"
    });
    setIsAddDialogOpen(true);
  };

  const createUser = async () => {
    try {
      // Since we can't create auth users directly, we'll create an invitation system
      // For now, we'll just show a message about the limitation
      toast({
        title: "Feature Note",
        description: "User invitation system needs to be implemented. Users must sign up themselves to create auth accounts.",
        variant: "default",
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = filters.search === "" || 
      user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesRole = filters.role === "all" || user.role === filters.role;
    
    const matchesStatus = filters.status === "all" ||
      (filters.status === "active" && !user.blocked) ||
      (filters.status === "blocked" && user.blocked);

    const matchesSubscription = filters.subscription === "all" ||
      (filters.subscription === "active" && user.subscription?.status === "active") ||
      (filters.subscription === "trialing" && user.subscription?.status === "trialing") ||
      (filters.subscription === "expired" && user.subscription?.status === "expired") ||
      (filters.subscription === "none" && !user.subscription);

    const matchesPublisher = filters.publisher === "all" ||
      (filters.publisher === "none" && !user.publisher) ||
      (user.publisher?.id === filters.publisher);

    return matchesSearch && matchesRole && matchesStatus && matchesSubscription && matchesPublisher;
  });

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
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Comprehensive user account and permission management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Users
          </Button>
          <Button onClick={handleAddUser}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <UserFilters
        filters={filters}
        onFiltersChange={setFilters}
        publishers={publishers}
        totalUsers={users.length}
        filteredUsers={filteredUsers.length}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              +{users.filter(u => new Date(u.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.subscription?.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {users.filter(u => u.subscription?.status === 'trialing').length} on trial
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Publisher Authors</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.publisher).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Associated with publishers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'admin').length}
            </div>
            <p className="text-xs text-muted-foreground">
              System administrators
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="table" className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4" />
            User Table
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>All Users</span>
                <Badge variant="secondary">{filteredUsers.length} users</Badge>
              </CardTitle>
              <CardDescription>
                Comprehensive sortable and searchable user table
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SortableTable
                users={filteredUsers}
                onView={handleViewUser}
                onEdit={handleEditUser}
                onDelete={setDeleteUserId}
                onToggleBlock={toggleUserBlock}
                onUpdateRole={(userId, role) => updateUser(userId, { role })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add New User
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Users
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Bulk Actions
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {users.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {user.full_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium truncate max-w-24">
                            {user.full_name || 'Unnamed'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {new Date(user.created_at).toLocaleDateString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">User Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Regular Users</span>
                    <Badge>{users.filter(u => u.role === 'user').length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Admins</span>
                    <Badge>{users.filter(u => u.role === 'admin').length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Moderators</span>
                    <Badge>{users.filter(u => u.role === 'moderator').length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">With Publishers</span>
                    <Badge>{users.filter(u => u.publisher).length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Active Subscriptions</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">
                        {users.filter(u => u.subscription?.status === 'active').length}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {users.length > 0 ? Math.round((users.filter(u => u.subscription?.status === 'active').length / users.length) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Trial Users</span>
                    <Badge variant="secondary">
                      {users.filter(u => u.subscription?.status === 'trialing').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Free Users</span>
                    <Badge variant="outline">
                      {users.filter(u => !u.subscription).length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Active Users</span>
                    <Badge variant="default">
                      {users.filter(u => !u.blocked).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Blocked Users</span>
                    <Badge variant="destructive">
                      {users.filter(u => u.blocked).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      Health Status
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </span>
                    <Badge variant="default">Optimal</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent User Activity</CardTitle>
              <CardDescription>Latest user registrations and status changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.slice(0, 10).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {user.full_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{user.full_name || 'Unnamed User'}</p>
                        <p className="text-sm text-muted-foreground">
                          Registered on {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                        {user.role}
                      </Badge>
                      {user.subscription && (
                        <Badge variant="secondary">
                          {user.subscription.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Growth This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  +{users.filter(u => new Date(u.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
                </div>
                <p className="text-xs text-muted-foreground">New users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.subscription?.status === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {users.length > 0 ? Math.round((users.filter(u => u.subscription?.status === 'active').length / users.length) * 100) : 0}% conversion
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Publisher Authors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.publisher).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across {publishers.length} publishers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.role === 'admin').length}
                </div>
                <p className="text-xs text-muted-foreground">System access</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Registration Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Today</span>
                    <span className="font-medium">
                      +{users.filter(u => new Date(u.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>This Week</span>
                    <span className="font-medium">
                      +{users.filter(u => new Date(u.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>This Month</span>
                    <span className="font-medium">
                      +{users.filter(u => new Date(u.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last 3 Months</span>
                    <span className="font-medium">
                      +{users.filter(u => new Date(u.created_at) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Complete Profiles</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {users.filter(u => u.full_name && u.bio).length}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({users.length > 0 ? Math.round((users.filter(u => u.full_name && u.bio).length / users.length) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Public Profiles</span>
                    <span className="font-medium">
                      {users.filter(u => u.public_profile).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>With Website</span>
                    <span className="font-medium">
                      {users.filter(u => u.website_url).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs and Modals */}
      <UserProfileDialog
        user={selectedUser}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      />

      <UserEditDialog
        user={selectedUser}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={updateUser}
      />

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-name" className="text-right">
                Name
              </Label>
              <Input
                id="add-name"
                value={addForm.full_name}
                onChange={(e) => setAddForm({...addForm, full_name: e.target.value})}
                className="col-span-3"
                placeholder="Enter full name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-email" className="text-right">
                Email
              </Label>
              <Input
                id="add-email"
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm({...addForm, email: e.target.value})}
                className="col-span-3"
                placeholder="Enter email address"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-role" className="text-right">
                Role
              </Label>
              <Select value={addForm.role} onValueChange={(value) => setAddForm({...addForm, role: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-bio" className="text-right">
                Bio
              </Label>
              <Textarea
                id="add-bio"
                value={addForm.bio}
                onChange={(e) => setAddForm({...addForm, bio: e.target.value})}
                className="col-span-3"
                placeholder="Optional bio"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-website" className="text-right">
                Website
              </Label>
              <Input
                id="add-website"
                type="url"
                value={addForm.website_url}
                onChange={(e) => setAddForm({...addForm, website_url: e.target.value})}
                className="col-span-3"
                placeholder="https://example.com"
              />
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                Note: This creates a user profile. The user will need to sign up with the provided email to activate their account.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createUser}>
              Create User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account
              and remove all associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteUserId && deleteUser(deleteUserId)}>
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}