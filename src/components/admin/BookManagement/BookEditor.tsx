import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, Search, Link, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Book {
  id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  isbn?: string;
  publisher?: string;
  publication_date?: string;
  page_count?: number;
  category?: string;
  genres?: string[];
  tags?: string[];
  language?: string;
  status: string;
  cover_image_url?: string;
  purchase_links?: any[];
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  slug?: string;
}

interface BookEditorProps {
  book: Book | null;
  onSave: () => void;
  onCancel: () => void;
}

const affiliateSettings = {
  amazon: { enabled: true, tag: 'yoursite-20' },
  kobo: { enabled: true, affiliate: 'yourid' },
  googleBooks: { enabled: true, partner: 'yourid' },
  barnesNoble: { enabled: true, affiliate: 'yourid' },
  bookshop: { enabled: true, shop: 'yourshop' }
};

export function BookEditor({ book, onSave, onCancel }: BookEditorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState("basic");
  
  const [formData, setFormData] = useState<Book>({
    title: "",
    subtitle: "",
    description: "",
    isbn: "",
    publisher: "",
    publication_date: "",
    page_count: 0,
    category: "",
    genres: [],
    tags: [],
    language: "en",
    status: "draft",
    cover_image_url: "",
    purchase_links: [],
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
    slug: ""
  });

  const [newGenre, setNewGenre] = useState("");
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (book) {
      setFormData({
        ...book,
        genres: book.genres || [],
        tags: book.tags || [],
        purchase_links: book.purchase_links || []
      });
    }
  }, [book]);

  const lookupISBN = async () => {
    if (!formData.isbn) {
      toast({
        title: "Error",
        description: "Please enter an ISBN first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Google Books API lookup
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${formData.isbn}`);
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const bookInfo = data.items[0].volumeInfo;
        
        setFormData(prev => ({
          ...prev,
          title: bookInfo.title || prev.title,
          subtitle: bookInfo.subtitle || prev.subtitle,
          description: bookInfo.description || prev.description,
          publisher: bookInfo.publisher || prev.publisher,
          publication_date: bookInfo.publishedDate || prev.publication_date,
          page_count: bookInfo.pageCount || prev.page_count,
          categories: bookInfo.categories?.[0] || prev.category,
          language: bookInfo.language || prev.language,
          cover_image_url: bookInfo.imageLinks?.large || bookInfo.imageLinks?.medium || bookInfo.imageLinks?.thumbnail || prev.cover_image_url,
          genres: bookInfo.categories || prev.genres
        }));

        // Auto-generate slug from title
        const slug = (bookInfo.title || formData.title)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        
        setFormData(prev => ({ ...prev, slug }));

        // Generate affiliate purchase links
        generatePurchaseLinks();

        toast({
          title: "Success",
          description: "Book information loaded from ISBN",
        });
      } else {
        toast({
          title: "Not Found",
          description: "No book information found for this ISBN",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('ISBN lookup error:', error);
      toast({
        title: "Error",
        description: "Failed to lookup ISBN information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePurchaseLinks = () => {
    const links = [];

    if (affiliateSettings.amazon.enabled && formData.isbn) {
      links.push({
        platform: 'Amazon',
        url: `https://amazon.com/dp/${formData.isbn}?tag=${affiliateSettings.amazon.tag}`,
        type: 'affiliate'
      });
    }

    if (affiliateSettings.kobo.enabled && formData.title) {
      const searchQuery = encodeURIComponent(`${formData.title} ${formData.isbn || ''}`);
      links.push({
        platform: 'Kobo',
        url: `https://www.kobo.com/search?query=${searchQuery}&affiliate=${affiliateSettings.kobo.affiliate}`,
        type: 'affiliate'
      });
    }

    if (affiliateSettings.googleBooks.enabled && formData.isbn) {
      links.push({
        platform: 'Google Books',
        url: `https://books.google.com/books?isbn=${formData.isbn}&partner=${affiliateSettings.googleBooks.partner}`,
        type: 'affiliate'
      });
    }

    if (affiliateSettings.barnesNoble.enabled && formData.isbn) {
      links.push({
        platform: 'Barnes & Noble',
        url: `https://www.barnesandnoble.com/s/${formData.isbn}?affiliate=${affiliateSettings.barnesNoble.affiliate}`,
        type: 'affiliate'
      });
    }

    if (affiliateSettings.bookshop.enabled && formData.title) {
      const searchQuery = encodeURIComponent(formData.title);
      links.push({
        platform: 'Bookshop.org',
        url: `https://bookshop.org/books?keywords=${searchQuery}&shop=${affiliateSettings.bookshop.shop}`,
        type: 'affiliate'
      });
    }

    setFormData(prev => ({ ...prev, purchase_links: links }));
  };

  const addGenre = () => {
    if (newGenre.trim() && !formData.genres?.includes(newGenre.trim())) {
      setFormData(prev => ({
        ...prev,
        genres: [...(prev.genres || []), newGenre.trim()]
      }));
      setNewGenre("");
    }
  };

  const removeGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres?.filter(g => g !== genre) || []
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || []
    }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Book title is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const bookData = {
        ...formData,
        user_id: 'current-user-id', // This should be the actual user ID
        slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        seo_title: formData.seo_title || formData.title,
        seo_description: formData.seo_description || formData.description?.substring(0, 160)
      };

      if (book?.id) {
        // Update existing book
        const { error } = await supabase
          .from('books')
          .update(bookData)
          .eq('id', book.id);

        if (error) throw error;
      } else {
        // Create new book
        const { error } = await supabase
          .from('books')
          .insert([bookData]);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Book ${book?.id ? 'updated' : 'created'} successfully`,
      });

      onSave();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: `Failed to ${book?.id ? 'update' : 'create'} book`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="basic">Basic Info</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="purchase">Purchase Links</TabsTrigger>
        <TabsTrigger value="seo">SEO</TabsTrigger>
      </TabsList>

      <div className="max-h-[60vh] overflow-y-auto mt-4">
        <TabsContent value="basic" className="space-y-4">
          <div className="grid gap-4">
            {/* ISBN Lookup */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">ISBN Lookup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter ISBN (10 or 13 digits)"
                    value={formData.isbn || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, isbn: e.target.value }))}
                  />
                  <Button onClick={lookupISBN} disabled={loading} variant="outline">
                    <Search className="h-4 w-4 mr-2" />
                    Lookup
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Book title"
                />
              </div>

              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="Book subtitle"
                />
              </div>

              <div>
                <Label htmlFor="publisher">Publisher</Label>
                <Input
                  id="publisher"
                  value={formData.publisher || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, publisher: e.target.value }))}
                  placeholder="Publisher name"
                />
              </div>

              <div>
                <Label htmlFor="publication_date">Publication Date</Label>
                <Input
                  id="publication_date"
                  type="date"
                  value={formData.publication_date || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, publication_date: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="page_count">Page Count</Label>
                <Input
                  id="page_count"
                  type="number"
                  value={formData.page_count || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, page_count: parseInt(e.target.value) || 0 }))}
                  placeholder="Number of pages"
                />
              </div>

              <div>
                <Label htmlFor="language">Language</Label>
                <Select value={formData.language} onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Book description"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="cover_image_url">Cover Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="cover_image_url"
                  value={formData.cover_image_url || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, cover_image_url: e.target.value }))}
                  placeholder="https://example.com/book-cover.jpg"
                />
                <Button variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Fiction, Non-Fiction, etc."
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Genres */}
            <div>
              <Label>Genres</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value)}
                    placeholder="Add genre..."
                    onKeyPress={(e) => e.key === 'Enter' && addGenre()}
                  />
                  <Button onClick={addGenre} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.genres && formData.genres.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {formData.genres.map((genre, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {genre}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-1"
                          onClick={() => removeGenre(genre)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button onClick={addTag} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {tag}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-1"
                          onClick={() => removeTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="purchase" className="space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Purchase Links</h3>
              <Button onClick={generatePurchaseLinks} variant="outline">
                <Link className="h-4 w-4 mr-2" />
                Generate Affiliate Links
              </Button>
            </div>

            {formData.purchase_links && formData.purchase_links.length > 0 ? (
              <div className="space-y-3">
                {formData.purchase_links.map((link, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{link.platform}</h4>
                          <p className="text-sm text-muted-foreground break-all">{link.url}</p>
                          <Badge variant="outline" className="mt-1">{link.type}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              purchase_links: prev.purchase_links?.filter((_, i) => i !== index)
                            }));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No purchase links generated yet. Click "Generate Affiliate Links" to create them automatically.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                value={formData.slug || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="book-title-url-slug"
              />
            </div>

            <div>
              <Label htmlFor="seo_title">SEO Title</Label>
              <Input
                id="seo_title"
                value={formData.seo_title || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                placeholder="SEO optimized title"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.seo_title?.length || 0}/60 characters
              </p>
            </div>

            <div>
              <Label htmlFor="seo_description">SEO Description</Label>
              <Textarea
                id="seo_description"
                value={formData.seo_description || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                placeholder="SEO meta description"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.seo_description?.length || 0}/160 characters
              </p>
            </div>

            <div>
              <Label htmlFor="seo_keywords">SEO Keywords</Label>
              <Input
                id="seo_keywords"
                value={formData.seo_keywords || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, seo_keywords: e.target.value }))}
                placeholder="keyword1, keyword2, keyword3"
              />
            </div>
          </div>
        </TabsContent>
      </div>

      <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : (book?.id ? "Update Book" : "Create Book")}
        </Button>
      </div>
    </Tabs>
  );
}