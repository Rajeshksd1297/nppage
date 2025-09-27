import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';

interface Theme {
  id: string;
  name: string;
  description: string;
  preview_image_url: string;
  premium: boolean;
  config: any;
}

interface UseUserThemesReturn {
  themes: Theme[];
  loading: boolean;
  error: string | null;
  canAccessTheme: (theme: Theme) => boolean;
  getUserAccessibleThemes: () => Theme[];
  applyTheme: (themeId: string) => Promise<void>;
  currentThemeId: string | null;
}

export const useUserThemes = (): UseUserThemesReturn => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [currentThemeId, setCurrentThemeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { subscription, hasFeature, loading: subscriptionLoading } = useSubscription();

  useEffect(() => {
    if (!subscriptionLoading) {
      fetchThemes();
      fetchCurrentTheme();
    }
  }, [subscriptionLoading]);

  const fetchThemes = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: themesError } = await supabase
        .from('themes')
        .select('*')
        .order('premium', { ascending: true });

      if (themesError) throw themesError;
      setThemes(data || []);
    } catch (err) {
      console.error('Error fetching themes:', err);
      setError('Failed to load themes');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentTheme = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('theme_id')
        .eq('id', user.id)
        .single();

      if (profile?.theme_id) {
        setCurrentThemeId(profile.theme_id);
      }
    } catch (err) {
      console.error('Error fetching current theme:', err);
    }
  };

  const canAccessTheme = (theme: Theme): boolean => {
    if (!theme.premium) {
      return true; // Free themes are always accessible
    }

    // Check if user has premium themes feature
    const hasPremiumAccess = hasFeature('premium_themes');
    
    // Check if theme is in available themes for the user's plan
    const availableThemes = (subscription?.subscription_plans as any)?.available_themes || [];
    const isThemeInPlan = Array.isArray(availableThemes) && availableThemes.includes(theme.id);

    return hasPremiumAccess || isThemeInPlan;
  };

  const getUserAccessibleThemes = (): Theme[] => {
    return themes.filter(theme => canAccessTheme(theme));
  };

  const applyTheme = async (themeId: string): Promise<void> => {
    try {
      const theme = themes.find(t => t.id === themeId);
      if (!theme) {
        throw new Error('Theme not found');
      }

      if (!canAccessTheme(theme)) {
        throw new Error('You do not have access to this theme. Please upgrade your plan.');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Use the apply_user_theme function to set the theme
      const { data, error } = await supabase.rpc('apply_user_theme', {
        p_theme_id: themeId,
        p_custom_config: {}
      });

      if (error) throw error;

      setCurrentThemeId(themeId);
    } catch (err) {
      console.error('Error applying theme:', err);
      throw err;
    }
  };

  return {
    themes,
    loading: loading || subscriptionLoading,
    error,
    canAccessTheme,
    getUserAccessibleThemes,
    applyTheme,
    currentThemeId
  };
};