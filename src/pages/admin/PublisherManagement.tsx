import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Building2, Settings, List, Users, Wrench, Shield, Palette, UserCog } from 'lucide-react';
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
        <Button onClick={() => navigate('/admin/publishers/assign-users')}>
          <UserCog className="h-4 w-4 mr-2" />
          Assign Publisher Owners
        </Button>
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