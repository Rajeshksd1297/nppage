import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Mail, Reply, User, Calendar, Globe, Monitor } from 'lucide-react';
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
  source: string;
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

export default function ContactSubmissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [submission, setSubmission] = useState<ContactSubmission | null>(null);
  const [replies, setReplies] = useState<ContactReply[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSubmission();
      fetchReplies();
    }
  }, [id]);

  const fetchSubmission = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setSubmission(data as ContactSubmission);
    } catch (error) {
      console.error('Error fetching submission:', error);
      toast({
        title: "Error",
        description: "Failed to load contact submission",
        variant: "destructive",
      });
      navigate('/admin/contact-management');
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_replies')
        .select('*')
        .eq('contact_submission_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setReplies(data || []);
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!submission) return;

    try {
      const updates: any = { status: newStatus };
      
      if (newStatus === 'replied') updates.replied_at = new Date().toISOString();
      if (newStatus === 'resolved') updates.resolved_at = new Date().toISOString();

      const { error } = await supabase
        .from('contact_submissions')
        .update(updates)
        .eq('id', submission.id);

      if (error) throw error;

      setSubmission({ ...submission, status: newStatus });
      toast({
        title: "Status Updated",
        description: `Contact submission marked as ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const updatePriority = async (newPriority: string) => {
    if (!submission) return;

    try {
      const { error } = await supabase
        .from('contact_submissions')
        .update({ priority: newPriority })
        .eq('id', submission.id);

      if (error) throw error;

      setSubmission({ ...submission, priority: newPriority });
      toast({
        title: "Priority Updated",
        description: `Priority set to ${newPriority}`,
      });
    } catch (error) {
      console.error('Error updating priority:', error);
      toast({
        title: "Error",
        description: "Failed to update priority",
        variant: "destructive",
      });
    }
  };

  const sendReply = async () => {
    if (!submission || !replyMessage.trim()) return;

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Save reply to database
      const { error: replyError } = await supabase
        .from('contact_replies')
        .insert({
          contact_submission_id: submission.id,
          reply_message: replyMessage.trim(),
          replied_by: user.id,
          is_internal: false
        });

      if (replyError) throw replyError;

      // Send email via edge function
      const { error: emailError } = await supabase.functions.invoke('send-reply-email', {
        body: {
          submissionId: submission.id,
          recipientEmail: submission.email,
          recipientName: submission.name,
          originalMessage: submission.message,
          replyMessage: replyMessage.trim(),
          subject: submission.subject || 'Re: Your Contact Form Message'
        }
      });

      if (emailError) {
        console.warn('Email sending failed:', emailError);
      }

      // Update submission status
      await updateStatus('replied');

      setReplyMessage('');
      fetchReplies();

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
      'new': 'default',
      'in_progress': 'secondary',
      'replied': 'outline',
      'resolved': 'default',
      'spam': 'destructive'
    };

    return (
      <Badge variant={variants[status] || 'default'}>
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

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Submission Not Found</h1>
          <Button onClick={() => navigate('/admin/contact-management')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contact Management
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/admin/contact-management')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Contact Submission</h1>
          <p className="text-muted-foreground">View and respond to contact form submission</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Original Message */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Original Message
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">From</div>
                  <div className="font-medium">{submission.name}</div>
                  <div className="text-sm text-muted-foreground">{submission.email}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Date</div>
                  <div>{format(new Date(submission.created_at), 'PPpp')}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-sm font-medium text-muted-foreground">Subject</div>
                  <div>{submission.subject || 'No Subject'}</div>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Message</div>
                <div className="bg-muted p-4 rounded whitespace-pre-wrap">
                  {submission.message}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Replies */}
          {replies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Reply className="w-5 h-5" />
                  Conversation History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {replies.map((reply) => (
                    <div key={reply.id} className="border-l-4 border-primary pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-sm font-medium">
                          {reply.profiles?.full_name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(reply.created_at), 'PPpp')}
                        </div>
                        {reply.is_internal && (
                          <Badge variant="secondary">Internal</Badge>
                        )}
                      </div>
                      <div className="whitespace-pre-wrap">{reply.reply_message}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reply Form */}
          <Card>
            <CardHeader>
              <CardTitle>Send Reply</CardTitle>
              <CardDescription>
                Reply to {submission.name} at {submission.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Type your reply..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={6}
              />
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <Select value={submission.status} onValueChange={updateStatus}>
                    <SelectTrigger className="w-40">
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
                <Button 
                  onClick={sendReply} 
                  disabled={sending || !replyMessage.trim()}
                >
                  {sending ? "Sending..." : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Reply
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Priority</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Status</div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(submission.status)}
                  <Select value={submission.status} onValueChange={updateStatus}>
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
                <div className="text-sm font-medium text-muted-foreground mb-2">Priority</div>
                <div className="flex items-center gap-2">
                  {getPriorityBadge(submission.priority)}
                  <Select value={submission.priority} onValueChange={updatePriority}>
                    <SelectTrigger className="w-32">
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
            </CardContent>
          </Card>

          {/* Submission Details */}
          <Card>
            <CardHeader>
              <CardTitle>Submission Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">{submission.name}</div>
                  <div className="text-xs text-muted-foreground">{submission.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div className="text-sm">
                  {format(new Date(submission.created_at), 'PPP')}
                </div>
              </div>
              {submission.user_ip && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <div className="text-sm">{submission.user_ip}</div>
                </div>
              )}
              {submission.user_agent && (
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-muted-foreground" />
                  <div className="text-xs text-muted-foreground break-all">
                    {submission.user_agent}
                  </div>
                </div>
              )}
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground">Source: {submission.source}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}