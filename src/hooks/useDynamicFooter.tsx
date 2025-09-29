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
    console.log('Loading footer config...');
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .maybeSingle();

      console.log('Site settings data:', data);
      console.log('Site settings error:', error);

      if (error) {
        console.error('Error loading footer config:', error);
        // Only show toast for actual errors, not missing data
        if (error.code !== 'PGRST116') {
          toast({
            title: "Loading Error",
            description: "Could not load footer configuration.",
            variant: "destructive"
          });
        }
        return;
      }

      if (data) {
        const footerConfigData = data.footer_config as FooterConfig || {};
        console.log('Footer config data:', footerConfigData);
        
        // Load additional pages for footer navigation if showPages is true
        if (footerConfigData.showPages) {
          console.log('Loading additional pages for footer...');
          try {
            const { data: pagesData, error: pagesError } = await supabase
              .from('additional_pages')
              .select('title, slug')
              .eq('is_published', true)
              .eq('show_in_footer', true)
              .order('created_at', { ascending: true });

            console.log('Pages data:', pagesData);
            console.log('Pages error:', pagesError);

            if (!pagesError && pagesData && pagesData.length > 0) {
              // Add pages to navigation
              footerConfigData.navigation = pagesData.map(page => ({
                label: page.title,
                url: `/page/${page.slug}`,
                external: false
              }));
              console.log('Footer pages loaded:', footerConfigData.navigation);
            } else {
              console.log('No footer pages found or error:', pagesError);
              footerConfigData.navigation = [];
            }
          } catch (pagesError) {
            console.warn('Could not load additional pages for footer:', pagesError);
            footerConfigData.navigation = [];
          }
        } else {
          console.log('showPages is false, not loading pages');
          footerConfigData.navigation = [];
        }
        
        console.log('Final footer config:', footerConfigData);
        setFooterConfig(footerConfigData);
        setSiteTitle(data.site_title || "AuthorPage");
      } else {
        // Default configuration if no settings exist - this is normal, not an error
        setFooterConfig({
          copyright: `© ${new Date().getFullYear()} AuthorPage. All rights reserved.`,
          showPages: false,
          customText: "",
          showSocial: false,
          socialLinks: {},
          contact: {},
          navigation: []
        });
        setSiteTitle("AuthorPage");
      }
    } catch (error) {
      console.error('Error loading footer config:', error);
      // Only show toast for unexpected errors
      toast({
        title: "Loading Error", 
        description: "An unexpected error occurred while loading footer settings.",
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'additional_pages'
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