import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Settings,
  Plus,
  Trash2,
  Edit,
  Save,
  Hash,
  Tag,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface HelpDeskSettings {
  id: string;
  auto_assign_tickets: boolean;
  default_priority: string;
  categories: string[];
  email_notifications: boolean;
  business_hours: {
    start: string;
    end: string;
    timezone: string;
    days: string[];
  };
  sla_response_hours: number;
  ticket_number_prefix: string;
  ticket_statuses: string[];
}

export default function HelpDeskSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<HelpDeskSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);

  const defaultStatuses = ['open', 'in_progress', 'pending', 'resolved', 'closed'];
  const defaultCategories = ['General', 'Technical', 'Billing', 'Feature Request', 'Bug Report'];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('helpdesk_settings')
        .select('*')
        .single();

      if (error) throw error;

      setSettings({
        ...data,
        ticket_number_prefix: data.ticket_number_prefix || 'TICK',
        ticket_statuses: data.ticket_statuses || defaultStatuses,
        categories: data.categories || defaultCategories
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to load help desk settings",
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
        .from('helpdesk_settings')
        .update({
          auto_assign_tickets: settings.auto_assign_tickets,
          default_priority: settings.default_priority,
          categories: settings.categories,
          email_notifications: settings.email_notifications,
          business_hours: settings.business_hours,
          sla_response_hours: settings.sla_response_hours,
          ticket_number_prefix: settings.ticket_number_prefix,
          ticket_statuses: settings.ticket_statuses
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Help desk settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    if (!newCategory.trim() || !settings) return;

    setSettings({
      ...settings,
      categories: [...settings.categories, newCategory.trim()]
    });
    setNewCategory('');
    setIsCategoryDialogOpen(false);
  };

  const editCategory = (oldCategory: string, newCategory: string) => {
    if (!settings || !newCategory.trim()) return;

    setSettings({
      ...settings,
      categories: settings.categories.map(cat => 
        cat === oldCategory ? newCategory.trim() : cat
      )
    });
    setEditingCategory(null);
  };

  const removeCategory = (category: string) => {
    if (!settings) return;

    setSettings({
      ...settings,
      categories: settings.categories.filter(cat => cat !== category)
    });
  };

  const addStatus = () => {
    if (!newStatus.trim() || !settings) return;

    const statusValue = newStatus.trim().toLowerCase().replace(/\s+/g, '_');
    setSettings({
      ...settings,
      ticket_statuses: [...settings.ticket_statuses, statusValue]
    });
    setNewStatus('');
    setIsStatusDialogOpen(false);
  };

  const editStatus = (oldStatus: string, newStatus: string) => {
    if (!settings || !newStatus.trim()) return;

    const statusValue = newStatus.trim().toLowerCase().replace(/\s+/g, '_');
    setSettings({
      ...settings,
      ticket_statuses: settings.ticket_statuses.map(status => 
        status === oldStatus ? statusValue : status
      )
    });
    setEditingStatus(null);
  };

  const removeStatus = (status: string) => {
    if (!settings || settings.ticket_statuses.length <= 3) {
      toast({
        title: "Cannot Remove",
        description: "Must have at least 3 statuses",
        variant: "destructive",
      });
      return;
    }

    setSettings({
      ...settings,
      ticket_statuses: settings.ticket_statuses.filter(s => s !== status)
    });
  };

  if (loading) {
    return <div>Loading settings...</div>;
  }

  if (!settings) {
    return <div>Failed to load settings</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Help Desk Settings
          </h1>
          <p className="text-muted-foreground">Configure help desk behavior and options</p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="statuses">Statuses</TabsTrigger>
          <TabsTrigger value="numbering">Numbering</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure basic help desk behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auto Assignment */}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.auto_assign_tickets}
                  onCheckedChange={(checked) => setSettings({...settings, auto_assign_tickets: checked})}
                />
                <Label>Auto-assign tickets to available agents</Label>
              </div>

              {/* Email Notifications */}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => setSettings({...settings, email_notifications: checked})}
                />
                <Label>Send email notifications</Label>
              </div>

              {/* Default Priority */}
              <div className="space-y-2">
                <Label>Default Priority</Label>
                <select
                  value={settings.default_priority}
                  onChange={(e) => setSettings({...settings, default_priority: e.target.value})}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* SLA Response Time */}
              <div className="space-y-2">
                <Label>SLA Response Time (hours)</Label>
                <Input
                  type="number"
                  min="1"
                  max="168"
                  value={settings.sla_response_hours}
                  onChange={(e) => setSettings({...settings, sla_response_hours: parseInt(e.target.value) || 24})}
                />
              </div>

              {/* Business Hours */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Business Hours</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={settings.business_hours.start}
                      onChange={(e) => setSettings({
                        ...settings,
                        business_hours: {...settings.business_hours, start: e.target.value}
                      })}
                    />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={settings.business_hours.end}
                      onChange={(e) => setSettings({
                        ...settings,
                        business_hours: {...settings.business_hours, end: e.target.value}
                      })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Timezone</Label>
                  <Input
                    value={settings.business_hours.timezone}
                    onChange={(e) => setSettings({
                      ...settings,
                      business_hours: {...settings.business_hours, timezone: e.target.value}
                    })}
                    placeholder="UTC"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Ticket Categories
                  </CardTitle>
                  <CardDescription>Manage ticket categories for better organization</CardDescription>
                </div>
                <Button onClick={() => setIsCategoryDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {settings.categories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    {editingCategory === category ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          defaultValue={category}
                          onBlur={(e) => editCategory(category, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              editCategory(category, e.currentTarget.value);
                            }
                          }}
                          className="flex-1"
                        />
                        <Button size="sm" onClick={() => setEditingCategory(null)}>
                          Save
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Badge variant="outline">{category}</Badge>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingCategory(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeCategory(category)}
                            disabled={settings.categories.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statuses" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Ticket Statuses
                  </CardTitle>
                  <CardDescription>Manage available ticket statuses</CardDescription>
                </div>
                <Button onClick={() => setIsStatusDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Status
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {settings.ticket_statuses.map((status, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    {editingStatus === status ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          defaultValue={status.replace('_', ' ')}
                          onBlur={(e) => editStatus(status, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              editStatus(status, e.currentTarget.value);
                            }
                          }}
                          className="flex-1"
                        />
                        <Button size="sm" onClick={() => setEditingStatus(null)}>
                          Save
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Badge variant="outline">{status.replace('_', ' ')}</Badge>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingStatus(status)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeStatus(status)}
                            disabled={settings.ticket_statuses.length <= 3}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Note:</p>
                    <p className="text-sm text-muted-foreground">
                      You must have at least 3 statuses. Status names will be automatically formatted (spaces become underscores, lowercase).
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="numbering" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Ticket Numbering
              </CardTitle>
              <CardDescription>Configure how ticket numbers are generated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Ticket Number Prefix</Label>
                <Input
                  value={settings.ticket_number_prefix}
                  onChange={(e) => setSettings({...settings, ticket_number_prefix: e.target.value.toUpperCase()})}
                  placeholder="TICK"
                  maxLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Example: {settings.ticket_number_prefix}-000001, {settings.ticket_number_prefix}-000002, etc.
                </p>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Preview</h4>
                <div className="font-mono text-sm">
                  {settings.ticket_number_prefix}-{String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new ticket category for better organization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category Name</Label>
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter category name..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addCategory} disabled={!newCategory.trim()}>
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Status</DialogTitle>
            <DialogDescription>
              Create a new ticket status
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status Name</Label>
              <Input
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                placeholder="Enter status name..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Will be formatted as: {newStatus.toLowerCase().replace(/\s+/g, '_')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addStatus} disabled={!newStatus.trim()}>
              Add Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}