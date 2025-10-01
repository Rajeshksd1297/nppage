import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ModeratorPermission {
  id: string;
  user_id: string;
  feature: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_approve: boolean;
}

export const AVAILABLE_FEATURES = [
  { value: 'newsletter', label: 'Newsletter Management' },
  { value: 'blog', label: 'Blog Posts' },
  { value: 'events', label: 'Events' },
  { value: 'awards', label: 'Awards' },
  { value: 'faq', label: 'FAQs' },
  { value: 'books', label: 'Books' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'contact', label: 'Contact Submissions' },
  { value: 'tickets', label: 'Support Tickets' },
  { value: 'users', label: 'User Management' },
] as const;

export const useModeratorPermissions = (userId?: string) => {
  const [permissions, setPermissions] = useState<ModeratorPermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchPermissions();
    }
  }, [userId]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('moderator_permissions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      setPermissions(data || []);
    } catch (error) {
      console.error('Error fetching moderator permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = async (
    feature: string,
    permissionType: keyof Omit<ModeratorPermission, 'id' | 'user_id' | 'feature'>,
    value: boolean
  ) => {
    try {
      const existing = permissions.find(p => p.feature === feature);

      if (existing) {
        const { error } = await supabase
          .from('moderator_permissions')
          .update({ [permissionType]: value })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('moderator_permissions')
          .insert({
            user_id: userId,
            feature,
            [permissionType]: value,
          });

        if (error) throw error;
      }

      await fetchPermissions();
    } catch (error) {
      console.error('Error updating permission:', error);
      throw error;
    }
  };

  const hasPermission = (feature: string, permissionType: string): boolean => {
    const permission = permissions.find(p => p.feature === feature);
    if (!permission) return false;

    switch (permissionType) {
      case 'view': return permission.can_view;
      case 'create': return permission.can_create;
      case 'edit': return permission.can_edit;
      case 'delete': return permission.can_delete;
      case 'approve': return permission.can_approve;
      default: return false;
    }
  };

  return {
    permissions,
    loading,
    updatePermission,
    hasPermission,
    refetch: fetchPermissions,
  };
};
