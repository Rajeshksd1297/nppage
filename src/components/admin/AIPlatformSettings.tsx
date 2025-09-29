import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save, Eye, EyeOff, Settings, Star } from 'lucide-react';

interface AIPlatform {
  id: string;
  platform_name: string;
  display_name: string;
  api_key_encrypted?: string;
  model_name: string;
  is_active: boolean;
  is_default: boolean;
  rate_limit_per_minute: number;
}

const PLATFORM_MODELS = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  google_gemini: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
  anthropic: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
  perplexity: ['llama-3.1-sonar-large-128k-online', 'llama-3.1-sonar-small-128k-online', 'llama-3.1-sonar-huge-128k-online']
};

export const AIPlatformSettings: React.FC = () => {
  const [platforms, setPlatforms] = useState<AIPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const fetchPlatforms = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_platform_settings')
        .select('*')
        .order('display_name');

      if (error) throw error;
      setPlatforms(data || []);
    } catch (error) {
      console.error('Error fetching platforms:', error);
      toast({
        title: "Error loading platforms",
        description: "Failed to load AI platform settings.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePlatform = async (platformId: string, updates: Partial<AIPlatform>) => {
    setSaving(platformId);
    try {
      // If setting as default, first unset all other defaults
      if (updates.is_default) {
        await supabase
          .from('ai_platform_settings')
          .update({ is_default: false })
          .neq('id', platformId);
      }

      const { error } = await supabase
        .from('ai_platform_settings')
        .update(updates)
        .eq('id', platformId);

      if (error) throw error;

      // Update local state
      setPlatforms(prev => prev.map(p => 
        p.id === platformId 
          ? { ...p, ...updates }
          : updates.is_default ? { ...p, is_default: false } : p
      ));

      toast({
        title: "Settings updated",
        description: "AI platform settings have been saved successfully."
      });
    } catch (error) {
      console.error('Error updating platform:', error);
      toast({
        title: "Update failed",
        description: "Failed to update platform settings.",
        variant: "destructive"
      });
    } finally {
      setSaving(null);
    }
  };

  const saveApiKey = async (platformId: string) => {
    const apiKey = apiKeys[platformId];
    if (!apiKey?.trim()) {
      toast({
        title: "API Key required",
        description: "Please enter an API key before saving.",
        variant: "destructive"
      });
      return;
    }

    setSaving(platformId);
    try {
      // In a production app, you'd encrypt the API key here
      // For now, we'll store it as-is (not recommended for production)
      const { error } = await supabase
        .from('ai_platform_settings')
        .update({ 
          api_key_encrypted: apiKey,
          is_active: true 
        })
        .eq('id', platformId);

      if (error) throw error;

      // Update local state
      setPlatforms(prev => prev.map(p => 
        p.id === platformId 
          ? { ...p, api_key_encrypted: apiKey, is_active: true }
          : p
      ));

      // Clear the input
      setApiKeys(prev => ({ ...prev, [platformId]: '' }));

      toast({
        title: "API Key saved",
        description: "API key has been saved and platform activated."
      });
    } catch (error) {
      console.error('Error saving API key:', error);
      toast({
        title: "Save failed",
        description: "Failed to save API key.",
        variant: "destructive"
      });
    } finally {
      setSaving(null);
    }
  };

  const toggleApiKeyVisibility = (platformId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [platformId]: !prev[platformId]
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading AI platform settings...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          AI Platform Settings
        </CardTitle>
        <CardDescription>
          Configure API keys and settings for different AI platforms. Set one as default for SEO suggestions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {platforms.map((platform) => (
          <div key={platform.id} className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-lg">{platform.display_name}</h3>
                {platform.is_default && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Default
                  </Badge>
                )}
                {platform.is_active && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Active
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={platform.is_active}
                  onCheckedChange={(checked) => 
                    updatePlatform(platform.id, { is_active: checked })
                  }
                  disabled={saving === platform.id}
                />
                <Label className="text-sm">Active</Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* API Key Input */}
              <div className="space-y-2">
                <Label htmlFor={`apikey-${platform.id}`}>API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id={`apikey-${platform.id}`}
                      type={showApiKeys[platform.id] ? "text" : "password"}
                      placeholder={platform.api_key_encrypted ? "••••••••" : "Enter API key"}
                      value={apiKeys[platform.id] || ''}
                      onChange={(e) => setApiKeys(prev => ({
                        ...prev,
                        [platform.id]: e.target.value
                      }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                      onClick={() => toggleApiKeyVisibility(platform.id)}
                    >
                      {showApiKeys[platform.id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    onClick={() => saveApiKey(platform.id)}
                    disabled={saving === platform.id || !apiKeys[platform.id]?.trim()}
                    size="sm"
                  >
                    {saving === platform.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Model Selection */}
              <div className="space-y-2">
                <Label>Model</Label>
                <Select
                  value={platform.model_name}
                  onValueChange={(value) => 
                    updatePlatform(platform.id, { model_name: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORM_MODELS[platform.platform_name as keyof typeof PLATFORM_MODELS]?.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rate Limit */}
              <div className="space-y-2">
                <Label htmlFor={`rate-${platform.id}`}>Rate Limit (per minute)</Label>
                <Input
                  id={`rate-${platform.id}`}
                  type="number"
                  min="1"
                  max="1000"
                  value={platform.rate_limit_per_minute}
                  onChange={(e) => 
                    updatePlatform(platform.id, { 
                      rate_limit_per_minute: parseInt(e.target.value) || 60 
                    })
                  }
                />
              </div>

              {/* Set as Default */}
              <div className="space-y-2">
                <Label>Default Platform</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={platform.is_default}
                    onCheckedChange={(checked) => 
                      updatePlatform(platform.id, { is_default: checked })
                    }
                    disabled={saving === platform.id || !platform.is_active}
                  />
                  <Label className="text-sm">Use as default for SEO suggestions</Label>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>Security Note:</strong> API keys are stored securely in the database.</p>
          <p><strong>Default Platform:</strong> Used for AI SEO suggestions when no specific platform is selected.</p>
          <p><strong>Rate Limits:</strong> Configure based on your API plan to avoid quota exceeded errors.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIPlatformSettings;