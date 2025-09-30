import { useState } from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Globe, Save, ExternalLink, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  publisher: any;
}

export default function PublisherPublicPage({ publisher }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  const customFields = publisher.custom_fields || {};
  const [formData, setFormData] = useState({
    public_page_enabled: customFields.public_page_enabled || false,
    public_page_title: customFields.public_page_title || publisher.name,
    public_page_description: customFields.public_page_description || '',
    public_page_content: customFields.public_page_content || '',
    show_authors: customFields.show_authors ?? true,
    show_books: customFields.show_books ?? true,
    show_contact_form: customFields.show_contact_form ?? true,
  });

  const publicPageUrl = publisher.slug 
    ? `${window.location.origin}/publisher/${publisher.slug}`
    : 'Configure slug in settings first';

  const handleSave = async () => {
    try {
      setSaving(true);

      const updatedCustomFields = {
        ...customFields,
        ...formData,
      };

      const { error } = await supabase
        .from('publishers')
        .update({ 
          custom_fields: updatedCustomFields as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', publisher.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Public page settings updated successfully',
      });
    } catch (error: any) {
      console.error('Error saving public page:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save public page settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Public Page
            </CardTitle>
            <CardDescription>
              Create and manage your public publisher page
            </CardDescription>
          </div>
          {formData.public_page_enabled && publisher.slug && (
            <Button variant="outline" asChild>
              <a href={publicPageUrl} target="_blank" rel="noopener noreferrer">
                <Eye className="h-4 w-4 mr-2" />
                View Page
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!publisher.slug && (
          <Alert>
            <AlertDescription>
              Configure a slug in Settings to enable your public page URL
            </AlertDescription>
          </Alert>
        )}

        {/* Enable Public Page */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="public_page_enabled" className="text-base">
              Enable Public Page
            </Label>
            <p className="text-sm text-muted-foreground">
              Make your publisher page visible to the public
            </p>
          </div>
          <Switch
            id="public_page_enabled"
            checked={formData.public_page_enabled}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, public_page_enabled: checked })
            }
          />
        </div>

        {/* Page URL */}
        {publisher.slug && (
          <div className="space-y-2">
            <Label>Public Page URL</Label>
            <div className="flex gap-2">
              <Input value={publicPageUrl} readOnly className="flex-1" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(publicPageUrl);
                  toast({ title: 'Copied', description: 'URL copied to clipboard' });
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="public_page_title">Page Title</Label>
            <Input
              id="public_page_title"
              value={formData.public_page_title}
              onChange={(e) =>
                setFormData({ ...formData, public_page_title: e.target.value })
              }
              placeholder="Your publisher name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="public_page_description">Page Description</Label>
            <Textarea
              id="public_page_description"
              value={formData.public_page_description}
              onChange={(e) =>
                setFormData({ ...formData, public_page_description: e.target.value })
              }
              placeholder="Brief description for your public page"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="public_page_content">Page Content</Label>
            <Textarea
              id="public_page_content"
              value={formData.public_page_content}
              onChange={(e) =>
                setFormData({ ...formData, public_page_content: e.target.value })
              }
              placeholder="Detailed content about your publishing house, mission, values, etc."
              rows={8}
            />
          </div>
        </div>

        {/* Display Options */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold">Display Options</h3>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="show_authors" className="text-base">
                Show Authors
              </Label>
              <p className="text-sm text-muted-foreground">
                Display list of authors on your public page
              </p>
            </div>
            <Switch
              id="show_authors"
              checked={formData.show_authors}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, show_authors: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="show_books" className="text-base">
                Show Books
              </Label>
              <p className="text-sm text-muted-foreground">
                Display books published under your house
              </p>
            </div>
            <Switch
              id="show_books"
              checked={formData.show_books}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, show_books: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="show_contact_form" className="text-base">
                Show Contact Form
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow visitors to contact you through a form
              </p>
            </div>
            <Switch
              id="show_contact_form"
              checked={formData.show_contact_form}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, show_contact_form: checked })
              }
            />
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
