import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Plus,
  MessageCircle,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Ticket {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  updated_at: string;
}

interface TicketReply {
  id: string;
  content: string;
  user_id: string;
  is_internal: boolean;
  created_at: string;
}

interface NewTicket {
  title: string;
  description: string;
  priority: string;
  category: string;
}

export default function SupportTickets() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketReplies, setTicketReplies] = useState<TicketReply[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [newTicket, setNewTicket] = useState<NewTicket>({
    title: '',
    description: '',
    priority: 'medium',
    category: 'General'
  });
  const [newReply, setNewReply] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  const statusColors = {
    open: 'destructive',
    in_progress: 'default',
    pending: 'secondary',
    resolved: 'outline',
    closed: 'outline'
  };

  const priorityColors = {
    low: 'secondary',
    medium: 'default',
    high: 'destructive',
    urgent: 'destructive'
  };

  const statusIcons = {
    open: AlertCircle,
    in_progress: Clock,
    pending: Clock,
    resolved: CheckCircle,
    closed: XCircle
  };

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id || null);
    };
    getCurrentUser();
    fetchTickets();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      fetchTicketReplies(selectedTicket.id);
    }
  }, [selectedTicket]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('helpdesk_settings')
        .select('categories')
        .single();

      if (error) throw error;
      setCategories((data?.categories as string[]) || ['General', 'Technical', 'Billing']);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('created_by', (await supabase.auth.getUser()).data.user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: "Error",
        description: "Failed to load tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketReplies = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_replies')
        .select('*')
        .eq('ticket_id', ticketId)
        .eq('is_internal', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTicketReplies(data || []);
    } catch (error) {
      console.error('Error fetching ticket replies:', error);
    }
  };

  const createTicket = async () => {
    if (!newTicket.title.trim() || !newTicket.description.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        toast({
          title: "Error",
          description: "You must be logged in to create a ticket",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('tickets')
        .insert({
          title: newTicket.title,
          description: newTicket.description,
          priority: newTicket.priority,
          category: newTicket.category,
          created_by: user.data.user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ticket created successfully",
      });

      setNewTicket({
        title: '',
        description: '',
        priority: 'medium',
        category: 'General'
      });
      setIsCreateDialogOpen(false);
      fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create ticket",
        variant: "destructive",
      });
    }
  };

  const addReply = async () => {
    if (!selectedTicket || !newReply.trim()) return;

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      const { error } = await supabase
        .from('ticket_replies')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user.data.user.id,
          content: newReply,
          is_internal: false
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reply added successfully",
      });

      setNewReply('');
      setIsReplyDialogOpen(false);
      fetchTicketReplies(selectedTicket.id);
    } catch (error) {
      console.error('Error adding reply:', error);
      toast({
        title: "Error",
        description: "Failed to add reply",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="h-8 w-8" />
            Support Tickets
          </h1>
          <p className="text-muted-foreground">Create and manage your support tickets</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tickets List */}
        <Card>
          <CardHeader>
            <CardTitle>My Tickets ({tickets.length})</CardTitle>
            <CardDescription>
              Track the status of your support requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No tickets yet</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  Create Your First Ticket
                </Button>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {tickets.map((ticket) => {
                  const StatusIcon = statusIcons[ticket.status as keyof typeof statusIcons];
                  return (
                    <div
                      key={ticket.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedTicket?.id === ticket.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">{ticket.ticket_number}</span>
                              <Badge variant={statusColors[ticket.status as keyof typeof statusColors] as "default" | "destructive" | "secondary" | "outline"}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {ticket.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <h4 className="font-medium">{ticket.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
                          </div>
                          <Badge variant={priorityColors[ticket.priority as keyof typeof priorityColors] as "default" | "destructive" | "secondary" | "outline"} className="text-xs">
                            {ticket.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Category: {ticket.category}</span>
                          <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ticket Details */}
        {selectedTicket && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {React.createElement(statusIcons[selectedTicket.status as keyof typeof statusIcons], { className: "h-5 w-5" })}
                    {selectedTicket.ticket_number}
                  </CardTitle>
                  <CardDescription>{selectedTicket.title}</CardDescription>
                </div>
                <Badge variant={statusColors[selectedTicket.status as keyof typeof statusColors] as "default" | "destructive" | "secondary" | "outline"}>
                  {selectedTicket.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Ticket Info */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedTicket.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Priority:</span>
                    <Badge variant={priorityColors[selectedTicket.priority as keyof typeof priorityColors] as "default" | "destructive" | "secondary" | "outline"} className="ml-2 text-xs">
                      {selectedTicket.priority}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Category:</span> {selectedTicket.category}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {new Date(selectedTicket.created_at).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Last Updated:</span> {new Date(selectedTicket.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Replies */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Conversation ({ticketReplies.length})</h4>
                  {selectedTicket.status !== 'closed' && (
                    <Button size="sm" onClick={() => setIsReplyDialogOpen(true)}>
                      <Send className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                  )}
                </div>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {ticketReplies.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No replies yet</p>
                  ) : (
                    ticketReplies.map((reply) => (
                      <div key={reply.id} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">
                            {reply.user_id === currentUserId ? 'You' : 'Support Team'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(reply.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{reply.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Ticket Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>
              Describe your issue and we'll get back to you as soon as possible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Brief description of your issue..."
                value={newTicket.title}
                onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Please provide detailed information about your issue..."
                value={newTicket.description}
                onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={newTicket.priority} onValueChange={(value) => setNewTicket({...newTicket, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={newTicket.category} onValueChange={(value) => setNewTicket({...newTicket, category: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createTicket} disabled={!newTicket.title.trim() || !newTicket.description.trim()}>
              Create Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Reply</DialogTitle>
            <DialogDescription>
              Reply to ticket {selectedTicket?.ticket_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reply">Your Reply</Label>
              <Textarea
                id="reply"
                placeholder="Type your reply here..."
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addReply} disabled={!newReply.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}