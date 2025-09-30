import { useState, useEffect } from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wrench, RefreshCw, Save, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Publisher {
  id: string;
  name: string;
}

interface ToolsConfig {
  [key: string]: boolean;
}

const AVAILABLE_TOOLS = [
  { 
    id: 'isbn_lookup', 
    name: 'ISBN Lookup', 
    description: 'Search and import books by ISBN',
    category: 'book_management'
  },
  { 
    id: 'bulk_editor', 
    name: 'Bulk Book Editor', 
    description: 'Edit multiple books at once',
    category: 'book_management'
  },
  { 
    id: 'csv_import', 
    name: 'CSV Import/Export', 
    description: 'Import and export book data via CSV',
    category: 'book_management'
  },
  { 
    id: 'image_optimizer', 
    name: 'Image Optimizer', 
    description: 'Automatically optimize book cover images',
    category: 'media'
  },
  { 
    id: 'metadata_generator', 
    name: 'Metadata Generator', 
    description: 'AI-powered book metadata generation',
    category: 'ai_tools'
  },
  { 
    id: 'seo_analyzer', 
    name: 'SEO Analyzer', 
    description: 'Analyze and optimize book page SEO',
    category: 'marketing'
  },
  { 
    id: 'social_scheduler', 
    name: 'Social Media Scheduler', 
    description: 'Schedule posts about books',
    category: 'marketing'
  },
  { 
    id: 'email_campaigns', 
    name: 'Email Campaigns', 
    description: 'Create and manage email campaigns',
    category: 'marketing'
  },
  { 
    id: 'analytics_dashboard', 
    name: 'Analytics Dashboard', 
    description: 'Advanced analytics and reporting',
    category: 'analytics'
  },
  { 
    id: 'conversion_tracker', 
    name: 'Conversion Tracker', 
    description: 'Track book purchases and conversions',
    category: 'analytics'
  },
];

const CATEGORIES = [
  { id: 'all', name: 'All Tools' },
  { id: 'book_management', name: 'Book Management' },
  { id: 'media', name: 'Media Tools' },
  { id: 'ai_tools', name: 'AI Tools' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'analytics', name: 'Analytics' },
];

export default function ToolsAccess() {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [selectedPublisher, setSelectedPublisher] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [tools, setTools] = useState<ToolsConfig>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPublishers();
  }, []);

  useEffect(() => {
    if (selectedPublisher) {
      fetchTools();
    }
  }, [selectedPublisher]);

  const fetchPublishers = async () => {
    try {
      const { data, error } = await supabase
        .from('publishers')
        .select('id, name')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setPublishers(data || []);
    } catch (error: any) {
      console.error('Error fetching publishers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load publishers',
        variant: 'destructive',
      });
    }
  };

  const fetchTools = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('publishers')
        .select('tools_config')
        .eq('id', selectedPublisher)
        .single();

      if (error) throw error;
      
      const config = data?.tools_config || {};
      const initializedTools: ToolsConfig = {};
      AVAILABLE_TOOLS.forEach(tool => {
        initializedTools[tool.id] = config[tool.id] || false;
      });
      
      setTools(initializedTools);
    } catch (error: any) {
      console.error('Error fetching tools:', error);
      const initializedTools: ToolsConfig = {};
      AVAILABLE_TOOLS.forEach(tool => {
        initializedTools[tool.id] = false;
      });
      setTools(initializedTools);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTool = (toolId: string) => {
    setTools(prev => ({
      ...prev,
      [toolId]: !prev[toolId]
    }));
  };

  const handleSave = async () => {
    if (!selectedPublisher) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('publishers')
        .update({ tools_config: tools })
        .eq('id', selectedPublisher);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Tools access updated successfully',
      });
    } catch (error: any) {
      console.error('Error saving tools:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update tools',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredTools = selectedCategory === 'all'
    ? AVAILABLE_TOOLS
    : AVAILABLE_TOOLS.filter(tool => tool.category === selectedCategory);

  const enabledCount = Object.values(tools).filter(Boolean).length;

  return (
    <>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Tools & Integrations
            </CardTitle>
            <CardDescription>
              Manage publisher access to tools, integrations, and third-party services
            </CardDescription>
          </div>
          {selectedPublisher && (
            <Badge variant="outline" className="text-lg">
              {enabledCount}/{AVAILABLE_TOOLS.length} Enabled
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Publisher & Category Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Select Publisher</Label>
            <Select value={selectedPublisher} onValueChange={setSelectedPublisher}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Choose a publisher" />
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

          {selectedPublisher && (
            <div>
              <Label>Filter by Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Tools List */}
        {selectedPublisher && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4">
                  {filteredTools.map((tool) => (
                    <div
                      key={tool.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Label htmlFor={tool.id} className="font-semibold cursor-pointer">
                            {tool.name}
                          </Label>
                          {tools[tool.id] && (
                            <Badge variant="default" className="text-xs">Enabled</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {CATEGORIES.find(c => c.id === tool.category)?.name}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {tool.description}
                        </p>
                      </div>
                      <Switch
                        id={tool.id}
                        checked={tools[tool.id] || false}
                        onCheckedChange={() => handleToggleTool(tool.id)}
                      />
                    </div>
                  ))}
                </div>

                {filteredTools.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No tools found in this category
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {!selectedPublisher && (
          <div className="text-center py-12 text-muted-foreground">
            Select a publisher to manage their tools access
          </div>
        )}
      </CardContent>
    </>
  );
}
