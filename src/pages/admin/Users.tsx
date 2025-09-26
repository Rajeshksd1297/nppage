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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
  Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserProfileDialog } from "@/components/admin/UserManagement/UserProfileDialog";
import { UserEditDialog } from "@/components/admin/UserManagement/UserEditDialog";
import { UserActions } from "@/components/admin/UserManagement/UserActions";

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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentTab, setCurrentTab] = useState("overview");
  const { toast } = useToast();

  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    bio: "",
    website_url: "",
    public_profile: true,
    role: "user"
  });

  useEffect(() => {
    fetchUsers();
  }, []);

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
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: updates.full_name,
          bio: updates.bio,
          website_url: updates.website_url,
          public_profile: updates.public_profile,
          specializations: updates.specializations
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Update role if changed
      if (updates.role) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesStatus = filterStatus === "all" ||
      (filterStatus === "active" && !user.blocked) ||
      (filterStatus === "blocked" && user.blocked) ||
      (filterStatus === "subscribed" && user.subscription?.status === "active") ||
      (filterStatus === "trial" && user.subscription?.status === "trialing");

    return matchesSearch && matchesRole && matchesStatus;
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
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="moderator">Moderator</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="subscribed">Subscribed</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">All Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {users.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{user.full_name || 'Unnamed User'}</p>
                        <p className="text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge variant="outline">
                        {new Date(user.created_at).toLocaleDateString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Regular Users</span>
                    <span className="font-medium">{users.filter(u => u.role === 'user').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Admins</span>
                    <span className="font-medium">{users.filter(u => u.role === 'admin').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Moderators</span>
                    <span className="font-medium">{users.filter(u => u.role === 'moderator').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Publisher Authors</span>
                    <span className="font-medium">{users.filter(u => u.publisher).length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Comprehensive user management</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No users found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? "Try adjusting your search terms" : "No users registered yet"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="Avatar" className="w-12 h-12 rounded-full" />
                          ) : (
                            <UsersIcon className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{user.full_name || 'Unnamed User'}</h4>
                            {user.blocked && <Badge variant="destructive">Blocked</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Joined {new Date(user.created_at).toLocaleDateString()}
                            </span>
                            {user.subscription && (
                              <span className="flex items-center gap-1">
                                <CreditCard className="h-3 w-3" />
                                {user.subscription.plan.name}
                              </span>
                            )}
                            {user.publisher && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {user.publisher.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={user.role === 'admin' ? 'default' : user.role === 'moderator' ? 'secondary' : 'outline'}>
                          {user.role}
                        </Badge>
                        
                        {user.subscription && (
                          <Badge variant={user.subscription.status === 'active' ? 'default' : 'secondary'}>
                            {user.subscription.status}
                          </Badge>
                        )}
                        
                        <UserActions
                          user={user}
                          onView={() => handleViewUser(user)}
                          onEdit={() => handleEditUser(user)}
                          onDelete={() => setDeleteUserId(user.id)}
                          onToggleBlock={() => toggleUserBlock(user.id, user.blocked || false)}
                          onUpdateRole={(role) => updateUser(user.id, { role })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Growth Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>This Month</span>
                    <span className="font-medium">
                      +{users.filter(u => new Date(u.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>This Week</span>
                    <span className="font-medium">
                      +{users.filter(u => new Date(u.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Today</span>
                    <span className="font-medium">
                      +{users.filter(u => new Date(u.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Active Subscriptions</span>
                    <span className="font-medium">{users.filter(u => u.subscription?.status === 'active').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trial Users</span>
                    <span className="font-medium">{users.filter(u => u.subscription?.status === 'trialing').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Conversion Rate</span>
                    <span className="font-medium">
                      {users.filter(u => u.subscription).length > 0 
                        ? Math.round((users.filter(u => u.subscription?.status === 'active').length / users.filter(u => u.subscription).length) * 100)
                        : 0}%
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