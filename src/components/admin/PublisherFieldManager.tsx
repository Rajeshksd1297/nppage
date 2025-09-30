import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Save, X, GripVertical, Palette, Upload, Building2, Settings as SettingsIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PublisherField {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  is_enabled: boolean;
  is_custom: boolean;
  placeholder?: string;
  validation_rules?: any;
  options?: any;
  sort_order: number;
}

interface Publisher {
  id: string;
  name: string;
}

interface BrandingConfig {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url: string;
  favicon_url: string;
  custom_css: string;
  font_family: string;
}

const FONT_OPTIONS = [
  { value: 'inter', label: 'Inter' },
  { value: 'roboto', label: 'Roboto' },
  { value: 'open-sans', label: 'Open Sans' },
  { value: 'lato', label: 'Lato' },
  { value: 'montserrat', label: 'Montserrat' },
  { value: 'playfair', label: 'Playfair Display' },
  { value: 'merriweather', label: 'Merriweather' },
];

export default function PublisherFieldManager() {
  const [fields, setFields] = useState<PublisherField[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<Partial<PublisherField> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Branding state
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [selectedPublisher, setSelectedPublisher] = useState<string>('');
  const [branding, setBranding] = useState<BrandingConfig>({
    primary_color: '#3b82f6',
    secondary_color: '#6366f1',
    accent_color: '#8b5cf6',
    logo_url: '',
    favicon_url: '',
    custom_css: '',
    font_family: 'inter',
  });
  const [savingBranding, setSavingBranding] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchFields();
    fetchPublishers();
  }, []);

  useEffect(() => {
    if (selectedPublisher) {
      fetchBranding();
    }
  }, [selectedPublisher]);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('publisher_field_settings')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setFields(data || []);
    } catch (error) {
      console.error('Error fetching publisher fields:', error);
      toast({
        title: 'Error',
        description: 'Failed to load publisher fields',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPublishers = async () => {
    try {
      const { data, error } = await supabase
        .from('publishers')
        .select('id, name')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setPublishers(data || []);
    } catch (error) {
      console.error('Error fetching publishers:', error);
    }
  };

  const fetchBranding = async () => {
    try {
      const { data, error } = await supabase
        .from('publishers')
        .select('branding_config')
        .eq('id', selectedPublisher)
        .single();

      if (error) throw error;
      
      if (data?.branding_config) {
        const config = data.branding_config as any;
        setBranding({ ...branding, ...config });
      }
    } catch (error) {
      console.error('Error fetching branding:', error);
    }
  };

  const handleSaveField = async () => {
    if (!editingField) return;

    try {
      if (editingField.id) {
        const { error } = await supabase
          .from('publisher_field_settings')
          .update({
            field_label: editingField.field_label,
            field_type: editingField.field_type,
            is_required: editingField.is_required,
            is_enabled: editingField.is_enabled,
            placeholder: editingField.placeholder,
          })
          .eq('id', editingField.id);

        if (error) throw error;
      } else {
        const fieldName = editingField.field_label?.toLowerCase().replace(/\s+/g, '_') || '';
        const { error } = await supabase
          .from('publisher_field_settings')
          .insert([{
            field_name: `custom_${fieldName}`,
            field_label: editingField.field_label,
            field_type: editingField.field_type || 'text',
            is_required: editingField.is_required || false,
            is_enabled: editingField.is_enabled !== false,
            is_custom: true,
            placeholder: editingField.placeholder,
            sort_order: fields.length + 1,
          }]);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: editingField.id ? 'Field updated successfully' : 'Field created successfully',
      });

      setIsDialogOpen(false);
      setEditingField(null);
      fetchFields();
    } catch (error: any) {
      console.error('Error saving field:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save field',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('Are you sure you want to delete this field?')) return;

    try {
      const { error } = await supabase
        .from('publisher_field_settings')
        .delete()
        .eq('id', fieldId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Field deleted successfully',
      });

      fetchFields();
    } catch (error: any) {
      console.error('Error deleting field:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete field',
        variant: 'destructive',
      });
    }
  };

  const handleToggleField = async (fieldId: string, isEnabled: boolean) => {
    try {
      const { error } = await supabase
        .from('publisher_field_settings')
        .update({ is_enabled: !isEnabled })
        .eq('id', fieldId);

      if (error) throw error;

      fetchFields();
    } catch (error: any) {
      console.error('Error toggling field:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to toggle field',
        variant: 'destructive',
      });
    }
  };

  const handleColorChange = (field: keyof BrandingConfig, value: string) => {
    setBranding(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveBranding = async () => {
    if (!selectedPublisher) return;

    try {
      setSavingBranding(true);
      const { error } = await supabase
        .from('publishers')
        .update({ branding_config: branding as any })
        .eq('id', selectedPublisher);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Branding settings saved successfully',
      });
    } catch (error: any) {
      console.error('Error saving branding:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save branding',
        variant: 'destructive',
      });
    } finally {
      setSavingBranding(false);
    }
  };

  return (
    <div className="space-y-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Publisher Profile Management
        </CardTitle>
        <CardDescription>
          Configure publisher form fields and branding settings
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="fields" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fields" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              Form Fields
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Branding
            </TabsTrigger>
          </TabsList>

          {/* Form Fields Tab */}
          <TabsContent value="fields" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Publisher Form Fields</h3>
                <p className="text-sm text-muted-foreground">
                  Customize fields displayed in publisher registration and profile forms
                </p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingField({})}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Field
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingField?.id ? 'Edit Field' : 'Add Custom Field'}
                    </DialogTitle>
                    <DialogDescription>
                      Configure the field properties
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Field Label</Label>
                      <Input
                        value={editingField?.field_label || ''}
                        onChange={(e) => setEditingField({ ...editingField, field_label: e.target.value })}
                        placeholder="e.g., Company Name"
                      />
                    </div>
                    <div>
                      <Label>Field Type</Label>
                      <Select
                        value={editingField?.field_type || 'text'}
                        onValueChange={(value) => setEditingField({ ...editingField, field_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="url">URL</SelectItem>
                          <SelectItem value="tel">Phone</SelectItem>
                          <SelectItem value="textarea">Text Area</SelectItem>
                          <SelectItem value="select">Select Dropdown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Placeholder</Label>
                      <Input
                        value={editingField?.placeholder || ''}
                        onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })}
                        placeholder="e.g., Enter your company name"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={editingField?.is_required || false}
                          onCheckedChange={(checked) => setEditingField({ ...editingField, is_required: checked })}
                        />
                        <Label>Required</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={editingField?.is_enabled !== false}
                          onCheckedChange={(checked) => setEditingField({ ...editingField, is_enabled: checked })}
                        />
                        <Label>Enabled</Label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveField}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Field
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Order</TableHead>
                    <TableHead>Field Label</TableHead>
                    <TableHead>Field Type</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No fields configured
                      </TableCell>
                    </TableRow>
                  ) : (
                    fields.map((field) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        </TableCell>
                        <TableCell className="font-medium">
                          {field.field_label}
                          {field.is_custom && (
                            <Badge variant="outline" className="ml-2 text-xs">Custom</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{field.field_type}</Badge>
                        </TableCell>
                        <TableCell>
                          {field.is_required ? (
                            <Badge variant="destructive">Required</Badge>
                          ) : (
                            <Badge variant="outline">Optional</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={field.is_enabled}
                            onCheckedChange={() => handleToggleField(field.id, field.is_enabled)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingField(field);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {field.is_custom && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteField(field.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-6">
            <div>
              <Label>Select Publisher</Label>
              <Select value={selectedPublisher} onValueChange={setSelectedPublisher}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choose a publisher to customize" />
                </SelectTrigger>
                <SelectContent>
                  {publishers.map((pub) => (
                    <SelectItem key={pub.id} value={pub.id}>
                      {pub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPublisher ? (
              <div className="space-y-6">
                {/* Color Scheme */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Color Scheme</CardTitle>
                    <CardDescription>Define the primary color palette</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="primary_color">Primary Color</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="primary_color"
                          type="color"
                          value={branding.primary_color}
                          onChange={(e) => handleColorChange('primary_color', e.target.value)}
                          className="h-10 w-20 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={branding.primary_color}
                          onChange={(e) => handleColorChange('primary_color', e.target.value)}
                          placeholder="#3b82f6"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="secondary_color">Secondary Color</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="secondary_color"
                          type="color"
                          value={branding.secondary_color}
                          onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                          className="h-10 w-20 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={branding.secondary_color}
                          onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                          placeholder="#6366f1"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="accent_color">Accent Color</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="accent_color"
                          type="color"
                          value={branding.accent_color}
                          onChange={(e) => handleColorChange('accent_color', e.target.value)}
                          className="h-10 w-20 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={branding.accent_color}
                          onChange={(e) => handleColorChange('accent_color', e.target.value)}
                          placeholder="#8b5cf6"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Typography */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Typography</CardTitle>
                    <CardDescription>Choose the font family</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Label htmlFor="font_family">Font Family</Label>
                    <Select
                      value={branding.font_family}
                      onValueChange={(value) => handleColorChange('font_family', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            {font.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Logos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Logos & Icons</CardTitle>
                    <CardDescription>Upload or link to brand assets</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="logo_url">Logo URL</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="logo_url"
                          type="url"
                          value={branding.logo_url}
                          onChange={(e) => handleColorChange('logo_url', e.target.value)}
                          placeholder="https://example.com/logo.png"
                        />
                        <Button variant="outline" size="icon">
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="favicon_url">Favicon URL</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="favicon_url"
                          type="url"
                          value={branding.favicon_url}
                          onChange={(e) => handleColorChange('favicon_url', e.target.value)}
                          placeholder="https://example.com/favicon.ico"
                        />
                        <Button variant="outline" size="icon">
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Custom CSS */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Custom CSS</CardTitle>
                    <CardDescription>Add custom styling (Advanced)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={branding.custom_css}
                      onChange={(e) => handleColorChange('custom_css', e.target.value)}
                      placeholder=".custom-class { color: red; }"
                      className="font-mono text-sm"
                      rows={6}
                    />
                  </CardContent>
                </Card>

                {/* Preview */}
                <Card style={{
                  backgroundColor: `${branding.primary_color}10`,
                  borderColor: branding.primary_color,
                }}>
                  <CardHeader>
                    <CardTitle className="text-base">Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button style={{ backgroundColor: branding.primary_color }}>
                      Primary Button
                    </Button>
                    <Button variant="outline" style={{ borderColor: branding.secondary_color, color: branding.secondary_color }}>
                      Secondary Button
                    </Button>
                    <div style={{ color: branding.accent_color, fontFamily: branding.font_family }}>
                      Sample text in {FONT_OPTIONS.find(f => f.value === branding.font_family)?.label}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button onClick={handleSaveBranding} disabled={savingBranding}>
                    <Save className="h-4 w-4 mr-2" />
                    {savingBranding ? 'Saving...' : 'Save Branding'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Select a publisher to customize their branding
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </div>
  );
}
