import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { FeatureAccessGuard } from '@/components/FeatureAccessGuard';

export default function UserFaqCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings, loading: settingsLoading } = useAdminSettings();
  
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    is_published: true,
  });
  
  const [loading, setLoading] = useState(false);
  const [faqs, setFaqs] = useState<any[]>([]);

  useEffect(() => {
    fetchUserFaqs();
  }, []);

  const fetchUserFaqs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('faqs')
        .select('*')
        .eq('user_id', user.id);

      setFaqs(data || []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    }
  };

  const validateForm = () => {
    if (!formData.question.trim()) {
      toast({
        title: "Validation Error",
        description: "Question is required",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.answer.trim()) {
      toast({
        title: "Validation Error",
        description: "Answer is required",
        variant: "destructive",
      });
      return false;
    }

    const maxQuestionLength = 200; // Default limit
    if (formData.question.length > maxQuestionLength) {
      toast({
        title: "Validation Error",
        description: `Question must be less than ${maxQuestionLength} characters`,
        variant: "destructive",
      });
      return false;
    }

    const maxAnswerLength = 2000; // Default limit
    if (formData.answer.length > maxAnswerLength) {
      toast({
        title: "Validation Error",
        description: `Answer must be less than ${maxAnswerLength} characters`,
        variant: "destructive",
      });
      return false;
    }

    const maxFaqs = settings?.faq?.maxFaqsPerUser || 10;
    if (faqs.length >= maxFaqs) {
      toast({
        title: "Limit Reached",
        description: `You can only create up to ${maxFaqs} FAQs`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const maxOrder = Math.max(...faqs.map(faq => faq.sort_order || 0), 0);
      
      // If admin requires approval, set published to false
      const finalIsPublished = settings?.faq?.requireApproval ? false : formData.is_published;
      
      const faqData = {
        ...formData,
        is_published: finalIsPublished,
        user_id: user.id,
        sort_order: maxOrder + 1,
      };

      const { error } = await supabase
        .from('faqs')
        .insert([faqData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: settings?.faq?.requireApproval 
          ? "FAQ submitted for approval" 
          : "FAQ created successfully",
      });
      
      navigate('/user-faq-management');
    } catch (error: any) {
      console.error('Error creating FAQ:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create FAQ",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategories = () => {
    return settings?.faq?.categories || [
      'general', 'account', 'billing', 'technical', 'support', 'features'
    ];
  };

  if (settingsLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <FeatureAccessGuard feature="faq">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/user-faq-management')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to FAQs
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <HelpCircle className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Create FAQ</h1>
            <p className="text-muted-foreground">Add a new frequently asked question</p>
          </div>
        </div>

        {settings?.faq?.requireApproval && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-4">
              <p className="text-orange-800 text-sm">
                <strong>Note:</strong> FAQs require admin approval before they become visible to visitors.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>FAQ Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="question">Question *</Label>
                <Input
                  id="question"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Enter the frequently asked question"
                  maxLength={200}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.question.length}/200 characters
                </p>
              </div>

              <div>
                <Label htmlFor="answer">Answer *</Label>
                <Textarea
                  id="answer"
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Provide a detailed answer"
                  maxLength={2000}
                  rows={5}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.answer.length}/2000 characters
                </p>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCategories().map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!settings?.faq?.requireApproval && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  />
                  <Label htmlFor="is_published">Published (visible to visitors)</Label>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/user-faq-management')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create FAQ'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </FeatureAccessGuard>
  );
}