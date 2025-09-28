import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { FeatureAccessGuard } from '@/components/FeatureAccessGuard';

interface NewsletterSubscriber {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  status: 'active' | 'unsubscribed' | 'bounced';
  source: string | null;
  tags: string[];
  subscribed_at: string;
  created_at: string;
  updated_at: string;
}

export default function UserNewsletterEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { settings, loading: settingsLoading } = useAdminSettings();
  
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    source: 'manual',
    tags: [] as string[],
    tagInput: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [subscriber, setSubscriber] = useState<NewsletterSubscriber | null>(null);

  useEffect(() => {
    if (id) {
      fetchSubscriber();
    }
  }, [id]);

  const fetchSubscriber = async () => {
    if (!id) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: "Error",
            description: "Subscriber not found",
            variant: "destructive",
          });
          navigate('/user-newsletter-management');
          return;
        }
        throw error;
      }

      setSubscriber(data as NewsletterSubscriber);
      setFormData({
        email: data.email,
        name: data.name || '',
        source: data.source || 'manual',
        tags: data.tags || [],
        tagInput: '',
      });
    } catch (error: any) {
      console.error('Error fetching subscriber:', error);
      toast({
        title: "Error",
        description: "Failed to load subscriber",
        variant: "destructive",
      });
      navigate('/user-newsletter-management');
    }
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Email address is required",
        variant: "destructive",
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const checkEmailExists = async () => {
    if (formData.email === subscriber?.email) return false; // Same email, no conflict
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('user_id', user.id)
      .eq('email', formData.email)
      .neq('id', id)
      .maybeSingle();

    return !!data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !subscriber) return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if email already exists (for a different subscriber)
      const emailExists = await checkEmailExists();
      if (emailExists) {
        toast({
          title: "Error",
          description: "This email is already used by another subscriber",
          variant: "destructive",
        });
        return;
      }

      const subscriberData = {
        email: formData.email.trim(),
        name: formData.name.trim() || null,
        source: formData.source,
        tags: formData.tags,
      };

      const { error } = await supabase
        .from('newsletter_subscribers')
        .update(subscriberData)
        .eq('id', subscriber.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subscriber updated successfully",
      });
      
      navigate('/user-newsletter-management');
    } catch (error: any) {
      console.error('Error updating subscriber:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update subscriber",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (formData.tagInput.trim() && !formData.tags.includes(formData.tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.tagInput.trim()],
        tagInput: '',
      });
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  if (settingsLoading || !subscriber) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <FeatureAccessGuard feature="newsletter">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/user-newsletter-management')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Subscribers
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Edit3 className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Edit Subscriber</h1>
            <p className="text-muted-foreground">Update subscriber information</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Subscriber Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="subscriber@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name">Name (Optional)</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Subscriber name"
                  />
                </div>
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
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="import">Import</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={formData.tagInput}
                    onChange={(e) => setFormData({ ...formData, tagInput: e.target.value })}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} variant="outline">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/user-newsletter-management')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Subscriber'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </FeatureAccessGuard>
  );
}