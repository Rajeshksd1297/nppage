import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';

interface BlogSettings {
  id: string;
  max_title_length: number;
  max_content_length: number;
  max_excerpt_length: number;
  allowed_image_size_mb: number;
  allowed_image_types: string[];
  require_approval: boolean;
  allow_html: boolean;
  categories: string[];
  auto_generate_slug: boolean;
  default_status: string;
  created_at: string;
  updated_at: string;
}

export default function BlogSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<BlogSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings({
          ...data,
          categories: Array.isArray(data.categories) ? data.categories as string[] : []
        });
      } else {
        // Create default settings if none exist
        const defaultSettings = {
          max_title_length: 100,
          max_content_length: 50000,
          max_excerpt_length: 300,
          allowed_image_size_mb: 5,
          allowed_image_types: ['image/jpeg', 'image/png', 'image/webp'],
          require_approval: false,
          allow_html: true,
          categories: ['General', 'Technology', 'Lifestyle', 'Business', 'Education', 'Health', 'Travel', 'Food'],
          auto_generate_slug: true,
          default_status: 'draft'
        };

        const { data: newData, error: insertError } = await supabase
          .from('blog_settings')
          .insert([defaultSettings])
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings({
          ...newData,
          categories: Array.isArray(newData.categories) ? newData.categories as string[] : []
        });
      }
    } catch (error: any) {
      console.error('Error fetching blog settings:', error);
      toast({
        title: "Error",
        description: "Failed to load blog settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('blog_settings')
        .update(settings)
        .eq('id', settings.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Blog settings updated successfully",
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save blog settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    if (!newCategory.trim() || !settings) return;
    
    const updatedCategories = [...settings.categories, newCategory.trim()];
    setSettings({
      ...settings,
      categories: updatedCategories
    });
    setNewCategory('');
  };

  const removeCategory = (categoryToRemove: string) => {
    if (!settings) return;
    
    const updatedCategories = settings.categories.filter(cat => cat !== categoryToRemove);
    setSettings({
      ...settings,
      categories: updatedCategories
    });
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (!settings) {
    return <div className="flex justify-center p-8">No settings found</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/admin/blog-management')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Blog Settings</h1>
          <p className="text-muted-foreground">Configure blog management settings and restrictions</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Content Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Content Limits</CardTitle>
            <CardDescription>Set character and size limits for blog content</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="max_title_length">Max Title Length</Label>
              <Input
                id="max_title_length"
                type="number"
                value={settings.max_title_length}
                onChange={(e) => setSettings({
                  ...settings,
                  max_title_length: parseInt(e.target.value) || 0
                })}
              />
            </div>
            <div>
              <Label htmlFor="max_excerpt_length">Max Excerpt Length</Label>
              <Input
                id="max_excerpt_length"
                type="number"
                value={settings.max_excerpt_length}
                onChange={(e) => setSettings({
                  ...settings,
                  max_excerpt_length: parseInt(e.target.value) || 0
                })}
              />
            </div>
            <div>
              <Label htmlFor="max_content_length">Max Content Length</Label>
              <Input
                id="max_content_length"
                type="number"
                value={settings.max_content_length}
                onChange={(e) => setSettings({
                  ...settings,
                  max_content_length: parseInt(e.target.value) || 0
                })}
              />
            </div>
            <div>
              <Label htmlFor="allowed_image_size_mb">Max Image Size (MB)</Label>
              <Input
                id="allowed_image_size_mb"
                type="number"
                value={settings.allowed_image_size_mb}
                onChange={(e) => setSettings({
                  ...settings,
                  allowed_image_size_mb: parseInt(e.target.value) || 0
                })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Content Management */}
        <Card>
          <CardHeader>
            <CardTitle>Content Management</CardTitle>
            <CardDescription>Configure content approval and formatting options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="require_approval">Require Approval</Label>
                <p className="text-sm text-muted-foreground">Posts need admin approval before publishing</p>
              </div>
              <Switch
                id="require_approval"
                checked={settings.require_approval}
                onCheckedChange={(checked) => setSettings({
                  ...settings,
                  require_approval: checked
                })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="allow_html">Allow HTML</Label>
                <p className="text-sm text-muted-foreground">Allow HTML tags in post content</p>
              </div>
              <Switch
                id="allow_html"
                checked={settings.allow_html}
                onCheckedChange={(checked) => setSettings({
                  ...settings,
                  allow_html: checked
                })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto_generate_slug">Auto Generate Slug</Label>
                <p className="text-sm text-muted-foreground">Automatically generate URL slug from title</p>
              </div>
              <Switch
                id="auto_generate_slug"
                checked={settings.auto_generate_slug}
                onCheckedChange={(checked) => setSettings({
                  ...settings,
                  auto_generate_slug: checked
                })}
              />
            </div>
            <div>
              <Label htmlFor="default_status">Default Post Status</Label>
              <Select
                value={settings.default_status}
                onValueChange={(value) => setSettings({
                  ...settings,
                  default_status: value
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Manage blog post categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add new category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCategory()}
              />
              <Button onClick={addCategory}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {settings.categories.map((category, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {category}
                  <button
                    onClick={() => removeCategory(category)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Image Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Image Settings</CardTitle>
            <CardDescription>Configure allowed image types and sizes</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label>Allowed Image Types</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {settings.allowed_image_types.map((type, index) => (
                  <Badge key={index} variant="outline">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}