import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Theme {
  id: string;
  name: string;
  description: string;
  premium: boolean;
  config: any;
  created_at: string;
  updated_at: string;
}

interface UserThemeCustomization {
  id: string;
  user_id: string;
  theme_id: string;
  custom_config: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ThemeUsageAnalytics {
  id: string;
  user_id: string;
  theme_id: string;
  action: string;
  metadata: any;
  created_at: string;
}

export function useRealtimeThemes() {
  const { toast } = useToast();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [userCustomizations, setUserCustomizations] = useState<UserThemeCustomization[]>([]);
  const [themeAnalytics, setThemeAnalytics] = useState<ThemeUsageAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  useEffect(() => {
    // Initial data fetch
    fetchThemes();
    fetchUserCustomizations();
    fetchThemeAnalytics();
    
    // Set up realtime subscriptions
    const themesChannel = supabase
      .channel('themes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'themes'
        },
        (payload) => {
          console.log('Theme change detected:', payload);
          handleThemeChange(payload);
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
          console.log('Theme customization change:', payload);
          handleCustomizationChange(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'theme_usage_analytics'
        },
        (payload) => {
          console.log('Theme usage tracked:', payload);
          handleAnalyticsChange(payload);
        }
      )
      .subscribe();

    // User presence tracking
    const presenceChannel = supabase
      .channel('theme-management-presence')
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState();
        const users = Object.values(newState).flat();
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined theme management:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left theme management:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track user presence
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await presenceChannel.track({
              user_id: user.id,
              email: user.email,
              online_at: new Date().toISOString(),
              page: 'theme-management'
            });
          }
        }
      });

    return () => {
      supabase.removeChannel(themesChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, []);

  const fetchThemes = async () => {
    try {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .order('updated_at', { ascending: false });

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

  const fetchUserCustomizations = async () => {
    try {
      const { data, error } = await supabase
        .from('user_theme_customizations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setUserCustomizations(data || []);
    } catch (error) {
      console.error('Error fetching customizations:', error);
    }
  };

  const fetchThemeAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('theme_usage_analytics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setThemeAnalytics(data || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleThemeChange = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    setThemes(prev => {
      switch (eventType) {
        case 'INSERT':
          return [newRecord, ...prev];
        case 'UPDATE':
          return prev.map(theme => 
            theme.id === newRecord.id ? newRecord : theme
          );
        case 'DELETE':
          return prev.filter(theme => theme.id !== oldRecord.id);
        default:
          return prev;
      }
    });

    // Show toast notification for real-time updates
    if (eventType === 'INSERT') {
      toast({
        title: "New Theme Available",
        description: `${newRecord.name} has been added`,
      });
    } else if (eventType === 'UPDATE') {
      toast({
        title: "Theme Updated",
        description: `${newRecord.name} has been modified`,
      });
    }
  };

  const handleCustomizationChange = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    setUserCustomizations(prev => {
      switch (eventType) {
        case 'INSERT':
          return [newRecord, ...prev];
        case 'UPDATE':
          return prev.map(customization => 
            customization.id === newRecord.id ? newRecord : customization
          );
        case 'DELETE':
          return prev.filter(customization => customization.id !== oldRecord.id);
        default:
          return prev;
      }
    });
  };

  const handleAnalyticsChange = (payload: any) => {
    const { new: newRecord } = payload;
    setThemeAnalytics(prev => [newRecord, ...prev.slice(0, 99)]);
  };

  const applyTheme = async (themeId: string, customConfig: any = {}) => {
    try {
      const { data, error } = await supabase.rpc('apply_user_theme', {
        p_theme_id: themeId,
        p_custom_config: customConfig
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Theme applied successfully",
      });

      return data;
    } catch (error) {
      console.error('Error applying theme:', error);
      toast({
        title: "Error",
        description: "Failed to apply theme",
        variant: "destructive",
      });
    }
  };

  const trackThemeUsage = async (themeId: string, action: string, metadata: any = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('theme_usage_analytics')
        .insert([{
          user_id: user.id,
          theme_id: themeId,
          action,
          metadata
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking theme usage:', error);
    }
  };

  const createTheme = async (themeData: any) => {
    try {
      const { data, error } = await supabase
        .from('themes')
        .insert([themeData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Theme created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating theme:', error);
      toast({
        title: "Error",
        description: "Failed to create theme",
        variant: "destructive",
      });
    }
  };

  const updateTheme = async (themeId: string, updates: Partial<Theme>) => {
    try {
      const { data, error } = await supabase
        .from('themes')
        .update(updates)
        .eq('id', themeId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Theme updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error updating theme:', error);
      toast({
        title: "Error",
        description: "Failed to update theme",
        variant: "destructive",
      });
    }
  };

  const deleteTheme = async (themeId: string) => {
    try {
      const { error } = await supabase
        .from('themes')
        .delete()
        .eq('id', themeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Theme deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting theme:', error);
      toast({
        title: "Error",
        description: "Failed to delete theme",
        variant: "destructive",
      });
    }
  };

  return {
    themes,
    userCustomizations,
    themeAnalytics,
    onlineUsers,
    loading,
    applyTheme,
    trackThemeUsage,
    createTheme,
    updateTheme,
    deleteTheme,
    refetch: () => {
      fetchThemes();
      fetchUserCustomizations();
      fetchThemeAnalytics();
    }
  };
}