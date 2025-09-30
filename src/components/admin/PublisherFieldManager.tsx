import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, GripVertical, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PublisherField {
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

interface Publisher {
  id: string;
  name: string;
}

interface BrandingConfig {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url: string;
  favicon_url: string;
  custom_css: string;
  font_family: string;
}

const FONT_OPTIONS = [
  { value: 'inter', label: 'Inter' },
  { value: 'roboto', label: 'Roboto' },
  { value: 'open-sans', label: 'Open Sans' },
  { value: 'lato', label: 'Lato' },
  { value: 'montserrat', label: 'Montserrat' },
  { value: 'playfair', label: 'Playfair Display' },
  { value: 'merriweather', label: 'Merriweather' },
];

export default function PublisherFieldManager() {
  const navigate = useNavigate();
  const [fields, setFields] = useState<PublisherField[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchFields();

    // Real-time sync
    const channel = supabase
      .channel('publisher_fields_sync')
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
      setLoading(true);
      const { data, error } = await supabase
        .from('publisher_field_settings')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setFields(data || []);
    } catch (error) {
      console.error('Error fetching publisher fields:', error);
      toast({
        title: 'Error',
        description: 'Failed to load publisher fields',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('Are you sure you want to delete this field?')) return;

    try {
      const { error } = await supabase
        .from('publisher_field_settings')
        .delete()
        .eq('id', fieldId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Field deleted successfully',
      });

      fetchFields();
    } catch (error: any) {
      console.error('Error deleting field:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete field',
        variant: 'destructive',
      });
    }
  };

  const handleToggleField = async (fieldId: string, isEnabled: boolean) => {
    try {
      const { error } = await supabase
        .from('publisher_field_settings')
        .update({ is_enabled: !isEnabled })
        .eq('id', fieldId);

      if (error) throw error;

      fetchFields();
    } catch (error: any) {
      console.error('Error toggling field:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to toggle field',
        variant: 'destructive',
      });
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Publisher Form Fields
        </CardTitle>
        <CardDescription>
          Customize fields displayed in publisher registration and profile forms
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Button onClick={() => navigate('/admin/publishers/field/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Field
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Order</TableHead>
                  <TableHead>Field Label</TableHead>
                  <TableHead>Field Type</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No fields configured
                    </TableCell>
                  </TableRow>
                ) : (
                  fields.map((field) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      </TableCell>
                      <TableCell className="font-medium">
                        {field.field_label}
                        {field.is_custom && (
                          <Badge variant="outline" className="ml-2 text-xs">Custom</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{field.field_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {field.is_required ? (
                          <Badge variant="destructive">Required</Badge>
                        ) : (
                          <Badge variant="outline">Optional</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={field.is_enabled}
                          onCheckedChange={() => handleToggleField(field.id, field.is_enabled)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/publishers/field/edit?id=${field.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {field.is_custom && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteField(field.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
