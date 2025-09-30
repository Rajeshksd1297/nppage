import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  User, 
  Package, 
  X, 
  Save, 
  RefreshCw,
  Crown,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Star,
  Building2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { emailSchema, validateFormData } from "@/utils/inputValidation";
import { z } from 'zod';
import { useSubscription } from '@/hooks/useSubscription';
import { useDynamicFeatures } from '@/hooks/useDynamicFeatures';
import UserPublisherAssignment from '@/components/admin/UserManagement/UserPublisherAssignment';

interface User {
  id: string;
  email: string;
  full_name?: string;
  bio?: string;
  website_url?: string;
  public_profile?: boolean;
  specializations?: string[];
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
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price_monthly: number;
  description?: string;
  features?: any;
}

export default function UserEdit() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshFeatures } = useDynamicFeatures();
  
  const [user, setUser] = useState<User | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSpecialization, setNewSpecialization] = useState("");
  
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    bio: "",
    website_url: "",
    public_profile: true,
    role: "user",
    specializations: [] as string[]
  });

  const [packageForm, setPackageForm] = useState({
    plan_id: "",
    status: "active",
    trial_ends_at: "",
    current_period_end: "",
    auto_convert_to_free: true
  });

  useEffect(() => {
    if (userId) {
      fetchUser();
      fetchPlans();
    }
  }, [userId]);

  // Set up real-time subscription for live updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user-edit-${userId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, 
        () => fetchUser()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'user_subscriptions', filter: `user_id=eq.${userId}` }, 
        () => fetchUser()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'user_roles', filter: `user_id=eq.${userId}` }, 
        () => fetchUser()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Fetch user role
      const { data: role, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      // Fetch user subscription
      const { data: subscription, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select(`
          id,
          status,
          plan_id,
          trial_ends_at,
          current_period_end,
          subscription_plans(name, price_monthly)
        `)
        .eq('user_id', userId)
        .single();

      const userData = {
        ...profile,
        role: role?.role || 'user',
        subscription: subscription ? {
          id: subscription.id,
          status: subscription.status,
          plan_id: subscription.plan_id,
          trial_ends_at: subscription.trial_ends_at,
          current_period_end: subscription.current_period_end,
          plan: subscription.subscription_plans
        } : null
      };

      setUser(userData);
      setFormData({
        full_name: userData.full_name || "",
        email: userData.email || "",
        bio: userData.bio || "",
        website_url: userData.website_url || "",
        public_profile: userData.public_profile ?? true,
        role: userData.role || "user",
        specializations: userData.specializations || []
      });

      setPackageForm({
        plan_id: userData.subscription?.plan_id || "",
        status: userData.subscription?.status || "active",
        trial_ends_at: userData.subscription?.trial_ends_at ? new Date(userData.subscription.trial_ends_at).toISOString().slice(0, 16) : "",
        current_period_end: userData.subscription?.current_period_end ? new Date(userData.subscription.current_period_end).toISOString().slice(0, 16) : "",
        auto_convert_to_free: true
      });

    } catch (error) {
      console.error('Error fetching user:', error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  const updateUser = async () => {
    try {
      setSaving(true);

      // Validate email
      if (formData.email) {
        const emailValidation = validateFormData({ email: formData.email }, z.object({ email: emailSchema }));
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
          full_name: formData.full_name,
          email: formData.email,
          bio: formData.bio,
          website_url: formData.website_url,
          public_profile: formData.public_profile,
          specializations: formData.specializations
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Update role
      const { error: deleteRoleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteRoleError) throw deleteRoleError;

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{
          user_id: userId,
          role: formData.role as any
        }]);

      if (roleError) throw roleError;

      toast({
        title: "Success",
        description: "User profile updated successfully",
      });

    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePackage = async () => {
    try {
      setSaving(true);

      if (!packageForm.plan_id) {
        toast({
          title: "Error",
          description: "Please select a plan",
          variant: "destructive",
        });
        return;
      }

      // Validate dates
      const now = new Date();
      let currentPeriodEnd = new Date();
      let trialEndsAt = null;

      if (packageForm.status === 'trialing') {
        if (!packageForm.trial_ends_at) {
          toast({
            title: "Error",
            description: "Trial end date is required for trialing status",
            variant: "destructive",
          });
          return;
        }
        trialEndsAt = new Date(packageForm.trial_ends_at);
        currentPeriodEnd = trialEndsAt;
      } else if (packageForm.status === 'active') {
        if (!packageForm.current_period_end) {
          // Default to 30 days from now if not specified
          currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        } else {
          currentPeriodEnd = new Date(packageForm.current_period_end);
        }
      }

      // Check if user has existing subscription
      if (user?.subscription?.id) {
        // Update existing subscription
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            plan_id: packageForm.plan_id,
            status: packageForm.status,
            current_period_start: now.toISOString(),
            current_period_end: currentPeriodEnd.toISOString(),
            trial_ends_at: trialEndsAt?.toISOString() || null,
            updated_at: now.toISOString()
          })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Create new subscription
        const { error } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            plan_id: packageForm.plan_id,
            status: packageForm.status,
            current_period_start: now.toISOString(),
            current_period_end: currentPeriodEnd.toISOString(),
            trial_ends_at: trialEndsAt?.toISOString() || null
          });

        if (error) throw error;
      }

      // Refresh features after package change
      await refreshFeatures();

      toast({
        title: "Success",
        description: `User subscription updated successfully. ${packageForm.status === 'active' && packageForm.auto_convert_to_free ? 'Will auto-convert to free after end date.' : ''}`,
      });

      // Refetch user data to show updated subscription
      await fetchUser();

    } catch (error) {
      console.error('Error updating package:', error);
      toast({
        title: "Error",
        description: "Failed to update user package",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addSpecialization = () => {
    if (newSpecialization.trim() && !formData.specializations.includes(newSpecialization.trim())) {
      setFormData(prev => ({
        ...prev,
        specializations: [...prev.specializations, newSpecialization.trim()]
      }));
      setNewSpecialization("");
    }
  };

  const removeSpecialization = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.filter(s => s !== spec)
    }));
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      trialing: "secondary",
      expired: "destructive",
      canceled: "outline"
    } as const;

    const icons = {
      active: CheckCircle,
      trialing: Clock,
      expired: AlertTriangle,
      canceled: X
    };

    const Icon = icons[status as keyof typeof icons] || CheckCircle;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "default"} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h2 className="text-2xl font-bold">User Not Found</h2>
        <p className="text-muted-foreground">The requested user could not be found.</p>
        <Button onClick={() => navigate('/admin/users')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/admin/users')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit User</h1>
            <p className="text-muted-foreground">Manage user profile and subscription package</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchUser} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={updateUser} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            Save Profile
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            User Profile
          </TabsTrigger>
          <TabsTrigger value="package" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Package Management
          </TabsTrigger>
          <TabsTrigger value="publisher" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Publisher
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Edit user profile details and permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="website_url">Website URL</Label>
                <Input
                  id="website_url"
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="public_profile">Public Profile</Label>
                  <Switch
                    id="public_profile"
                    checked={formData.public_profile}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, public_profile: checked }))}
                  />
                </div>
              </div>

              <div>
                <Label>Specializations</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newSpecialization}
                      onChange={(e) => setNewSpecialization(e.target.value)}
                      placeholder="Add specialization..."
                      onKeyPress={(e) => e.key === 'Enter' && addSpecialization()}
                    />
                    <Button onClick={addSpecialization} variant="outline">
                      Add
                    </Button>
                  </div>
                  {formData.specializations.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {formData.specializations.map((spec, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {spec}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 ml-1"
                            onClick={() => removeSpecialization(spec)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="package" className="space-y-6">
          {/* Current Subscription Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Current Subscription
              </CardTitle>
              <CardDescription>Live subscription status and details</CardDescription>
            </CardHeader>
            <CardContent>
              {user.subscription ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{user.subscription.plan.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        ${user.subscription.plan.price_monthly}/month
                      </p>
                    </div>
                    {getStatusBadge(user.subscription.status)}
                  </div>
                  
                  <Separator />
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    {user.subscription.trial_ends_at && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Trial Ends</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(user.subscription.trial_ends_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {user.subscription.current_period_end && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Current Period Ends</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(user.subscription.current_period_end).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No Active Subscription</h3>
                  <p className="text-muted-foreground">This user doesn't have an active subscription</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Package Management */}
          <Card>
            <CardHeader>
              <CardTitle>Change Package</CardTitle>
              <CardDescription>Update user's subscription plan and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="plan_id">Subscription Plan</Label>
                  <Select
                    value={packageForm.plan_id}
                    onValueChange={(value) => setPackageForm(prev => ({ ...prev, plan_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{plan.name}</span>
                            <span className="text-muted-foreground ml-2">
                              ${plan.price_monthly}/mo
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={packageForm.status}
                    onValueChange={(value) => setPackageForm(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="trialing">Trialing</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date Management */}
              <div className="grid gap-4 md:grid-cols-2">
                {packageForm.status === 'trialing' && (
                  <div>
                    <Label htmlFor="trial_ends_at">Trial End Date</Label>
                    <Input
                      id="trial_ends_at"
                      type="datetime-local"
                      value={packageForm.trial_ends_at}
                      onChange={(e) => setPackageForm(prev => ({ ...prev, trial_ends_at: e.target.value }))}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      When the trial period ends
                    </p>
                  </div>
                )}

                {(packageForm.status === 'active' || packageForm.status === 'trialing') && (
                  <div>
                    <Label htmlFor="current_period_end">
                      {packageForm.status === 'trialing' ? 'Period End (after trial)' : 'Active Period End'}
                    </Label>
                    <Input
                      id="current_period_end"
                      type="datetime-local"
                      value={packageForm.current_period_end}
                      onChange={(e) => setPackageForm(prev => ({ ...prev, current_period_end: e.target.value }))}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {packageForm.status === 'trialing' 
                        ? 'When the subscription will end if not upgraded' 
                        : 'When the active subscription expires'
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Auto-conversion setting */}
              {packageForm.status === 'active' && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="auto_convert_to_free"
                    checked={packageForm.auto_convert_to_free}
                    onChange={(e) => setPackageForm(prev => ({ ...prev, auto_convert_to_free: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="auto_convert_to_free" className="text-sm">
                    Auto-convert to Free plan after expiration
                  </Label>
                </div>
              )}

              {/* Current subscription info */}
              {user?.subscription && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Current Subscription Info</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>Plan:</span>
                      <span>{user.subscription.plan?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      {getStatusBadge(user.subscription.status)}
                    </div>
                    {user.subscription.trial_ends_at && (
                      <div className="flex justify-between">
                        <span>Trial Ends:</span>
                        <span>{new Date(user.subscription.trial_ends_at).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Period Ends:</span>
                      <span>{new Date(user.subscription.current_period_end).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={updatePackage} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Update Package
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Available Plans */}
          <Card>
            <CardHeader>
              <CardTitle>Available Plans</CardTitle>
              <CardDescription>All subscription plans in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      packageForm.plan_id === plan.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{plan.name}</h3>
                      {plan.price_monthly > 0 && (
                        <Star className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-2xl font-bold mb-2">
                      ${plan.price_monthly}
                      <span className="text-sm font-normal text-muted-foreground">/month</span>
                    </p>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="publisher" className="space-y-6">
          <UserPublisherAssignment userId={userId!} />
        </TabsContent>
      </Tabs>
    </div>
  );
}