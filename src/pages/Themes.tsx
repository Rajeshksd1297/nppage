import { useState, useEffect } from 'react';
import { useRealtimeThemes } from '@/hooks/useRealtimeThemes';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { useProfileThemeSync } from '@/hooks/useProfileThemeSync';
import { FeatureGate } from '@/components/FeatureGate';
import { 
  Palette, 
  Crown, 
  Eye,
  Settings,
  ExternalLink
} from 'lucide-react';
import { UserThemeCustomizer } from '@/components/profile/UserThemeCustomizer';

interface Profile {
  id: string;
  theme_id?: string;
}

interface Theme {
  id: string;
  name: string;
  description: string;
  premium: boolean;
  config: any;
}

export default function Themes() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { hasFeature } = useSubscription();
  const { themes: realtimeThemes } = useRealtimeThemes();
  const { profileTheme } = useProfileThemeSync();
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, theme_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleThemeSelect = async (theme: Theme) => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          theme_id: theme.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, theme_id: theme.id });
      toast({
        title: "Theme Updated",
        description: `Successfully applied ${theme.name} theme`,
      });
    } catch (error) {
      console.error('Error updating theme:', error);
      toast({
        title: "Error",
        description: "Failed to update theme",
        variant: "destructive",
      });
    }
  };

  const handleProfileUpdate = (updatedProfile: any) => {
    setProfile(updatedProfile);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Theme Settings</h1>
          <p className="text-muted-foreground">Customize your profile's appearance and theme</p>
        </div>
        <div className="flex gap-2">
          {selectedTheme && (
            <Button
              variant="outline"
              onClick={() => {
                setShowCustomizer(!showCustomizer);
                if (!showCustomizer && !selectedTheme) {
                  // Set first theme as selected if none selected
                  setSelectedTheme(realtimeThemes[0] || null);
                }
              }}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              {showCustomizer ? 'Hide Customizer' : 'Customize Theme'}
            </Button>
          )}
          {profile && (
            <Button
              variant="outline"
              asChild
              className="flex items-center gap-2"
            >
              <a href={`/${profile.id}`} target="_blank" rel="noopener noreferrer">
                <Eye className="w-4 h-4" />
                Preview Profile
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Theme Customizer */}
      {showCustomizer && selectedTheme && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Theme Customizer - {selectedTheme.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UserThemeCustomizer 
              selectedTheme={selectedTheme}
              onSave={(customConfig) => {
                handleThemeSelect(selectedTheme);
                setShowCustomizer(false);
              }}
              onCancel={() => setShowCustomizer(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Choose Your Theme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {realtimeThemes.map((theme) => {
              const canUse = !theme.premium || hasFeature('premium_themes');
              const isActive = profileTheme?.themeId === theme.id;

              return (
                <Card 
                  key={theme.id}
                  className={`relative cursor-pointer transition-all hover:shadow-lg ${
                    isActive ? 'ring-2 ring-primary' : ''
                  } ${!canUse ? 'opacity-60' : ''}`}
                  onClick={() => {
                    if (canUse) {
                      handleThemeSelect(theme);
                      setSelectedTheme(theme);
                    }
                  }}
                >
                  {theme.premium && (
                    <div className="absolute top-2 left-2 z-10">
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                        <Crown className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    </div>
                  )}
                  
                  {isActive && (
                    <div className="absolute top-2 right-2 z-10">
                      <Badge variant="default">Active</Badge>
                    </div>
                  )}

                  <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 rounded-t-lg">
                    <div className="flex items-center justify-center h-full">
                      <Palette className="w-12 h-12 text-muted-foreground" />
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold">{theme.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {theme.description}
                    </p>
                    
                    {!canUse && theme.premium && (
                      <FeatureGate feature="premium_themes" inline>
                        <span></span>
                      </FeatureGate>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}