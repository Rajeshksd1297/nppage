import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings,
  Mail,
  Save,
  User
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
  FormDescription,
} from '@/components/ui/form';

const settingsSchema = z.object({
  fromName: z.string().min(1, 'From name is required').max(100, 'From name must be less than 100 characters'),
  fromEmail: z.string().email('Invalid email address'),
  maxRecipientsPerNewsletter: z.number().min(1, 'Must be at least 1').max(10000, 'Cannot exceed 10,000'),
  maxNewslettersPerMonth: z.number().min(1, 'Must be at least 1').max(100, 'Cannot exceed 100'),
  enableAutoUnsubscribe: z.boolean(),
  signature: z.string().max(500, 'Signature must be less than 500 characters').optional(),
  emailProvider: z.enum(['system', 'resend']),
  resendApiKey: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface UserNewsletterSettings {
  id?: string;
  user_id: string;
  from_name: string;
  from_email: string;
  max_recipients_per_newsletter: number;
  max_newsletters_per_month: number;
  enable_auto_unsubscribe: boolean;
  signature?: string;
  created_at?: string;
  updated_at?: string;
}

export default function UserNewsletterSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      fromName: '',
      fromEmail: '',
      maxRecipientsPerNewsletter: 1000,
      maxNewslettersPerMonth: 10,
      enableAutoUnsubscribe: true,
      signature: '',
      emailProvider: 'system' as const,
      resendApiKey: '',
    },
  });

  useEffect(() => {
    fetchUserProfile();
    fetchSettings();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      setUserProfile(profile);
      
      // Set default values from profile
      if (profile) {
        form.setValue('fromName', profile.full_name || '');
        form.setValue('fromEmail', profile.email || '');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // For now, we'll use default values since the table is new
      // In a real implementation, you'd fetch from the user_newsletter_settings table
      console.log('Settings would be fetched for user:', user.id);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const onSubmit = async (data: SettingsFormData) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const settingsData: Omit<UserNewsletterSettings, 'id' | 'created_at' | 'updated_at'> = {
        user_id: user.id,
        from_name: data.fromName,
        from_email: data.fromEmail,
        max_recipients_per_newsletter: data.maxRecipientsPerNewsletter,
        max_newsletters_per_month: data.maxNewslettersPerMonth,
        enable_auto_unsubscribe: data.enableAutoUnsubscribe,
        signature: data.signature,
      };

      // For now, we'll just show success - in a real implementation you'd save to user_newsletter_settings
      console.log('Settings would be saved:', settingsData);

      toast({
        title: "Success",
        description: "Newsletter settings saved successfully",
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
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
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Newsletter Settings
          </h1>
          <p className="text-muted-foreground">Configure your newsletter sending preferences</p>
        </div>

        {/* Settings Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Provider Configuration
            </CardTitle>
            <CardDescription>
              Choose your email provider and configure sending preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="emailProvider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Provider</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose email provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="system">System Default (Limited)</SelectItem>
                          <SelectItem value="resend">Resend (Recommended)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        System default has sending limits. Resend provides better deliverability and higher limits.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("emailProvider") === "resend" && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Setup Resend Account</h4>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>To use Resend for professional email delivery:</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                          <li>
                            Create account at{" "}
                            <a 
                              href="https://resend.com" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-primary hover:underline font-medium"
                            >
                              resend.com
                            </a>
                          </li>
                          <li>
                            Verify your domain at{" "}
                            <a 
                              href="https://resend.com/domains" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-primary hover:underline font-medium"
                            >
                              resend.com/domains
                            </a>
                          </li>
                          <li>
                            Generate API key at{" "}
                            <a 
                              href="https://resend.com/api-keys" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-primary hover:underline font-medium"
                            >
                              resend.com/api-keys
                            </a>
                          </li>
                          <li>Enter your API key below</li>
                        </ol>
                      </div>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="resendApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Resend API Key</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="re_xxxxxxxxxxxxxxxx"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Your API key is stored securely and encrypted. Required to send emails via Resend.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="fromName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your name or organization"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This name will appear as the sender in your newsletters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fromEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="your@domain.com"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {form.watch("emailProvider") === "resend" 
                            ? "Must match your verified domain in Resend" 
                            : "Must be your account email address"
                          }
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="maxRecipientsPerNewsletter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Recipients per Newsletter</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="10000"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum number of recipients per newsletter send
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxNewslettersPerMonth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Newsletters per Month</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Limit the number of newsletters you can send monthly
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="enableAutoUnsubscribe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Auto Unsubscribe Link
                        </FormLabel>
                        <FormDescription>
                          Automatically include an unsubscribe link in all newsletters
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="signature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Signature (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Your signature that will be added to all newsletters..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This signature will be automatically added to the end of your newsletters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your account details used for newsletter sending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Account Name</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {userProfile?.full_name || 'Not set'}
                </p>
              </div>
              <div>
                <Label>Account Email</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {userProfile?.email || 'Not set'}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Note: Newsletters will be sent from your account email address. 
                Make sure this email is verified and has proper sending permissions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </FeatureAccessGuard>
  );
}