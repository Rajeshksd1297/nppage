import { useState, useEffect } from 'react';
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
  ArrowUpDown,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';

interface FaqItem {
  id: string;
  user_id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface FaqSettings {
  max_question_length: number;
  max_answer_length: number;
  categories: string[];
  allow_user_submissions: boolean;
  require_approval: boolean;
  enable_public_display: boolean;
}

export default function FaqManagement() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [settings, setSettings] = useState<FaqSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<FaqItem | null>(null);

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'general',
    sort_order: 0,
    is_published: true,
  });

  useEffect(() => {
    fetchFaqs();
    fetchSettings();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('faqs-changes')
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
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFaqs((data as any) || []);
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

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("faq_settings")
        .select("max_question_length, max_answer_length, categories, allow_user_submissions, require_approval, enable_public_display")
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error("Error fetching FAQ settings:", error);
    }
  };

  const handleSubmit = async () => {
    // Validate against settings
    if (settings) {
      if (formData.question.length > settings.max_question_length) {
        toast({
          title: "Validation Error",
          description: `Question must be ${settings.max_question_length} characters or less`,
          variant: "destructive",
        });
        return;
      }

      if (formData.answer.length > settings.max_answer_length) {
        toast({
          title: "Validation Error",
          description: `Answer must be ${settings.max_answer_length} characters or less`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      if (selectedFaq) {
        // Update existing FAQ
        const { error } = await supabase
          .from('faqs')
          .update(formData)
          .eq('id', selectedFaq.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "FAQ updated successfully",
        });
        setIsEditOpen(false);
      } else {
        // Create new FAQ
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
          .from('faqs')
          .insert([{ ...formData, user_id: user.id }]);

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
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', faqId);

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

  const togglePublished = async (faqId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('faqs')
        .update({ is_published: !currentStatus })
        .eq('id', faqId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `FAQ ${!currentStatus ? 'published' : 'unpublished'} successfully`,
      });
      fetchFaqs();
    } catch (error: any) {
      console.error('Error updating FAQ status:', error);
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
      category: faq.category,
      sort_order: faq.sort_order,
      is_published: faq.is_published,
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category: 'general',
      sort_order: 0,
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

  const categories = settings?.categories || Array.from(new Set(faqs.map(faq => faq.category)));

  const FaqForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="question">Question</Label>
        <Input
          id="question"
          value={formData.question}
          onChange={(e) => setFormData({ ...formData, question: e.target.value })}
          placeholder="Enter the frequently asked question"
          maxLength={settings?.max_question_length || 200}
        />
        {settings && (
          <p className="text-sm text-muted-foreground mt-1">
            {formData.question.length}/{settings.max_question_length} characters
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="answer">Answer</Label>
        <Textarea
          id="answer"
          value={formData.answer}
          onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
          placeholder="Provide a detailed answer to the question"
          rows={5}
          maxLength={settings?.max_answer_length || 2000}
        />
        {settings && (
          <p className="text-sm text-muted-foreground mt-1">
            {formData.answer.length}/{settings.max_answer_length} characters
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="sort_order">Sort Order</Label>
          <Input
            id="sort_order"
            type="number"
            value={formData.sort_order}
            onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_published"
          checked={formData.is_published}
          onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
        />
        <Label htmlFor="is_published">Published (visible to users)</Label>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <HelpCircle className="h-8 w-8" />
            FAQ Management
          </h1>
          <p className="text-muted-foreground">Manage frequently asked questions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/faq-settings')}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add FAQ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add FAQ</DialogTitle>
                <DialogDescription>
                  Add a new frequently asked question with answer and categorization.
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
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* FAQs Table */}
      <Card>
        <CardHeader>
          <CardTitle>FAQs ({filteredFaqs.length})</CardTitle>
          <CardDescription>
            Manage all frequently asked questions across your platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFaqs.map((faq) => (
                  <TableRow key={faq.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{faq.question}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {faq.answer}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{faq.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {faq.is_published ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Eye className="h-3 w-3 mr-1" />
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Draft
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4" />
                        <span>{faq.sort_order}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePublished(faq.id, faq.is_published)}
                          title={faq.is_published ? 'Unpublish' : 'Publish'}
                        >
                          {faq.is_published ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(faq)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(faq.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit FAQ</DialogTitle>
            <DialogDescription>
              Update the FAQ question, answer, and settings.
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
  );
}