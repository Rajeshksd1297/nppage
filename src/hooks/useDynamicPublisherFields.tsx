import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DynamicField {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  is_enabled: boolean;
  is_custom: boolean;
  placeholder?: string;
  validation_rules?: any;
  options?: any;
  sort_order: number;
}

export function useDynamicPublisherFields() {
  const [fields, setFields] = useState<DynamicField[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFields();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('publisher_fields_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'publisher_field_settings'
      }, () => {
        fetchFields();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFields = async () => {
    try {
      const { data, error } = await supabase
        .from('publisher_field_settings')
        .select('*')
        .eq('is_enabled', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setFields(data || []);
    } catch (error) {
      console.error('Error fetching publisher fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  const generateUniqueSlug = async (name: string, currentPublisherId?: string): Promise<string> => {
    const baseSlug = generateSlug(name);
    let finalSlug = `pub-${baseSlug}`;
    let counter = 1;

    // Keep checking until we find a unique slug
    while (true) {
      const { data, error } = await supabase
        .from('publishers')
        .select('id')
        .eq('slug', finalSlug)
        .maybeSingle();

      if (error) {
        console.error('Error checking slug:', error);
        break;
      }

      // If no publisher exists with this slug, or it's the current publisher, we're good
      if (!data || (currentPublisherId && data.id === currentPublisherId)) {
        break;
      }

      // Slug exists, try with a number suffix
      finalSlug = `pub-${baseSlug}-${counter}`;
      counter++;
    }

    return finalSlug.replace('pub-', ''); // Return without prefix
  };

  return {
    fields,
    loading,
    generateSlug,
    generateUniqueSlug
  };
}