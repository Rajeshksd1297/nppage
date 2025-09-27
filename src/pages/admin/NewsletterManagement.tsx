import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Search,
  Mail,
  Users,
  Download,
  Upload,
  Filter,
  UserPlus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
  subscribed_at: string;
  status: 'active' | 'unsubscribed' | 'bounced';
  tags: string[];
  source: string;
  created_at: string;
  updated_at: string;
}

export default function NewsletterManagement() {
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    tags: '',
    source: 'manual',
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
      .channel('newsletter-subscribers-changes')
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
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });

      if (error) throw error;
      const subscriberData = (data as any) || [];
      setSubscribers(subscriberData);

      // Calculate stats
      const newStats = {
        total: subscriberData.length,
        active: subscriberData.filter((s: NewsletterSubscriber) => s.status === 'active').length,
        unsubscribed: subscriberData.filter((s: NewsletterSubscriber) => s.status === 'unsubscribed').length,
        bounced: subscriberData.filter((s: NewsletterSubscriber) => s.status === 'bounced').length,
      };
      setStats(newStats);
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

      const subscriberData = {
        user_id: user.id,
        email: formData.email,
        name: formData.name || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        source: formData.source,
        status: 'active' as const,
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

  const handleRemoveSubscriber = async (subscriberId: string) => {
    if (!window.confirm('Are you sure you want to remove this subscriber?')) return;

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', subscriberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subscriber removed successfully",
      });
      fetchSubscribers();
    } catch (error: any) {
      console.error('Error removing subscriber:', error);
      toast({
        title: "Error",
        description: "Failed to remove subscriber",
        variant: "destructive",
      });
    }
  };

  const updateSubscriberStatus = async (subscriberId: string, newStatus: NewsletterSubscriber['status']) => {
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ status: newStatus })
        .eq('id', subscriberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Subscriber status updated to ${newStatus}`,
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
      'Email,Name,Status,Tags,Source,Subscribed Date',
      ...filteredSubscribers.map(sub => 
        `${sub.email},"${sub.name || ''}",${sub.status},"${sub.tags.join('; ')}",${sub.source},${new Date(sub.subscribed_at).toLocaleDateString()}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      tags: '',
      source: 'manual',
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
      active: { variant: 'default' as const, text: 'Active', class: 'bg-green-100 text-green-800' },
      unsubscribed: { variant: 'secondary' as const, text: 'Unsubscribed', class: 'bg-gray-100 text-gray-800' },
      bounced: { variant: 'destructive' as const, text: 'Bounced', class: 'bg-red-100 text-red-800' },
    };
    const config = variants[status as keyof typeof variants] || variants.active;
    return <Badge className={config.class}>{config.text}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8" />
            Newsletter Management
          </h1>
          <p className="text-muted-foreground">Manage newsletter subscribers and campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportSubscribers}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Subscriber
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Newsletter Subscriber</DialogTitle>
                <DialogDescription>
                  Manually add a new subscriber to the newsletter.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="subscriber@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Name (Optional)</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Subscriber's name"
                  />
                </div>
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="tag1, tag2, tag3"
                  />
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
                      <SelectItem value="import">Import</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Subscribers</p>
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
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-green-600"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unsubscribed</p>
                <p className="text-2xl font-bold text-gray-600">{stats.unsubscribed}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-gray-600"></div>
              </div>
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
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-red-600"></div>
              </div>
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
              <SelectTrigger className="w-40">
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
          <CardTitle>Newsletter Subscribers ({filteredSubscribers.length})</CardTitle>
          <CardDescription>
            Manage all newsletter subscribers across your platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subscriber</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Subscribed</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscribers.map((subscriber) => (
                  <TableRow key={subscriber.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{subscriber.email}</div>
                        {subscriber.name && (
                          <div className="text-sm text-muted-foreground">{subscriber.name}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(subscriber.status)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {subscriber.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{subscriber.source}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(subscriber.subscribed_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {subscriber.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateSubscriberStatus(subscriber.id, 'unsubscribed')}
                            title="Unsubscribe"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                        {subscriber.status === 'unsubscribed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateSubscriberStatus(subscriber.id, 'active')}
                            title="Resubscribe"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSubscriber(subscriber.id)}
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
  );
}