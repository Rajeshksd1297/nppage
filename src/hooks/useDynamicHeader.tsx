import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NavigationItem {
  label: string;
  url: string;
  external?: boolean;
}

interface HeaderConfig {
  showLogo?: boolean;
  showLogin?: boolean;
  navigation?: NavigationItem[];
  showSearch?: boolean;
  showDarkMode?: boolean;
}

interface SiteSettings {
  id: string;
  site_title: string;
  site_description: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color: string;
  secondary_color: string;
  enable_dark_mode: boolean;
  header_config: HeaderConfig;
  footer_config: any;
}

export const useDynamicHeader = () => {
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>({});
  const [siteTitle, setSiteTitle] = useState<string>("AuthorPage");
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadHeaderConfig();
    setupRealtimeListener();
  }, []);

  const loadHeaderConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error loading header config:', error);
        toast({
          title: "Loading Error",
          description: "Could not load header configuration.",
          variant: "destructive"
        });
        return;
      }

      if (data) {
        const headerConfigData = data.header_config as HeaderConfig || {};
        setHeaderConfig(headerConfigData);
        setSiteTitle(data.site_title || "AuthorPage");
        setLogoUrl(data.logo_url);
      } else {
        // Default configuration if no settings exist
        setHeaderConfig({
          showLogo: true,
          showLogin: true,
          navigation: [],
          showSearch: false,
          showDarkMode: true
        });
      }
    } catch (error) {
      console.error('Error loading header config:', error);
      toast({
        title: "Loading Error",
        description: "Could not load header configuration.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListener = () => {
    const channel = supabase
      .channel('header-config-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings'
        },
        () => {
          loadHeaderConfig();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return {
    headerConfig,
    siteTitle,
    logoUrl,
    loading
  };
};