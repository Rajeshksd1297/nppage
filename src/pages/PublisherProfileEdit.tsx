import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Save, ArrowLeft, Globe, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useDynamicPublisherFields } from '@/hooks/useDynamicPublisherFields';

// Dynamic validation schema builder
const buildValidationSchema = (fields: any[]) => {
  const schemaObject: any = {};
  
  fields.forEach(field => {
    if (field.field_name === 'slug') return; // Skip slug, it's auto-generated
    
    // Add type-specific validation
    if (field.field_type === 'email') {
      if (field.is_required) {
        schemaObject[field.field_name] = z.string().trim().email(`Invalid ${field.field_label.toLowerCase()}`);
      } else {
        schemaObject[field.field_name] = z.string().trim().email(`Invalid ${field.field_label.toLowerCase()}`).optional().or(z.literal(''));
      }
    } else if (field.field_type === 'url') {
      if (field.is_required) {
        schemaObject[field.field_name] = z.string().trim().url(`Invalid ${field.field_label.toLowerCase()}`);
      } else {
        schemaObject[field.field_name] = z.string().trim().url(`Invalid ${field.field_label.toLowerCase()}`).optional().or(z.literal(''));
      }
    } else {
      // Text, textarea, number, etc.
      if (field.is_required) {
        schemaObject[field.field_name] = z.string().trim().min(1, `${field.field_label} is required`);
      } else {
        schemaObject[field.field_name] = z.string().trim().optional().or(z.literal(''));
      }
    }
  });
  
  return z.object(schemaObject);
};

export default function PublisherProfileEdit() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';
  const { toast } = useToast();
  const { fields, loading: fieldsLoading, generateUniqueSlug } = useDynamicPublisherFields();
  const [loading, setLoading] = useState(false);
  const [publisherData, setPublisherData] = useState<any>({
    custom_fields: {}
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditMode) {
      fetchPublisherData();
    }
  }, [isEditMode]);

  // Auto-generate unique slug from name in create mode
  useEffect(() => {
    if (!isEditMode && publisherData.name) {
      const debounceTimer = setTimeout(async () => {
        const uniqueSlug = await generateUniqueSlug(publisherData.name);
        setPublisherData(prev => ({ ...prev, slug: uniqueSlug }));
      }, 500); // Debounce to avoid too many checks while typing

      return () => clearTimeout(debounceTimer);
    }
  }, [publisherData.name, isEditMode, generateUniqueSlug]);

  const fetchPublisherData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('publishers')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const newData: any = { custom_fields: {} };
        
        // Map database fields to state
        fields.forEach(field => {
          if (field.is_custom) {
            const customFields = data.custom_fields as any || {};
            newData.custom_fields[field.field_name] = customFields[field.field_name] || '';
          } else if (field.field_name === 'slug') {
            newData.slug = data.slug.replace('pub-', '');
          } else {
            newData[field.field_name] = data[field.field_name] || '';
          }
        });
        
        setPublisherData(newData);
      }
    } catch (error) {
      console.error('Error fetching publisher data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load publisher data',
        variant: 'destructive',
      });
    }
  };

  const validateForm = () => {
    try {
      const schema = buildValidationSchema(fields);
      const dataToValidate: any = {};
      
      // Build data object from fields
      fields.forEach(field => {
        if (field.is_custom) {
          if (!dataToValidate.custom_fields) {
            dataToValidate.custom_fields = {};
          }
          dataToValidate.custom_fields[field.field_name] = publisherData.custom_fields?.[field.field_name] || '';
        } else if (field.field_name !== 'slug') {
          dataToValidate[field.field_name] = publisherData[field.field_name] || '';
        }
      });
      
      schema.parse(dataToValidate);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            const path = err.path.join('.');
            newErrors[path] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const finalSlug = `pub-${publisherData.slug}`;

      // Build update/insert data dynamically from fields
      const publisherUpdate: any = {
        slug: finalSlug,
        custom_fields: {}
      };

      fields.forEach(field => {
        if (field.field_name === 'slug') return;
        
        if (field.is_custom) {
          publisherUpdate.custom_fields[field.field_name] = publisherData.custom_fields?.[field.field_name] || null;
        } else {
          const value = publisherData[field.field_name];
          publisherUpdate[field.field_name] = value?.trim() || null;
        }
      });

      if (isEditMode) {
        // Update existing publisher
        delete publisherUpdate.slug; // Don't update slug
        
        const { error } = await supabase
          .from('publishers')
          .update(publisherUpdate)
          .eq('owner_id', user.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Publisher profile updated successfully',
        });
      } else {
        // Slug is already unique from the auto-generation
        const finalSlug = `pub-${publisherData.slug}`;
        const { error } = await supabase
          .from('publishers')
          .insert([{
            name: publisherData.name.trim(),
            slug: finalSlug,
            contact_email: publisherData.contact_email.trim(),
            website_url: publisherData.website_url?.trim() || null,
            description: publisherData.description?.trim() || null,
            brand_colors: publisherData.brand_colors,
            custom_fields: {
              ...publisherData.custom_fields,
              social_links: publisherData.social_links
            },
            owner_id: user.id,
            status: 'active',
            revenue_share_percentage: 30
          }]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Publisher profile created successfully',
        });
      }

      navigate('/publisher-page');
    } catch (error: any) {
      console.error('Error saving publisher:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save publisher profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: any) => {
    const isCustomField = field.is_custom;
    const fieldValue = isCustomField 
      ? publisherData.custom_fields?.[field.field_name] || ''
      : publisherData[field.field_name] || '';

    const handleFieldChange = (value: any) => {
      if (isCustomField) {
        setPublisherData({
          ...publisherData,
          custom_fields: {
            ...publisherData.custom_fields,
            [field.field_name]: value
          }
        });
      } else {
        setPublisherData({ ...publisherData, [field.field_name]: value });
      }
    };

    const errorKey = isCustomField ? `custom_fields.${field.field_name}` : field.field_name;
    const hasError = errors[errorKey];

    // Slug is always disabled and auto-generated
    const isDisabled = field.field_name === 'slug';

    return (
      <div key={field.id} className={field.field_type === 'textarea' ? 'md:col-span-2' : ''}>
        <Label htmlFor={field.field_name}>
          {field.field_label}
          {field.is_required && <span className="text-destructive ml-1">*</span>}
        </Label>
        
        {field.field_type === 'textarea' ? (
          <Textarea
            id={field.field_name}
            value={fieldValue}
            onChange={(e) => handleFieldChange(e.target.value)}
            placeholder={field.placeholder || ''}
            className={hasError ? 'border-destructive' : ''}
            disabled={isDisabled}
            rows={4}
          />
        ) : field.field_type === 'email' ? (
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id={field.field_name}
              type="email"
              value={fieldValue}
              onChange={(e) => handleFieldChange(e.target.value)}
              placeholder={field.placeholder || ''}
              className={`pl-10 ${hasError ? 'border-destructive' : ''}`}
              disabled={isDisabled}
            />
          </div>
        ) : field.field_type === 'url' ? (
          <div className="relative">
            <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id={field.field_name}
              type="url"
              value={fieldValue}
              onChange={(e) => handleFieldChange(e.target.value)}
              placeholder={field.placeholder || ''}
              className={`pl-10 ${hasError ? 'border-destructive' : ''}`}
              disabled={isDisabled}
            />
          </div>
        ) : field.field_name === 'slug' ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">pub-</span>
              <Input
                id={field.field_name}
                value={fieldValue}
                disabled={true}
                placeholder={field.placeholder || ''}
                className={`bg-muted cursor-not-allowed ${hasError ? 'border-destructive' : ''}`}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Automatically generated from publisher name
            </p>
          </>
        ) : (
          <Input
            id={field.field_name}
            type={field.field_type}
            value={fieldValue}
            onChange={(e) => handleFieldChange(e.target.value)}
            placeholder={field.placeholder || ''}
            className={hasError ? 'border-destructive' : ''}
            disabled={isDisabled}
          />
        )}
        
        {hasError && (
          <p className="text-sm text-destructive mt-1">{hasError}</p>
        )}
      </div>
    );
  };

  if (fieldsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate('/publisher-page')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Publisher Page
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            {isEditMode ? 'Edit Publisher Profile' : 'Create Publisher Profile'}
          </CardTitle>
          <CardDescription>
            {isEditMode 
              ? 'Update your publishing house information' 
              : 'Complete all required fields to create your publisher profile'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* All Dynamic Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map(field => renderField(field))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/publisher-page')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : isEditMode ? 'Update Publisher' : 'Create Publisher'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
