import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Building2, Users, Settings, Globe, Package, Palette, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PublisherProfileEditor from '@/components/publisher/PublisherProfileEditor';
import PublisherAuthorManagement from '@/components/publisher/PublisherAuthorManagement';
import PublisherPublicPage from '@/components/publisher/PublisherPublicPage';
import PublisherSettings from '@/components/publisher/PublisherSettings';
import PublisherBranding from '@/components/publisher/PublisherBranding';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PublisherDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [publisher, setPublisher] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    checkPublisherAccess();
  }, []);

  useEffect(() => {
    if (publisher) {
      // Real-time sync
      const channel = supabase
        .channel('publisher_dashboard_sync')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'publishers',
          filter: `id=eq.${publisher.id}`
        }, () => {
          setRefreshKey(prev => prev + 1);
          fetchPublisherData();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `publisher_id=eq.${publisher.id}`
        }, () => {
          setRefreshKey(prev => prev + 1);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [publisher]);

  const checkPublisherAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check if user owns a publisher
      const { data: publisherData, error } = await supabase
        .from('publishers')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!publisherData) {
        toast({
          title: 'No Publisher Found',
          description: 'You need to be assigned as a publisher owner.',
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }

      setPublisher(publisherData);
    } catch (error: any) {
      console.error('Error checking publisher access:', error);
      toast({
        title: 'Error',
        description: 'Failed to load publisher data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPublisherData = async () => {
    if (!publisher?.id) return;

    try {
      const { data, error } = await supabase
        .from('publishers')
        .select('*')
        .eq('id', publisher.id)
        .single();

      if (error) throw error;
      setPublisher(data);
    } catch (error) {
      console.error('Error refreshing publisher data:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading publisher dashboard...</div>
      </div>
    );
  }

  if (!publisher) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="w-8 h-8" />
            {publisher.name}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Live Sync
            </div>
          </h1>
          <p className="text-muted-foreground mt-1">
            Publisher Dashboard - Manage your authors, profile, and public presence
          </p>
        </div>
        <div className="flex items-center gap-2">
          {publisher.status !== 'active' && (
            <Alert className="w-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Status: {publisher.status}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      <Card>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="profile" className="flex flex-col items-center gap-1 py-3">
              <Building2 className="h-4 w-4" />
              <span className="text-xs">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="authors" className="flex flex-col items-center gap-1 py-3">
              <Users className="h-4 w-4" />
              <span className="text-xs">Authors</span>
            </TabsTrigger>
            <TabsTrigger value="public-page" className="flex flex-col items-center gap-1 py-3">
              <Globe className="h-4 w-4" />
              <span className="text-xs">Public Page</span>
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex flex-col items-center gap-1 py-3">
              <Palette className="h-4 w-4" />
              <span className="text-xs">Branding</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex flex-col items-center gap-1 py-3">
              <Settings className="h-4 w-4" />
              <span className="text-xs">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" key={`profile-${refreshKey}`}>
            <PublisherProfileEditor publisher={publisher} onUpdate={fetchPublisherData} />
          </TabsContent>

          <TabsContent value="authors" key={`authors-${refreshKey}`}>
            <PublisherAuthorManagement publisherId={publisher.id} />
          </TabsContent>

          <TabsContent value="public-page" key={`public-page-${refreshKey}`}>
            <PublisherPublicPage publisher={publisher} />
          </TabsContent>

          <TabsContent value="branding" key={`branding-${refreshKey}`}>
            <PublisherBranding publisher={publisher} onUpdate={fetchPublisherData} />
          </TabsContent>

          <TabsContent value="settings" key={`settings-${refreshKey}`}>
            <PublisherSettings publisher={publisher} onUpdate={fetchPublisherData} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
