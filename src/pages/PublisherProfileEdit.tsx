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
  const [loading, setLoading] = useState(false);
  const [publisherData, setPublisherData] = useState({
    name: '',
    slug: '',
    contact_email: '',
    website_url: '',
    description: '',
    brand_colors: { primary: '#000000', secondary: '#666666', accent: '#0066cc' },
    social_links: { twitter: '', linkedin: '', website: '' }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditMode) {
      fetchPublisherData();
    }
  }, [isEditMode]);

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
        setPublisherData({
          name: data.name,
          slug: data.slug.replace('pub-', ''), // Remove prefix for editing
          contact_email: data.contact_email,
          website_url: data.website_url || '',
          description: (data as any).description || '',
          brand_colors: (data.brand_colors as any) || { primary: '#000000', secondary: '#666666', accent: '#0066cc' },
          social_links: (data as any).social_links || { twitter: '', linkedin: '', website: '' }
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

      const finalSlug = `pub-${publisherData.slug.toLowerCase().trim()}`;

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
            social_links: publisherData.social_links,
          })
          .eq('owner_id', user.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Publisher profile updated successfully',
        });
      } else {
        // Check if slug already exists
        const { data: existingPublisher } = await supabase
          .from('publishers')
          .select('id')
          .eq('slug', finalSlug)
          .maybeSingle();

        if (existingPublisher) {
          setErrors({ slug: 'This slug is already in use' });
          toast({
            title: 'Slug Taken',
            description: 'This slug is already in use. Please choose another one.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        // Create new publisher
        const { error } = await supabase
          .from('publishers')
          .insert([{
            name: publisherData.name.trim(),
            slug: finalSlug,
            contact_email: publisherData.contact_email.trim(),
            website_url: publisherData.website_url?.trim() || null,
            description: publisherData.description?.trim() || null,
            brand_colors: publisherData.brand_colors,
            social_links: publisherData.social_links,
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
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">
                    Publisher Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={publisherData.name}
                    onChange={(e) => setPublisherData({ ...publisherData, name: e.target.value })}
                    placeholder="My Publishing House"
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="slug">
                    Publisher Slug <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">pub-</span>
                    <Input
                      id="slug"
                      value={publisherData.slug}
                      onChange={(e) => setPublisherData({ ...publisherData, slug: e.target.value.toLowerCase() })}
                      placeholder="yourpublisher"
                      disabled={isEditMode} // Slug cannot be changed after creation
                      className={errors.slug ? 'border-destructive' : ''}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Lowercase letters, numbers, and hyphens only
                  </p>
                  {errors.slug && (
                    <p className="text-sm text-destructive mt-1">{errors.slug}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="contact_email">
                  Contact Email <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contact_email"
                    type="email"
                    value={publisherData.contact_email}
                    onChange={(e) => setPublisherData({ ...publisherData, contact_email: e.target.value })}
                    placeholder="contact@yourpublisher.com"
                    className={`pl-10 ${errors.contact_email ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.contact_email && (
                  <p className="text-sm text-destructive mt-1">{errors.contact_email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="website_url">Website URL</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website_url"
                    type="url"
                    value={publisherData.website_url}
                    onChange={(e) => setPublisherData({ ...publisherData, website_url: e.target.value })}
                    placeholder="https://yourpublisher.com"
                    className={`pl-10 ${errors.website_url ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.website_url && (
                  <p className="text-sm text-destructive mt-1">{errors.website_url}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={publisherData.description}
                  onChange={(e) => setPublisherData({ ...publisherData, description: e.target.value })}
                  placeholder="Tell us about your publishing house..."
                  rows={4}
                  className={errors.description ? 'border-destructive' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-destructive mt-1">{errors.description}</p>
                )}
              </div>
            </div>

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
