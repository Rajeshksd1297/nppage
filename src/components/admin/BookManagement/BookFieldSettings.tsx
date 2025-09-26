import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Settings, 
  Eye, 
  Lock, 
  Save, 
  RotateCcw, 
  Trash2,
  Plus,
  AlertTriangle,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BookField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'multiselect' | 'url' | 'email' | 'json';
  required: boolean;
  visible: boolean;
  enabled: boolean;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string;
  options?: string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  category: 'basic' | 'publishing' | 'seo' | 'advanced';
  systemField: boolean;
  order: number;
}

const defaultBookFields: BookField[] = [
  {
    id: 'title',
    name: 'title',
    label: 'Book Title',
    type: 'text',
    required: true,
    visible: true,
    enabled: true,
    placeholder: 'Enter the book title',
    helpText: 'The main title of your book',
    category: 'basic',
    systemField: true,
    order: 1,
    validation: { minLength: 1, maxLength: 200 }
  },
  {
    id: 'subtitle',
    name: 'subtitle',
    label: 'Subtitle',
    type: 'text',
    required: false,
    visible: true,
    enabled: true,
    placeholder: 'Enter the book subtitle (optional)',
    helpText: 'Additional title information',
    category: 'basic',
    systemField: false,
    order: 2,
    validation: { maxLength: 200 }
  },
  {
    id: 'description',
    name: 'description',
    label: 'Description',
    type: 'textarea',
    required: true,
    visible: true,
    enabled: true,
    placeholder: 'Describe your book...',
    helpText: 'A compelling description of your book',
    category: 'basic',
    systemField: false,
    order: 3,
    validation: { minLength: 10, maxLength: 2000 }
  },
  {
    id: 'isbn',
    name: 'isbn',
    label: 'ISBN',
    type: 'text',
    required: false,
    visible: true,
    enabled: true,
    placeholder: 'Enter ISBN (10 or 13 digits)',
    helpText: 'International Standard Book Number',
    category: 'publishing',
    systemField: false,
    order: 4,
    validation: { pattern: '^[0-9]{10,13}$' }
  },
  {
    id: 'category',
    name: 'category',
    label: 'Category',
    type: 'select',
    required: false,
    visible: true,
    enabled: true,
    placeholder: 'Select a category',
    helpText: 'Primary book category',
    category: 'basic',
    systemField: false,
    order: 5,
    options: ['Fiction', 'Non-Fiction', 'Biography', 'Science Fiction', 'Fantasy', 'Romance', 'Mystery', 'Thriller', 'Self-Help', 'Business', 'History', 'Science', 'Technology', 'Art', 'Philosophy', 'Religion', 'Children', 'Young Adult', 'Poetry', 'Drama']
  },
  {
    id: 'genres',
    name: 'genres',
    label: 'Genres',
    type: 'multiselect',
    required: false,
    visible: true,
    enabled: true,
    placeholder: 'Select genres',
    helpText: 'Multiple genres that apply to your book',
    category: 'basic',
    systemField: false,
    order: 6,
    options: ['Action', 'Adventure', 'Comedy', 'Crime', 'Drama', 'Fantasy', 'Historical', 'Horror', 'Romance', 'Science Fiction', 'Thriller', 'Western', 'Biography', 'Memoir', 'Self-Help', 'Business', 'Health', 'Travel', 'Cooking', 'Art', 'Music', 'Sports', 'Politics', 'Religion', 'Philosophy', 'Psychology', 'Education', 'Technology', 'Science']
  },
  {
    id: 'publisher',
    name: 'publisher',
    label: 'Publisher',
    type: 'text',
    required: false,
    visible: true,
    enabled: true,
    placeholder: 'Enter publisher name',
    helpText: 'The publisher of your book',
    category: 'publishing',
    systemField: false,
    order: 7,
    validation: { maxLength: 100 }
  },
  {
    id: 'publication_date',
    name: 'publication_date',
    label: 'Publication Date',
    type: 'date',
    required: false,
    visible: true,
    enabled: true,
    placeholder: 'Select publication date',
    helpText: 'When the book was or will be published',
    category: 'publishing',
    systemField: false,
    order: 8
  },
  {
    id: 'page_count',
    name: 'page_count',
    label: 'Page Count',
    type: 'number',
    required: false,
    visible: true,
    enabled: true,
    placeholder: 'Enter number of pages',
    helpText: 'Total number of pages in the book',
    category: 'publishing',
    systemField: false,
    order: 9,
    validation: { min: 1, max: 10000 }
  },
  {
    id: 'language',
    name: 'language',
    label: 'Language',
    type: 'select',
    required: false,
    visible: true,
    enabled: true,
    placeholder: 'Select language',
    helpText: 'Primary language of the book',
    category: 'publishing',
    systemField: false,
    order: 10,
    defaultValue: 'en',
    options: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi', 'other']
  },
  {
    id: 'cover_image_url',
    name: 'cover_image_url',
    label: 'Cover Image URL',
    type: 'url',
    required: false,
    visible: true,
    enabled: true,
    placeholder: 'https://example.com/cover.jpg',
    helpText: 'URL to your book cover image',
    category: 'basic',
    systemField: false,
    order: 11
  },
  {
    id: 'seo_title',
    name: 'seo_title',
    label: 'SEO Title',
    type: 'text',
    required: false,
    visible: true,
    enabled: true,
    placeholder: 'SEO optimized title',
    helpText: 'Title optimized for search engines',
    category: 'seo',
    systemField: false,
    order: 12,
    validation: { maxLength: 60 }
  },
  {
    id: 'seo_description',
    name: 'seo_description',
    label: 'SEO Description',
    type: 'textarea',
    required: false,
    visible: true,
    enabled: true,
    placeholder: 'SEO meta description',
    helpText: 'Description for search engine results',
    category: 'seo',
    systemField: false,
    order: 13,
    validation: { maxLength: 160 }
  },
  {
    id: 'seo_keywords',
    name: 'seo_keywords',
    label: 'SEO Keywords',
    type: 'text',
    required: false,
    visible: true,
    enabled: true,
    placeholder: 'keyword1, keyword2, keyword3',
    helpText: 'Comma-separated keywords for SEO',
    category: 'seo',
    systemField: false,
    order: 14,
    validation: { maxLength: 200 }
  },
  {
    id: 'purchase_links',
    name: 'purchase_links',
    label: 'Purchase Links',
    type: 'json',
    required: false,
    visible: true,
    enabled: true,
    placeholder: 'Managed by affiliate settings',
    helpText: 'Links where readers can purchase your book',
    category: 'advanced',
    systemField: false,
    order: 15
  }
];

export function BookFieldSettings() {
  const { toast } = useToast();
  const [fields, setFields] = useState<BookField[]>(defaultBookFields);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    // Load saved field settings from localStorage or API
    const savedSettings = localStorage.getItem('bookFieldSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setFields(parsedSettings);
      } catch (error) {
        console.error('Error loading field settings:', error);
      }
    }
  }, []);

  const updateField = (fieldId: string, updates: Partial<BookField>) => {
    setFields(prev => prev.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ));
    setHasChanges(true);
  };

  const toggleFieldEnabled = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (field?.systemField && field.required) {
      toast({
        title: "Cannot Disable",
        description: "This is a required system field and cannot be disabled.",
        variant: "destructive",
      });
      return;
    }
    
    updateField(fieldId, { 
      enabled: !field?.enabled,
      visible: field?.enabled ? false : field?.visible // Hide if disabling
    });
  };

  const toggleFieldRequired = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (field?.systemField && field.id === 'title') {
      toast({
        title: "Cannot Change",
        description: "Title is always required and cannot be changed.",
        variant: "destructive",
      });
      return;
    }
    
    updateField(fieldId, { required: !field?.required });
  };

  const toggleFieldVisible = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field?.enabled) {
      toast({
        title: "Cannot Show",
        description: "Field must be enabled before it can be made visible.",
        variant: "destructive",
      });
      return;
    }
    
    updateField(fieldId, { visible: !field?.visible });
  };

  const moveFieldUp = (fieldId: string, category: string) => {
    const categoryFields = getCategoryFields(category);
    const fieldIndex = categoryFields.findIndex(f => f.id === fieldId);
    
    if (fieldIndex > 0) {
      const newFields = [...fields];
      const currentField = newFields.find(f => f.id === fieldId);
      const prevField = categoryFields[fieldIndex - 1];
      
      if (currentField && prevField) {
        const currentOrder = currentField.order;
        currentField.order = prevField.order;
        const prevFieldInArray = newFields.find(f => f.id === prevField.id);
        if (prevFieldInArray) {
          prevFieldInArray.order = currentOrder;
        }
        
        setFields(newFields);
        setHasChanges(true);
      }
    }
  };

  const moveFieldDown = (fieldId: string, category: string) => {
    const categoryFields = getCategoryFields(category);
    const fieldIndex = categoryFields.findIndex(f => f.id === fieldId);
    
    if (fieldIndex < categoryFields.length - 1) {
      const newFields = [...fields];
      const currentField = newFields.find(f => f.id === fieldId);
      const nextField = categoryFields[fieldIndex + 1];
      
      if (currentField && nextField) {
        const currentOrder = currentField.order;
        currentField.order = nextField.order;
        const nextFieldInArray = newFields.find(f => f.id === nextField.id);
        if (nextFieldInArray) {
          nextFieldInArray.order = currentOrder;
        }
        
        setFields(newFields);
        setHasChanges(true);
      }
    }
  };

  const saveSettings = () => {
    try {
      localStorage.setItem('bookFieldSettings', JSON.stringify(fields));
      setHasChanges(false);
      
      toast({
        title: "Settings Saved",
        description: "Book field settings have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save field settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetToDefaults = () => {
    setFields(defaultBookFields);
    setHasChanges(true);
    
    toast({
      title: "Reset to Defaults",
      description: "All field settings have been reset to default values.",
    });
  };

  const addCustomField = () => {
    const newField: BookField = {
      id: `custom_${Date.now()}`,
      name: `custom_${Date.now()}`,
      label: 'New Custom Field',
      type: 'text',
      required: false,
      visible: true,
      enabled: true,
      placeholder: 'Enter value',
      helpText: 'Custom field description',
      category: 'advanced',
      systemField: false,
      order: fields.length + 1
    };
    
    setFields(prev => [...prev, newField]);
    setHasChanges(true);
  };

  const removeCustomField = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (field?.systemField) {
      toast({
        title: "Cannot Delete",
        description: "System fields cannot be deleted.",
        variant: "destructive",
      });
      return;
    }
    
    setFields(prev => prev.filter(f => f.id !== fieldId));
    setHasChanges(true);
  };

  const getCategoryFields = (category: string) => {
    return fields
      .filter(field => field.category === category)
      .sort((a, b) => a.order - b.order);
  };

  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'textarea': return '📝';
      case 'number': return '🔢';
      case 'date': return '📅';
      case 'select': return '📋';
      case 'multiselect': return '☑️';
      case 'url': return '🔗';
      case 'email': return '📧';
      case 'json': return '⚙️';
      default: return '📄';
    }
  };

  const enabledFields = fields.filter(f => f.enabled);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Book Field Settings
          </h2>
          <p className="text-muted-foreground">
            Configure which fields to show in the book management interface
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={saveSettings} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Fields</p>
                <p className="text-2xl font-bold">{fields.length}</p>
              </div>
              <Settings className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Enabled</p>
                <p className="text-2xl font-bold text-green-600">{enabledFields.length}</p>
              </div>
              <Eye className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Required</p>
                <p className="text-2xl font-bold text-red-600">
                  {fields.filter(f => f.required && f.enabled).length}
                </p>
              </div>
              <Lock className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Custom</p>
                <p className="text-2xl font-bold text-blue-600">
                  {fields.filter(f => !f.systemField).length}
                </p>
              </div>
              <Plus className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="publishing">Publishing</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="custom">Custom Fields</TabsTrigger>
        </TabsList>

        {['basic', 'publishing', 'seo', 'advanced'].map(category => (
          <TabsContent key={category} value={category} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">{category} Fields</CardTitle>
                <CardDescription>
                  Configure {category} information fields for books
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getCategoryFields(category).map((field, index) => {
                    const categoryFields = getCategoryFields(category);
                    const isFirst = index === 0;
                    const isLast = index === categoryFields.length - 1;
                    
                    return (
                      <div
                        key={field.id}
                        className={`border rounded-lg p-4 bg-card ${
                          field.enabled ? 'border-border' : 'border-muted bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveFieldUp(field.id, category)}
                                disabled={isFirst}
                                className="h-6 w-6 p-0"
                              >
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveFieldDown(field.id, category)}
                                disabled={isLast}
                                className="h-6 w-6 p-0"
                              >
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {getFieldTypeIcon(field.type)}
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{field.label}</h4>
                                  {field.systemField && (
                                    <Badge variant="outline" className="text-xs">
                                      System
                                    </Badge>
                                  )}
                                  {field.required && (
                                    <Badge variant="destructive" className="text-xs">
                                      Required
                                    </Badge>
                                  )}
                                  {!field.enabled && (
                                    <Badge variant="secondary" className="text-xs">
                                      Disabled
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {field.helpText}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-4">
                              {/* Enabled Toggle */}
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`enabled-${field.id}`} className="text-sm">
                                  Enabled
                                </Label>
                                <Switch
                                  id={`enabled-${field.id}`}
                                  checked={field.enabled}
                                  onCheckedChange={() => toggleFieldEnabled(field.id)}
                                  disabled={field.systemField && field.required}
                                />
                              </div>
                              
                              {/* Visible Toggle */}
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`visible-${field.id}`} className="text-sm">
                                  Visible
                                </Label>
                                <Switch
                                  id={`visible-${field.id}`}
                                  checked={field.visible}
                                  onCheckedChange={() => toggleFieldVisible(field.id)}
                                  disabled={!field.enabled}
                                />
                              </div>
                              
                              {/* Required Toggle */}
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`required-${field.id}`} className="text-sm">
                                  Required
                                </Label>
                                <Switch
                                  id={`required-${field.id}`}
                                  checked={field.required}
                                  onCheckedChange={() => toggleFieldRequired(field.id)}
                                  disabled={field.systemField && field.id === 'title'}
                                />
                              </div>
                            </div>
                            
                            {!field.systemField && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeCustomField(field.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {/* Field Configuration */}
                        {field.enabled && (
                          <div className="mt-4 pt-4 border-t grid gap-4 md:grid-cols-2">
                            <div>
                              <Label htmlFor={`placeholder-${field.id}`}>
                                Placeholder Text
                              </Label>
                              <Input
                                id={`placeholder-${field.id}`}
                                value={field.placeholder || ''}
                                onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                                placeholder="Enter placeholder text"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`help-${field.id}`}>
                                Help Text
                              </Label>
                              <Input
                                id={`help-${field.id}`}
                                value={field.helpText || ''}
                                onChange={(e) => updateField(field.id, { helpText: e.target.value })}
                                placeholder="Enter help text"
                              />
                            </div>
                            
                            {(field.type === 'select' || field.type === 'multiselect') && (
                              <div className="md:col-span-2">
                                <Label htmlFor={`options-${field.id}`}>
                                  Options (one per line)
                                </Label>
                                <Textarea
                                  id={`options-${field.id}`}
                                  value={field.options?.join('\n') || ''}
                                  onChange={(e) => updateField(field.id, { 
                                    options: e.target.value.split('\n').filter(o => o.trim())
                                  })}
                                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                                  rows={4}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Custom Fields</CardTitle>
                  <CardDescription>
                    Add and manage custom fields for specific needs
                  </CardDescription>
                </div>
                <Button onClick={addCustomField}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Field
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {fields.filter(f => !f.systemField).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No custom fields added yet. Click "Add Custom Field" to create one.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fields
                    .filter(f => !f.systemField)
                    .map(field => (
                      <div
                        key={field.id}
                        className="border rounded-lg p-4 bg-card"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">
                              {getFieldTypeIcon(field.type)}
                            </span>
                            <div>
                              <h4 className="font-medium">{field.label}</h4>
                              <p className="text-sm text-muted-foreground">
                                Type: {field.type} • {field.enabled ? 'Enabled' : 'Disabled'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={field.enabled}
                              onCheckedChange={() => toggleFieldEnabled(field.id)}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeCustomField(field.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Warning for disabled required fields */}
      {fields.some(f => f.required && !f.enabled) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Warning</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Some required fields are disabled. This may cause issues when creating or editing books.
                  Consider enabling all required fields or making them optional.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasChanges && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-800">Unsaved Changes</h4>
                  <p className="text-sm text-blue-700">
                    You have unsaved changes to your field settings.
                  </p>
                </div>
              </div>
              <Button onClick={saveSettings} size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}