import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft,
  Send,
  Mail,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FeatureAccessGuard } from '@/components/FeatureAccessGuard';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAdminSettings } from '@/hooks/useAdminSettings';

const newsletterSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(100, 'Subject must be less than 100 characters'),
  content: z.string().min(1, 'Content is required').max(50000, 'Content must be less than 50,000 characters'),
  previewText: z.string().optional(),
});

type NewsletterFormData = z.infer<typeof newsletterSchema>;

export default function UserNewsletterCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings } = useAdminSettings();
  const [loading, setLoading] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);

  const form = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      subject: '',
      content: '',
      previewText: '',
    },
  });

  useEffect(() => {
    fetchSubscriberCount();
  }, []);

  const fetchSubscriberCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from('newsletter_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active');

      setSubscriberCount(count || 0);
    } catch (error) {
      console.error('Error fetching subscriber count:', error);
    }
  };

  const onSubmit = async (data: NewsletterFormData) => {
    if (subscriberCount === 0) {
      toast({
        title: "No Recipients",
        description: "You need at least one active subscriber to send a newsletter.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get user profile for sender info
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .single();

      if (!profile?.email) {
        toast({
          title: "Error",
          description: "Please complete your profile with an email address before sending newsletters.",
          variant: "destructive",
        });
        return;
      }

      // Get active subscribers
      const { data: subscribers } = await supabase
        .from('newsletter_subscribers')
        .select('email')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (!subscribers || subscribers.length === 0) {
        toast({
          title: "No Recipients",
          description: "No active subscribers found.",
          variant: "destructive",
        });
        return;
      }

      // Send newsletter via edge function  
      const { error: sendError } = await supabase.functions.invoke('send-newsletter', {
        body: {
          subject: data.subject,
          content: data.content,
          previewText: data.previewText,
          fromEmail: profile.email,
          fromName: profile.full_name || 'Newsletter',
          recipients: subscribers.map(s => s.email),
        }
      });

      if (sendError) {
        throw sendError;
      }

      toast({
        title: "Success",
        description: `Newsletter sent to ${subscribers.length} subscriber(s)`,
      });

      navigate('/user-newsletter-management');
    } catch (error: any) {
      console.error('Error sending newsletter:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send newsletter",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FeatureAccessGuard feature="newsletter">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/user-newsletter-management')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Mail className="h-8 w-8" />
              Create Newsletter
            </h1>
            <p className="text-muted-foreground">
              Compose and send a newsletter to your {subscriberCount} active subscriber(s)
            </p>
          </div>
        </div>

        {/* Stats */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Recipients</p>
                <p className="text-2xl font-bold">{subscriberCount}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Newsletter Form */}
        <Card>
          <CardHeader>
            <CardTitle>Newsletter Content</CardTitle>
            <CardDescription>
              Create your newsletter content. The email will be sent from your account email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject Line</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter newsletter subject..."
                          {...field}
                          maxLength={100}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="previewText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preview Text (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Preview text shown in email clients..."
                          {...field}
                          maxLength={100}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Newsletter Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write your newsletter content here..."
                          className="min-h-[300px]"
                          {...field}
                          maxLength={50000}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/user-newsletter-management')}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading || subscriberCount === 0}>
                    <Send className="h-4 w-4 mr-2" />
                    {loading ? 'Sending...' : `Send to ${subscriberCount} Subscriber(s)`}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </FeatureAccessGuard>
  );
}