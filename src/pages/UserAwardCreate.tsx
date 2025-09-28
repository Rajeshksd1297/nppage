import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { FeatureAccessGuard } from '@/components/FeatureAccessGuard';

export default function UserAwardCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings, loading: settingsLoading } = useAdminSettings();
  
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
  
  const [loading, setLoading] = useState(false);
  const [awards, setAwards] = useState<any[]>([]);

  useEffect(() => {
    fetchUserAwards();
  }, []);

  const fetchUserAwards = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('awards')
        .select('*')
        .eq('user_id', user.id);

      setAwards(data || []);
    } catch (error) {
      console.error('Error fetching awards:', error);
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Award title is required",
        variant: "destructive",
      });
      return false;
    }

    const maxTitleLength = 100; // Default limit
    if (formData.title.length > maxTitleLength) {
      toast({
        title: "Validation Error",
        description: `Title must be less than ${maxTitleLength} characters`,
        variant: "destructive",
      });
      return false;
    }

    const maxDescLength = 1000; // Default limit
    if (formData.description && formData.description.length > maxDescLength) {
      toast({
        title: "Validation Error",
        description: `Description must be less than ${maxDescLength} characters`,
        variant: "destructive",
      });
      return false;
    }

    const maxAwards = settings?.awards?.maxAwardsPerUser || 20;
    if (awards.length >= maxAwards) {
      toast({
        title: "Limit Reached",
        description: `You can only create up to ${maxAwards} awards`,
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

      const maxOrder = Math.max(...awards.map(award => award.sort_order || 0), 0);
      
      const awardData = {
        ...formData,
        award_date: formData.award_date || null,
        user_id: user.id,
        sort_order: maxOrder + 1,
      };

      const { error } = await supabase
        .from('awards')
        .insert([awardData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Award created successfully",
      });
      
      navigate('/user-awards-management');
    } catch (error: any) {
      console.error('Error creating award:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create award",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategories = () => {
    return settings?.awards?.categories || [
      'achievement', 'recognition', 'excellence', 'innovation', 
      'leadership', 'community', 'academic', 'professional'
    ];
  };

  if (settingsLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <FeatureAccessGuard feature="awards">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/user-awards-management')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Awards
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Award className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Create Award</h1>
            <p className="text-muted-foreground">Add a new award or recognition to your portfolio</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Award Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="title">Award Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter award title"
                    maxLength={100}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.title.length}/100 characters
                  </p>
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
                      {getCategories().map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
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
                  maxLength={1000}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.description.length}/1000 characters
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="award_image_url">Award Image URL</Label>
                  <Input
                    id="award_image_url"
                    value={formData.award_image_url}
                    onChange={(e) => setFormData({ ...formData, award_image_url: e.target.value })}
                    placeholder="https://example.com/award.jpg"
                    type="url"
                  />
                </div>
                <div>
                  <Label htmlFor="certificate_url">Certificate URL</Label>
                  <Input
                    id="certificate_url"
                    value={formData.certificate_url}
                    onChange={(e) => setFormData({ ...formData, certificate_url: e.target.value })}
                    placeholder="https://example.com/certificate.pdf"
                    type="url"
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

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/user-awards-management')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Award'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </FeatureAccessGuard>
  );
}