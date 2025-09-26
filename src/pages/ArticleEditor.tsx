import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, ArrowLeft, Eye, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SEOEditor } from '@/components/seo/SEOEditor';
import { generateStructuredData, injectStructuredData } from '@/utils/seo';

interface Article {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  featured_image_url?: string;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export default function ArticleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  
  const [article, setArticle] = useState<Article>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    status: 'draft',
    tags: [],
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    featured_image_url: '',
  });

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id]);

  useEffect(() => {
    // Auto-generate slug from title
    if (article.title && !id) {
      const slug = article.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setArticle(prev => ({ ...prev, slug }));
    }
  }, [article.title, id]);

  const fetchArticle = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setArticle(data as Article);
    } catch (error) {
      console.error('Error fetching article:', error);
      toast({
        title: 'Error',
        description: 'Failed to load article',
        variant: 'destructive',
      });
      navigate('/articles');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (publish = false) => {
    if (!article.title.trim()) {
      toast({
        title: 'Error',
        description: 'Article title is required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const articleData = {
        ...article,
        user_id: user.id,
        status: publish ? 'published' as const : article.status,
        published_at: publish ? new Date().toISOString() : (article.status === 'published' ? article.published_at : null),
      };

      if (id) {
        const { error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('articles')
          .insert(articleData);
        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: publish ? 'Article published successfully' : 'Article saved successfully',
      });

      navigate('/articles');
    } catch (error) {
      console.error('Error saving article:', error);
      toast({
        title: 'Error',
        description: 'Failed to save article',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSEOSave = (seoData: any) => {
    setArticle(prev => ({
      ...prev,
      seo_title: seoData.title,
      seo_description: seoData.description,
      seo_keywords: seoData.keywords,
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !article.tags.includes(tagInput.trim())) {
      setArticle(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setArticle(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handlePreview = () => {
    // Generate structured data for preview
    const schema = generateStructuredData('Book', {
      title: article.seo_title || article.title,
      description: article.seo_description || article.excerpt,
      author: 'Author Name', // Would be dynamic in real implementation
      datePublished: new Date().toISOString(),
      image: article.featured_image_url,
    });
    
    injectStructuredData(schema);
    
    // Open preview in new tab
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${article.seo_title || article.title}</title>
          <meta name="description" content="${article.seo_description || article.excerpt}">
          <meta name="keywords" content="${article.seo_keywords}">
          <style>
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
            h1 { color: #333; margin-bottom: 10px; }
            .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
            .tags { margin: 20px 0; }
            .tag { background: #e5e7eb; padding: 4px 8px; border-radius: 4px; margin-right: 8px; font-size: 12px; }
            .content { white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>${article.title}</h1>
          <div class="meta">Preview Mode • ${new Date().toLocaleDateString()}</div>
          ${article.excerpt ? `<p><strong>${article.excerpt}</strong></p>` : ''}
          <div class="content">${article.content}</div>
          ${article.tags.length > 0 ? `
            <div class="tags">
              ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
          ` : ''}
        </body>
        </html>
      `);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/articles')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Articles
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {id ? 'Edit Article' : 'New Article'}
            </h1>
            <p className="text-muted-foreground">
              Create SEO-optimized content for better search visibility
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving}>
            Publish
          </Button>
        </div>
      </div>

      <Tabs defaultValue="content" className="space-y-6">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="seo">SEO Settings</TabsTrigger>
          <TabsTrigger value="settings">Article Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Article Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={article.title}
                  onChange={(e) => setArticle(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter article title..."
                />
              </div>

              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={article.slug}
                  onChange={(e) => setArticle(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="article-url-slug"
                />
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={article.excerpt}
                  onChange={(e) => setArticle(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Brief summary of your article..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={article.content}
                  onChange={(e) => setArticle(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your article content here..."
                  rows={15}
                  className="font-mono"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <SEOEditor
            initialData={{
              title: article.seo_title,
              description: article.seo_description,
              keywords: article.seo_keywords,
            }}
            onSave={handleSEOSave}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Article Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={article.status} 
                  onValueChange={(value: 'draft' | 'published' | 'archived') => 
                    setArticle(prev => ({ ...prev, status: value }))
                  }
                >
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

              <div>
                <Label htmlFor="featured-image">Featured Image URL</Label>
                <Input
                  id="featured-image"
                  value={article.featured_image_url}
                  onChange={(e) => setArticle(prev => ({ ...prev, featured_image_url: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}