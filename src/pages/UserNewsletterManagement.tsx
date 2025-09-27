import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search,
  Mail,
  Users,
  Download,
  UserPlus,
  Trash2,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FeatureAccessGuard } from '@/components/FeatureAccessGuard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface NewsletterSubscriber {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  status: 'active' | 'unsubscribed' | 'bounced';
  source: string | null;
  tags: string[];
  subscribed_at: string;
  created_at: string;
  updated_at: string;
}

export default function UserNewsletterManagement() {
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    source: 'manual',
    tags: [] as string[],
    tagInput: '',
  });

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    unsubscribed: 0,
    bounced: 0,
  });

  useEffect(() => {
    fetchSubscribers();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('user-newsletter-subscribers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'newsletter_subscribers'
        },
        () => {
          fetchSubscribers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .eq('user_id', user.id)
        .order('subscribed_at', { ascending: false });

      if (error) throw error;
      const subscriberData = (data as NewsletterSubscriber[]) || [];
      setSubscribers(subscriberData);

      // Calculate stats
      const total = subscriberData.length;
      const active = subscriberData.filter(s => s.status === 'active').length;
      const unsubscribed = subscriberData.filter(s => s.status === 'unsubscribed').length;
      const bounced = subscriberData.filter(s => s.status === 'bounced').length;

      setStats({ total, active, unsubscribed, bounced });
    } catch (error) {
      console.error('Error fetching newsletter subscribers:', error);
      toast({
        title: "Error",
        description: "Failed to load newsletter subscribers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubscriber = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if email already exists
      const { data: existing } = await supabase
        .from('newsletter_subscribers')
        .select('id')
        .eq('user_id', user.id)
        .eq('email', formData.email)
        .single();

      if (existing) {
        toast({
          title: "Error",
          description: "This email is already subscribed",
          variant: "destructive",
        });
        return;
      }

      const subscriberData = {
        email: formData.email,
        name: formData.name || null,
        source: formData.source,
        tags: formData.tags,
        status: 'active' as const,
        user_id: user.id,
      };

      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert([subscriberData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subscriber added successfully",
      });
      setIsAddOpen(false);
      resetForm();
      fetchSubscribers();
    } catch (error: any) {
      console.error('Error adding subscriber:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add subscriber",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSubscriber = async (subscriberId: string) => {
    if (!window.confirm('Are you sure you want to remove this subscriber?')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', subscriberId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subscriber removed successfully",
      });
      fetchSubscribers();
    } catch (error: any) {
      console.error('Error deleting subscriber:', error);
      toast({
        title: "Error",
        description: "Failed to remove subscriber",
        variant: "destructive",
      });
    }
  };

  const updateSubscriberStatus = async (subscriberId: string, newStatus: 'active' | 'unsubscribed') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ status: newStatus })
        .eq('id', subscriberId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Subscriber ${newStatus === 'active' ? 'reactivated' : 'unsubscribed'}`,
      });
      fetchSubscribers();
    } catch (error: any) {
      console.error('Error updating subscriber status:', error);
      toast({
        title: "Error",
        description: "Failed to update subscriber status",
        variant: "destructive",
      });
    }
  };

  const exportSubscribers = () => {
    const csvContent = [
      ['Email', 'Name', 'Status', 'Source', 'Tags', 'Subscribed Date'],
      ...filteredSubscribers.map(sub => [
        sub.email,
        sub.name || '',
        sub.status,
        sub.source || '',
        sub.tags.join('; '),
        new Date(sub.subscribed_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'newsletter-subscribers.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      source: 'manual',
      tags: [],
      tagInput: '',
    });
  };

  const addTag = () => {
    if (formData.tagInput.trim() && !formData.tags.includes(formData.tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.tagInput.trim()],
        tagInput: '',
      });
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const filteredSubscribers = subscribers.filter(subscriber => {
    const matchesSearch = subscriber.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (subscriber.name && subscriber.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || subscriber.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { variant: 'default' as const, text: 'Active' },
      unsubscribed: { variant: 'secondary' as const, text: 'Unsubscribed' },
      bounced: { variant: 'destructive' as const, text: 'Bounced' },
    };
    const config = variants[status as keyof typeof variants] || variants.active;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const AddSubscriberForm = () => (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="subscriber@example.com"
            required
          />
        </div>
        <div>
          <Label htmlFor="name">Name (Optional)</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Subscriber name"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="source">Source</Label>
        <Select
          value={formData.source}
          onValueChange={(value) => setFormData({ ...formData, source: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="website">Website</SelectItem>
            <SelectItem value="event">Event</SelectItem>
            <SelectItem value="social">Social Media</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Tags</Label>
        <div className="flex gap-2 mb-2">
          <Input
            value={formData.tagInput}
            onChange={(e) => setFormData({ ...formData, tagInput: e.target.value })}
            placeholder="Add a tag"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          />
          <Button type="button" onClick={addTag} variant="outline">Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
              {tag} ×
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <FeatureAccessGuard feature="newsletter">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8" />
            Newsletter Subscribers
          </h1>
          <p className="text-muted-foreground">Manage your newsletter subscriber list</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportSubscribers}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Subscriber
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Subscriber</DialogTitle>
                <DialogDescription>
                  Manually add a new subscriber to your newsletter list.
                </DialogDescription>
              </DialogHeader>
              <AddSubscriberForm />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSubscriber}>Add Subscriber</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <Badge variant="default" className="h-8 w-8 rounded-full p-0 flex items-center justify-center">
                ✓
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unsubscribed</p>
                <p className="text-2xl font-bold text-orange-600">{stats.unsubscribed}</p>
              </div>
              <Badge variant="secondary" className="h-8 w-8 rounded-full p-0 flex items-center justify-center">
                -
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bounced</p>
                <p className="text-2xl font-bold text-red-600">{stats.bounced}</p>
              </div>
              <Badge variant="destructive" className="h-8 w-8 rounded-full p-0 flex items-center justify-center">
                ×
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search subscribers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscribers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscribers ({filteredSubscribers.length})</CardTitle>
          <CardDescription>
            Manage your newsletter subscriber list and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading subscribers...</div>
          ) : filteredSubscribers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No subscribers found</p>
              <p className="text-sm">Add your first subscriber to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Subscribed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscribers.map((subscriber) => (
                  <TableRow key={subscriber.id}>
                    <TableCell className="font-medium">{subscriber.email}</TableCell>
                    <TableCell>{subscriber.name || '-'}</TableCell>
                    <TableCell>{getStatusBadge(subscriber.status)}</TableCell>
                    <TableCell>{subscriber.source || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {subscriber.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(subscriber.subscribed_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {subscriber.status === 'active' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateSubscriberStatus(subscriber.id, 'unsubscribed')}
                          >
                            Unsubscribe
                          </Button>
                        ) : subscriber.status === 'unsubscribed' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateSubscriberStatus(subscriber.id, 'active')}
                          >
                            Reactivate
                          </Button>
                        ) : null}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSubscriber(subscriber.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>
    </FeatureAccessGuard>
  );
}