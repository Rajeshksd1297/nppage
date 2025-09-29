import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SEOHead } from '@/components/SEOHead';
import { DynamicHeader } from '@/components/layout/DynamicHeader';
import { DynamicFooter } from '@/components/layout/DynamicFooter';
import { DynamicHeroBlock } from '@/components/sections/DynamicHeroBlock';
import { DynamicSection } from '@/components/sections/DynamicSection';
import { useToast } from '@/hooks/use-toast';

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
  footer_config: any;
}

interface HeroBlock {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  config: any;
  preview_image_url?: string;
}

interface HomeSection {
  id: string;
  type: string;
  title: string;
  enabled: boolean;
  order_index: number;
  config: any;
}

interface Book {
  id: string;
  title: string;
  subtitle?: string;
  cover_image_url?: string;
  description?: string;
  status: string;
  publication_date?: string;
  user_id: string;
}

const Home = () => {
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [heroBlocks, setHeroBlocks] = useState<HeroBlock[]>([]);
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAllData();
    setupRealtimeListeners();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadSiteSettings(),
        loadHeroBlocks(),
        loadSections(),
        loadBooks()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Loading Error",
        description: "Some content may not display correctly.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSiteSettings = async () => {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading site settings:', error);
      return;
    }

    if (data && data.length > 0) {
      let settings = data.find(s => s.site_title && s.site_title.trim() !== '') || data[0];
      
      if (!settings.site_title || settings.site_title.trim() === '') {
        settings.site_title = 'AuthorPage - Professional Author Platform';
      }
      if (!settings.site_description || settings.site_description.trim() === '') {
        settings.site_description = 'Create stunning author profiles, showcase your books, and grow your readership.';
      }
      if (!settings.primary_color) {
        settings.primary_color = '#3b82f6';
      }
      if (!settings.secondary_color) {
        settings.secondary_color = '#64748b';
      }
      
      setSiteSettings(settings);
    } else {
      setSiteSettings({
        id: 'default',
        site_title: 'AuthorPage - Professional Author Platform',
        site_description: 'Create stunning author profiles, showcase your books, and grow your readership.',
        logo_url: null,
        favicon_url: null,
        primary_color: '#3b82f6',
        secondary_color: '#64748b',
        enable_dark_mode: true,
        header_config: { showLogo: true, showLogin: true, navigation: [], showSearch: false },
        footer_config: { copyright: '© 2024 AuthorPage. All rights reserved.', showPages: true, customText: 'Built with AuthorPage', showSocial: true }
      });
    }
  };

  const loadHeroBlocks = async () => {
    const { data, error } = await supabase
      .from('hero_blocks')
      .select('*')
      .eq('enabled', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading hero blocks:', error);
      return;
    }

    setHeroBlocks(data || []);
  };

  const loadSections = async () => {
    const { data, error } = await supabase
      .from('home_page_sections')
      .select('*')
      .eq('enabled', true)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error loading sections:', error);
      return;
    }

    setSections(data || []);
  };

  const loadBooks = async () => {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) {
      console.error('Error loading books:', error);
      return;
    }

    setBooks(data || []);
  };

  const setupRealtimeListeners = () => {
    // Listen for site settings changes
    const siteChannel = supabase
      .channel('site-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings'
        },
        () => {
          loadSiteSettings();
        }
      )
      .subscribe();

    // Listen for hero blocks changes
    const heroChannel = supabase
      .channel('hero-blocks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hero_blocks'
        },
        () => {
          loadHeroBlocks();
        }
      )
      .subscribe();

    // Listen for sections changes
    const sectionsChannel = supabase
      .channel('sections-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'home_page_sections'
        },
        () => {
          loadSections();
        }
      )
      .subscribe();

    // Listen for books changes
    const booksChannel = supabase
      .channel('books-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'books'
        },
        () => {
          loadBooks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(siteChannel);
      supabase.removeChannel(heroChannel);
      supabase.removeChannel(sectionsChannel);
      supabase.removeChannel(booksChannel);
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/30 flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-sm mx-auto">
          <div className="relative">
            <div className="animate-spin h-12 w-12 border-3 border-primary/30 border-t-primary rounded-full mx-auto"></div>
            <div className="absolute inset-0 animate-ping h-12 w-12 border border-primary/20 rounded-full mx-auto"></div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground">Loading your website...</p>
            <p className="text-sm text-muted-foreground">Fetching brand settings and content</p>
          </div>
        </div>
      </div>
    );
  }

  // Apply brand colors to CSS variables
  useEffect(() => {
    if (siteSettings) {
      const root = document.documentElement;
      const hexToHsl = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
          h = s = 0;
        } else {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
            default: h = 0;
          }
          h /= 6;
        }
        
        return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
      };
      
      if (siteSettings.primary_color) {
        root.style.setProperty('--primary', hexToHsl(siteSettings.primary_color));
      }
      if (siteSettings.secondary_color) {
        root.style.setProperty('--secondary', hexToHsl(siteSettings.secondary_color));
      }
    }
  }, [siteSettings]);

  const pageTitle = siteSettings?.site_title || "AuthorPage - Professional Author Platform";
  const pageDescription = siteSettings?.site_description || "Create stunning author profiles, showcase your books, and grow your readership.";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/10 overflow-x-hidden" 
         style={{
           '--brand-primary': siteSettings?.primary_color,
           '--brand-secondary': siteSettings?.secondary_color
         } as React.CSSProperties}>
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        keywords="author profiles, book marketing, author website, book showcase, professional author pages"
        url="/"
        type="website"
        image={siteSettings?.logo_url || "/hero-authors-workspace.jpg"}
      />

      <DynamicHeader 
        config={siteSettings?.header_config} 
        siteTitle={siteSettings?.site_title}
        logoUrl={siteSettings?.logo_url}
      />

      <div className="w-full">
        {heroBlocks.map((heroBlock) => (
          <DynamicHeroBlock
            key={heroBlock.id}
            config={heroBlock.config}
            name={heroBlock.name}
            description={heroBlock.description}
          />
        ))}
      </div>

      <main className="relative w-full">
        {sections.map((section, index) => (
          <div key={section.id} className={`w-full ${index % 2 === 1 ? 'bg-muted/30' : ''}`}>
            <DynamicSection
              type={section.type}
              title={section.title}
              config={section.config}
              books={section.type === 'book_showcase' ? books : undefined}
            />
          </div>
        ))}

        {sections.length === 0 && (
          <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6">
            <div className="container mx-auto text-center max-w-4xl">
              <div className="space-y-6 sm:space-y-8 animate-fade-in">
                <div className="space-y-4">
                  <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent leading-tight">
                    Welcome to Your Author Platform
                  </h1>
                  <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
                    Your professional author website is ready to showcase your work. 
                    Customize your brand identity and add compelling content through the admin dashboard.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
                  <div className="px-4 sm:px-6 py-2 sm:py-3 bg-primary/10 text-primary rounded-full text-xs sm:text-sm font-medium border border-primary/20 w-full sm:w-auto text-center">
                    🎨 Brand Identity Ready
                  </div>
                  <div className="px-4 sm:px-6 py-2 sm:py-3 bg-muted text-muted-foreground rounded-full text-xs sm:text-sm font-medium w-full sm:w-auto text-center">
                    📝 Add Content to Get Started
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <DynamicFooter 
        config={siteSettings?.footer_config}
        siteTitle={siteSettings?.site_title}
      />
    </div>
  );
};

export default Home;