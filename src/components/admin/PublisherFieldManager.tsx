import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X, GripVertical } from 'lucide-react';
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

export default function PublisherFieldManager() {
  const [fields, setFields] = useState<PublisherField[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<Partial<PublisherField> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchFields();
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

  const handleSaveField = async () => {
    if (!editingField) return;

    try {
      if (editingField.id) {
        // Update existing field
        const { error } = await supabase
          .from('publisher_field_settings')
          .update({
            field_label: editingField.field_label,
            field_type: editingField.field_type,
            is_required: editingField.is_required,
            is_enabled: editingField.is_enabled,
            placeholder: editingField.placeholder,
          })
          .eq('id', editingField.id);

        if (error) throw error;
      } else {
        // Create new custom field
        const fieldName = editingField.field_label?.toLowerCase().replace(/\s+/g, '_') || '';
        const { error } = await supabase
          .from('publisher_field_settings')
          .insert([{
            field_name: `custom_${fieldName}`,
            field_label: editingField.field_label,
            field_type: editingField.field_type || 'text',
            is_required: editingField.is_required || false,
            is_enabled: editingField.is_enabled !== false,
            is_custom: true,
            placeholder: editingField.placeholder,
            sort_order: fields.length + 1,
          }]);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: editingField.id ? 'Field updated successfully' : 'Custom field created successfully',
      });

      setIsDialogOpen(false);
      setEditingField(null);
      fetchFields();
    } catch (error: any) {
      console.error('Error saving field:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save field',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteField = async (fieldId: string, isCustom: boolean) => {
    if (!isCustom) {
      toast({
        title: 'Cannot Delete',
        description: 'Built-in fields cannot be deleted, but you can disable them.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('publisher_field_settings')
        .delete()
        .eq('id', fieldId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Custom field deleted successfully',
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

  const handleToggleEnabled = async (fieldId: string, currentEnabled: boolean) => {
    try {
      const { error } = await supabase
        .from('publisher_field_settings')
        .update({ is_enabled: !currentEnabled })
        .eq('id', fieldId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Field ${!currentEnabled ? 'enabled' : 'disabled'} successfully`,
      });

      fetchFields();
    } catch (error) {
      console.error('Error toggling field:', error);
      toast({
        title: 'Error',
        description: 'Failed to update field',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Publisher Form Fields</CardTitle>
            <CardDescription>
              Manage the fields displayed in publisher profile forms
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingField({
                    field_label: '',
                    field_type: 'text',
                    is_required: false,
                    is_enabled: true,
                    is_custom: true,
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Field
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingField?.id ? 'Edit Field' : 'Add Custom Field'}
                </DialogTitle>
                <DialogDescription>
                  {editingField?.id 
                    ? 'Update field configuration' 
                    : 'Create a new custom field for publisher profiles'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="field_label">Field Label</Label>
                  <Input
                    id="field_label"
                    value={editingField?.field_label || ''}
                    onChange={(e) => setEditingField({ ...editingField, field_label: e.target.value })}
                    placeholder="e.g., Phone Number"
                  />
                </div>

                <div>
                  <Label htmlFor="field_type">Field Type</Label>
                  <Select
                    value={editingField?.field_type || 'text'}
                    onValueChange={(value) => setEditingField({ ...editingField, field_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="url">URL</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="textarea">Text Area</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="placeholder">Placeholder</Label>
                  <Input
                    id="placeholder"
                    value={editingField?.placeholder || ''}
                    onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })}
                    placeholder="Enter placeholder text"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_required">Required Field</Label>
                  <Switch
                    id="is_required"
                    checked={editingField?.is_required || false}
                    onCheckedChange={(checked) => setEditingField({ ...editingField, is_required: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_enabled">Enabled</Label>
                  <Switch
                    id="is_enabled"
                    checked={editingField?.is_enabled !== false}
                    onCheckedChange={(checked) => setEditingField({ ...editingField, is_enabled: checked })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingField(null);
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveField}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Field
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Field Label</TableHead>
              <TableHead>Field Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field) => (
              <TableRow key={field.id}>
                <TableCell>
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </TableCell>
                <TableCell className="font-medium">
                  {field.field_label}
                  {field.is_required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{field.field_type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={field.is_enabled ? 'default' : 'secondary'}>
                    {field.is_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={field.is_custom ? 'secondary' : 'default'}>
                    {field.is_custom ? 'Custom' : 'Built-in'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleEnabled(field.id, field.is_enabled)}
                    >
                      {field.is_enabled ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingField(field);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {field.is_custom && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteField(field.id, field.is_custom)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}