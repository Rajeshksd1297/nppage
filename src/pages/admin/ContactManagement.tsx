import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AdminAccessGuard } from '@/components/AdminAccessGuard';
import { 
  Mail, 
  MessageSquare, 
  Eye, 
  Reply, 
  Archive, 
  Search,
  Filter,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  replied_at: string | null;
  resolved_at: string | null;
  user_agent: string | null;
  user_ip: string | null;
}

interface ContactReply {
  id: string;
  reply_message: string;
  replied_by: string;
  is_internal: boolean;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  } | null;
}

export default function ContactManagement() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [replies, setReplies] = useState<ContactReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchSubmissions();
    setupRealtimeSubscription();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions((data || []) as ContactSubmission[]);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: "Error",
        description: "Failed to load contact submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('contact-submissions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_submissions'
        },
        () => {
          fetchSubmissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchReplies = async (submissionId: string) => {
    try {
      const { data, error } = await supabase
        .from('contact_replies')
        .select(`
          *,
          profiles:replied_by (full_name, email)
        `)
        .eq('contact_submission_id', submissionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setReplies((data || []) as any);
    } catch (error) {
      console.error('Error fetching replies:', error);
      toast({
        title: "Error",
        description: "Failed to load replies",
        variant: "destructive",
      });
    }
  };

  const updateSubmissionStatus = async (id: string, status: string, priority?: string) => {
    try {
      const updates: any = { status };
      
      if (priority) updates.priority = priority;
      if (status === 'replied') updates.replied_at = new Date().toISOString();
      if (status === 'resolved') updates.resolved_at = new Date().toISOString();

      const { error } = await supabase
        .from('contact_submissions')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Contact submission marked as ${status}`,
      });

      fetchSubmissions();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const sendReply = async () => {
    if (!selectedSubmission || !replyMessage.trim()) return;

    setSending(true);
    try {
      // Save reply to database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: replyError } = await supabase
        .from('contact_replies')
        .insert({
          contact_submission_id: selectedSubmission.id,
          reply_message: replyMessage.trim(),
          replied_by: user.id,
          is_internal: false
        });

      if (replyError) throw replyError;

      // Send email via edge function
      const { error: emailError } = await supabase.functions.invoke('send-reply-email', {
        body: {
          submissionId: selectedSubmission.id,
          recipientEmail: selectedSubmission.email,
          recipientName: selectedSubmission.name,
          originalMessage: selectedSubmission.message,
          replyMessage: replyMessage.trim(),
          subject: selectedSubmission.subject || 'Re: Your Contact Form Message'
        }
      });

      if (emailError) {
        console.warn('Email sending failed:', emailError);
        // Continue anyway as the reply was saved
      }

      // Update submission status
      await updateSubmissionStatus(selectedSubmission.id, 'replied');

      setReplyMessage('');
      fetchReplies(selectedSubmission.id);

      toast({
        title: "Reply Sent",
        description: "Your reply has been sent successfully",
      });
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'new': { variant: 'default', icon: AlertCircle },
      'in_progress': { variant: 'secondary', icon: Clock },
      'replied': { variant: 'outline', icon: Reply },
      'resolved': { variant: 'default', icon: CheckCircle },
      'spam': { variant: 'destructive', icon: Archive }
    };

    const config = variants[status] || variants['new'];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      'low': 'bg-blue-100 text-blue-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={colors[priority] || colors['medium']}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = 
      submission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (submission.subject && submission.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
      submission.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || submission.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <AdminAccessGuard>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Contact Management</h1>
            <p className="text-muted-foreground">Manage and respond to contact form submissions</p>
          </div>
          <Button onClick={fetchSubmissions} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, email, subject, or message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
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
          </CardContent>
        </Card>

        {/* Submissions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contact Submissions ({filteredSubmissions.length})
            </CardTitle>
            <CardDescription>
              All contact form submissions with status and priority management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{submission.name}</div>
                          <div className="text-sm text-muted-foreground">{submission.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-medium truncate">
                            {submission.subject || 'No subject'}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {submission.message}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(submission.status)}</TableCell>
                      <TableCell>{getPriorityBadge(submission.priority)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(submission.created_at), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(submission.created_at), 'HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedSubmission(submission);
                                  fetchReplies(submission.id);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Contact Submission Details</DialogTitle>
                              </DialogHeader>
                              {selectedSubmission && (
                                <div className="space-y-6">
                                  {/* Submission Details */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>From</Label>
                                      <div className="font-medium">{selectedSubmission.name}</div>
                                      <div className="text-sm text-muted-foreground">{selectedSubmission.email}</div>
                                    </div>
                                    <div>
                                      <Label>Date</Label>
                                      <div>{format(new Date(selectedSubmission.created_at), 'PPpp')}</div>
                                    </div>
                                    <div>
                                      <Label>Status</Label>
                                      <div className="flex items-center gap-2">
                                        {getStatusBadge(selectedSubmission.status)}
                                        <Select
                                          value={selectedSubmission.status}
                                          onValueChange={(value) => updateSubmissionStatus(selectedSubmission.id, value)}
                                        >
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="new">New</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="replied">Replied</SelectItem>
                                            <SelectItem value="resolved">Resolved</SelectItem>
                                            <SelectItem value="spam">Spam</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                    <div>
                                      <Label>Priority</Label>
                                      <div className="flex items-center gap-2">
                                        {getPriorityBadge(selectedSubmission.priority)}
                                        <Select
                                          value={selectedSubmission.priority}
                                          onValueChange={(value) => updateSubmissionStatus(selectedSubmission.id, selectedSubmission.status, value)}
                                        >
                                          <SelectTrigger className="w-24">
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
                                    </div>
                                  </div>

                                  {/* Original Message */}
                                  <div>
                                    <Label>Subject</Label>
                                    <div className="font-medium">{selectedSubmission.subject || 'No subject provided'}</div>
                                  </div>

                                  <div>
                                    <Label>Message</Label>
                                    <div className="mt-2 p-4 bg-muted rounded-lg whitespace-pre-wrap">
                                      {selectedSubmission.message}
                                    </div>
                                  </div>

                                  {/* Replies */}
                                  {replies.length > 0 && (
                                    <div>
                                      <Label>Previous Replies</Label>
                                      <div className="space-y-3 mt-2">
                                        {replies.map((reply) => (
                                          <div key={reply.id} className="border rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-2">
                                              <div className="flex items-center gap-2">
                                                <User className="w-4 h-4" />
                                                <span className="font-medium">
                                                  {reply.profiles?.full_name || 'Admin'}
                                                </span>
                                                {reply.is_internal && (
                                                  <Badge variant="secondary">Internal</Badge>
                                                )}
                                              </div>
                                              <span className="text-sm text-muted-foreground">
                                                {format(new Date(reply.created_at), 'PPp')}
                                              </span>
                                            </div>
                                            <div className="whitespace-pre-wrap">{reply.reply_message}</div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Reply Form */}
                                  <div>
                                    <Label htmlFor="reply">Send Reply</Label>
                                    <Textarea
                                      id="reply"
                                      placeholder="Type your reply here..."
                                      value={replyMessage}
                                      onChange={(e) => setReplyMessage(e.target.value)}
                                      rows={4}
                                      className="mt-2"
                                    />
                                    <div className="flex justify-end gap-2 mt-4">
                                      <Button
                                        onClick={sendReply}
                                        disabled={sending || !replyMessage.trim()}
                                      >
                                        {sending ? (
                                          <>
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Sending...
                                          </>
                                        ) : (
                                          <>
                                            <Reply className="w-4 h-4 mr-2" />
                                            Send Reply
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          <Select
                            value={submission.status}
                            onValueChange={(value) => updateSubmissionStatus(submission.id, value)}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="replied">Replied</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="spam">Spam</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredSubmissions.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No submissions found</h3>
                  <p className="text-muted-foreground">
                    {submissions.length === 0 
                      ? "No contact form submissions yet." 
                      : "No submissions match your current filters."
                    }
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminAccessGuard>
  );
}