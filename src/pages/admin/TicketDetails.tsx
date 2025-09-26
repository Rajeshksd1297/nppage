import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  ArrowLeft,
  MessageCircle,
  Clock,
  User,
  Calendar,
  Edit,
  Save,
  Plus,
  Check,
  X,
  AlertCircle,
  CheckCircle,
  History
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
  updated_at: string;
}

interface TicketTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  assigned_to: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

interface StatusHistory {
  id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string;
  reason: string | null;
  created_at: string;
}

export default function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [tasks, setTasks] = useState<TicketTask[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Ticket>>({});
  const [newReply, setNewReply] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: ''
  });
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

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
    if (id) {
      fetchTicketDetails();
    }
  }, [id]);

  const fetchTicketDetails = async () => {
    try {
      // Fetch ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single();

      if (ticketError) throw ticketError;
      setTicket(ticketData);
      setEditForm(ticketData);

      // Fetch replies
      const { data: repliesData, error: repliesError } = await supabase
        .from('ticket_replies')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });

      if (repliesError) throw repliesError;
      setReplies(repliesData || []);

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('ticket_tasks')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      // Fetch status history
      const { data: historyData, error: historyError } = await supabase
        .from('ticket_status_history')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: false });

      if (historyError) throw historyError;
      setStatusHistory(historyData || []);

    } catch (error) {
      console.error('Error fetching ticket details:', error);
      toast({
        title: "Error",
        description: "Failed to load ticket details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveTicket = async () => {
    if (!ticket || !editForm.title || !editForm.description) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          title: editForm.title,
          description: editForm.description,
          priority: editForm.priority,
          category: editForm.category,
          status: editForm.status,
          assigned_to: editForm.assigned_to
        })
        .eq('id', ticket.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ticket updated successfully",
      });

      setIsEditing(false);
      fetchTicketDetails();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update ticket",
        variant: "destructive",
      });
    }
  };

  const addReply = async () => {
    if (!newReply.trim() || !ticket) return;

    try {
      const { error } = await supabase
        .from('ticket_replies')
        .insert({
          ticket_id: ticket.id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          content: newReply,
          is_internal: isInternal
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reply added successfully",
      });

      setNewReply('');
      setIsInternal(false);
      setIsReplyDialogOpen(false);
      fetchTicketDetails();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add reply",
        variant: "destructive",
      });
    }
  };

  const addTask = async () => {
    if (!newTask.title.trim() || !ticket) return;

    try {
      const { error } = await supabase
        .from('ticket_tasks')
        .insert({
          ticket_id: ticket.id,
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
      fetchTicketDetails();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive",
      });
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const updateData: any = { status };
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('ticket_tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task status updated",
      });

      fetchTicketDetails();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading ticket details...</div>;
  }

  if (!ticket) {
    return <div>Ticket not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/help-desk')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Help Desk
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{ticket.ticket_number}</h1>
            <p className="text-muted-foreground">{ticket.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusColors[ticket.status as keyof typeof statusColors] as any}>
            {ticket.status.replace('_', ' ')}
          </Badge>
          <Badge variant={priorityColors[ticket.priority as keyof typeof priorityColors] as any}>
            {ticket.priority}
          </Badge>
          {isEditing ? (
            <div className="flex gap-2">
              <Button size="sm" onClick={saveTicket}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Details */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={editForm.title || ''}
                        onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Input
                        value={editForm.category || ''}
                        onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                      rows={4}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Priority</Label>
                      <Select
                        value={editForm.priority || ''}
                        onValueChange={(value) => setEditForm({...editForm, priority: value})}
                      >
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
                      <Label>Status</Label>
                      <Select
                        value={editForm.status || ''}
                        onValueChange={(value) => setEditForm({...editForm, status: value})}
                      >
                        <SelectTrigger>
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
                </>
              ) : (
                <>
                  <div>
                    <Label>Description</Label>
                    <p className="mt-1 text-sm bg-muted p-3 rounded-lg">{ticket.description}</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Category</Label>
                      <p className="mt-1">{ticket.category}</p>
                    </div>
                    <div>
                      <Label>Created</Label>
                      <p className="mt-1">{new Date(ticket.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Tabs for Replies, Tasks, History */}
          <Tabs defaultValue="replies" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="replies">Replies ({replies.length})</TabsTrigger>
              <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
              <TabsTrigger value="history">History ({statusHistory.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="replies" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Conversation</h3>
                <Button onClick={() => setIsReplyDialogOpen(true)}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Add Reply
                </Button>
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {replies.map((reply) => (
                  <div key={reply.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium text-sm">User {reply.user_id.slice(0, 8)}</span>
                        {reply.is_internal && (
                          <Badge variant="secondary" className="text-xs">Internal</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(reply.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{reply.content}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Tasks</h3>
                <Button onClick={() => setIsTaskDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{task.title}</span>
                          <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                            {task.status}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                          {task.due_date && (
                            <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {task.status !== 'completed' && (
                          <Button
                            size="sm"
                            onClick={() => updateTaskStatus(task.id, 'completed')}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <h3 className="text-lg font-medium">Status History</h3>
              <div className="space-y-3">
                {statusHistory.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm">
                        Status changed from <Badge variant="outline" className="text-xs">{item.old_status || 'none'}</Badge> to <Badge variant="outline" className="text-xs">{item.new_status}</Badge>
                      </p>
                      {item.reason && (
                        <p className="text-xs text-muted-foreground mt-1">Reason: {item.reason}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline" onClick={() => setIsReplyDialogOpen(true)}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Add Reply
              </Button>
              <Button className="w-full" variant="outline" onClick={() => setIsTaskDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
              <Select
                value={ticket.status}
                onValueChange={(value) => {
                  setEditForm({...editForm, status: value});
                  setTimeout(() => saveTicket(), 100);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Change Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Ticket Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ticket Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated:</span>
                <span>{new Date(ticket.updated_at).toLocaleDateString()}</span>
              </div>
              {ticket.resolved_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolved:</span>
                  <span>{new Date(ticket.resolved_at).toLocaleDateString()}</span>
                </div>
              )}
              {ticket.closed_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Closed:</span>
                  <span>{new Date(ticket.closed_at).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Reply</DialogTitle>
            <DialogDescription>
              Add a reply to ticket {ticket.ticket_number}
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
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="internal"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
              />
              <Label htmlFor="internal">Internal note (not visible to customer)</Label>
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
              Add a task to ticket {ticket.ticket_number}
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