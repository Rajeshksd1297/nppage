import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, FileText, Eye, Save } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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

const AdditionalPagesManager = () => {
  const [pages, setPages] = useState<AdditionalPage[]>([]);
  const [editingPage, setEditingPage] = useState<AdditionalPage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const defaultPages = [
    { title: 'Privacy Policy', slug: 'privacy-policy', content: '<h1>Privacy Policy</h1><p>Your privacy policy content here...</p>' },
    { title: 'Terms of Service', slug: 'terms-of-service', content: '<h1>Terms of Service</h1><p>Your terms of service content here...</p>' },
    { title: 'About Us', slug: 'about-us', content: '<h1>About Us</h1><p>Tell your story here...</p>' },
    { title: 'Contact', slug: 'contact', content: '<h1>Contact Us</h1><p>Contact information and form here...</p>' }
  ];

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('additional_pages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast({
        title: "Error",
        description: "Failed to load pages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePage = async (pageData: Partial<AdditionalPage>) => {
    try {
      setSaving(true);
      
      if (editingPage?.id) {
        // Update existing page
        const { error } = await supabase
          .from('additional_pages')
          .update({
            ...pageData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPage.id);
        
        if (error) throw error;
      } else {
        // Create new page - ensure all required fields are provided
        const newPage = {
          title: pageData.title || '',
          slug: pageData.slug || '',
          content: pageData.content || '',
          meta_title: pageData.meta_title,
          meta_description: pageData.meta_description,
          is_published: pageData.is_published ?? true,
          show_in_footer: pageData.show_in_footer ?? true
        };
        
        const { error } = await supabase
          .from('additional_pages')
          .insert([newPage]);
        
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Page ${editingPage?.id ? 'updated' : 'created'} successfully`,
      });

      setIsDialogOpen(false);
      setEditingPage(null);
      fetchPages();
    } catch (error) {
      console.error('Error saving page:', error);
      toast({
        title: "Error",
        description: "Failed to save page",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deletePage = async (pageId: string) => {
    try {
      const { error } = await supabase
        .from('additional_pages')
        .delete()
        .eq('id', pageId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Page deleted successfully",
      });

      fetchPages();
    } catch (error) {
      console.error('Error deleting page:', error);
      toast({
        title: "Error",
        description: "Failed to delete page",
        variant: "destructive",
      });
    }
  };

  const createDefaultPages = async () => {
    try {
      setSaving(true);
      const pagesToCreate = defaultPages.map(page => ({
        title: page.title,
        slug: page.slug,
        content: page.content,
        meta_title: page.title,
        meta_description: `${page.title} page`,
        is_published: true,
        show_in_footer: true
      }));

      const { error } = await supabase
        .from('additional_pages')
        .insert(pagesToCreate);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Default pages created successfully",
      });

      fetchPages();
    } catch (error) {
      console.error('Error creating default pages:', error);
      toast({
        title: "Error",
        description: "Failed to create default pages",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const PageEditor = () => {
    const [formData, setFormData] = useState({
      title: editingPage?.title || '',
      slug: editingPage?.slug || '',
      content: editingPage?.content || '',
      meta_title: editingPage?.meta_title || '',
      meta_description: editingPage?.meta_description || '',
      is_published: editingPage?.is_published ?? true,
      show_in_footer: editingPage?.show_in_footer ?? true
    });

    const generateSlug = (title: string) => {
      return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    };

    const handleTitleChange = (title: string) => {
      setFormData(prev => ({
        ...prev,
        title,
        slug: generateSlug(title),
        meta_title: title
      }));
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Page Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter page title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="page-url-slug"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Page Content</Label>
          <ReactQuill
            value={formData.content}
            onChange={(content) => setFormData(prev => ({ ...prev, content }))}
            modules={{
              toolbar: [
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['blockquote', 'code-block'],
                ['link', 'image'],
                ['clean']
              ]
            }}
            style={{ height: '300px', marginBottom: '50px' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="meta_title">SEO Title</Label>
            <Input
              id="meta_title"
              value={formData.meta_title}
              onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
              placeholder="SEO optimized title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta_description">SEO Description</Label>
            <Textarea
              id="meta_description"
              value={formData.meta_description}
              onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
              placeholder="SEO meta description"
              rows={3}
            />
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="is_published"
              checked={formData.is_published}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
            />
            <Label htmlFor="is_published">Published</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="show_in_footer"
              checked={formData.show_in_footer}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_in_footer: checked }))}
            />
            <Label htmlFor="show_in_footer">Show in Footer</Label>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsDialogOpen(false);
              setEditingPage(null);
            }}
          >
            Cancel
          </Button>
          <Button onClick={() => savePage(formData)} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Page'}
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading pages...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Additional Pages</h2>
          <p className="text-muted-foreground">Manage your site's additional pages like privacy policy, terms, etc.</p>
        </div>
        <div className="flex space-x-2">
          {pages.length === 0 && (
            <Button onClick={createDefaultPages} disabled={saving}>
              <Plus className="w-4 h-4 mr-2" />
              Create Default Pages
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingPage(null)}>
                <Plus className="w-4 h-4 mr-2" />
                New Page
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPage ? 'Edit Page' : 'Create New Page'}
                </DialogTitle>
              </DialogHeader>
              <PageEditor />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {pages.map((page) => (
          <Card key={page.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{page.title}</CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                    <span>/{page.slug}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      page.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {page.is_published ? 'Published' : 'Draft'}
                    </span>
                    {page.show_in_footer && (
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        In Footer
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingPage(page);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deletePage(page.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div 
                className="text-sm text-muted-foreground line-clamp-2"
                dangerouslySetInnerHTML={{ 
                  __html: page.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...' 
                }}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {pages.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No additional pages yet</h3>
            <p className="text-muted-foreground mb-4">
              Create pages like Privacy Policy, Terms of Service, About Us, etc.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdditionalPagesManager;