import { useState } from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Save, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDynamicPublisherFields } from '@/hooks/useDynamicPublisherFields';

interface Props {
  publisher: any;
  onUpdate: () => void;
}

export default function PublisherSettings({ publisher, onUpdate }: Props) {
  const { generateSlug, generateUniqueSlug } = useDynamicPublisherFields();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    slug: publisher.slug || '',
    status: publisher.status || 'active',
    country: publisher.country || '',
    timezone: publisher.timezone || 'UTC',
  });

  const handleGenerateSlug = async () => {
    const slug = await generateUniqueSlug(publisher.name, publisher.id);
    setFormData({ ...formData, slug });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate slug
      if (formData.slug && formData.slug !== publisher.slug) {
        const { data: existingPublisher } = await supabase
          .from('publishers')
          .select('id')
          .eq('slug', formData.slug)
          .neq('id', publisher.id)
          .maybeSingle();

        if (existingPublisher) {
          toast({
            title: 'Slug Already Taken',
            description: 'This slug is already in use by another publisher',
            variant: 'destructive',
          });
          return;
        }
      }

      const { error } = await supabase
        .from('publishers')
        .update(formData)
        .eq('id', publisher.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Publisher settings updated successfully',
      });

      onUpdate();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Publisher Settings
        </CardTitle>
        <CardDescription>
          Configure general settings for your publisher account
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Slug Configuration */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slug">Publisher Slug</Label>
            <div className="flex gap-2">
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="your-publisher-name"
              />
              <Button variant="outline" onClick={handleGenerateSlug}>
                Generate
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Used in your public page URL: {window.location.origin}/publisher/{formData.slug || 'your-slug'}
            </p>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            {formData.status !== 'active' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your publisher is currently {formData.status}. Some features may be restricted.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Country */}
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="United States"
            />
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) => setFormData({ ...formData, timezone: value })}
            >
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/New_York">Eastern Time (US)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (US)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (US)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (US)</SelectItem>
                <SelectItem value="Europe/London">London</SelectItem>
                <SelectItem value="Europe/Paris">Paris</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                <SelectItem value="Australia/Sydney">Sydney</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

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
