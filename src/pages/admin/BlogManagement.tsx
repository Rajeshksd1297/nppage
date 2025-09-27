import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Eye,
  Search,
  Filter,
  Calendar,
  User,
  FileText,
  Image,
  Tag,
  Globe,
  Settings,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  Save,
  RotateCcw
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

interface BlogPost {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image_url: string | null;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  category: string;
  approved_by: string | null;
  approved_at: string | null;
  word_count: number;
  reading_time: number;
  featured: boolean;
}

interface BlogSettings {
  id: string;
  max_title_length: number;
  max_content_length: number;
  max_excerpt_length: number;
  allowed_image_size_mb: number;
  allowed_image_types: string[];
  require_approval: boolean;
  allow_html: boolean;
  categories: string[];
  default_status: string;
  auto_generate_slug: boolean;
  created_at: string;
  updated_at: string;
}

export default function BlogManagement() {
  console.log('BlogManagement component loading...');
  const { toast } = useToast();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [settings, setSettings] = useState<BlogSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featured_image_url: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    tags: [] as string[],
    meta_title: '',
    meta_description: '',
    category: 'General',
    featured: false,
  });

  useEffect(() => {
    fetchPosts();
    fetchSettings();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('blog-posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blog_posts'
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts((data as any) || []);
    } catch (error: any) {
      console.error('Error fetching blog posts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch blog posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setSettings(data as BlogSettings);
    } catch (error: any) {
      console.error('Error fetching blog settings:', error);
    }
  };

  const validateForm = () => {
    if (!settings) return false;

    if (formData.title.length > settings.max_title_length) {
      toast({
        title: "Validation Error",
        description: `Title exceeds maximum length of ${settings.max_title_length} characters`,
        variant: "destructive",
      });
      return false;
    }

    if (formData.content.length > settings.max_content_length) {
      toast({
        title: "Validation Error",
        description: `Content exceeds maximum length of ${settings.max_content_length} characters`,
        variant: "destructive",
      });
      return false;
    }

    if (formData.excerpt && formData.excerpt.length > settings.max_excerpt_length) {
      toast({
        title: "Validation Error",
        description: `Excerpt exceeds maximum length of ${settings.max_excerpt_length} characters`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    if (!settings) return null;

    // Validate file size
    if (file.size > settings.allowed_image_size_mb * 1024 * 1024) {
      toast({
        title: "Upload Error",
        description: `Image size exceeds ${settings.allowed_image_size_mb}MB limit`,
        variant: "destructive",
      });
      return null;
    }

    // Validate file type
    if (!settings.allowed_image_types.includes(file.type)) {
      toast({
        title: "Upload Error",
        description: `Invalid file type. Allowed types: ${settings.allowed_image_types.join(', ')}`,
        variant: "destructive",
      });
      return null;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `blog-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      return null;
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const savePost = async () => {
    if (!validateForm()) return;

    try {
      let imageUrl = formData.featured_image_url;
      
      if (imageFile) {
        const uploadedUrl = await handleImageUpload(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const slug = settings?.auto_generate_slug ? generateSlug(formData.title) : formData.slug;

      const postData = {
        ...formData,
        featured_image_url: imageUrl,
        slug,
        tags: formData.tags,
        published_at: formData.status === 'published' ? new Date().toISOString() : null,
      };

      if (editingPost) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', editingPost.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Blog post updated successfully",
        });
        setIsEditOpen(false);
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert([{
            ...postData,
            user_id: (await supabase.auth.getUser()).data.user?.id,
          }]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Blog post created successfully",
        });
        setIsCreateOpen(false);
      }

      resetForm();
      fetchPosts();
    } catch (error: any) {
      console.error('Error saving blog post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save blog post",
        variant: "destructive",
      });
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Blog post deleted successfully",
      });
      fetchPosts();
    } catch (error: any) {
      console.error('Error deleting blog post:', error);
      toast({
        title: "Error",
        description: "Failed to delete blog post",
        variant: "destructive",
      });
    }
  };

  const approvePost = async (id: string) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          status: 'published',
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString(),
          published_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Blog post approved and published",
      });
      fetchPosts();
    } catch (error: any) {
      console.error('Error approving blog post:', error);
      toast({
        title: "Error",
        description: "Failed to approve blog post",
        variant: "destructive",
      });
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      const { error } = await supabase
        .from('blog_settings')
        .update(settings)
        .eq('id', settings.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Blog settings updated successfully",
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      featured_image_url: '',
      status: 'draft',
      tags: [],
      meta_title: '',
      meta_description: '',
      category: 'General',
      featured: false,
    });
    setImageFile(null);
    setEditingPost(null);
  };

  const openEditDialog = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || '',
      featured_image_url: post.featured_image_url || '',
      status: post.status,
      tags: post.tags || [],
      meta_title: post.meta_title || '',
      meta_description: post.meta_description || '',
      category: post.category || 'General',
      featured: post.featured || false,
    });
    setIsEditOpen(true);
  };

  const openViewDialog = (post: BlogPost) => {
    setEditingPost(post);
    setIsViewOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      published: 'default',
      archived: 'outline'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || post.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = settings?.categories || ['General'];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Blog Management</h1>
          <p className="text-muted-foreground">Manage blog posts and settings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/blog-settings')}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category-filter">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Categories" />
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
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Blog Posts ({filteredPosts.length})
          </CardTitle>
          <CardDescription>
            Manage all blog posts from users across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading posts...</div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No blog posts found. Create your first post to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {post.featured && <Star className="h-4 w-4 text-yellow-500" />}
                          {post.title}
                        </div>
                        <div className="text-sm text-muted-foreground">/{post.slug}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Admin</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{post.category}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(post.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {post.word_count || 0} words
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {post.reading_time || 1} min read
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(post.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openViewDialog(post)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(post)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        {settings?.require_approval && post.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => approvePost(post.id)}
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePost(post.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
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

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setIsEditOpen(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditOpen ? 'Edit Blog Post' : 'Create Blog Post'}
            </DialogTitle>
            <DialogDescription>
              {settings && (
                <div className="text-sm text-muted-foreground">
                  Limits: Title {settings.max_title_length} chars, Content {settings.max_content_length} chars, Excerpt {settings.max_excerpt_length} chars
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="content" className="space-y-4">
            <TabsList>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="seo">SEO & Meta</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      title: e.target.value,
                      slug: settings?.auto_generate_slug ? generateSlug(e.target.value) : prev.slug
                    }))}
                    maxLength={settings?.max_title_length}
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {formData.title.length}/{settings?.max_title_length} characters
                  </div>
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    disabled={settings?.auto_generate_slug}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
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
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  maxLength={settings?.max_excerpt_length}
                  rows={3}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {formData.excerpt.length}/{settings?.max_excerpt_length} characters
                </div>
              </div>

              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  maxLength={settings?.max_content_length}
                  rows={12}
                  className="font-mono"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {formData.content.length}/{settings?.max_content_length} characters
                </div>
              </div>

              <div>
                <Label htmlFor="image">Featured Image</Label>
                <div className="space-y-2">
                  <Input
                    id="image"
                    type="file"
                    accept={settings?.allowed_image_types.join(',')}
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                  {formData.featured_image_url && (
                    <div className="text-sm text-muted-foreground">
                      Current: {formData.featured_image_url}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Max size: {settings?.allowed_image_size_mb}MB. Allowed: {settings?.allowed_image_types.join(', ')}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags.join(', ')}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  }))}
                  placeholder="technology, web development, tutorial"
                />
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              <div>
                <Label htmlFor="meta-title">SEO Title</Label>
                <Input
                  id="meta-title"
                  value={formData.meta_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                  maxLength={60}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {formData.meta_title.length}/60 characters (recommended for SEO)
                </div>
              </div>

              <div>
                <Label htmlFor="meta-description">SEO Description</Label>
                <Textarea
                  id="meta-description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                  maxLength={160}
                  rows={3}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {formData.meta_description.length}/160 characters (recommended for SEO)
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                />
                <Label htmlFor="featured">Featured Post</Label>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateOpen(false);
              setIsEditOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={savePost}>
              <Save className="h-4 w-4 mr-2" />
              {isEditOpen ? 'Update' : 'Create'} Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Blog Post</DialogTitle>
          </DialogHeader>
          {editingPost && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold">{editingPost.title}</h2>
                {editingPost.featured && <Star className="h-5 w-5 text-yellow-500" />}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Category: {editingPost.category}</span>
                <span>Status: {editingPost.status}</span>
                <span>Words: {editingPost.word_count}</span>
                <span>Reading time: {editingPost.reading_time} min</span>
              </div>
              {editingPost.excerpt && (
                <div className="italic text-muted-foreground">{editingPost.excerpt}</div>
              )}
              {editingPost.featured_image_url && (
                <img src={editingPost.featured_image_url} alt="Featured" className="max-w-full h-auto rounded" />
              )}
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: editingPost.content }} />
              </div>
              {editingPost.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {editingPost.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Close
            </Button>
            {editingPost && (
              <Button onClick={() => {
                setIsViewOpen(false);
                openEditDialog(editingPost);
              }}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Post
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}