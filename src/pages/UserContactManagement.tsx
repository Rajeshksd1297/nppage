import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, MessageSquare, Reply, Search, Filter, ArrowUpDown, Settings, Eye, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContactFormWidget } from '@/components/ContactFormWidget';
import ContactFormSettings from '@/pages/ContactFormSettings';
import ContactEmailSettings from '@/pages/ContactEmailSettings';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: string;
  priority: string;
  created_at: string;
  replied_at: string | null;
  source: string;
}
interface ContactReply {
  id: string;
  reply_message: string;
  created_at: string;
  is_internal: boolean;
}
export default function UserContactManagement() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [replies, setReplies] = useState<ContactReply[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'priority'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [userSlug, setUserSlug] = useState<string>('');
  const {
    toast
  } = useToast();
  useEffect(() => {
    getCurrentUser();
    fetchSubmissions();
    setupRealtimeSubscription();
  }, []);
  const getCurrentUser = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);

        // Get user profile to find slug
        const {
          data: profile
        } = await supabase.from('profiles').select('slug').eq('id', user.id).single();
        if (profile?.slug) {
          setUserSlug(profile.slug);
        }
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };
  const setupRealtimeSubscription = () => {
    const channel = supabase.channel('contact-management').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'contact_submissions',
      filter: `contacted_user_id=eq.${supabase.auth.getUser().then(u => u.data.user?.id)}`
    }, () => {
      fetchSubmissions();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  };
  const fetchSubmissions = async () => {
    try {
      const {
        data: user
      } = await supabase.auth.getUser();
      if (!user.user) return;
      let query = supabase.from('contact_submissions').select('*').eq('contacted_user_id', user.user.id);
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      query = query.order(sortBy, {
        ascending: sortOrder === 'asc'
      });
      const {
        data,
        error
      } = await query;
      if (error) throw error;
      let filteredData = data || [];
      if (searchTerm) {
        filteredData = filteredData.filter(submission => submission.name.toLowerCase().includes(searchTerm.toLowerCase()) || submission.email.toLowerCase().includes(searchTerm.toLowerCase()) || submission.message.toLowerCase().includes(searchTerm.toLowerCase()) || submission.subject && submission.subject.toLowerCase().includes(searchTerm.toLowerCase()));
      }
      setSubmissions(filteredData);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch contact submissions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const fetchReplies = async (submissionId: string) => {
    try {
      const {
        data,
        error
      } = await supabase.from('contact_replies').select('*').eq('contact_submission_id', submissionId).order('created_at', {
        ascending: true
      });
      if (error) throw error;
      setReplies(data || []);
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };
  const handleReply = async () => {
    if (!selectedSubmission || !replyMessage.trim()) return;
    try {
      setSending(true);

      // Insert reply into database
      const {
        data: user
      } = await supabase.auth.getUser();
      const {
        error: replyError
      } = await supabase.from('contact_replies').insert({
        contact_submission_id: selectedSubmission.id,
        reply_message: replyMessage,
        replied_by: user.user?.id,
        is_internal: false
      });
      if (replyError) throw replyError;

      // Send email via edge function
      const {
        error: emailError
      } = await supabase.functions.invoke('send-reply-email', {
        body: {
          submissionId: selectedSubmission.id,
          recipientEmail: selectedSubmission.email,
          recipientName: selectedSubmission.name,
          originalMessage: selectedSubmission.message,
          replyMessage: replyMessage,
          subject: selectedSubmission.subject || 'Contact Form Inquiry'
        }
      });
      if (emailError) throw emailError;

      // Update submission status
      const {
        error: updateError
      } = await supabase.from('contact_submissions').update({
        status: 'replied',
        replied_at: new Date().toISOString()
      }).eq('id', selectedSubmission.id);
      if (updateError) throw updateError;
      toast({
        title: "Reply Sent",
        description: "Your reply has been sent successfully"
      });
      setReplyMessage('');
      fetchReplies(selectedSubmission.id);
      fetchSubmissions();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };
  const updateStatus = async (submissionId: string, newStatus: string) => {
    try {
      const {
        error
      } = await supabase.from('contact_submissions').update({
        status: newStatus
      }).eq('id', submissionId);
      if (error) throw error;
      fetchSubmissions();
      toast({
        title: "Status Updated",
        description: "Contact submission status has been updated"
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'new':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'replied':
        return 'outline';
      case 'resolved':
        return 'destructive';
      default:
        return 'default';
    }
  };
  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'default';
    }
  };
  useEffect(() => {
    fetchSubmissions();
  }, [searchTerm, statusFilter, sortBy, sortOrder]);
  return <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Contact Management</h1>
        <p className="text-muted-foreground">
          Manage your contact form, messages, and settings
        </p>
      </div>

      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="form-preview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Form Preview
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Form Settings
          </TabsTrigger>
          <TabsTrigger value="email-settings" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-6">
          {/* Messages Tab Content */}

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search messages..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: 'created_at' | 'priority') => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4" />
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
          </div>
        </CardContent>
          </Card>

          {/* Submissions Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Contact Submissions ({submissions.length})
              </CardTitle>
            </CardHeader>
        <CardContent>
          {loading ? <div className="text-center p-8">Loading...</div> : submissions.length === 0 ? <div className="text-center p-8 text-muted-foreground">
              No contact submissions found
            </div> : <Table>
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
                {submissions.map(submission => <TableRow key={submission.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{submission.name}</div>
                        <div className="text-sm text-muted-foreground">{submission.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {submission.subject || 'No Subject'}
                      </div>
                      <div className="text-sm text-muted-foreground max-w-xs truncate">
                        {submission.message}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(submission.status)}>
                        {submission.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityBadgeVariant(submission.priority)}>
                        {submission.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(submission.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => {
                            setSelectedSubmission(submission);
                            fetchReplies(submission.id);
                          }}>
                              <Reply className="w-4 h-4 mr-1" />
                              Reply
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Reply to {submission.name}</DialogTitle>
                              <DialogDescription>
                                Responding to: {submission.subject || 'No Subject'}
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-6">
                              {/* Original Message */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Original Message</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-2">
                                    <div><strong>From:</strong> {submission.name} ({submission.email})</div>
                                    <div><strong>Date:</strong> {format(new Date(submission.created_at), 'PPpp')}</div>
                                    <div><strong>Message:</strong></div>
                                    <div className="bg-muted p-4 rounded whitespace-pre-wrap">
                                      {submission.message}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Previous Replies */}
                              {replies.length > 0 && <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Previous Replies</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-4">
                                      {replies.map(reply => <div key={reply.id} className="border-l-4 border-primary pl-4">
                                          <div className="text-sm text-muted-foreground mb-2">
                                            {format(new Date(reply.created_at), 'PPpp')}
                                            {reply.is_internal && <Badge variant="secondary" className="ml-2">Internal</Badge>}
                                          </div>
                                          <div className="whitespace-pre-wrap">{reply.reply_message}</div>
                                        </div>)}
                                    </div>
                                  </CardContent>
                                </Card>}

                              {/* Reply Form */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Your Reply</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <Textarea placeholder="Type your reply..." value={replyMessage} onChange={e => setReplyMessage(e.target.value)} rows={6} />
                                  <div className="flex justify-between">
                                    <Select value={submission.status} onValueChange={value => updateStatus(submission.id, value)}>
                                      <SelectTrigger className="w-40">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="new">New</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="replied">Replied</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    
                                    <Button onClick={handleReply} disabled={sending || !replyMessage.trim()}>
                                      {sending ? "Sending..." : <>
                                          <Mail className="w-4 h-4 mr-2" />
                                          Send Reply
                                        </>}
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form-preview" className="mt-6">
          <div className="space-y-6">
            {/* Quick Actions */}
            

            {/* Form Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Form Preview</CardTitle>
                <CardDescription>
                  This is how your contact form appears to visitors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContactFormWidget userId={currentUserId} onSubmissionSuccess={() => {
                toast({
                  title: "Test Submission",
                  description: "Form test completed successfully"
                });
              }} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <ContactFormSettings />
        </TabsContent>

        <TabsContent value="email-settings" className="mt-6">
          <ContactEmailSettings />
        </TabsContent>
      </Tabs>
    </div>;
}