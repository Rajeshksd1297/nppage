import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Save, ArrowLeft, Globe, Mail, Palette } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useDynamicPublisherFields } from '@/hooks/useDynamicPublisherFields';

const publisherSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  slug: z.string().trim().min(1, 'Slug is required').max(50, 'Slug must be less than 50 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  contact_email: z.string().trim().email('Invalid email address').max(255, 'Email must be less than 255 characters'),
  website_url: z.string().trim().url('Invalid URL').optional().or(z.literal('')),
  description: z.string().trim().max(1000, 'Description must be less than 1000 characters').optional(),
});

export default function PublisherProfileEdit() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';
  const { toast } = useToast();
  const { fields, loading: fieldsLoading, generateUniqueSlug } = useDynamicPublisherFields();
  const [loading, setLoading] = useState(false);
  const [publisherData, setPublisherData] = useState<any>({
    name: '',
    slug: '',
    contact_email: '',
    website_url: '',
    description: '',
    brand_colors: { primary: '#000000', secondary: '#666666', accent: '#0066cc' },
    social_links: { twitter: '', linkedin: '', website: '' },
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
        const customFields = (data.custom_fields as any) || {};
        setPublisherData({
          name: data.name,
          slug: data.slug.replace('pub-', ''), // Remove prefix for editing
          contact_email: data.contact_email,
          website_url: data.website_url || '',
          description: data.description || '',
          brand_colors: data.brand_colors || { primary: '#000000', secondary: '#666666', accent: '#0066cc' },
          social_links: customFields.social_links || { twitter: '', linkedin: '', website: '' },
          custom_fields: customFields
        });
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
      publisherSchema.parse(publisherData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
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

      if (isEditMode) {
        // Update existing publisher
        const { error } = await supabase
          .from('publishers')
          .update({
            name: publisherData.name.trim(),
            contact_email: publisherData.contact_email.trim(),
            website_url: publisherData.website_url?.trim() || null,
            description: publisherData.description?.trim() || null,
            brand_colors: publisherData.brand_colors,
            custom_fields: {
              ...publisherData.custom_fields,
              social_links: publisherData.social_links
            },
          })
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

      navigate('/publisher-dashboard');
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

  const renderDynamicField = (field: any) => {
    const fieldValue = field.is_custom 
      ? publisherData.custom_fields?.[field.field_name] || ''
      : publisherData[field.field_name] || '';

    const handleFieldChange = (value: any) => {
      if (field.is_custom) {
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

    const commonProps = {
      id: field.field_name,
      value: fieldValue,
      onChange: (e: any) => handleFieldChange(e.target.value),
      placeholder: field.placeholder || '',
      className: errors[field.field_name] ? 'border-destructive' : '',
      disabled: field.field_name === 'slug', // Slug is always disabled (auto-generated)
    };

    return (
      <div key={field.id}>
        <Label htmlFor={field.field_name}>
          {field.field_label} {field.is_required && <span className="text-destructive">*</span>}
        </Label>
        {field.field_type === 'textarea' ? (
          <Textarea {...commonProps} rows={4} />
        ) : field.field_type === 'email' ? (
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input {...commonProps} type="email" className={`pl-10 ${commonProps.className}`} />
          </div>
        ) : field.field_type === 'url' ? (
          <div className="relative">
            <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input {...commonProps} type="url" className={`pl-10 ${commonProps.className}`} />
          </div>
        ) : field.field_name === 'slug' ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">pub-</span>
            <Input 
              {...commonProps} 
              className={`${commonProps.className} bg-muted cursor-not-allowed`}
            />
          </div>
        ) : (
          <Input {...commonProps} type={field.field_type} />
        )}
        {field.field_name === 'slug' && (
          <p className="text-xs text-muted-foreground mt-1">
            Automatically generated from publisher name
          </p>
        )}
        {errors[field.field_name] && (
          <p className="text-sm text-destructive mt-1">{errors[field.field_name]}</p>
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
        onClick={() => navigate('/publisher-dashboard')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
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
              : 'Set up your publishing house profile to manage authors and books'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dynamic Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Publisher Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.filter(f => !f.is_custom).map(field => (
                  <div key={field.id} className={field.field_type === 'textarea' ? 'md:col-span-2' : ''}>
                    {renderDynamicField(field)}
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Fields */}
            {fields.filter(f => f.is_custom).length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fields.filter(f => f.is_custom).map(field => (
                    <div key={field.id} className={field.field_type === 'textarea' ? 'md:col-span-2' : ''}>
                      {renderDynamicField(field)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Brand Colors */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Brand Colors
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={publisherData.brand_colors.primary}
                      onChange={(e) => setPublisherData({ 
                        ...publisherData, 
                        brand_colors: { ...publisherData.brand_colors, primary: e.target.value }
                      })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={publisherData.brand_colors.primary}
                      onChange={(e) => setPublisherData({ 
                        ...publisherData, 
                        brand_colors: { ...publisherData.brand_colors, primary: e.target.value }
                      })}
                      placeholder="#000000"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="secondary_color">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={publisherData.brand_colors.secondary}
                      onChange={(e) => setPublisherData({ 
                        ...publisherData, 
                        brand_colors: { ...publisherData.brand_colors, secondary: e.target.value }
                      })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={publisherData.brand_colors.secondary}
                      onChange={(e) => setPublisherData({ 
                        ...publisherData, 
                        brand_colors: { ...publisherData.brand_colors, secondary: e.target.value }
                      })}
                      placeholder="#666666"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="accent_color">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accent_color"
                      type="color"
                      value={publisherData.brand_colors.accent}
                      onChange={(e) => setPublisherData({ 
                        ...publisherData, 
                        brand_colors: { ...publisherData.brand_colors, accent: e.target.value }
                      })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={publisherData.brand_colors.accent}
                      onChange={(e) => setPublisherData({ 
                        ...publisherData, 
                        brand_colors: { ...publisherData.brand_colors, accent: e.target.value }
                      })}
                      placeholder="#0066cc"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Social Media Links</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input
                    id="twitter"
                    value={publisherData.social_links.twitter}
                    onChange={(e) => setPublisherData({ 
                      ...publisherData, 
                      social_links: { ...publisherData.social_links, twitter: e.target.value }
                    })}
                    placeholder="https://twitter.com/yourpublisher"
                  />
                </div>

                <div>
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={publisherData.social_links.linkedin}
                    onChange={(e) => setPublisherData({ 
                      ...publisherData, 
                      social_links: { ...publisherData.social_links, linkedin: e.target.value }
                    })}
                    placeholder="https://linkedin.com/company/yourpublisher"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/publisher-dashboard')}
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
