import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Save,
  Plus,
  Trash2,
  Image,
  Clock,
  FileText,
  Users,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EventSettings {
  id?: string;
  max_title_length: number;
  max_description_length: number;
  allowed_image_size_mb: number;
  allowed_image_types: string[];
  require_approval: boolean;
  default_duration_hours: number;
  categories: string[];
  default_status: string;
  allow_virtual_events: boolean;
  allow_registration: boolean;
  max_attendees_limit: number;
  auto_generate_slug: boolean;
  enable_featured_images: boolean;
  created_at?: string;
  updated_at?: string;
}

const defaultSettings: EventSettings = {
  max_title_length: 100,
  max_description_length: 2000,
  allowed_image_size_mb: 5,
  allowed_image_types: ['image/jpeg', 'image/png', 'image/webp'],
  require_approval: false,
  default_duration_hours: 2,
  categories: ['General', 'Book Launch', 'Book Signing', 'Interview', 'Conference', 'Workshop', 'Webinar'],
  default_status: 'upcoming',
  allow_virtual_events: true,
  allow_registration: true,
  max_attendees_limit: 1000,
  auto_generate_slug: true,
  enable_featured_images: true,
};

export default function EventSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<EventSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [showImageTypes, setShowImageTypes] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('event_settings' as any)
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const eventData = data as any;
        setSettings({
          ...defaultSettings,
          ...eventData,
          categories: eventData.categories || defaultSettings.categories,
          allowed_image_types: eventData.allowed_image_types || defaultSettings.allowed_image_types,
        });
      }
    } catch (error) {
      console.error('Error fetching event settings:', error);
      toast({
        title: "Error",
        description: "Failed to load event settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      
      const { data: existingSettings } = await supabase
        .from('event_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existingSettings) {
        const { error } = await supabase
          .from('event_settings')
          .update(settings)
          .eq('id', existingSettings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('event_settings')
          .insert([settings]);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Event settings saved successfully",
      });
    } catch (error: any) {
      console.error('Error saving event settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save event settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addCategory = () => {
    if (newCategory.trim() && !settings.categories.includes(newCategory.trim())) {
      setSettings({
        ...settings,
        categories: [...settings.categories, newCategory.trim()]
      });
      setNewCategory('');
    }
  };

  const removeCategory = (category: string) => {
    setSettings({
      ...settings,
      categories: settings.categories.filter(c => c !== category)
    });
  };

  const handleImageTypeChange = (type: string, checked: boolean) => {
    const newTypes = checked
      ? [...settings.allowed_image_types, type]
      : settings.allowed_image_types.filter(t => t !== type);
    
    setSettings({
      ...settings,
      allowed_image_types: newTypes
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Event Settings
          </h1>
          <p className="text-muted-foreground">Configure event management settings and restrictions</p>
        </div>
        <Button onClick={saveSettings} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Content Restrictions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Content Restrictions
            </CardTitle>
            <CardDescription>
              Set limits for event titles and descriptions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="max_title_length">Maximum Title Length</Label>
              <Input
                id="max_title_length"
                type="number"
                min="10"
                max="200"
                value={settings.max_title_length}
                onChange={(e) => setSettings({ ...settings, max_title_length: parseInt(e.target.value) || 100 })}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Characters allowed in event titles
              </p>
            </div>

            <div>
              <Label htmlFor="max_description_length">Maximum Description Length</Label>
              <Input
                id="max_description_length"
                type="number"
                min="100"
                max="10000"
                value={settings.max_description_length}
                onChange={(e) => setSettings({ ...settings, max_description_length: parseInt(e.target.value) || 2000 })}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Characters allowed in event descriptions
              </p>
            </div>

            <div>
              <Label htmlFor="default_duration_hours">Default Event Duration (Hours)</Label>
              <Input
                id="default_duration_hours"
                type="number"
                min="0.5"
                max="168"
                step="0.5"
                value={settings.default_duration_hours}
                onChange={(e) => setSettings({ ...settings, default_duration_hours: parseFloat(e.target.value) || 2 })}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Default duration for new events
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Image Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Image Settings
            </CardTitle>
            <CardDescription>
              Configure image upload restrictions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="enable_featured_images">Enable Featured Images</Label>
              <Switch
                id="enable_featured_images"
                checked={settings.enable_featured_images}
                onCheckedChange={(checked) => setSettings({ ...settings, enable_featured_images: checked })}
              />
            </div>

            <div>
              <Label htmlFor="allowed_image_size_mb">Maximum Image Size (MB)</Label>
              <Input
                id="allowed_image_size_mb"
                type="number"
                min="1"
                max="50"
                value={settings.allowed_image_size_mb}
                onChange={(e) => setSettings({ ...settings, allowed_image_size_mb: parseInt(e.target.value) || 5 })}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label>Allowed Image Types</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImageTypes(!showImageTypes)}
                >
                  {showImageTypes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              
              {showImageTypes && (
                <div className="space-y-2 p-3 border rounded-md">
                  {['image/jpeg', 'image/png', 'image/webp', 'image/gif'].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={type}
                        checked={settings.allowed_image_types.includes(type)}
                        onChange={(e) => handleImageTypeChange(type, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={type} className="text-sm">
                        {type.split('/')[1].toUpperCase()}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Event Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Event Categories</CardTitle>
            <CardDescription>
              Manage available event categories
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add new category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCategory()}
              />
              <Button onClick={addCategory} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {settings.categories.map((category) => (
                <Badge key={category} variant="secondary" className="flex items-center gap-1">
                  {category}
                  <button
                    onClick={() => removeCategory(category)}
                    className="ml-1 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Event Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Event Permissions
            </CardTitle>
            <CardDescription>
              Control user event capabilities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="require_approval">Require Admin Approval</Label>
              <Switch
                id="require_approval"
                checked={settings.require_approval}
                onCheckedChange={(checked) => setSettings({ ...settings, require_approval: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="allow_virtual_events">Allow Virtual Events</Label>
              <Switch
                id="allow_virtual_events"
                checked={settings.allow_virtual_events}
                onCheckedChange={(checked) => setSettings({ ...settings, allow_virtual_events: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="allow_registration">Allow Event Registration</Label>
              <Switch
                id="allow_registration"
                checked={settings.allow_registration}
                onCheckedChange={(checked) => setSettings({ ...settings, allow_registration: checked })}
              />
            </div>

            <div>
              <Label htmlFor="max_attendees_limit">Maximum Attendees Limit</Label>
              <Input
                id="max_attendees_limit"
                type="number"
                min="1"
                max="10000"
                value={settings.max_attendees_limit}
                onChange={(e) => setSettings({ ...settings, max_attendees_limit: parseInt(e.target.value) || 1000 })}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Maximum allowed attendees per event
              </p>
            </div>

            <div>
              <Label htmlFor="default_status">Default Event Status</Label>
              <Select
                value={settings.default_status}
                onValueChange={(value) => setSettings({ ...settings, default_status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending Approval</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto_generate_slug">Auto-generate Event Slugs</Label>
              <Switch
                id="auto_generate_slug"
                checked={settings.auto_generate_slug}
                onCheckedChange={(checked) => setSettings({ ...settings, auto_generate_slug: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}