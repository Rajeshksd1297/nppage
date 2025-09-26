import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    textSecondary: string;
    muted: string;
    border: string;
    gradient?: {
      enabled: boolean;
      from: string;
      to: string;
      direction: string;
    };
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    headingSize: string;
    bodySize: string;
  };
  layout: {
    containerWidth: string;
    spacing: string;
    borderRadius: string;
    shadowStyle: string;
  };
  components: {
    buttonStyle: string;
    cardStyle: string;
    navigationStyle: string;
  };
}

interface Theme {
  id: string;
  name: string;
  description: string;
  preview_image_url?: string;
  premium: boolean;
  config: ThemeConfig;
}

interface ThemeContextType {
  currentTheme: Theme | null;
  themes: Theme[];
  loading: boolean;
  loadThemeByUser: (userId: string) => Promise<void>;
  applyThemeConfig: (config: ThemeConfig) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Default themes
const defaultThemes: Theme[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Clean and professional design',
    premium: false,
    config: {
      colors: {
        primary: '#2563eb',
        secondary: '#64748b',
        accent: '#059669',
        background: '#ffffff',
        text: '#1f2937',
        textSecondary: '#6b7280',
        muted: '#f3f4f6',
        border: '#e5e7eb',
        gradient: {
          enabled: false,
          from: '#2563eb',
          to: '#1d4ed8',
          direction: 'to-r'
        }
      },
      typography: {
        headingFont: 'Inter, system-ui, sans-serif',
        bodyFont: 'Inter, system-ui, sans-serif',
        headingSize: 'text-3xl',
        bodySize: 'text-base'
      },
      layout: {
        containerWidth: 'max-w-6xl',
        spacing: 'space-y-6',
        borderRadius: 'rounded-md',
        shadowStyle: 'shadow-sm'
      },
      components: {
        buttonStyle: 'solid',
        cardStyle: 'bordered',
        navigationStyle: 'horizontal'
      }
    }
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary design with gradients',
    premium: false,
    config: {
      colors: {
        primary: '#8b5cf6',
        secondary: '#64748b',
        accent: '#f59e0b',
        background: '#ffffff',
        text: '#111827',
        textSecondary: '#6b7280',
        muted: '#f9fafb',
        border: '#e5e7eb',
        gradient: {
          enabled: true,
          from: '#8b5cf6',
          to: '#3b82f6',
          direction: 'to-br'
        }
      },
      typography: {
        headingFont: 'Poppins, system-ui, sans-serif',
        bodyFont: 'Inter, system-ui, sans-serif',
        headingSize: 'text-4xl',
        bodySize: 'text-lg'
      },
      layout: {
        containerWidth: 'max-w-7xl',
        spacing: 'space-y-8',
        borderRadius: 'rounded-lg',
        shadowStyle: 'shadow-lg'
      },
      components: {
        buttonStyle: 'gradient',
        cardStyle: 'elevated',
        navigationStyle: 'centered'
      }
    }
  }
];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(null);
  const [themes, setThemes] = useState<Theme[]>(defaultThemes);
  const [loading, setLoading] = useState(false);

  const loadThemeByUser = async (userId: string) => {
    setLoading(true);
    try {
      // First get user's theme_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('theme_id')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      let theme: Theme | null = null;

      if (profile?.theme_id) {
        // Try to get theme from database
        const { data: dbTheme, error: themeError } = await supabase
          .from('themes')
          .select('*')
          .eq('id', profile.theme_id)
          .single();

        if (!themeError && dbTheme) {
          theme = {
            ...dbTheme,
            config: dbTheme.config as unknown as ThemeConfig
          };
        }
      }

      // Fallback to default theme if no theme found
      if (!theme) {
        theme = defaultThemes[0];
      }

      setCurrentTheme(theme);
      applyThemeConfig(theme.config);
    } catch (error) {
      console.error('Error loading theme:', error);
      // Use default theme on error
      const defaultTheme = defaultThemes[0];
      setCurrentTheme(defaultTheme);
      applyThemeConfig(defaultTheme.config);
    } finally {
      setLoading(false);
    }
  };

  const applyThemeConfig = (config: ThemeConfig) => {
    const root = document.documentElement;
    
    // Apply color variables
    root.style.setProperty('--color-primary', config.colors.primary);
    root.style.setProperty('--color-secondary', config.colors.secondary);
    root.style.setProperty('--color-accent', config.colors.accent);
    root.style.setProperty('--color-background', config.colors.background);
    root.style.setProperty('--color-text', config.colors.text);
    root.style.setProperty('--color-text-secondary', config.colors.textSecondary);
    root.style.setProperty('--color-muted', config.colors.muted);
    root.style.setProperty('--color-border', config.colors.border);

    // Apply typography
    root.style.setProperty('--font-heading', config.typography.headingFont);
    root.style.setProperty('--font-body', config.typography.bodyFont);

    // Apply layout styles
    root.style.setProperty('--container-width', config.layout.containerWidth);
    root.style.setProperty('--border-radius', config.layout.borderRadius);
  };

  useEffect(() => {
    // Load themes from database and merge with defaults
    const loadThemes = async () => {
      try {
        const { data: dbThemes, error } = await supabase
          .from('themes')
          .select('*')
          .order('premium', { ascending: true });

        if (!error && dbThemes) {
          // Merge default themes with database themes, avoiding duplicates
          const mergedThemes = [...defaultThemes];
          dbThemes.forEach(dbTheme => {
            if (!mergedThemes.find(t => t.id === dbTheme.id)) {
              mergedThemes.push({
                ...dbTheme,
                config: dbTheme.config as unknown as ThemeConfig
              });
            }
          });
          setThemes(mergedThemes);
        }
      } catch (error) {
        console.error('Error loading themes from database:', error);
      }
    };

    loadThemes();
  }, []);

  const value: ThemeContextType = {
    currentTheme,
    themes,
    loading,
    loadThemeByUser,
    applyThemeConfig
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}