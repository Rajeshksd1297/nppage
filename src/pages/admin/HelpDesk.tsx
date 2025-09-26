import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search,
  Plus,
  MessageCircle,
  Clock,
  User,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Calendar,
  List
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
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
}

interface TicketReply {
  id: string;
  content: string;
  user_id: string;
  is_internal: boolean;
  created_at: string;
}

interface TicketTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  assigned_to: string | null;
  due_date: string | null;
  created_at: string;
}

export default function HelpDesk() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketReplies, setTicketReplies] = useState<TicketReply[]>([]);
  const [ticketTasks, setTicketTasks] = useState<TicketTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [newReply, setNewReply] = useState('');
  const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '' });

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

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      fetchTicketDetails(selectedTicket.id);
    }
  }, [selectedTicket]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
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

  const fetchTicketDetails = async (ticketId: string) => {
    try {
      // Fetch replies
      const { data: replies, error: repliesError } = await supabase
        .from('ticket_replies')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (repliesError) throw repliesError;
      setTicketReplies(replies || []);

      // Fetch tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('ticket_tasks')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;
      setTicketTasks(tasks || []);
    } catch (error) {
      console.error('Error fetching ticket details:', error);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ticket status updated successfully",
      });

      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive",
      });
    }
  };

  const assignTicket = async (ticketId: string, assigneeId: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ assigned_to: assigneeId })
        .eq('id', ticketId);

      if (error) throw error;

      // Create assignment record
      await supabase
        .from('ticket_assignments')
        .insert({
          ticket_id: ticketId,
          assigned_by: (await supabase.auth.getUser()).data.user?.id,
          assigned_to: assigneeId
        });

      toast({
        title: "Success",
        description: "Ticket assigned successfully",
      });

      fetchTickets();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign ticket",
        variant: "destructive",
      });
    }
  };

  const addReply = async () => {
    if (!selectedTicket || !newReply.trim()) return;

    try {
      const { error } = await supabase
        .from('ticket_replies')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
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
      fetchTicketDetails(selectedTicket.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add reply",
        variant: "destructive",
      });
    }
  };

  const addTask = async () => {
    if (!selectedTicket || !newTask.title.trim()) return;

    try {
      const { error } = await supabase
        .from('ticket_tasks')
        .insert({
          ticket_id: selectedTicket.id,
          title: newTask.title,
          description: newTask.description || null,
          due_date: newTask.due_date || null,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task added successfully",
      });

      setNewTask({ title: '', description: '', due_date: '' });
      setIsTaskDialogOpen(false);
      fetchTicketDetails(selectedTicket.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive",
      });
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="h-8 w-8" />
            Help Desk Management
          </h1>
          <p className="text-muted-foreground">Manage support tickets, assignments, and tasks</p>
        </div>
        <Button onClick={() => setIsTicketDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Search Tickets</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or ticket number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tickets List */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets ({filteredTickets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedTicket?.id === ticket.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{ticket.ticket_number}</span>
                        <Badge variant={statusColors[ticket.status as keyof typeof statusColors] as "default" | "destructive" | "secondary" | "outline"}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant={priorityColors[ticket.priority as keyof typeof priorityColors] as "default" | "destructive" | "secondary" | "outline"} className="text-xs">
                          {ticket.priority}
                        </Badge>
                      </div>
                      <h4 className="font-medium">{ticket.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                    {ticket.assigned_to && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Assigned
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ticket Details */}
        {selectedTicket && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Ticket Details</CardTitle>
                <div className="flex gap-2">
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(value) => updateTicketStatus(selectedTicket.id, value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="replies">Replies</TabsTrigger>
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Ticket Number</Label>
                    <p className="font-mono">{selectedTicket.ticket_number}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <p>{selectedTicket.title}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <p className="text-sm">{selectedTicket.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Badge variant={priorityColors[selectedTicket.priority as keyof typeof priorityColors] as "default" | "destructive" | "secondary" | "outline"}>
                        {selectedTicket.priority}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <p>{selectedTicket.category || 'Uncategorized'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Created</Label>
                    <p>{new Date(selectedTicket.created_at).toLocaleString()}</p>
                  </div>
                </TabsContent>

                <TabsContent value="replies" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Replies ({ticketReplies.length})</h4>
                    <Button size="sm" onClick={() => setIsReplyDialogOpen(true)}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Add Reply
                    </Button>
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {ticketReplies.map((reply) => (
                      <div key={reply.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">User {reply.user_id.slice(0, 8)}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(reply.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{reply.content}</p>
                        {reply.is_internal && (
                          <Badge variant="outline" className="mt-2 text-xs">Internal</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="tasks" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Tasks ({ticketTasks.length})</h4>
                    <Button size="sm" onClick={() => setIsTaskDialogOpen(true)}>
                      <List className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {ticketTasks.map((task) => (
                      <div key={task.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{task.title}</span>
                          <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                            {task.status}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                          {task.due_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Reply</DialogTitle>
            <DialogDescription>
              Add a reply to ticket {selectedTicket?.ticket_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reply</Label>
              <Textarea
                placeholder="Enter your reply..."
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
              Add Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
            <DialogDescription>
              Add a task to ticket {selectedTicket?.ticket_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Task Title</Label>
              <Input
                placeholder="Enter task title..."
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Task description (optional)..."
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                rows={3}
              />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="datetime-local"
                value={newTask.due_date}
                onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addTask} disabled={!newTask.title.trim()}>
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}