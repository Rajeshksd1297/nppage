import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BookOpen, 
  PlusCircle, 
  Search,
  Edit,
  Eye,
  ExternalLink,
  Calendar,
  Scan,
  FileEdit
} from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeBanner } from '@/components/UpgradeBanner';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Book {
  id: string;
  title: string;
  subtitle?: string;
  slug?: string;
  status: string;
  cover_image_url?: string;
  isbn?: string;
  publication_date?: string;
  created_at: string;
  genres: string[];
  purchase_links: any;
}

interface BookData {
  title: string;
  subtitle?: string;
  authors?: string[];
  description?: string;
  publisher?: string;
  publishedDate?: string;
  pageCount?: number;
  categories?: string[];
  language?: string;
  imageLinks?: {
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
  };
  isbn?: string;
  industryIdentifiers?: Array<{
    type: string;
    identifier: string;
  }>;
  affiliateLinks?: Array<{
    platform: string;
    url: string;
    icon: string;
    priority: number;
  }>;
}

interface BookField {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  visible: boolean;
  enabled: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
}

export default function Books() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isbnSearching, setIsbnSearching] = useState(false);
  const [isbn, setIsbn] = useState("");
  const [bookData, setBookData] = useState<BookData | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    isbn: '',
    category: '',
    genres: [] as string[],
    publisher: '',
    page_count: '',
    language: 'en',
    cover_image_url: ''
  });
  const [bookFields, setBookFields] = useState<BookField[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { subscription, getLimit, loading: subscriptionLoading } = useSubscription();

  useEffect(() => {
    fetchBooks();
    loadBookFields();
  }, []);

  const loadBookFields = () => {
    // Load book field settings from localStorage
    const savedSettings = localStorage.getItem('bookFieldSettings');
    if (savedSettings) {
      try {
        const fields = JSON.parse(savedSettings);
        setBookFields(fields.filter((f: BookField) => f.enabled && f.visible));
      } catch (error) {
        console.error('Error loading field settings:', error);
      }
    }
  };

  const fetchBooks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const booksWithParsedLinks = (data || []).map(book => ({
        ...book,
        purchase_links: Array.isArray(book.purchase_links) ? book.purchase_links : 
          (book.purchase_links && typeof book.purchase_links === 'string' ? JSON.parse(book.purchase_links) : 
           book.purchase_links || [])
      }));
      setBooks(booksWithParsedLinks);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const lookupISBN = async () => {
    if (!isbn.trim()) {
      toast({
        title: "Error",
        description: "Please enter an ISBN",
        variant: "destructive",
      });
      return;
    }

    setIsbnSearching(true);
    setBookData(null);

    try {
      const cleanIsbn = isbn.replace(/[-\s]/g, '');
      
      // Google Books API lookup
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`);
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const book = data.items[0].volumeInfo;
        const bookInfo: BookData = {
          title: book.title || '',
          subtitle: book.subtitle || '',
          authors: book.authors || [],
          description: book.description || '',
          publisher: book.publisher || '',
          publishedDate: book.publishedDate || '',
          pageCount: book.pageCount || 0,
          categories: book.categories || [],
          language: book.language || 'en',
          imageLinks: book.imageLinks || {},
          isbn: cleanIsbn
        };
        
        setBookData(bookInfo);
        
        // Auto-fill form with retrieved data
        setFormData({
          title: bookInfo.title,
          subtitle: bookInfo.subtitle || '',
          description: bookInfo.description || '',
          isbn: cleanIsbn,
          category: bookInfo.categories?.[0] || '',
          genres: bookInfo.categories || [],
          publisher: bookInfo.publisher || '',
          page_count: bookInfo.pageCount?.toString() || '',
          language: bookInfo.language || 'en',
          cover_image_url: bookInfo.imageLinks?.thumbnail || bookInfo.imageLinks?.small || ''
        });
        
        toast({
          title: "Success",
          description: "Book information retrieved successfully",
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
      setIsbnSearching(false);
    }
  };

  const handleFormSubmit = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Book title is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const bookToSave = {
        ...formData,
        user_id: user.id,
        status: 'draft',
        page_count: formData.page_count ? parseInt(formData.page_count) : null,
        genres: formData.genres,
        tags: [],
        purchase_links: []
      };

      const { error } = await supabase
        .from('books')
        .insert([bookToSave]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Book added successfully",
      });

      // Reset form and close dialog
      setFormData({
        title: '',
        subtitle: '',
        description: '',
        isbn: '',
        category: '',
        genres: [],
        publisher: '',
        page_count: '',
        language: 'en',
        cover_image_url: ''
      });
      setBookData(null);
      setIsbn('');
      setDialogOpen(false);
      
      // Refresh books list
      fetchBooks();
    } catch (error) {
      console.error('Error adding book:', error);
      toast({
        title: "Error",
        description: "Failed to add book",
        variant: "destructive",
      });
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || subscriptionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const bookLimit = getLimit('books');
  const isAtLimit = books.length >= bookLimit && bookLimit !== Infinity;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Books</h1>
          <p className="text-muted-foreground">
            Manage your published works and manuscripts
            {bookLimit !== Infinity && (
              <span className="ml-2 text-sm">
                ({books.length}/{bookLimit} books used)
              </span>
            )}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={isAtLimit}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add New Book
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Book</DialogTitle>
              <DialogDescription>
                Search by ISBN or add book details manually
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="isbn" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="isbn" className="flex items-center gap-2">
                  <Scan className="h-4 w-4" />
                  ISBN Search
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <FileEdit className="h-4 w-4" />
                  Manual Entry
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="isbn" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Search by ISBN</CardTitle>
                    <CardDescription>
                      Enter a 10 or 13-digit ISBN to automatically retrieve book information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <Input
                        placeholder="Enter ISBN (e.g., 9780316769174)"
                        value={isbn}
                        onChange={(e) => setIsbn(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && lookupISBN()}
                      />
                      <Button onClick={lookupISBN} disabled={isbnSearching}>
                        <Search className="h-4 w-4 mr-2" />
                        {isbnSearching ? "Searching..." : "Search"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {bookData && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Retrieved Book Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          {bookData.imageLinks?.thumbnail ? (
                            <img
                              src={bookData.imageLinks.thumbnail}
                              alt={bookData.title}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                              <BookOpen className="h-16 w-16 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <h3 className="font-bold text-lg">{bookData.title}</h3>
                          {bookData.subtitle && <p className="text-muted-foreground">{bookData.subtitle}</p>}
                          {bookData.authors && (
                            <p><strong>Authors:</strong> {bookData.authors.join(', ')}</p>
                          )}
                          {bookData.publisher && (
                            <p><strong>Publisher:</strong> {bookData.publisher}</p>
                          )}
                          {bookData.publishedDate && (
                            <p><strong>Published:</strong> {bookData.publishedDate}</p>
                          )}
                          {bookData.pageCount && (
                            <p><strong>Pages:</strong> {bookData.pageCount}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end mt-4">
                        <Button onClick={handleFormSubmit}>
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add to Library
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="manual" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Manual Book Entry</CardTitle>
                    <CardDescription>
                      Fill in the book details manually
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          placeholder="Enter book title"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="subtitle">Subtitle</Label>
                        <Input
                          id="subtitle"
                          placeholder="Enter subtitle"
                          value={formData.subtitle}
                          onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Enter book description"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="isbn-manual">ISBN</Label>
                        <Input
                          id="isbn-manual"
                          placeholder="Enter ISBN"
                          value={formData.isbn}
                          onChange={(e) => setFormData(prev => ({ ...prev, isbn: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Fiction">Fiction</SelectItem>
                            <SelectItem value="Non-Fiction">Non-Fiction</SelectItem>
                            <SelectItem value="Biography">Biography</SelectItem>
                            <SelectItem value="Science Fiction">Science Fiction</SelectItem>
                            <SelectItem value="Fantasy">Fantasy</SelectItem>
                            <SelectItem value="Romance">Romance</SelectItem>
                            <SelectItem value="Mystery">Mystery</SelectItem>
                            <SelectItem value="Thriller">Thriller</SelectItem>
                            <SelectItem value="Self-Help">Self-Help</SelectItem>
                            <SelectItem value="Business">Business</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="publisher">Publisher</Label>
                        <Input
                          id="publisher"
                          placeholder="Enter publisher"
                          value={formData.publisher}
                          onChange={(e) => setFormData(prev => ({ ...prev, publisher: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="page_count">Page Count</Label>
                        <Input
                          id="page_count"
                          type="number"
                          placeholder="Enter page count"
                          value={formData.page_count}
                          onChange={(e) => setFormData(prev => ({ ...prev, page_count: e.target.value }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="cover_url">Cover Image URL</Label>
                        <Input
                          id="cover_url"
                          placeholder="Enter cover image URL"
                          value={formData.cover_image_url}
                          onChange={(e) => setFormData(prev => ({ ...prev, cover_image_url: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleFormSubmit}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Book
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {isAtLimit && (
        <div className="mb-6">
          <UpgradeBanner 
            message="You've reached your book limit"
            feature="unlimited books"
          />
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search books..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Books Grid */}
      {filteredBooks.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No books found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Try adjusting your search terms" : "Start building your library by adding your first book"}
              </p>
              {!searchTerm && (
                <Button onClick={() => setDialogOpen(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Your First Book
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredBooks.map((book) => (
            <Card key={book.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-[3/4] bg-muted relative">
                {book.cover_image_url ? (
                  <img
                    src={book.cover_image_url}
                    alt={`Cover of ${book.title}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant={book.status === 'published' ? 'default' : 'secondary'}>
                    {book.status}
                  </Badge>
                </div>
              </div>
              
              <CardHeader>
                <CardTitle className="line-clamp-2">{book.title}</CardTitle>
                {book.subtitle && (
                  <CardDescription className="line-clamp-2">{book.subtitle}</CardDescription>
                )}
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Calendar className="h-3 w-3" />
                  {book.publication_date 
                    ? new Date(book.publication_date).toLocaleDateString()
                    : new Date(book.created_at).toLocaleDateString()
                  }
                </div>
                
                {book.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {book.genres.slice(0, 2).map((genre) => (
                      <Badge key={genre} variant="outline" className="text-xs">
                        {genre}
                      </Badge>
                    ))}
                    {book.genres.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{book.genres.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/books/${book.id}`)}>
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  {book.status === 'published' && (
                    <Button variant="outline" size="sm" onClick={() => navigate(`/books/${book.slug || book.id}/preview`)}>
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  )}
                  {book.purchase_links.length > 0 && (
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}