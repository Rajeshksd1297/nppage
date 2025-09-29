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

export const DynamicHomePage: React.FC = () => {
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
      .maybeSingle();

    if (error) {
      console.error('Error loading site settings:', error);
      return;
    }

    if (data) {
      setSiteSettings(data);
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

    // Cleanup function
    return () => {
      supabase.removeChannel(siteChannel);
      supabase.removeChannel(heroChannel);
      supabase.removeChannel(sectionsChannel);
      supabase.removeChannel(booksChannel);
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading your website...</p>
        </div>
      </div>
    );
  }

  const pageTitle = siteSettings?.site_title || "AuthorPage - Professional Author Profiles & Book Showcases";
  const pageDescription = siteSettings?.site_description || "Create stunning author profiles, showcase your books, and grow your readership with our professional author platform.";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        keywords="author profiles, book marketing, author website, book showcase, professional author pages"
        url="/"
        type="website"
        image={siteSettings?.logo_url || "/hero-authors-workspace.jpg"}
      />

      {/* Dynamic Header */}
      <DynamicHeader 
        config={siteSettings?.header_config} 
        siteTitle={siteSettings?.site_title}
        logoUrl={siteSettings?.logo_url}
      />

      {/* Hero Blocks */}
      {heroBlocks.map((heroBlock) => (
        <DynamicHeroBlock
          key={heroBlock.id}
          config={heroBlock.config}
          name={heroBlock.name}
          description={heroBlock.description}
        />
      ))}

      {/* Dynamic Sections */}
      {sections.map((section) => (
        <DynamicSection
          key={section.id}
          type={section.type}
          title={section.title}
          config={section.config}
          books={section.type === 'book_showcase' ? books : undefined}
        />
      ))}

      {/* Default content if no sections exist */}
      {sections.length === 0 && (
        <div className="container mx-auto px-6 py-24 text-center">
          <h2 className="text-3xl font-bold mb-4">Welcome to Your Author Platform</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your home page is ready to be customized. Visit the admin dashboard to add sections and content.
          </p>
        </div>
      )}

      {/* Dynamic Footer */}
      <DynamicFooter 
        config={siteSettings?.footer_config}
        siteTitle={siteSettings?.site_title}
      />
    </div>
  );
};

export default DynamicHomePage;