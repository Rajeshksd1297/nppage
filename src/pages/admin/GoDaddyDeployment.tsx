import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SOPTab } from '@/components/admin/GoDaddy/SOPTab';
import { ConfigurationTab } from '@/components/admin/GoDaddy/ConfigurationTab';
import { DeploymentTab } from '@/components/admin/GoDaddy/DeploymentTab';
import { StatusCheckTab } from '@/components/admin/GoDaddy/StatusCheckTab';

const GoDaddyDeployment = () => {
  const navigate = useNavigate();

  // Fetch GoDaddy settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['godaddy-settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('godaddy_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Fetch deployment history
  const { data: deployments, isLoading: deploymentsLoading } = useQuery({
    queryKey: ['godaddy-deployments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('godaddy_deployments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">GoDaddy Shared Hosting Deployment</h1>
            <p className="text-muted-foreground">Deploy your application to GoDaddy shared hosting via FTP</p>
          </div>
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="sop" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sop">SOP</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
          <TabsTrigger value="status">Status Check</TabsTrigger>
        </TabsList>

        <TabsContent value="sop" className="mt-6">
          <SOPTab />
        </TabsContent>

        <TabsContent value="configuration" className="mt-6">
          <ConfigurationTab settings={settings} settingsLoading={settingsLoading} />
        </TabsContent>

        <TabsContent value="deployment" className="mt-6">
          <DeploymentTab 
            settings={settings} 
            deployments={deployments || []} 
            deploymentsLoading={deploymentsLoading}
          />
        </TabsContent>

        <TabsContent value="status" className="mt-6">
          <StatusCheckTab settings={settings} deployments={deployments || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GoDaddyDeployment;
