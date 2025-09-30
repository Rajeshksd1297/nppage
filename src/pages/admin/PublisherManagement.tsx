import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Building2, Settings, List, Users, Wrench, Shield, Palette, UserCog, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PublisherList from '@/components/admin/Publisher/PublisherList';
import PublisherSettings from '@/components/admin/Publisher/PublisherSettings';
import PublisherFieldManager from '@/components/admin/PublisherFieldManager';
import AuthorManagement from '@/components/admin/Publisher/AuthorManagement';
import FeatureAccess from '@/components/admin/Publisher/FeatureAccess';
import ToolsAccess from '@/components/admin/Publisher/ToolsAccess';
import BrandingOptions from '@/components/admin/Publisher/BrandingOptions';

export default function PublisherManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [applyingPlans, setApplyingPlans] = useState(false);

  // Real-time sync across all tabs
  useEffect(() => {
    const channel = supabase
      .channel('publisher_management_sync')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'publishers'
      }, () => {
        setRefreshKey(prev => prev + 1);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'publisher_settings'
      }, () => {
        setRefreshKey(prev => prev + 1);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'publisher_field_settings'
      }, () => {
        setRefreshKey(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const applyPublisherPlanToAllUsers = async () => {
    if (!confirm('Apply publisher plan to ALL existing users? This will update users who don\'t have a publisher plan.')) {
      return;
    }

    try {
      setApplyingPlans(true);

      // Get the first publisher plan
      const { data: publisherPlan, error: planError } = await supabase
        .from('subscription_plans')
        .select('id, name')
        .eq('is_publisher_plan', true)
        .limit(1)
        .maybeSingle();

      if (planError) throw planError;

      if (!publisherPlan) {
        toast({
          title: 'Error',
          description: 'No publisher plan found. Please create one first.',
          variant: 'destructive',
        });
        return;
      }

      // Get all users
      const { data: allUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id');

      if (usersError) throw usersError;

      let updatedCount = 0;
      let createdCount = 0;
      let skippedCount = 0;

      // Apply to all users
      for (const user of allUsers || []) {
        // Check if user has a subscription
        const { data: existingSub } = await supabase
          .from('user_subscriptions')
          .select('id, plan_id, subscription_plans!inner(is_publisher_plan)')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingSub) {
          // Check if they already have a publisher plan
          const hasPublisherPlan = (existingSub as any).subscription_plans?.is_publisher_plan;
          
          if (hasPublisherPlan) {
            skippedCount++;
            continue;
          }

          // Update to publisher plan
          const { error } = await supabase
            .from('user_subscriptions')
            .update({
              plan_id: publisherPlan.id,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);

          if (!error) updatedCount++;
        } else {
          // Create new subscription with publisher plan
          const { error } = await supabase
            .from('user_subscriptions')
            .insert({
              user_id: user.id,
              plan_id: publisherPlan.id,
              status: 'active',
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            });

          if (!error) createdCount++;
        }
      }

      toast({
        title: 'Publisher Plans Applied',
        description: `Updated: ${updatedCount}, Created: ${createdCount}, Skipped: ${skippedCount} users.`,
      });

    } catch (error: any) {
      console.error('Error applying publisher plans:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to apply publisher plans',
        variant: 'destructive',
      });
    } finally {
      setApplyingPlans(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="w-8 h-8" />
            Publisher Management
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Live Sync
            </div>
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage publishers, configure settings, and customize form fields
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={applyPublisherPlanToAllUsers}
            disabled={applyingPlans}
            variant="outline"
          >
            {applyingPlans ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Users className="h-4 w-4 mr-2" />
            )}
            Apply Publisher Plan to All Users
          </Button>
          <Button onClick={() => navigate('/admin/publishers/assign-users')}>
            <UserCog className="h-4 w-4 mr-2" />
            Assign Publisher Owners
          </Button>
        </div>
      </div>

      <Card>
        <Tabs defaultValue="publishers" className="w-full">
          <TabsList className="grid w-full grid-cols-6 h-auto">
            <TabsTrigger value="publishers" className="flex flex-col items-center gap-1 py-3">
              <List className="h-4 w-4" />
              <span className="text-xs">Publishers</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex flex-col items-center gap-1 py-3">
              <Building2 className="h-4 w-4" />
              <span className="text-xs">Profile & Branding</span>
            </TabsTrigger>
            <TabsTrigger value="authors" className="flex flex-col items-center gap-1 py-3">
              <Users className="h-4 w-4" />
              <span className="text-xs">Authors</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="flex flex-col items-center gap-1 py-3">
              <Shield className="h-4 w-4" />
              <span className="text-xs">Features</span>
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex flex-col items-center gap-1 py-3">
              <Wrench className="h-4 w-4" />
              <span className="text-xs">Tools</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex flex-col items-center gap-1 py-3">
              <Settings className="h-4 w-4" />
              <span className="text-xs">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="publishers" key={`publishers-${refreshKey}`}>
            <PublisherList />
          </TabsContent>

          <TabsContent value="profile" key={`profile-${refreshKey}`} className="space-y-6">
            <Tabs defaultValue="fields" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="fields">
                  Publisher Form Fields
                </TabsTrigger>
                <TabsTrigger value="branding">
                  Publisher Branding
                </TabsTrigger>
              </TabsList>

              <TabsContent value="fields" className="mt-6">
                <PublisherFieldManager />
              </TabsContent>

              <TabsContent value="branding" className="mt-6">
                <BrandingOptions />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="authors" key={`authors-${refreshKey}`}>
            <AuthorManagement />
          </TabsContent>

          <TabsContent value="features" key={`features-${refreshKey}`}>
            <FeatureAccess />
          </TabsContent>

          <TabsContent value="tools" key={`tools-${refreshKey}`}>
            <ToolsAccess />
          </TabsContent>

          <TabsContent value="settings" key={`settings-${refreshKey}`}>
            <PublisherSettings />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}