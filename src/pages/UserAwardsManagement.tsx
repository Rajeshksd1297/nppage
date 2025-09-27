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
  Award,
  Star,
  Calendar,
  Building,
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

interface AwardItem {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  organization: string | null;
  category: string | null;
  award_date: string | null;
  sort_order: number;
  is_featured: boolean;
  award_image_url: string | null;
  certificate_url: string | null;
  created_at: string;
  updated_at: string;
}

export default function UserAwardsManagement() {
  const { toast } = useToast();
  const [awards, setAwards] = useState<AwardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedAward, setSelectedAward] = useState<AwardItem | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    organization: '',
    category: '',
    award_date: '',
    is_featured: false,
    award_image_url: '',
    certificate_url: '',
  });

  const categories = ['Literary', 'Academic', 'Professional', 'Community', 'Industry Recognition', 'Other'];

  useEffect(() => {
    fetchAwards();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('user-awards-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'awards'
        },
        () => {
          fetchAwards();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAwards = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('awards')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setAwards(data || []);
    } catch (error) {
      console.error('Error fetching awards:', error);
      toast({
        title: "Error",
        description: "Failed to load awards",
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

      const awardData = {
        ...formData,
        award_date: formData.award_date || null,
        user_id: user.id,
      };

      if (selectedAward) {
        // Update existing award
        const { error } = await supabase
          .from('awards')
          .update(awardData)
          .eq('id', selectedAward.id)
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Award updated successfully",
        });
        setIsEditOpen(false);
      } else {
        // Create new award
        const maxOrder = Math.max(...awards.map(award => award.sort_order), 0);
        const { error } = await supabase
          .from('awards')
          .insert([{ 
            ...awardData,
            sort_order: maxOrder + 1 
          }]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Award created successfully",
        });
        setIsCreateOpen(false);
      }

      resetForm();
      fetchAwards();
    } catch (error: any) {
      console.error('Error saving award:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save award",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (awardId: string) => {
    if (!window.confirm('Are you sure you want to delete this award?')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('awards')
        .delete()
        .eq('id', awardId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Award deleted successfully",
      });
      fetchAwards();
    } catch (error: any) {
      console.error('Error deleting award:', error);
      toast({
        title: "Error",
        description: "Failed to delete award",
        variant: "destructive",
      });
    }
  };

  const updateSortOrder = async (awardId: string, newOrder: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('awards')
        .update({ sort_order: newOrder })
        .eq('id', awardId)
        .eq('user_id', user.id);

      if (error) throw error;
      fetchAwards();
    } catch (error: any) {
      console.error('Error updating sort order:', error);
      toast({
        title: "Error",
        description: "Failed to update sort order",
        variant: "destructive",
      });
    }
  };

  const moveAward = (awardId: string, direction: 'up' | 'down') => {
    const award = awards.find(a => a.id === awardId);
    if (!award) return;

    const currentIndex = awards.findIndex(a => a.id === awardId);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= awards.length) return;

    const targetAward = awards[targetIndex];
    updateSortOrder(award.id, targetAward.sort_order);
    updateSortOrder(targetAward.id, award.sort_order);
  };

  const openEditDialog = (award: AwardItem) => {
    setSelectedAward(award);
    setFormData({
      title: award.title,
      description: award.description || '',
      organization: award.organization || '',
      category: award.category || '',
      award_date: award.award_date ? new Date(award.award_date).toISOString().slice(0, 10) : '',
      is_featured: award.is_featured,
      award_image_url: award.award_image_url || '',
      certificate_url: award.certificate_url || '',
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      organization: '',
      category: '',
      award_date: '',
      is_featured: false,
      award_image_url: '',
      certificate_url: '',
    });
    setSelectedAward(null);
  };

  const filteredAwards = awards.filter(award => {
    const matchesSearch = award.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (award.description && award.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || award.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const AwardForm = () => (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="title">Award Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter award title"
          />
        </div>
        <div>
          <Label htmlFor="organization">Organization</Label>
          <Input
            id="organization"
            value={formData.organization}
            onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
            placeholder="Awarding organization"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
        <div>
          <Label htmlFor="award_date">Award Date</Label>
          <Input
            id="award_date"
            type="date"
            value={formData.award_date}
            onChange={(e) => setFormData({ ...formData, award_date: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the award and achievement"
          rows={3}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="award_image_url">Award Image URL</Label>
          <Input
            id="award_image_url"
            value={formData.award_image_url}
            onChange={(e) => setFormData({ ...formData, award_image_url: e.target.value })}
            placeholder="https://example.com/award.jpg"
          />
        </div>
        <div>
          <Label htmlFor="certificate_url">Certificate URL</Label>
          <Input
            id="certificate_url"
            value={formData.certificate_url}
            onChange={(e) => setFormData({ ...formData, certificate_url: e.target.value })}
            placeholder="https://example.com/certificate.pdf"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_featured"
          checked={formData.is_featured}
          onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
        />
        <Label htmlFor="is_featured">Featured Award</Label>
      </div>
    </div>
  );

  return (
    <FeatureAccessGuard feature="awards">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Award className="h-8 w-8" />
            My Awards
          </h1>
          <p className="text-muted-foreground">Showcase your achievements and recognition</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Award
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Award</DialogTitle>
              <DialogDescription>
                Add a new award or recognition to your portfolio.
              </DialogDescription>
            </DialogHeader>
            <AwardForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Add Award</Button>
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
                  placeholder="Search awards..."
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

      {/* Awards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8">Loading awards...</div>
        ) : filteredAwards.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Award className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No awards found</p>
            <p className="text-sm">Add your first award to get started</p>
          </div>
        ) : (
          filteredAwards.map((award, index) => (
            <Card key={award.id} className="overflow-hidden">
              {award.award_image_url && (
                <div className="aspect-square overflow-hidden">
                  <img
                    src={award.award_image_url}
                    alt={award.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold line-clamp-1 mb-1">{award.title}</h3>
                    <div className="flex gap-2 mb-2">
                      {award.is_featured && (
                        <Badge variant="default">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {award.category && (
                        <Badge variant="secondary" className="text-xs">
                          {award.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveAward(award.id, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveAward(award.id, 'down')}
                      disabled={index === filteredAwards.length - 1}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground mb-3">
                  {award.organization && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <span className="line-clamp-1">{award.organization}</span>
                    </div>
                  )}
                  
                  {award.award_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(award.award_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {award.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {award.description}
                  </p>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Order: {award.sort_order}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(award)}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(award.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Award</DialogTitle>
            <DialogDescription>
              Update your award details and information.
            </DialogDescription>
          </DialogHeader>
          <AwardForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Update Award</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </FeatureAccessGuard>
  );
}