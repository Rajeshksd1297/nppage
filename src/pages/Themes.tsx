import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Palette, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeBanner } from '@/components/UpgradeBanner';

interface Theme {
  id: string;
  name: string;
  description: string;
  preview_image_url: string;
  premium: boolean;
  config: any;
}

export default function Themes() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [currentThemeId, setCurrentThemeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { hasFeature, loading: subscriptionLoading } = useSubscription();

  const canUsePremiumThemes = hasFeature('premium_themes');

  useEffect(() => {
    fetchThemes();
    fetchCurrentTheme();
  }, []);

  const fetchThemes = async () => {
    try {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .order('premium', { ascending: true });

      if (error) throw error;
      setThemes(data || []);
    } catch (error) {
      console.error('Error fetching themes:', error);
      toast({
        title: "Error",
        description: "Failed to load themes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentTheme = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('theme_id')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setCurrentThemeId(data?.theme_id || null);
    } catch (error) {
      console.error('Error fetching current theme:', error);
    }
  };

  const applyTheme = async (themeId: string, isPremium: boolean) => {
    if (isPremium && !canUsePremiumThemes) {
      toast({
        title: "Premium Theme",
        description: "Upgrade to Pro to use premium themes",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ theme_id: themeId })
        .eq('id', user.id);

      if (error) throw error;

      setCurrentThemeId(themeId);
      toast({
        title: "Theme Applied",
        description: "Your theme has been updated successfully",
      });
    } catch (error: any) {
      console.error('Error applying theme:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to apply theme",
        variant: "destructive",
      });
    }
  };

  if (subscriptionLoading || loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Themes</h1>
        <p className="text-muted-foreground">
          Customize the look and feel of your author profile
        </p>
      </div>

      {!canUsePremiumThemes && (
        <div className="mb-6">
          <UpgradeBanner 
            message="Premium themes are a Pro feature"
            feature="access to all premium themes and advanced customization"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {themes.map((theme) => {
          const isCurrentTheme = currentThemeId === theme.id;
          const canUseTheme = !theme.premium || canUsePremiumThemes;

          return (
            <Card 
              key={theme.id} 
              className={`relative ${isCurrentTheme ? 'ring-2 ring-primary' : ''} ${
                !canUseTheme ? 'opacity-75' : ''
              }`}
            >
              {theme.premium && (
                <div className="absolute top-4 left-4 z-10">
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                </div>
              )}

              {isCurrentTheme && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge variant="default">
                    <Check className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>
              )}

              <div className="relative aspect-video overflow-hidden rounded-t-lg">
                {theme.preview_image_url ? (
                  <img
                    src={theme.preview_image_url}
                    alt={`${theme.name} preview`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <Palette className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {theme.name}
                </CardTitle>
                <CardDescription>{theme.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <Button
                  className="w-full"
                  variant={isCurrentTheme ? "outline" : "default"}
                  disabled={isCurrentTheme || (!canUseTheme && theme.premium)}
                  onClick={() => applyTheme(theme.id, theme.premium)}
                >
                  {isCurrentTheme ? 'Currently Active' : 
                   !canUseTheme && theme.premium ? 'Requires Pro' : 
                   'Apply Theme'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {themes.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Palette className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Themes Available</h3>
            <p className="text-muted-foreground">
              Themes will be available soon. Check back later!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}