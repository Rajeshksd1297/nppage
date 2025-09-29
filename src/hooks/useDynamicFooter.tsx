import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FooterConfig {
  copyright?: string;
  showPages?: boolean;
  customText?: string;
  showSocial?: boolean;
  socialLinks?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  navigation?: Array<{
    label: string;
    url: string;
    external?: boolean;
  }>;
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
  header_config: any;
  footer_config: FooterConfig;
}

export const useDynamicFooter = () => {
  const [footerConfig, setFooterConfig] = useState<FooterConfig>({});
  const [siteTitle, setSiteTitle] = useState<string>("AuthorPage");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFooterConfig();
    setupRealtimeListener();
  }, []);

  const loadFooterConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error loading footer config:', error);
        toast({
          title: "Loading Error",
          description: "Could not load footer configuration.",
          variant: "destructive"
        });
        return;
      }

      if (data) {
        const footerConfigData = data.footer_config as FooterConfig || {};
        setFooterConfig(footerConfigData);
        setSiteTitle(data.site_title || "AuthorPage");
      } else {
        // Default configuration if no settings exist
        setFooterConfig({
          copyright: `© ${new Date().getFullYear()} AuthorPage. All rights reserved.`,
          showPages: false,
          customText: "",
          showSocial: false,
          socialLinks: {},
          contact: {},
          navigation: []
        });
      }
    } catch (error) {
      console.error('Error loading footer config:', error);
      toast({
        title: "Loading Error",
        description: "Could not load footer configuration.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListener = () => {
    const channel = supabase
      .channel('footer-config-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings'
        },
        () => {
          loadFooterConfig();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return {
    footerConfig,
    siteTitle,
    loading
  };
};