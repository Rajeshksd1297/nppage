import { useState, useEffect } from 'react';
import { useRealtimeThemes } from '@/hooks/useRealtimeThemes';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { useProfileThemeSync } from '@/hooks/useProfileThemeSync';
import { FeatureGate } from '@/components/FeatureGate';
import { 
  User, 
  Palette, 
  Globe, 
  Crown, 
  Eye,
  Settings,
  ExternalLink
} from 'lucide-react';
import { ProfileBasicInfo } from '@/components/profile/ProfileBasicInfo';
import { ProfileSocialLinks } from '@/components/profile/ProfileSocialLinks';
import { ProfileSEOSettings } from '@/components/profile/ProfileSEOSettings';
import { UserThemeCustomizer } from '@/components/profile/UserThemeCustomizer';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  website_url: string;
  slug: string;
  public_profile: boolean;
  specializations: string[];
  social_links: Record<string, string>;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  mobile_number?: string;
  country_code?: string;
  theme_id?: string;
}

interface Theme {
  id: string;
  name: string;
  description: string;
  premium: boolean;
  config: any;
  created_at: string;
  updated_at: string;
}

export default function ProfileSettings() {
  const { toast } = useToast();
  const { hasFeature, isPro, getCurrentPlanName } = useSubscription();
  const { profileTheme, syncThemeToProfile, getProfileLandingPageUrl } = useProfileThemeSync();
  const { themes: realtimeThemes, loading: themesLoading } = useRealtimeThemes();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(true);
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Set up real-time profile updates
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          const updatedProfile = payload.new as Profile;
          const socialLinks = typeof updatedProfile.social_links === 'object' && updatedProfile.social_links !== null
            ? updatedProfile.social_links as Record<string, string>
            : {};
          
          setProfile({
            ...updatedProfile,
            social_links: socialLinks
          });
        }
      )
      .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtimeSubscription();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (profileData) {
        const socialLinks = typeof profileData.social_links === 'object' && profileData.social_links !== null
          ? profileData.social_links as Record<string, string>
          : {};
        
        setProfile({
          ...profileData,
          social_links: socialLinks
        });
      }

      // Themes are handled by useRealtimeThemes hook

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (updatedProfile: Partial<Profile>) => {
    if (profile) {
      setProfile({ ...profile, ...updatedProfile });
      
      // Save to database
      try {
        const { error } = await supabase
          .from('profiles')
          .update(updatedProfile)
          .eq('id', profile.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      } catch (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive"
        });
      }
    }
  };

  const handleThemeSelect = (theme: Theme) => {
    if (theme.premium && !hasFeature('premium_themes')) {
      toast({
        title: "Premium Feature",
        description: "Upgrade to Pro to use premium themes",
        variant: "destructive"
      });
      return;
    }
    setSelectedTheme(theme);
    setShowThemeCustomizer(true);
  };

  const handleThemeApply = async (themeId: string, customConfig?: any) => {
    try {
      await syncThemeToProfile(themeId, customConfig);
      setShowThemeCustomizer(false);
      toast({
        title: "Success",
        description: "Theme applied successfully",
      });
    } catch (error) {
      console.error('Error applying theme:', error);
      toast({
        title: "Error",
        description: "Failed to apply theme",
        variant: "destructive"
      });
    }
  };

  const profileUrl = getProfileLandingPageUrl();
  console.log('Profile URL debug:', { profileUrl, profileSlug: profile?.slug });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showThemeCustomizer && selectedTheme) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <UserThemeCustomizer
          selectedTheme={selectedTheme}
          onSave={(customConfig) => handleThemeApply(selectedTheme.id, customConfig)}
          onCancel={() => setShowThemeCustomizer(false)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your profile, themes, and landing page
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isPro() ? "default" : "secondary"}>
            {isPro() ? <Crown className="w-3 h-3 mr-1" /> : null}
            {getCurrentPlanName()}
          </Badge>
          {profile?.slug && (
            <Button variant="outline" size="sm" asChild>
              <a href={profileUrl || `/${profile.slug}`} target="_blank" rel="noopener noreferrer">
                <Eye className="w-4 h-4 mr-2" />
                View Profile
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Social
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            SEO
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {profile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileBasicInfo 
                  profile={profile}
                  onProfileUpdate={handleProfileUpdate}
                  onNext={() => setActiveTab('theme')}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="theme" className="space-y-6">
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
                      onClick={() => canUse && handleThemeSelect(theme)}
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
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          {profile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Social Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileSocialLinks 
                  profile={profile}
                  onProfileUpdate={handleProfileUpdate}
                  onNext={() => setActiveTab('seo')}
                  onPrevious={() => setActiveTab('profile')}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <FeatureGate feature="advanced_analytics" fallback={
            <Card>
              <CardContent className="p-6 text-center">
                <Crown className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">SEO Settings</h3>
                <p className="text-muted-foreground mb-4">
                  Advanced SEO customization is available with Pro plans
                </p>
                <Button asChild>
                  <a href="/subscription">Upgrade to Pro</a>
                </Button>
              </CardContent>
            </Card>
          }>
            {profile && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    SEO Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProfileSEOSettings 
                    profile={profile}
                    onProfileUpdate={handleProfileUpdate}
                    onPrevious={() => setActiveTab('social')}
                    isPro={isPro()}
                  />
                </CardContent>
              </Card>
            )}
          </FeatureGate>
        </TabsContent>
      </Tabs>
    </div>
  );
}