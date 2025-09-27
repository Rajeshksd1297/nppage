import { useState, useEffect } from 'react';
import { FeatureAccessGuard } from '@/components/FeatureAccessGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Search,
  HelpCircle,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FaqItem {
  id: string;
  user_id: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export default function UserFaqManagement() {
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<FaqItem | null>(null);

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    is_published: true,
  });

  const categories = ['General', 'Books', 'Events', 'Contact', 'Services', 'Other'];

  useEffect(() => {
    fetchFaqs();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('user-faqs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'faqs'
        },
        () => {
          fetchFaqs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      toast({
        title: "Error",
        description: "Failed to load FAQs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const faqData = {
        ...formData,
        user_id: user.id,
      };

      if (selectedFaq) {
        // Update existing FAQ
        const { error } = await supabase
          .from('faqs')
          .update(faqData)
          .eq('id', selectedFaq.id)
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "FAQ updated successfully",
        });
        setIsEditOpen(false);
      } else {
        // Create new FAQ
        const maxOrder = Math.max(...faqs.map(faq => faq.sort_order), 0);
        const { error } = await supabase
          .from('faqs')
          .insert([{ 
            ...faqData,
            sort_order: maxOrder + 1 
          }]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "FAQ created successfully",
        });
        setIsCreateOpen(false);
      }

      resetForm();
      fetchFaqs();
    } catch (error: any) {
      console.error('Error saving FAQ:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save FAQ",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (faqId: string) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', faqId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "FAQ deleted successfully",
      });
      fetchFaqs();
    } catch (error: any) {
      console.error('Error deleting FAQ:', error);
      toast({
        title: "Error",
        description: "Failed to delete FAQ",
        variant: "destructive",
      });
    }
  };

  const updateSortOrder = async (faqId: string, newOrder: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('faqs')
        .update({ sort_order: newOrder })
        .eq('id', faqId)
        .eq('user_id', user.id);

      if (error) throw error;
      fetchFaqs();
    } catch (error: any) {
      console.error('Error updating sort order:', error);
      toast({
        title: "Error",
        description: "Failed to update sort order",
        variant: "destructive",
      });
    }
  };

  const moveFaq = (faqId: string, direction: 'up' | 'down') => {
    const faq = faqs.find(f => f.id === faqId);
    if (!faq) return;

    const currentIndex = faqs.findIndex(f => f.id === faqId);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    const targetFaq = faqs[targetIndex];
    updateSortOrder(faq.id, targetFaq.sort_order);
    updateSortOrder(targetFaq.id, faq.sort_order);
  };

  const togglePublished = async (faqId: string, currentStatus: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('faqs')
        .update({ is_published: !currentStatus })
        .eq('id', faqId)
        .eq('user_id', user.id);

      if (error) throw error;
      fetchFaqs();
    } catch (error: any) {
      console.error('Error toggling FAQ status:', error);
      toast({
        title: "Error",
        description: "Failed to update FAQ status",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (faq: FaqItem) => {
    setSelectedFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || '',
      is_published: faq.is_published,
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category: '',
      is_published: true,
    });
    setSelectedFaq(null);
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || faq.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const FaqForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="question">Question</Label>
        <Input
          id="question"
          value={formData.question}
          onChange={(e) => setFormData({ ...formData, question: e.target.value })}
          placeholder="Enter the frequently asked question"
        />
      </div>

      <div>
        <Label htmlFor="answer">Answer</Label>
        <Textarea
          id="answer"
          value={formData.answer}
          onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
          placeholder="Provide a detailed answer"
          rows={5}
        />
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
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_published"
          checked={formData.is_published}
          onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
        />
        <Label htmlFor="is_published">Published (visible to visitors)</Label>
      </div>
    </div>
  );

  return (
    <FeatureAccessGuard feature="faq">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <HelpCircle className="h-8 w-8" />
            My FAQs
          </h1>
          <p className="text-muted-foreground">Manage frequently asked questions for your audience</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add FAQ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add FAQ</DialogTitle>
              <DialogDescription>
                Add a new frequently asked question and answer.
              </DialogDescription>
            </DialogHeader>
            <FaqForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Add FAQ</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* FAQs List */}
      <Card>
        <CardHeader>
          <CardTitle>FAQs ({filteredFaqs.length})</CardTitle>
          <CardDescription>
            Manage your frequently asked questions and their visibility
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading FAQs...</div>
          ) : filteredFaqs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <HelpCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No FAQs found</p>
              <p className="text-sm">Add your first FAQ to help your audience</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFaqs.map((faq, index) => (
                <Card key={faq.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold line-clamp-2">{faq.question}</h3>
                          <div className="flex gap-2">
                            {faq.is_published ? (
                              <Badge variant="default">
                                <Eye className="h-3 w-3 mr-1" />
                                Published
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <EyeOff className="h-3 w-3 mr-1" />
                                Draft
                              </Badge>
                            )}
                            {faq.category && (
                              <Badge variant="outline" className="text-xs">
                                {faq.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {faq.answer}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveFaq(faq.id, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveFaq(faq.id, 'down')}
                          disabled={index === filteredFaqs.length - 1}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">
                          Order: {faq.sort_order}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePublished(faq.id, faq.is_published)}
                        >
                          {faq.is_published ? (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Publish
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(faq)}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(faq.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Section */}
      {filteredFaqs.filter(faq => faq.is_published).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview (Published FAQs)</CardTitle>
            <CardDescription>
              How your FAQs will appear to visitors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {filteredFaqs
                .filter(faq => faq.is_published)
                .map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="text-muted-foreground">
                        {faq.answer}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit FAQ</DialogTitle>
            <DialogDescription>
              Update your FAQ question and answer.
            </DialogDescription>
          </DialogHeader>
          <FaqForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Update FAQ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </FeatureAccessGuard>
  );
}