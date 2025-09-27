import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NewsletterSettings {
  allowUserNewsletters: boolean;
  maxNewslettersPerUser: number;
  requireEmailVerification: boolean;
  requireContentApproval: boolean;
}

interface BlogSettings {
  allowUserSubmissions: boolean;
  requireApproval: boolean;
  maxContentLength: number;
  allowHtml: boolean;
  categories: string[];
}

interface EventSettings {
  allowUserEvents: boolean;
  requireApproval: boolean;
  maxTitleLength: number;
  maxContentLength: number;
  categories: string[];
}

interface GallerySettings {
  allowUserUploads: boolean;
  requireApproval: boolean;
  maxImagesPerUser: number;
  maxImageSizeMb: number;
  allowedImageTypes: string[];
}

interface AwardsSettings {
  allowUserSubmissions: boolean;
  requireApproval: boolean;
  maxAwardsPerUser: number;
  categories: string[];
}

interface FaqSettings {
  allowUserSubmissions: boolean;
  requireApproval: boolean;
  maxFaqsPerUser: number;
  categories: string[];
}

interface AdminSettings {
  newsletter: NewsletterSettings | null;
  blog: BlogSettings | null;
  events: EventSettings | null;
  gallery: GallerySettings | null;
  awards: AwardsSettings | null;
  faq: FaqSettings | null;
}

export const useAdminSettings = () => {
  const [settings, setSettings] = useState<AdminSettings>({
    newsletter: null,
    blog: null,
    events: null,
    gallery: null,
    awards: null,
    faq: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminSettings();
  }, []);

  const fetchAdminSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all admin settings in parallel
      const [
        newsletterSettings,
        blogSettings,
        eventSettings,
        gallerySettings,
        awardsSettings,
        faqSettings
      ] = await Promise.allSettled([
        supabase.from('newsletter_settings' as any).select('*').maybeSingle(),
        supabase.from('blog_settings').select('*').maybeSingle(),
        supabase.from('event_settings').select('*').maybeSingle(),
        supabase.from('gallery_settings').select('*').maybeSingle(),
        supabase.from('awards_settings').select('*').maybeSingle(),
        supabase.from('faq_settings').select('*').maybeSingle()
      ]);

      // Process newsletter settings
      if (newsletterSettings.status === 'fulfilled' && newsletterSettings.value.data) {
        const data = newsletterSettings.value.data as any;
        setSettings(prev => ({
          ...prev,
          newsletter: {
            allowUserNewsletters: data.allow_user_newsletters ?? true,
            maxNewslettersPerUser: data.max_newsletters_per_user ?? 5,
            requireEmailVerification: data.require_email_verification ?? true,
            requireContentApproval: data.require_content_approval ?? false
          }
        }));
      }

      // Process blog settings
      if (blogSettings.status === 'fulfilled' && blogSettings.value.data) {
        const data = blogSettings.value.data as any;
        setSettings(prev => ({
          ...prev,
          blog: {
            allowUserSubmissions: true, // Blog doesn't have this field, assume true
            requireApproval: data.require_approval ?? false,
            maxContentLength: data.max_content_length ?? 50000,
            allowHtml: data.allow_html ?? true,
            categories: Array.isArray(data.categories) ? (data.categories as string[]) : []
          }
        }));
      }

      // Process event settings
      if (eventSettings.status === 'fulfilled' && eventSettings.value.data) {
        const data = eventSettings.value.data as any;
        setSettings(prev => ({
          ...prev,
          events: {
            allowUserEvents: data.allow_user_events ?? true,
            requireApproval: data.require_approval ?? false,
            maxTitleLength: data.max_title_length ?? 100,
            maxContentLength: data.max_content_length ?? 2000,
            categories: Array.isArray(data.categories) ? (data.categories as string[]) : []
          }
        }));
      }

      // Process gallery settings
      if (gallerySettings.status === 'fulfilled' && gallerySettings.value.data) {
        const data = gallerySettings.value.data as any;
        setSettings(prev => ({
          ...prev,
          gallery: {
            allowUserUploads: data.allow_user_uploads ?? true,
            requireApproval: data.require_approval ?? false,
            maxImagesPerUser: data.max_images_per_user ?? 50,
            maxImageSizeMb: data.max_image_size_mb ?? 10,
            allowedImageTypes: Array.isArray(data.allowed_image_types) ? (data.allowed_image_types as string[]) : []
          }
        }));
      }

      // Process awards settings
      if (awardsSettings.status === 'fulfilled' && awardsSettings.value.data) {
        const data = awardsSettings.value.data as any;
        setSettings(prev => ({
          ...prev,
          awards: {
            allowUserSubmissions: data.allow_user_submissions ?? true,
            requireApproval: data.require_approval ?? false,
            maxAwardsPerUser: data.max_awards_per_user ?? 20,
            categories: Array.isArray(data.categories) ? (data.categories as string[]) : []
          }
        }));
      }

      // Process FAQ settings
      if (faqSettings.status === 'fulfilled' && faqSettings.value.data) {
        const data = faqSettings.value.data as any;
        setSettings(prev => ({
          ...prev,
          faq: {
            allowUserSubmissions: data.allow_user_submissions ?? true,
            requireApproval: data.require_approval ?? false,
            maxFaqsPerUser: data.max_faqs_per_user ?? 10,
            categories: Array.isArray(data.categories) ? (data.categories as string[]) : []
          }
        }));
      }

    } catch (err) {
      console.error('Error fetching admin settings:', err);
      setError('Failed to load admin settings');
    } finally {
      setLoading(false);
    }
  };

  const hasFeatureAccess = (feature: keyof AdminSettings): boolean => {
    const featureSetting = settings[feature];
    if (!featureSetting) return true; // Default to true if no settings found
    
    switch (feature) {
      case 'newsletter':
        return (featureSetting as NewsletterSettings).allowUserNewsletters;
      case 'blog':
        return (featureSetting as BlogSettings).allowUserSubmissions;
      case 'events':
        return (featureSetting as EventSettings).allowUserEvents;
      case 'gallery':
        return (featureSetting as GallerySettings).allowUserUploads;
      case 'awards':
        return (featureSetting as AwardsSettings).allowUserSubmissions;
      case 'faq':
        return (featureSetting as FaqSettings).allowUserSubmissions;
      default:
        return true;
    }
  };

  const getFeatureLimit = (feature: keyof AdminSettings, limitType: string): number => {
    const featureSetting = settings[feature];
    if (!featureSetting) return 999; // Default high limit if no settings found
    
    switch (feature) {
      case 'newsletter':
        if (limitType === 'maxItems') return (featureSetting as NewsletterSettings).maxNewslettersPerUser;
        break;
      case 'blog':
        if (limitType === 'maxContentLength') return (featureSetting as BlogSettings).maxContentLength;
        break;
      case 'events':
        if (limitType === 'maxTitleLength') return (featureSetting as EventSettings).maxTitleLength;
        if (limitType === 'maxContentLength') return (featureSetting as EventSettings).maxContentLength;
        break;
      case 'gallery':
        if (limitType === 'maxItems') return (featureSetting as GallerySettings).maxImagesPerUser;
        if (limitType === 'maxFileSize') return (featureSetting as GallerySettings).maxImageSizeMb;
        break;
      case 'awards':
        if (limitType === 'maxItems') return (featureSetting as AwardsSettings).maxAwardsPerUser;
        break;
      case 'faq':
        if (limitType === 'maxItems') return (featureSetting as FaqSettings).maxFaqsPerUser;
        break;
    }
    return 999;
  };

  const requiresApproval = (feature: keyof AdminSettings): boolean => {
    const featureSetting = settings[feature];
    if (!featureSetting) return false;
    
    return 'requireApproval' in featureSetting ? featureSetting.requireApproval : false;
  };

  const getCategories = (feature: keyof AdminSettings): string[] => {
    const featureSetting = settings[feature];
    if (!featureSetting || !('categories' in featureSetting)) return [];
    
    return featureSetting.categories || [];
  };

  return {
    settings,
    loading,
    error,
    hasFeatureAccess,
    getFeatureLimit,
    requiresApproval,
    getCategories,
    refetch: fetchAdminSettings
  };
};