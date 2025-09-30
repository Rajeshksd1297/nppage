import { useState, useEffect } from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDynamicPublisherFields } from '@/hooks/useDynamicPublisherFields';

interface Props {
  publisher: any;
  onUpdate: () => void;
}

export default function PublisherProfileEditor({ publisher, onUpdate }: Props) {
  const { fields, loading: fieldsLoading } = useDynamicPublisherFields();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: publisher.name || '',
    description: publisher.description || '',
    website: publisher.website || '',
    contact_email: publisher.contact_email || '',
    phone: publisher.phone || '',
    address: publisher.address || '',
  });

  useEffect(() => {
    // Populate custom fields
    if (publisher.custom_fields) {
      setFormData((prev: any) => ({ ...prev, ...publisher.custom_fields }));
    }
  }, [publisher]);

  const handleSave = async () => {
    try {
      setSaving(true);

      // Separate standard fields from custom fields
      const standardFields = {
        name: formData.name,
        description: formData.description,
        website: formData.website,
        contact_email: formData.contact_email,
        phone: formData.phone,
        address: formData.address,
      };

      const customFields: any = {};
      fields.forEach(field => {
        if (field.is_custom && formData[field.field_name]) {
          customFields[field.field_name] = formData[field.field_name];
        }
      });

      const { error } = await supabase
        .from('publishers')
        .update({
          ...standardFields,
          custom_fields: customFields,
          updated_at: new Date().toISOString(),
        })
        .eq('id', publisher.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Publisher profile updated successfully',
      });

      onUpdate();
    } catch (error: any) {
      console.error('Error saving publisher profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save publisher profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field: any) => {
    const value = formData[field.field_name] || '';

    switch (field.field_type) {
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.field_name]: e.target.value })}
            placeholder={field.placeholder}
            required={field.is_required}
            rows={4}
          />
        );
      case 'select':
        return (
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.field_name]: e.target.value })}
            required={field.is_required}
          >
            <option value="">Select...</option>
            {field.options?.choices?.map((choice: string) => (
              <option key={choice} value={choice}>{choice}</option>
            ))}
          </select>
        );
      default:
        return (
          <Input
            type={field.field_type}
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.field_name]: e.target.value })}
            placeholder={field.placeholder}
            required={field.is_required}
          />
        );
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Publisher Profile
        </CardTitle>
        <CardDescription>
          Update your publisher information and details
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Standard Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Publisher Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter publisher name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email">Contact Email *</Label>
            <Input
              id="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              placeholder="contact@publisher.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://publisher.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of your publishing house"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Full business address"
            rows={2}
          />
        </div>

        {/* Dynamic Custom Fields */}
        {!fieldsLoading && fields.filter(f => f.is_custom && f.is_enabled).length > 0 && (
          <>
            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.filter(f => f.is_custom && f.is_enabled).map(field => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.field_name}>
                      {field.field_label}
                      {field.is_required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {renderField(field)}
                    {field.options?.helpText && (
                      <p className="text-xs text-muted-foreground">{field.options.helpText}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </>
  );
}
