import { useState, useEffect } from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, RefreshCw, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Publisher {
  id: string;
  name: string;
}

interface FeatureConfig {
  [key: string]: boolean;
}

const AVAILABLE_FEATURES = [
  { id: 'custom_domain', name: 'Custom Domain', description: 'Allow custom domain setup' },
  { id: 'premium_themes', name: 'Premium Themes', description: 'Access to premium theme library' },
  { id: 'advanced_analytics', name: 'Advanced Analytics', description: 'Detailed analytics and insights' },
  { id: 'bulk_import', name: 'Bulk Import', description: 'Import multiple books at once' },
  { id: 'api_access', name: 'API Access', description: 'Access to publisher API' },
  { id: 'white_label', name: 'White Label', description: 'Remove platform branding' },
  { id: 'priority_support', name: 'Priority Support', description: '24/7 priority customer support' },
  { id: 'custom_branding', name: 'Custom Branding', description: 'Customize colors and logos' },
  { id: 'seo_tools', name: 'SEO Tools', description: 'Advanced SEO optimization tools' },
  { id: 'social_media', name: 'Social Media Integration', description: 'Connect social media accounts' },
];

export default function FeatureAccess() {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [selectedPublisher, setSelectedPublisher] = useState<string>('');
  const [features, setFeatures] = useState<FeatureConfig>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPublishers();
  }, []);

  useEffect(() => {
    if (selectedPublisher) {
      fetchFeatures();
    }
  }, [selectedPublisher]);

  const fetchPublishers = async () => {
    try {
      const { data, error } = await supabase
        .from('publishers')
        .select('id, name')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setPublishers(data || []);
    } catch (error: any) {
      console.error('Error fetching publishers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load publishers',
        variant: 'destructive',
      });
    }
  };

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('publishers')
        .select('feature_config')
        .eq('id', selectedPublisher)
        .single();

      if (error) throw error;
      
      // Initialize with default false values if no config exists
      const config = data?.feature_config || {};
      const initializedFeatures: FeatureConfig = {};
      AVAILABLE_FEATURES.forEach(feature => {
        initializedFeatures[feature.id] = config[feature.id] || false;
      });
      
      setFeatures(initializedFeatures);
    } catch (error: any) {
      console.error('Error fetching features:', error);
      // Initialize with all false if error
      const initializedFeatures: FeatureConfig = {};
      AVAILABLE_FEATURES.forEach(feature => {
        initializedFeatures[feature.id] = false;
      });
      setFeatures(initializedFeatures);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeature = (featureId: string) => {
    setFeatures(prev => ({
      ...prev,
      [featureId]: !prev[featureId]
    }));
  };

  const handleSave = async () => {
    if (!selectedPublisher) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('publishers')
        .update({ feature_config: features })
        .eq('id', selectedPublisher);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Feature access updated successfully',
      });
    } catch (error: any) {
      console.error('Error saving features:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update features',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const enabledCount = Object.values(features).filter(Boolean).length;

  return (
    <>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Feature Access Control
            </CardTitle>
            <CardDescription>
              Configure which features are available to each publisher
            </CardDescription>
          </div>
          {selectedPublisher && (
            <Badge variant="outline" className="text-lg">
              {enabledCount}/{AVAILABLE_FEATURES.length} Enabled
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Publisher Selection */}
        <div>
          <Label>Select Publisher</Label>
          <Select value={selectedPublisher} onValueChange={setSelectedPublisher}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Choose a publisher to manage" />
            </SelectTrigger>
            <SelectContent>
              {publishers.map((pub) => (
                <SelectItem key={pub.id} value={pub.id}>
                  {pub.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Features List */}
        {selectedPublisher && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4">
                  {AVAILABLE_FEATURES.map((feature) => (
                    <div
                      key={feature.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Label htmlFor={feature.id} className="font-semibold cursor-pointer">
                            {feature.name}
                          </Label>
                          {features[feature.id] && (
                            <Badge variant="default" className="text-xs">Active</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                      <Switch
                        id={feature.id}
                        checked={features[feature.id] || false}
                        onCheckedChange={() => handleToggleFeature(feature.id)}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {!selectedPublisher && (
          <div className="text-center py-12 text-muted-foreground">
            Select a publisher to manage their feature access
          </div>
        )}
      </CardContent>
    </>
  );
}
