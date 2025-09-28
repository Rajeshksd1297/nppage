import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

interface ContactFormSettings {
  form_title: string;
  form_description: string;
  collect_phone: boolean;
  collect_company: boolean;
  require_subject: boolean;
  enabled: boolean;
  max_message_length: number;
  user_id: string;
}

interface ContactFormWidgetProps {
  userId?: string;
  onSubmissionSuccess?: () => void;
}

export function ContactFormWidget({ userId, onSubmissionSuccess }: ContactFormWidgetProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    phone: '',
    company: '',
    message: ''
  });
  const [settings, setSettings] = useState<ContactFormSettings | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      loadContactFormSettings();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const loadContactFormSettings = async () => {
    try {
      if (!userId) return;

      const { data, error } = await supabase
        .from('user_contact_form_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          form_title: data.form_title || 'Contact Me',
          form_description: data.form_description || 'Send me a message and I\'ll get back to you soon!',
          collect_phone: data.collect_phone ?? false,
          collect_company: data.collect_company ?? false,
          require_subject: data.require_subject ?? false,
          enabled: data.enabled ?? true,
          max_message_length: data.max_message_length || 1000,
          user_id: data.user_id,
        });
      } else {
        // Use default settings if none found
        setSettings({
          form_title: 'Contact Me',
          form_description: 'Send me a message and I\'ll get back to you soon!',
          collect_phone: false,
          collect_company: false,
          require_subject: false,
          enabled: true,
          max_message_length: 1000,
          user_id: userId,
        });
      }
    } catch (error) {
      console.error('Error loading contact form settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!settings || !settings.enabled) {
      toast({
        title: "Contact Form Unavailable",
        description: "This contact form is currently disabled",
        variant: "destructive",
      });
      return;
    }

    // Create validation schema based on settings
    const schema = z.object({
      name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
      email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
      subject: settings.require_subject 
        ? z.string().trim().min(1, "Subject is required").max(200, "Subject must be less than 200 characters")
        : z.string().max(200, "Subject must be less than 200 characters").optional(),
      phone: settings.collect_phone 
        ? z.string().trim().min(1, "Phone number is required")
        : z.string().optional(),
      company: settings.collect_company 
        ? z.string().trim().min(1, "Company is required")
        : z.string().optional(),
      message: z.string().trim().min(1, "Message is required").max(settings.max_message_length, `Message must be less than ${settings.max_message_length} characters`)
    });

    try {
      // Validate form data
      const validatedData = schema.parse(formData);
      setSending(true);

      // Send contact form via edge function
      const { data, error: submitError } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: validatedData.name,
          email: validatedData.email,
          subject: validatedData.subject || 'Contact Form Inquiry',
          message: validatedData.message,
          phone: validatedData.phone,
          company: validatedData.company,
          contactedUserId: settings.user_id,
          userAgent: navigator.userAgent,
          userIp: null
        }
      });

      if (submitError) throw submitError;

      // Handle success response
      const responseData = data || {};
      const message = responseData.message || "Thank you for your message. We'll get back to you soon!";
      
      toast({
        title: "Message Sent",
        description: message,
      });

      // Reset form
      setFormData({ 
        name: '', 
        email: '', 
        subject: '', 
        phone: '', 
        company: '', 
        message: '' 
      });

      // Call success callback
      onSubmissionSuccess?.();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast({
          title: "Validation Error",
          description: firstError.message,
          variant: "destructive",
        });
      } else {
        console.error('Error sending message:', error);
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div className="flex justify-center p-4">Loading...</div>;
  }

  if (!settings || !settings.enabled) {
    return (
      <Card className="opacity-50">
        <CardHeader>
          <CardTitle>Contact Form</CardTitle>
          <CardDescription>Contact form is currently unavailable</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This contact form is temporarily disabled.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{settings.form_title}</CardTitle>
        <CardDescription>{settings.form_description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name and Email - Always required */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Your name"
                required
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="your@email.com"
                required
                maxLength={255}
              />
            </div>
          </div>

          {/* Optional fields based on settings */}
          {(settings.require_subject || settings.collect_phone || settings.collect_company) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settings.require_subject && (
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="Subject"
                    required
                    maxLength={200}
                  />
                </div>
              )}
              
              {settings.collect_phone && (
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Your phone number"
                    required
                  />
                </div>
              )}
              
              {settings.collect_company && (
                <div className="space-y-2">
                  <Label htmlFor="company">Company *</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="Your company"
                    required
                  />
                </div>
              )}
            </div>
          )}

          {/* Message - Always required */}
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Your message..."
              rows={4}
              required
              maxLength={settings.max_message_length}
            />
            <p className="text-xs text-muted-foreground">
              {formData.message.length}/{settings.max_message_length} characters
            </p>
          </div>

          <Button type="submit" disabled={sending} className="w-full">
            {sending ? (
              "Sending..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}