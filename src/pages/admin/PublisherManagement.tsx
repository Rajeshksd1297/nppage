import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Settings, List } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PublisherList from '@/components/admin/Publisher/PublisherList';
import PublisherSettings from '@/components/admin/Publisher/PublisherSettings';
import PublisherFieldManager from '@/components/admin/PublisherFieldManager';

export default function PublisherManagement() {
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
      </div>

      <Card>
        <Tabs defaultValue="publishers" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="publishers" className="flex flex-col items-center gap-1 py-3">
              <List className="h-4 w-4" />
              <span>Publishers</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex flex-col items-center gap-1 py-3">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
            <TabsTrigger value="fields" className="flex flex-col items-center gap-1 py-3">
              <Building2 className="h-4 w-4" />
              <span>Form Fields</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="publishers" key={`publishers-${refreshKey}`}>
            <PublisherList />
          </TabsContent>

          <TabsContent value="settings" key={`settings-${refreshKey}`}>
            <PublisherSettings />
          </TabsContent>

          <TabsContent value="fields" key={`fields-${refreshKey}`}>
            <PublisherFieldManager />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}