import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  custom?: string;
}

interface FieldOptions {
  choices?: string[];
  defaultValue?: string;
  helpText?: string;
}

export default function PublisherFieldEdit() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fieldId = searchParams.get('id');
  const { toast } = useToast();

  const [loading, setLoading] = useState(!!fieldId);
  const [saving, setSaving] = useState(false);
  const [field, setField] = useState({
    field_label: '',
    field_type: 'text',
    placeholder: '',
    is_required: false,
    is_enabled: true,
    help_text: '',
    validation_rules: {} as FieldValidation,
    options: {} as FieldOptions,
  });

  const [choicesText, setChoicesText] = useState('');

  useEffect(() => {
    if (fieldId) {
      fetchField();
    }
  }, [fieldId]);

  const fetchField = async () => {
    try {
      const { data, error } = await supabase
        .from('publisher_field_settings')
        .select('*')
        .eq('id', fieldId)
        .single();

      if (error) throw error;

      const options = data.options as any || {};
      const validationRules = data.validation_rules as any || {};

      setField({
        field_label: data.field_label,
        field_type: data.field_type,
        placeholder: data.placeholder || '',
        is_required: data.is_required,
        is_enabled: data.is_enabled,
        help_text: options.helpText || '',
        validation_rules: validationRules,
        options: options,
      });

      if (options.choices && Array.isArray(options.choices)) {
        setChoicesText(options.choices.join('\n'));
      }
    } catch (error: any) {
      console.error('Error fetching field:', error);
      toast({
        title: 'Error',
        description: 'Failed to load field',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!field.field_label.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Field label is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      const choices = choicesText.trim() 
        ? choicesText.split('\n').map(c => c.trim()).filter(Boolean)
        : [];

      const fieldData = {
        field_label: field.field_label,
        field_type: field.field_type,
        placeholder: field.placeholder,
        is_required: field.is_required,
        is_enabled: field.is_enabled,
        validation_rules: field.validation_rules as any,
        options: {
          ...field.options,
          choices: choices.length > 0 ? choices : undefined,
          helpText: field.help_text || undefined,
        } as any,
      };

      if (fieldId) {
        const { error } = await supabase
          .from('publisher_field_settings')
          .update(fieldData)
          .eq('id', fieldId);

        if (error) throw error;
      } else {
        const fieldName = field.field_label.toLowerCase().replace(/\s+/g, '_');
        const { error } = await supabase
          .from('publisher_field_settings')
          .insert([{
            ...fieldData,
            field_name: `custom_${fieldName}`,
            is_custom: true,
            sort_order: 999,
          }]);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: fieldId ? 'Field updated successfully' : 'Field created successfully',
      });

      navigate('/admin/publishers?tab=profile');
    } catch (error: any) {
      console.error('Error saving field:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save field',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!fieldId) return;
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

      navigate('/admin/publishers?tab=profile');
    } catch (error: any) {
      console.error('Error deleting field:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete field',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading field...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/publishers?tab=profile')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Fields
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{fieldId ? 'Edit Publisher Field' : 'Add New Publisher Field'}</CardTitle>
          <CardDescription>
            Configure field properties, validation rules, and display options
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="field_label">Field Label *</Label>
                <Input
                  id="field_label"
                  value={field.field_label}
                  onChange={(e) => setField({ ...field, field_label: e.target.value })}
                  placeholder="e.g., Company Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="field_type">Field Type *</Label>
                <Select
                  value={field.field_type}
                  onValueChange={(value) => setField({ ...field, field_type: value })}
                >
                  <SelectTrigger id="field_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="tel">Phone</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="time">Time</SelectItem>
                    <SelectItem value="textarea">Text Area</SelectItem>
                    <SelectItem value="select">Select Dropdown</SelectItem>
                    <SelectItem value="multiselect">Multi-Select</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                    <SelectItem value="radio">Radio Group</SelectItem>
                    <SelectItem value="file">File Upload</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="placeholder">Placeholder Text</Label>
              <Input
                id="placeholder"
                value={field.placeholder}
                onChange={(e) => setField({ ...field, placeholder: e.target.value })}
                placeholder="e.g., Enter your company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="help_text">Help Text</Label>
              <Textarea
                id="help_text"
                value={field.help_text}
                onChange={(e) => setField({ ...field, help_text: e.target.value })}
                placeholder="Additional instructions or help text for this field"
                rows={2}
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_required"
                  checked={field.is_required}
                  onCheckedChange={(checked) => setField({ ...field, is_required: checked })}
                />
                <Label htmlFor="is_required">Required Field</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_enabled"
                  checked={field.is_enabled}
                  onCheckedChange={(checked) => setField({ ...field, is_enabled: checked })}
                />
                <Label htmlFor="is_enabled">Enabled</Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Field Options for Select/Radio/Multiselect */}
          {(['select', 'multiselect', 'radio'].includes(field.field_type)) && (
            <>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Field Choices</h3>
                <div className="space-y-2">
                  <Label htmlFor="choices">Options (one per line)</Label>
                  <Textarea
                    id="choices"
                    value={choicesText}
                    onChange={(e) => setChoicesText(e.target.value)}
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                    rows={6}
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter each choice on a new line
                  </p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Validation Rules */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Validation Rules</h3>
            
            {['text', 'textarea', 'number'].includes(field.field_type) && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min">Minimum {field.field_type === 'number' ? 'Value' : 'Length'}</Label>
                  <Input
                    id="min"
                    type="number"
                    value={field.validation_rules.min || ''}
                    onChange={(e) => setField({
                      ...field,
                      validation_rules: { ...field.validation_rules, min: parseInt(e.target.value) || undefined }
                    })}
                    placeholder="e.g., 3"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max">Maximum {field.field_type === 'number' ? 'Value' : 'Length'}</Label>
                  <Input
                    id="max"
                    type="number"
                    value={field.validation_rules.max || ''}
                    onChange={(e) => setField({
                      ...field,
                      validation_rules: { ...field.validation_rules, max: parseInt(e.target.value) || undefined }
                    })}
                    placeholder="e.g., 100"
                  />
                </div>
              </div>
            )}

            {field.field_type === 'text' && (
              <div className="space-y-2">
                <Label htmlFor="pattern">RegEx Pattern (Advanced)</Label>
                <Input
                  id="pattern"
                  value={field.validation_rules.pattern || ''}
                  onChange={(e) => setField({
                    ...field,
                    validation_rules: { ...field.validation_rules, pattern: e.target.value }
                  })}
                  placeholder="e.g., ^[A-Za-z]+$"
                />
                <p className="text-sm text-muted-foreground">
                  Regular expression for custom validation
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="custom_validation">Custom Validation Message</Label>
              <Input
                id="custom_validation"
                value={field.validation_rules.custom || ''}
                onChange={(e) => setField({
                  ...field,
                  validation_rules: { ...field.validation_rules, custom: e.target.value }
                })}
                placeholder="e.g., Please enter a valid value"
              />
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex justify-between items-center pt-4">
            <div>
              {fieldId && (
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Field
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/admin/publishers?tab=profile')}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Field'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
