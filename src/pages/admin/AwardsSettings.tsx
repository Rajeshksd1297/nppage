import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Save, 
  Settings, 
  Award, 
  Users, 
  FileImage, 
  Trophy,
  Shield,
  Star
} from 'lucide-react';

interface AwardsSettings {
  id?: string;
  categories: string[];
  max_title_length: number;
  max_description_length: number;
  max_image_size_mb: number;
  allowed_image_types: string[];
  require_approval: boolean;
  allow_user_submissions: boolean;
  max_awards_per_user: number;
  require_verification: boolean;
  auto_generate_certificates: boolean;
  enable_public_display: boolean;
  sort_by_date: boolean;
}

const AwardsSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const defaultSettings: AwardsSettings = {
    categories: ['achievement', 'recognition', 'excellence', 'innovation', 'leadership', 'community', 'academic', 'professional'],
    max_title_length: 100,
    max_description_length: 1000,
    max_image_size_mb: 5,
    allowed_image_types: ['jpg', 'jpeg', 'png', 'webp'],
    require_approval: false,
    allow_user_submissions: true,
    max_awards_per_user: 20,
    require_verification: false,
    auto_generate_certificates: false,
    enable_public_display: true,
    sort_by_date: true,
  };

  const [settings, setSettings] = useState<AwardsSettings>(defaultSettings);
  const [newCategory, setNewCategory] = useState('');
  const [newImageType, setNewImageType] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('awards_settings' as any)
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const awardsData = data as any;
        setSettings({
          ...defaultSettings,
          ...awardsData,
          categories: awardsData.categories || defaultSettings.categories,
          allowed_image_types: awardsData.allowed_image_types || defaultSettings.allowed_image_types,
        });
      }
    } catch (error) {
      console.error('Error fetching awards settings:', error);
      toast({
        title: "Error",
        description: "Failed to load awards settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('awards_settings' as any)
        .upsert({
          ...settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Awards settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save awards settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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

  const addImageType = () => {
    if (newImageType.trim() && !settings.allowed_image_types.includes(newImageType.trim().toLowerCase())) {
      setSettings({
        ...settings,
        allowed_image_types: [...settings.allowed_image_types, newImageType.trim().toLowerCase()]
      });
      setNewImageType('');
    }
  };

  const removeImageType = (type: string) => {
    setSettings({
      ...settings,
      allowed_image_types: settings.allowed_image_types.filter(t => t !== type)
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Awards Settings</h1>
          <p className="text-muted-foreground">
            Configure awards management settings and user controls
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Content Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              Content Limits
            </CardTitle>
            <CardDescription>
              Set limits for award content and submissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxTitleLength">Maximum Title Length</Label>
              <Input
                id="maxTitleLength"
                type="number"
                value={settings.max_title_length}
                onChange={(e) => setSettings({
                  ...settings,
                  max_title_length: parseInt(e.target.value) || 0
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxDescriptionLength">Maximum Description Length</Label>
              <Input
                id="maxDescriptionLength"
                type="number"
                value={settings.max_description_length}
                onChange={(e) => setSettings({
                  ...settings,
                  max_description_length: parseInt(e.target.value) || 0
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxImageSize">Maximum Image Size (MB)</Label>
              <Input
                id="maxImageSize"
                type="number"
                value={settings.max_image_size_mb}
                onChange={(e) => setSettings({
                  ...settings,
                  max_image_size_mb: parseInt(e.target.value) || 0
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAwardsPerUser">Maximum Awards per User</Label>
              <Input
                id="maxAwardsPerUser"
                type="number"
                value={settings.max_awards_per_user}
                onChange={(e) => setSettings({
                  ...settings,
                  max_awards_per_user: parseInt(e.target.value) || 0
                })}
              />
            </div>
          </CardContent>
        </Card>

        {/* User Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Permissions
            </CardTitle>
            <CardDescription>
              Control what users can do with awards
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="allowSubmissions">Allow User Submissions</Label>
              <Switch
                id="allowSubmissions"
                checked={settings.allow_user_submissions}
                onCheckedChange={(checked) => setSettings({
                  ...settings,
                  allow_user_submissions: checked
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="requireApproval">Require Admin Approval</Label>
              <Switch
                id="requireApproval"
                checked={settings.require_approval}
                onCheckedChange={(checked) => setSettings({
                  ...settings,
                  require_approval: checked
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="requireVerification">Require Verification</Label>
              <Switch
                id="requireVerification"
                checked={settings.require_verification}
                onCheckedChange={(checked) => setSettings({
                  ...settings,
                  require_verification: checked
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="enablePublicDisplay">Enable Public Display</Label>
              <Switch
                id="enablePublicDisplay"
                checked={settings.enable_public_display}
                onCheckedChange={(checked) => setSettings({
                  ...settings,
                  enable_public_display: checked
                })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Award Categories
            </CardTitle>
            <CardDescription>
              Manage available award categories
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
              <Button onClick={addCategory} size="sm">Add</Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {settings.categories.map((category) => (
                <Badge
                  key={category}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => removeCategory(category)}
                >
                  {category} ×
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Advanced Settings
            </CardTitle>
            <CardDescription>
              Configure advanced award features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="autoCertificates">Auto Generate Certificates</Label>
              <Switch
                id="autoCertificates"
                checked={settings.auto_generate_certificates}
                onCheckedChange={(checked) => setSettings({
                  ...settings,
                  auto_generate_certificates: checked
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="sortByDate">Sort by Date</Label>
              <Switch
                id="sortByDate"
                checked={settings.sort_by_date}
                onCheckedChange={(checked) => setSettings({
                  ...settings,
                  sort_by_date: checked
                })}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Allowed Image Types</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add image type (e.g., jpg)"
                  value={newImageType}
                  onChange={(e) => setNewImageType(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addImageType()}
                />
                <Button onClick={addImageType} size="sm">Add</Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {settings.allowed_image_types.map((type) => (
                  <Badge
                    key={type}
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => removeImageType(type)}
                  >
                    {type} ×
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AwardsSettings;