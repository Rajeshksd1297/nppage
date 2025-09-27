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
  Award,
  Star,
  Calendar,
  Building,
  Image as ImageIcon,
  FileText
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';

interface AwardItem {
  id: string;
  user_id: string;
  title: string;
  organization: string | null;
  description: string | null;
  award_date: string | null;
  category: string | null;
  award_image_url: string | null;
  certificate_url: string | null;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

export default function AwardsManagement() {
  const { toast } = useToast();
  const [awards, setAwards] = useState<AwardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedAward, setSelectedAward] = useState<AwardItem | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    organization: '',
    description: '',
    award_date: '',
    category: '',
    award_image_url: '',
    certificate_url: '',
    is_featured: false,
    sort_order: 0,
  });

  useEffect(() => {
    fetchAwards();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('awards-changes')
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
      const { data, error } = await supabase
        .from('awards')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('award_date', { ascending: false });

      if (error) throw error;
      setAwards((data as any) || []);
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
      const awardData = {
        ...formData,
        award_date: formData.award_date ? new Date(formData.award_date).toISOString().split('T')[0] : null,
      };

      if (selectedAward) {
        // Update existing award
        const { error } = await supabase
          .from('awards')
          .update(awardData)
          .eq('id', selectedAward.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Award updated successfully",
        });
        setIsEditOpen(false);
      } else {
        // Create new award
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
          .from('awards')
          .insert([{ ...awardData, user_id: user.id }]);

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
      const { error } = await supabase
        .from('awards')
        .delete()
        .eq('id', awardId);

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

  const openEditDialog = (award: AwardItem) => {
    setSelectedAward(award);
    setFormData({
      title: award.title,
      organization: award.organization || '',
      description: award.description || '',
      award_date: award.award_date || '',
      category: award.category || '',
      award_image_url: award.award_image_url || '',
      certificate_url: award.certificate_url || '',
      is_featured: award.is_featured,
      sort_order: award.sort_order,
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      organization: '',
      description: '',
      award_date: '',
      category: '',
      award_image_url: '',
      certificate_url: '',
      is_featured: false,
      sort_order: 0,
    });
    setSelectedAward(null);
  };

  const filteredAwards = awards.filter(award => {
    const matchesSearch = award.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (award.organization && award.organization.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (award.description && award.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
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
            placeholder="Award giving organization"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the award and its significance"
          rows={3}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="award_date">Award Date</Label>
          <Input
            id="award_date"
            type="date"
            value={formData.award_date}
            onChange={(e) => setFormData({ ...formData, award_date: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="e.g., Literature, Fiction, etc."
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="award_image_url">Award Image URL</Label>
          <Input
            id="award_image_url"
            value={formData.award_image_url}
            onChange={(e) => setFormData({ ...formData, award_image_url: e.target.value })}
            placeholder="https://example.com/award-image.jpg"
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

      <div className="grid gap-4 md:grid-cols-2">
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
        <div className="flex items-center space-x-2 pt-6">
          <Switch
            id="is_featured"
            checked={formData.is_featured}
            onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
          />
          <Label htmlFor="is_featured">Featured Award</Label>
        </div>
      </div>

      {(formData.award_image_url || formData.certificate_url) && (
        <div className="grid gap-4 md:grid-cols-2">
          {formData.award_image_url && (
            <div>
              <Label>Award Image Preview</Label>
              <img
                src={formData.award_image_url}
                alt="Award preview"
                className="w-full h-32 object-cover rounded border mt-2"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          {formData.certificate_url && (
            <div>
              <Label>Certificate Link</Label>
              <div className="mt-2 p-3 border rounded bg-muted">
                <FileText className="h-6 w-6 mx-auto text-muted-foreground" />
                <p className="text-sm text-center mt-1">Certificate PDF</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Award className="h-8 w-8" />
            Awards Management
          </h1>
          <p className="text-muted-foreground">Manage awards and achievements</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Award
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Award</DialogTitle>
              <DialogDescription>
                Add a new award or achievement with details and documentation.
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

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search awards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Awards Table */}
      <Card>
        <CardHeader>
          <CardTitle>Awards ({filteredAwards.length})</CardTitle>
          <CardDescription>
            Manage all awards and achievements across your platform
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
                  <TableHead>Award</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAwards.map((award) => (
                  <TableRow key={award.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {award.award_image_url ? (
                          <img
                            src={award.award_image_url}
                            alt={award.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <Award className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{award.title}</div>
                          {award.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {award.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span>{award.organization || 'Not specified'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {award.award_date 
                            ? new Date(award.award_date).toLocaleDateString()
                            : 'Not specified'
                          }
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {award.category ? (
                        <Badge variant="outline">{award.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {award.is_featured && (
                        <Badge>
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(award)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(award.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {award.certificate_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(award.certificate_url!, '_blank')}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Award</DialogTitle>
            <DialogDescription>
              Update the award details and information.
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
  );
}