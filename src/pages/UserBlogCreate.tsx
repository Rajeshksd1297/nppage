import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, FileText, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FeatureAccessGuard } from '@/components/FeatureAccessGuard';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  auto_generate_slug: boolean;
  default_status: string;
}

interface BlogPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  excerpt: string | null;
  slug: string;
  status: 'draft' | 'published';
  featured_image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function UserBlogCreate() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [blogSettings, setBlogSettings] = useState<BlogSettings | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    slug: '',
    status: 'draft' as BlogPost['status'],
    featured_image_url: '',
    meta_title: '',
    meta_description: '',
    tags: [] as string[],
    tagInput: '',
    category: '',
  });

  useEffect(() => {
    fetchBlogSettings();
  }, []);

  const fetchBlogSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setBlogSettings({
          ...data,
          categories: Array.isArray(data.categories) ? data.categories as string[] : []
        });
        
        // Set default status from settings
        setFormData(prev => ({
          ...prev,
          status: (data.default_status as BlogPost['status']) || 'draft'
        }));
      }
    } catch (error: any) {
      console.error('Error fetching blog settings:', error);
      toast({
        title: "Warning",
        description: "Could not load blog settings. Using defaults.",
        variant: "destructive",
      });
    } finally {
      setSettingsLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.title.trim()) {
      errors.push("Title is required");
    } else if (blogSettings && formData.title.length > blogSettings.max_title_length) {
      errors.push(`Title must be less than ${blogSettings.max_title_length} characters`);
    }

    if (!formData.content.trim()) {
      errors.push("Content is required");
    } else if (blogSettings && formData.content.length > blogSettings.max_content_length) {
      errors.push(`Content must be less than ${blogSettings.max_content_length} characters`);
    }

    if (formData.excerpt && blogSettings && formData.excerpt.length > blogSettings.max_excerpt_length) {
      errors.push(`Excerpt must be less than ${blogSettings.max_excerpt_length} characters`);
    }

    return errors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join(", "),
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const slug = (blogSettings?.auto_generate_slug && !formData.slug) 
        ? generateSlug(formData.title)
        : formData.slug || generateSlug(formData.title);
        
      // Set status based on approval requirements
      const finalStatus = blogSettings?.require_approval && formData.status === 'published' 
        ? 'draft' 
        : formData.status;
        
      const postData = {
        ...formData,
        slug,
        status: finalStatus,
        published_at: finalStatus === 'published' ? new Date().toISOString() : null,
        user_id: user.id,
      };

      const { error } = await supabase
        .from('blog_posts')
        .insert([postData]);

      if (error) throw error;

      const successMessage = blogSettings?.require_approval && formData.status === 'published'
        ? "Blog post created and submitted for approval"
        : "Blog post created successfully";

      toast({
        title: "Success",
        description: successMessage,
      });
      
      navigate('/user-blog-management');
    } catch (error: any) {
      console.error('Error saving blog post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save blog post",
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

  const getCharacterCount = (text: string, max?: number) => {
    const color = max && text.length > max * 0.9 ? 'text-red-500' : 'text-muted-foreground';
    return (
      <span className={`text-xs ${color}`}>
        {text.length}{max ? `/${max}` : ''}
      </span>
    );
  };

  if (settingsLoading) {
    return (
      <FeatureAccessGuard feature="blog">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading blog settings...</p>
          </div>
        </div>
      </FeatureAccessGuard>
    );
  }

  return (
    <FeatureAccessGuard feature="blog">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/user-blog-management')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <FileText className="h-8 w-8" />
                Create Blog Post
              </h1>
              <p className="text-muted-foreground">Write and publish your blog content</p>
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Post'}
          </Button>
        </div>

        {/* Approval Notice */}
        {blogSettings?.require_approval && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Posts marked as "Published" will be submitted for admin approval before going live.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle>Blog Post Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="title">Title *</Label>
                    {getCharacterCount(formData.title, blogSettings?.max_title_length)}
                  </div>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter blog post title"
                    maxLength={blogSettings?.max_title_length}
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug {blogSettings?.auto_generate_slug && "(auto-generated)"}</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="auto-generated-slug"
                    disabled={blogSettings?.auto_generate_slug}
                  />
                </div>
              </div>

              {blogSettings?.categories && blogSettings.categories.length > 0 && (
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {blogSettings.categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  {getCharacterCount(formData.excerpt, blogSettings?.max_excerpt_length)}
                </div>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Brief description of the blog post"
                  rows={3}
                  maxLength={blogSettings?.max_excerpt_length}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="content">Content *</Label>
                  {getCharacterCount(formData.content, blogSettings?.max_content_length)}
                </div>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your blog post content here..."
                  rows={12}
                  maxLength={blogSettings?.max_content_length}
                />
                {!blogSettings?.allow_html && (
                  <p className="text-xs text-muted-foreground mt-1">
                    HTML tags are not allowed in content.
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: BlogPost['status']) => 
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="featured_image_url">Featured Image URL</Label>
                  <Input
                    id="featured_image_url"
                    value={formData.featured_image_url}
                    onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                  {blogSettings && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Max size: {blogSettings.allowed_image_size_mb}MB. 
                      Allowed types: {blogSettings.allowed_image_types.join(', ')}
                    </p>
                  )}
                </div>
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
            </div>
          </CardContent>
        </Card>

        {/* SEO Settings */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  placeholder="SEO meta title"
                />
              </div>
              <div>
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  placeholder="SEO meta description"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </FeatureAccessGuard>
  );
}