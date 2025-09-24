import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Save, 
  ArrowLeft,
  Plus,
  X,
  Search,
  ExternalLink,
  Globe
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Book {
  id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  isbn?: string;
  publication_date?: string;
  page_count?: number;
  language: string;
  publisher?: string;
  status: string;
  genres: string[];
  cover_image_url?: string;
  purchase_links: any; // JSON field from database
  slug?: string;
}

interface PurchaseLink {
  platform: string;
  url: string;
  price?: string;
}

const popularGenres = [
  "Fiction", "Non-Fiction", "Mystery", "Romance", "Science Fiction", "Fantasy",
  "Biography", "History", "Self-Help", "Business", "Poetry", "Children's",
  "Young Adult", "Horror", "Thriller", "Comedy", "Drama", "Adventure"
];

const purchasePlatforms = [
  "Amazon", "Apple Books", "Barnes & Noble", "Goodreads", "Google Books",
  "Kobo", "Audible", "Kindle", "Author Website", "Publisher", "Other"
];

export default function BookEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNewBook = id === 'new';

  const [book, setBook] = useState<Book>({
    title: "",
    subtitle: "",
    description: "",
    isbn: "",
    publication_date: "",
    page_count: undefined,
    language: "en",
    publisher: "",
    status: "draft",
    genres: [],
    cover_image_url: "",
    purchase_links: [],
    slug: ""
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newGenre, setNewGenre] = useState("");
  const [newLink, setNewLink] = useState<PurchaseLink>({ platform: "", url: "", price: "" });

  useEffect(() => {
    if (!isNewBook) {
      fetchBook();
    }
  }, [id, isNewBook]);

  const fetchBook = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setBook({
        ...data,
        purchase_links: Array.isArray(data.purchase_links) ? data.purchase_links : []
      });
    } catch (error) {
      console.error('Error fetching book:', error);
      toast({
        title: "Error",
        description: "Failed to load book",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const slug = book.slug || generateSlug(book.title);
      const bookData = {
        ...book,
        slug,
        user_id: user.id,
        purchase_links: JSON.stringify(book.purchase_links),
        updated_at: new Date().toISOString()
      };

      if (isNewBook) {
        const { data, error } = await supabase
          .from('books')
          .insert(bookData)
          .select()
          .single();

        if (error) throw error;
        navigate(`/books/${data.id}`);
        toast({
          title: "Success",
          description: "Book created successfully",
        });
      } else {
        const { error } = await supabase
          .from('books')
          .update(bookData)
          .eq('id', id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Book updated successfully",
        });
      }
    } catch (error) {
      console.error('Error saving book:', error);
      toast({
        title: "Error",
        description: "Failed to save book",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addGenre = (genre: string) => {
    if (genre && !book.genres.includes(genre)) {
      setBook(prev => ({
        ...prev,
        genres: [...prev.genres, genre]
      }));
      setNewGenre("");
    }
  };

  const removeGenre = (genre: string) => {
    setBook(prev => ({
      ...prev,
      genres: prev.genres.filter(g => g !== genre)
    }));
  };

  const addPurchaseLink = () => {
    if (newLink.platform && newLink.url) {
      setBook(prev => ({
        ...prev,
        purchase_links: [...prev.purchase_links, newLink]
      }));
      setNewLink({ platform: "", url: "", price: "" });
    }
  };

  const removePurchaseLink = (index: number) => {
    setBook(prev => ({
      ...prev,
      purchase_links: prev.purchase_links.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/books')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Books
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isNewBook ? 'Add New Book' : 'Edit Book'}
            </h1>
            <p className="text-muted-foreground">
              {isNewBook ? 'Create a new book entry' : 'Update book information'}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving || !book.title}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="links">Purchase Links</TabsTrigger>
          <TabsTrigger value="seo">SEO & Sharing</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Book Details</CardTitle>
                <CardDescription>Basic information about your book</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={book.title}
                    onChange={(e) => setBook(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter book title"
                  />
                </div>

                <div>
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={book.subtitle}
                    onChange={(e) => setBook(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="Enter book subtitle"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={book.description}
                    onChange={(e) => setBook(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter book description"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input
                      id="isbn"
                      value={book.isbn}
                      onChange={(e) => setBook(prev => ({ ...prev, isbn: e.target.value }))}
                      placeholder="978-0-000-00000-0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pages">Page Count</Label>
                    <Input
                      id="pages"
                      type="number"
                      value={book.page_count || ""}
                      onChange={(e) => setBook(prev => ({ ...prev, page_count: parseInt(e.target.value) || undefined }))}
                      placeholder="e.g. 250"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="publication_date">Publication Date</Label>
                    <Input
                      id="publication_date"
                      type="date"
                      value={book.publication_date}
                      onChange={(e) => setBook(prev => ({ ...prev, publication_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={book.status} onValueChange={(value) => setBook(prev => ({ ...prev, status: value }))}>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Publishing Info</CardTitle>
                <CardDescription>Publisher and categorization details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="publisher">Publisher</Label>
                  <Input
                    id="publisher"
                    value={book.publisher}
                    onChange={(e) => setBook(prev => ({ ...prev, publisher: e.target.value }))}
                    placeholder="Publisher name"
                  />
                </div>

                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select value={book.language} onValueChange={(value) => setBook(prev => ({ ...prev, language: value }))}>
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

                <div>
                  <Label htmlFor="cover">Cover Image URL</Label>
                  <Input
                    id="cover"
                    value={book.cover_image_url}
                    onChange={(e) => setBook(prev => ({ ...prev, cover_image_url: e.target.value }))}
                    placeholder="https://example.com/cover.jpg"
                  />
                </div>

                <div>
                  <Label>Genres</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {book.genres.map((genre) => (
                      <Badge key={genre} variant="secondary" className="flex items-center gap-1">
                        {genre}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeGenre(genre)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newGenre}
                      onChange={(e) => setNewGenre(e.target.value)}
                      placeholder="Add genre"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addGenre(newGenre);
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => addGenre(newGenre)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {popularGenres.map((genre) => (
                      <Badge
                        key={genre}
                        variant="outline"
                        className="cursor-pointer text-xs"
                        onClick={() => addGenre(genre)}
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="links" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Links</CardTitle>
              <CardDescription>Add links where readers can buy or access your book</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {book.purchase_links.map((link, index) => (
                <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Platform</Label>
                      <div className="font-medium">{link.platform}</div>
                    </div>
                    <div>
                      <Label className="text-xs">URL</Label>
                      <div className="text-sm text-muted-foreground truncate">{link.url}</div>
                    </div>
                    <div>
                      <Label className="text-xs">Price</Label>
                      <div className="text-sm">{link.price || 'N/A'}</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePurchaseLink(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <div className="border-t pt-4">
                <Label>Add New Link</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  <Select 
                    value={newLink.platform} 
                    onValueChange={(value) => setNewLink(prev => ({ ...prev, platform: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {purchasePlatforms.map((platform) => (
                        <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="URL"
                    value={newLink.url}
                    onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                  />
                  <Input
                    placeholder="Price (optional)"
                    value={newLink.price}
                    onChange={(e) => setNewLink(prev => ({ ...prev, price: e.target.value }))}
                  />
                  <Button onClick={addPurchaseLink}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO & Universal Link</CardTitle>
              <CardDescription>Optimize your book page for search engines and social sharing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={book.slug}
                  onChange={(e) => setBook(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder={generateSlug(book.title)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will be your book's unique URL: /books/{book.slug || generateSlug(book.title)}
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4" />
                  <span className="font-medium">Universal Link Preview</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Your book will be accessible at: 
                  <br />
                  <code className="bg-background px-2 py-1 rounded">
                    authorpage.app/{book.slug || generateSlug(book.title)}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}