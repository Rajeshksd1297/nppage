import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProfileThemeSync {
  profileId: string;
  themeId: string;
  customizationId?: string;
  isActive: boolean;
  lastSynced: string;
}

export function useProfileThemeSync() {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [profileTheme, setProfileTheme] = useState<ProfileThemeSync | null>(null);

  useEffect(() => {
    fetchCurrentProfileTheme();
    
    // Set up real-time subscription for profile changes
    const profileChannel = supabase
      .channel('profile-theme-sync')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${supabase.auth.getUser().then(u => u.data.user?.id)}`
        },
        (payload) => {
          console.log('Profile theme updated:', payload);
          handleProfileThemeUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_theme_customizations'
        },
        (payload) => {
          console.log('Theme customization updated:', payload);
          handleCustomizationUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, []);

  const fetchCurrentProfileTheme = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          id,
          theme_id,
          active_theme_customization_id,
          user_theme_customizations (
            id,
            theme_id,
            custom_config,
            is_active,
            updated_at
          )
        `)
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (profile && profile.theme_id) {
        setProfileTheme({
          profileId: profile.id,
          themeId: profile.theme_id,
          customizationId: profile.active_theme_customization_id,
          isActive: true,
          lastSynced: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error fetching profile theme:', error);
    }
  };

  const handleProfileThemeUpdate = (payload: any) => {
    const { new: newProfile } = payload;
    
    if (newProfile.theme_id) {
      setProfileTheme(prev => ({
        ...prev,
        profileId: newProfile.id,
        themeId: newProfile.theme_id,
        customizationId: newProfile.active_theme_customization_id,
        isActive: true,
        lastSynced: new Date().toISOString()
      }));

      // Show notification for theme changes
      toast({
        title: "Theme Updated",
        description: "Your profile theme has been synchronized",
      });
    }
  };

  const handleCustomizationUpdate = (payload: any) => {
    const { eventType, new: newCustomization } = payload;
    
    if (eventType === 'UPDATE' && newCustomization.is_active) {
      setProfileTheme(prev => prev ? {
        ...prev,
        customizationId: newCustomization.id,
        lastSynced: new Date().toISOString()
      } : null);
    }
  };

  const syncThemeToProfile = async (themeId: string, customConfig?: any) => {
    setSyncing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Apply theme using the database function
      const { data: customizationId, error: applyError } = await supabase.rpc('apply_user_theme', {
        p_theme_id: themeId,
        p_custom_config: customConfig || {}
      });

      if (applyError) throw applyError;

      // Update local state
      setProfileTheme({
        profileId: user.id,
        themeId,
        customizationId,
        isActive: true,
        lastSynced: new Date().toISOString()
      });

      toast({
        title: "Success",
        description: "Theme synchronized to your profile",
      });

      return customizationId;
    } catch (error) {
      console.error('Error syncing theme:', error);
      toast({
        title: "Error",
        description: "Failed to sync theme to profile",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const resetToDefaultTheme = async () => {
    setSyncing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get default theme (first non-premium theme)
      const { data: defaultTheme, error: themeError } = await supabase
        .from('themes')
        .select('id')
        .eq('premium', false)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (themeError) throw themeError;

      if (defaultTheme) {
        await syncThemeToProfile(defaultTheme.id);
      }
    } catch (error) {
      console.error('Error resetting theme:', error);
      toast({
        title: "Error",
        description: "Failed to reset to default theme",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const getProfileLandingPageUrl = () => {
    if (!profileTheme) return null;
    
    // In a real app, this would be the actual profile URL
    return `/profile/${profileTheme.profileId}`;
  };

  const previewProfileWithTheme = (themeId: string, customConfig?: any) => {
    // Create a preview URL with theme parameters
    const params = new URLSearchParams({
      theme: themeId,
      preview: 'true',
      ...(customConfig && { config: JSON.stringify(customConfig) })
    });
    
    return `/profile/preview?${params.toString()}`;
  };

  return {
    profileTheme,
    syncing,
    syncThemeToProfile,
    resetToDefaultTheme,
    getProfileLandingPageUrl,
    previewProfileWithTheme,
    refetch: fetchCurrentProfileTheme
  };
}