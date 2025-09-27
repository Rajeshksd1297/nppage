import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Plus, X, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FaqSettings {
  id: string;
  max_question_length: number;
  max_answer_length: number;
  categories: string[];
  allow_user_submissions: boolean;
  require_approval: boolean;
  allow_images: boolean;
  max_image_size_mb: number;
  allowed_image_types: string[];
  max_faqs_per_user: number;
  enable_public_display: boolean;
  sort_by_order: boolean;
  auto_publish: boolean;
  require_category: boolean;
}

export default function FaqSettings() {
  const [settings, setSettings] = useState<FaqSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newImageType, setNewImageType] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("faq_settings")
        .select("*")
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error("Error fetching FAQ settings:", error);
      toast({
        title: "Error",
        description: "Failed to load FAQ settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("faq_settings")
        .update(settings)
        .eq("id", settings.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "FAQ settings updated successfully",
      });
    } catch (error) {
      console.error("Error updating FAQ settings:", error);
      toast({
        title: "Error",
        description: "Failed to update FAQ settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    if (newCategory.trim() && settings && !settings.categories.includes(newCategory.trim())) {
      setSettings({
        ...settings,
        categories: [...settings.categories, newCategory.trim()]
      });
      setNewCategory("");
    }
  };

  const removeCategory = (category: string) => {
    if (settings) {
      setSettings({
        ...settings,
        categories: settings.categories.filter(c => c !== category)
      });
    }
  };

  const addImageType = () => {
    if (newImageType.trim() && settings && !settings.allowed_image_types.includes(newImageType.trim())) {
      setSettings({
        ...settings,
        allowed_image_types: [...settings.allowed_image_types, newImageType.trim()]
      });
      setNewImageType("");
    }
  };

  const removeImageType = (type: string) => {
    if (settings) {
      setSettings({
        ...settings,
        allowed_image_types: settings.allowed_image_types.filter(t => t !== type)
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return <div>No settings found</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">FAQ Settings</h1>
          <p className="text-muted-foreground">Configure FAQ management settings and user permissions</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Content Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Content Limits
            </CardTitle>
            <CardDescription>Set maximum lengths for FAQ content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="maxQuestionLength">Maximum Question Length</Label>
              <Input
                id="maxQuestionLength"
                type="number"
                value={settings.max_question_length}
                onChange={(e) => setSettings({
                  ...settings,
                  max_question_length: parseInt(e.target.value) || 0
                })}
                min="1"
                max="1000"
              />
            </div>
            <div>
              <Label htmlFor="maxAnswerLength">Maximum Answer Length</Label>
              <Input
                id="maxAnswerLength"
                type="number"
                value={settings.max_answer_length}
                onChange={(e) => setSettings({
                  ...settings,
                  max_answer_length: parseInt(e.target.value) || 0
                })}
                min="1"
                max="10000"
              />
            </div>
            <div>
              <Label htmlFor="maxFaqsPerUser">Maximum FAQs per User</Label>
              <Input
                id="maxFaqsPerUser"
                type="number"
                value={settings.max_faqs_per_user}
                onChange={(e) => setSettings({
                  ...settings,
                  max_faqs_per_user: parseInt(e.target.value) || 0
                })}
                min="1"
                max="100"
              />
            </div>
          </CardContent>
        </Card>

        {/* User Permissions */}
        <Card>
          <CardHeader>
            <CardTitle>User Permissions</CardTitle>
            <CardDescription>Control what users can do with FAQs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="allowUserSubmissions">Allow User Submissions</Label>
              <Switch
                id="allowUserSubmissions"
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
              <Label htmlFor="autoPublish">Auto Publish (when approval not required)</Label>
              <Switch
                id="autoPublish"
                checked={settings.auto_publish}
                onCheckedChange={(checked) => setSettings({
                  ...settings,
                  auto_publish: checked
                })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="requireCategory">Require Category Selection</Label>
              <Switch
                id="requireCategory"
                checked={settings.require_category}
                onCheckedChange={(checked) => setSettings({
                  ...settings,
                  require_category: checked
                })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Categories Management */}
        <Card>
          <CardHeader>
            <CardTitle>FAQ Categories</CardTitle>
            <CardDescription>Manage available FAQ categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="New category name"
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCategory(category)}
                    className="h-auto p-0 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Image Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Image Settings</CardTitle>
            <CardDescription>Configure image upload settings for FAQs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="allowImages">Allow Images in FAQs</Label>
              <Switch
                id="allowImages"
                checked={settings.allow_images}
                onCheckedChange={(checked) => setSettings({
                  ...settings,
                  allow_images: checked
                })}
              />
            </div>
            {settings.allow_images && (
              <>
                <div>
                  <Label htmlFor="maxImageSize">Maximum Image Size (MB)</Label>
                  <Input
                    id="maxImageSize"
                    type="number"
                    value={settings.max_image_size_mb}
                    onChange={(e) => setSettings({
                      ...settings,
                      max_image_size_mb: parseInt(e.target.value) || 0
                    })}
                    min="1"
                    max="50"
                  />
                </div>
                <div>
                  <Label>Allowed Image Types</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="e.g., gif"
                      value={newImageType}
                      onChange={(e) => setNewImageType(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addImageType()}
                    />
                    <Button onClick={addImageType} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {settings.allowed_image_types.map((type) => (
                      <Badge key={type} variant="outline" className="flex items-center gap-1">
                        .{type}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeImageType(type)}
                          className="h-auto p-0 ml-1"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Display Settings</CardTitle>
            <CardDescription>Configure how FAQs are displayed publicly</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
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
            <div className="flex items-center justify-between">
              <Label htmlFor="sortByOrder">Sort by Custom Order</Label>
              <Switch
                id="sortByOrder"
                checked={settings.sort_by_order}
                onCheckedChange={(checked) => setSettings({
                  ...settings,
                  sort_by_order: checked
                })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}