import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Globe, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeBanner } from '@/components/UpgradeBanner';

interface CustomDomain {
  id: string;
  domain: string;
  verified: boolean;
  dns_configured: boolean;
  ssl_enabled: boolean;
  created_at: string;
}

export default function CustomDomains() {
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();
  const { hasFeature, loading: subscriptionLoading } = useSubscription();

  const canUseCustomDomains = hasFeature('custom_domain');

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('custom_domains')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDomains(data || []);
    } catch (error) {
      console.error('Error fetching domains:', error);
      toast({
        title: "Error",
        description: "Failed to load domains",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addDomain = async () => {
    if (!newDomain.trim()) {
      toast({
        title: "Error",
        description: "Please enter a domain name",
        variant: "destructive",
      });
      return;
    }

    setAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('custom_domains')
        .insert({
          user_id: user.id,
          domain: newDomain.toLowerCase().trim(),
        });

      if (error) throw error;

      toast({
        title: "Domain Added",
        description: "Your domain has been added. Please configure DNS settings.",
      });

      setNewDomain('');
      fetchDomains();
    } catch (error: any) {
      console.error('Error adding domain:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add domain",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const removeDomain = async (domainId: string) => {
    try {
      const { error } = await supabase
        .from('custom_domains')
        .delete()
        .eq('id', domainId);

      if (error) throw error;

      toast({
        title: "Domain Removed",
        description: "Your domain has been removed",
      });

      fetchDomains();
    } catch (error) {
      console.error('Error removing domain:', error);
      toast({
        title: "Error",
        description: "Failed to remove domain",
        variant: "destructive",
      });
    }
  };

  if (subscriptionLoading || loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (!canUseCustomDomains) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Custom Domains</h1>
          <p className="text-muted-foreground">
            Connect your own domain to your author profile
          </p>
        </div>

        <UpgradeBanner 
          message="Custom domains are a Pro feature"
          feature="unlimited custom domain connections"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Custom Domains</h1>
        <p className="text-muted-foreground">
          Connect your own domain to your author profile
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Domain
          </CardTitle>
          <CardDescription>
            Enter your domain name (e.g., www.yourname.com or yourname.com)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="www.yourname.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addDomain()}
            />
            <Button onClick={addDomain} disabled={adding}>
              {adding ? 'Adding...' : 'Add Domain'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {domains.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No custom domains configured yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {domains.map((domain) => (
            <Card key={domain.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{domain.domain}</h3>
                      <Badge variant={domain.verified ? "default" : "secondary"}>
                        {domain.verified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${domain.dns_configured ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <span className="text-sm">
                          DNS: {domain.dns_configured ? 'Configured' : 'Pending Configuration'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${domain.ssl_enabled ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <span className="text-sm">
                          SSL: {domain.ssl_enabled ? 'Active' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    {!domain.dns_configured && (
                      <div className="mt-4 p-4 bg-muted rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium mb-2">DNS Configuration Required</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              Add these DNS records to your domain registrar:
                            </p>
                            <div className="bg-background p-3 rounded border">
                              <p className="text-sm font-mono">
                                Type: A<br />
                                Name: @ (or your subdomain)<br />
                                Value: 185.158.133.1
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDomain(domain.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}