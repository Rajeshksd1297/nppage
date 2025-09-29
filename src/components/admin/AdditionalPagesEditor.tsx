import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Edit, Eye, EyeOff, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface AdditionalPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  is_published: boolean;
  show_in_footer: boolean;
  created_at: string;
  updated_at: string;
}

interface AdditionalPagesEditorProps {
  onSave?: (pages: AdditionalPage[]) => void;
}

const AdditionalPagesEditor = ({ onSave }: AdditionalPagesEditorProps) => {
  const [pages, setPages] = useState<AdditionalPage[]>([]);
  const [editingPage, setEditingPage] = useState<AdditionalPage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPages();
    setupRealtimeListener();
  }, []);

  const setupRealtimeListener = () => {
    const channel = supabase
      .channel('additional-pages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'additional_pages'
        },
        () => {
          fetchPages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchPages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('additional_pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pages:', error);
        toast({
          title: "Error",
          description: "Failed to load additional pages",
          variant: "destructive",
        });
        return;
      }

      setPages(data || []);
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast({
        title: "Error",
        description: "Failed to load additional pages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePage = async (pageData: Partial<AdditionalPage>) => {
    try {
      // Validate slug uniqueness only if we're creating a new page or changing the slug
      if (pageData.slug && (!editingPage?.id || pageData.slug !== editingPage.slug)) {
        const { data: existingPage } = await supabase
          .from('additional_pages')
          .select('id')
          .eq('slug', pageData.slug)
          .maybeSingle();

        if (existingPage && existingPage.id !== editingPage?.id) {
          toast({
            title: "Error",
            description: "A page with this URL slug already exists. Please use a different slug.",
            variant: "destructive",
          });
          return;
        }
      }

      if (editingPage?.id) {
        // Update existing page - preserve current published status if not explicitly changed
        const updateData = {
          title: pageData.title || '',
          slug: pageData.slug || '',
          content: pageData.content || '',
          meta_title: pageData.meta_title,
          meta_description: pageData.meta_description,
          is_published: pageData.is_published ?? editingPage.is_published, // Preserve existing status
          show_in_footer: pageData.show_in_footer ?? true
        };

        const { error } = await supabase
          .from('additional_pages')
          .update(updateData)
          .eq('id', editingPage.id);

        if (error) throw error;

        toast({ title: "Success", description: "Page updated successfully" });
      } else {
        // Create new page
        const insertData = {
          title: pageData.title || '',
          slug: pageData.slug || '',
          content: pageData.content || '',
          meta_title: pageData.meta_title,
          meta_description: pageData.meta_description,
          is_published: pageData.is_published || false,
          show_in_footer: pageData.show_in_footer ?? true
        };

        const { error } = await supabase
          .from('additional_pages')
          .insert([insertData]);

        if (error) throw error;

        toast({ title: "Success", description: "Page created successfully" });
      }
      
      // Refresh the pages list
      await fetchPages();
      
      setEditingPage(null);
      setIsCreating(false);
      onSave?.(pages);
    } catch (error) {
      console.error('Error saving page:', error);
      
      // Handle specific database errors
      if (error.code === '23505') {
        toast({
          title: "Error",
          description: "A page with this URL slug already exists. Please use a different slug.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save page",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeletePage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;

    try {
      const { error } = await supabase
        .from('additional_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Refresh the pages list
      await fetchPages();
      
      toast({
        title: "Success",
        description: "Page deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting page:', error);
      toast({
        title: "Error",
        description: "Failed to delete page",
        variant: "destructive",
      });
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const createNewPage = () => {
    setEditingPage({
      id: '',
      title: '',
      slug: '',
      content: '',
      meta_title: '',
      meta_description: '',
      is_published: false,
      show_in_footer: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    setIsCreating(true);
  };

  const predefinedPages = [
    { title: 'Privacy Policy', content: 'Your privacy policy content goes here...' },
    { title: 'Terms of Service', content: 'Your terms of service content goes here...' },
    { title: 'About Us', content: 'Information about your company goes here...' },
    { title: 'Contact', content: 'Your contact information goes here...' },
    { title: 'Cookie Policy', content: 'Your cookie policy content goes here...' },
    { title: 'Refund Policy', content: 'Your refund policy content goes here...' }
  ];

  const createPredefinedPage = (template: { title: string; content: string }) => {
    setEditingPage({
      id: '',
      title: template.title,
      slug: generateSlug(template.title),
      content: template.content,
      meta_title: template.title,
      meta_description: `${template.title} page`,
      is_published: false,
      show_in_footer: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    setIsCreating(true);
  };

  if (loading) {
    return <div className="p-6">Loading additional pages...</div>;
  }

  if (editingPage || isCreating) {
    return (
      <PageEditor
        page={editingPage}
        onSave={handleSavePage}
        onCancel={() => {
          setEditingPage(null);
          setIsCreating(false);
        }}
        generateSlug={generateSlug}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Additional Pages</h3>
          <p className="text-sm text-muted-foreground">Create and manage additional pages like Privacy Policy, Terms, About Us, etc.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={createNewPage}>
            <Plus className="h-4 w-4 mr-2" />
            New Page
          </Button>
        </div>
      </div>

      {/* Quick Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start Templates</CardTitle>
          <CardDescription>Create common pages with pre-filled templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {predefinedPages.map((template) => (
              <Button
                key={template.title}
                variant="outline"
                onClick={() => createPredefinedPage(template)}
                className="text-left justify-start"
              >
                <FileText className="h-4 w-4 mr-2" />
                {template.title}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Existing Pages */}
      <div className="grid gap-4">
        {pages.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No additional pages created yet. Use the templates above or create a new page to get started.
            </CardContent>
          </Card>
        ) : (
          pages.map((page) => (
            <Card key={page.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium truncate">{page.title}</span>
                      <Badge variant={page.is_published ? 'default' : 'secondary'} className="text-xs">
                        {page.is_published ? 'Published' : 'Draft'}
                      </Badge>
                      {page.show_in_footer && (
                        <Badge variant="outline" className="text-xs">
                          In Footer
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                      <span>Slug: /{page.slug}</span>
                      <span>Updated: {new Date(page.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingPage(page)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePage(page.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
    </div>
  );
};

interface PageEditorProps {
  page: AdditionalPage | null;
  onSave: (pageData: Partial<AdditionalPage>) => void;
  onCancel: () => void;
  generateSlug: (title: string) => string;
}

const PageEditor = ({ page, onSave, onCancel, generateSlug }: PageEditorProps) => {
  const [formData, setFormData] = useState({
    title: page?.title || '',
    slug: page?.slug || '',
    content: page?.content || '',
    meta_title: page?.meta_title || '',
    meta_description: page?.meta_description || '',
    is_published: page?.is_published ?? false, // Use nullish coalescing to preserve false values
    show_in_footer: page?.show_in_footer ?? true
  });

  const handleTitleChange = (title: string) => {
    const newFormData = { ...formData, title };
    if (!page?.id) {
      // Auto-generate slug for new pages
      newFormData.slug = generateSlug(title);
      newFormData.meta_title = title;
    }
    setFormData(newFormData);
  };

  const handleSave = () => {
    if (!formData.title.trim() || !formData.slug.trim()) {
      alert('Please fill in the title and slug fields.');
      return;
    }
    onSave(formData);
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'blockquote'],
      ['clean']
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{page?.id ? 'Edit Page' : 'Create New Page'}</h3>
          <p className="text-sm text-muted-foreground">Create or edit additional pages with rich text content</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave}>Save Page</Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Page Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter page title"
              />
            </div>

            <div>
              <Label htmlFor="slug">URL Slug</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                  /
                </span>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="rounded-l-none"
                  placeholder="page-url-slug"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label>Published</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.show_in_footer}
                  onCheckedChange={(checked) => setFormData({ ...formData, show_in_footer: checked })}
                />
                <Label>Show in Footer</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>Page Content</CardTitle>
            <CardDescription>Use the rich text editor to create your page content</CardDescription>
          </CardHeader>
          <CardContent>
            <ReactQuill
              theme="snow"
              value={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
              modules={modules}
              style={{ height: '300px', marginBottom: '50px' }}
            />
          </CardContent>
        </Card>

        {/* SEO Settings */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
            <CardDescription>Optimize your page for search engines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="meta_title">Meta Title</Label>
              <Input
                id="meta_title"
                value={formData.meta_title}
                onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                placeholder="SEO title for search engines"
              />
            </div>

            <div>
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea
                id="meta_description"
                value={formData.meta_description}
                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                placeholder="Brief description for search engines (150-160 characters)"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdditionalPagesEditor;
