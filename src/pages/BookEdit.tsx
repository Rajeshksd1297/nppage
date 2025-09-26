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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  BookOpen, 
  Save, 
  ArrowLeft,
  Plus,
  X,
  Search,
  ExternalLink,
  Globe,
  CalendarIcon,
  Scan,
  FileEdit
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

interface BookField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'multiselect' | 'url' | 'email' | 'json';
  required: boolean;
  visible: boolean;
  enabled: boolean;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string;
  options?: string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  category: 'basic' | 'publishing' | 'seo' | 'advanced';
  systemField: boolean;
  order: number;
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
}

interface AffiliateConfig {
  enabled: boolean;
  displayName: string;
  baseUrl: string;
  parameters: { [key: string]: string };
  description: string;
}

interface AffiliateSettings {
  amazon: AffiliateConfig;
  kobo: AffiliateConfig;
  googleBooks: AffiliateConfig;
  barnesNoble: AffiliateConfig;
  bookshop: AffiliateConfig;
  applebooks: AffiliateConfig;
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
  const [bookFields, setBookFields] = useState<BookField[]>([]);
  const [affiliateSettings, setAffiliateSettings] = useState<AffiliateSettings | null>(null);
  const [isbnSearching, setIsbnSearching] = useState(false);
  const [isbn, setIsbn] = useState("");
  const [bookData, setBookData] = useState<BookData | null>(null);
  const [publicationDate, setPublicationDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    loadBookFields();
    loadAffiliateSettings();
    if (!isNewBook) {
      fetchBook();
    }
  }, [id, isNewBook]);

  const loadBookFields = () => {
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

  const loadAffiliateSettings = () => {
    const savedSettings = localStorage.getItem('affiliateSettings');
    if (savedSettings) {
      try {
        setAffiliateSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading affiliate settings:', error);
      }
    }
  };

  const generateAffiliateLinks = (bookInfo: any) => {
    if (!affiliateSettings) return [];

    const links: any[] = [];
    
    Object.entries(affiliateSettings).forEach(([platform, config]) => {
      if (config.enabled) {
        let url = config.baseUrl;
        
        // Replace placeholders
        url = url.replace('{isbn}', bookInfo.isbn || '');
        url = url.replace('{title}', encodeURIComponent(bookInfo.title || ''));
        
        // Add parameters
        const params = new URLSearchParams();
        Object.entries(config.parameters).forEach(([key, value]) => {
          let paramValue = String(value)
            .replace('{isbn}', bookInfo.isbn || '')
            .replace('{title}', bookInfo.title || '');
          params.append(key, paramValue);
        });
        
        const finalUrl = params.toString() ? `${url}?${params.toString()}` : url;
        
        links.push({
          platform: config.displayName,
          url: finalUrl,
          price: '' // Can be filled manually later
        });
      }
    });

    return links;
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
      
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`);
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const bookInfo = data.items[0].volumeInfo;
        const retrievedData: BookData = {
          title: bookInfo.title || '',
          subtitle: bookInfo.subtitle || '',
          authors: bookInfo.authors || [],
          description: bookInfo.description || '',
          publisher: bookInfo.publisher || '',
          publishedDate: bookInfo.publishedDate || '',
          pageCount: bookInfo.pageCount || 0,
          categories: bookInfo.categories || [],
          language: bookInfo.language || 'en',
          imageLinks: bookInfo.imageLinks || {},
          isbn: cleanIsbn
        };
        
        setBookData(retrievedData);
        
        // Auto-fill form with retrieved data
        setBook(prev => ({
          ...prev,
          title: retrievedData.title,
          subtitle: retrievedData.subtitle || '',
          description: retrievedData.description || '',
          isbn: cleanIsbn,
          genres: retrievedData.categories || [],
          publisher: retrievedData.publisher || '',
          page_count: retrievedData.pageCount || undefined,
          language: retrievedData.language || 'en',
          cover_image_url: retrievedData.imageLinks?.thumbnail || retrievedData.imageLinks?.small || ''
        }));

        if (retrievedData.publishedDate) {
          setPublicationDate(new Date(retrievedData.publishedDate));
        }

        // Generate affiliate links automatically
        const affiliateLinks = generateAffiliateLinks({
          isbn: cleanIsbn,
          title: retrievedData.title
        });

        setBook(prev => ({
          ...prev,
          purchase_links: affiliateLinks
        }));
        
        toast({
          title: "Success",
          description: `Book information retrieved successfully! ${affiliateLinks.length} affiliate links generated.`,
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

      <Tabs defaultValue={isNewBook ? "isbn" : "basic"} className="w-full">
        <TabsList>
          {isNewBook && (
            <>
              <TabsTrigger value="isbn" className="flex items-center gap-2">
                <Scan className="h-4 w-4" />
                ISBN Search
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <FileEdit className="h-4 w-4" />
                Manual Entry
              </TabsTrigger>
            </>
          )}
          {!isNewBook && (
            <>
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="links">Purchase Links</TabsTrigger>
              <TabsTrigger value="seo">SEO & Sharing</TabsTrigger>
            </>
          )}
        </TabsList>

        {isNewBook && (
          <TabsContent value="isbn" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Search by ISBN</CardTitle>
                <CardDescription>
                  Enter a 10 or 13-digit ISBN to automatically retrieve book information and generate affiliate links
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
                  <CardDescription>
                    Review the information and save to continue editing
                  </CardDescription>
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
                    <Button onClick={handleSave} disabled={saving || !book.title}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save & Continue Editing'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        <TabsContent value={isNewBook ? "manual" : "basic"} className="space-y-6">
          <div className="grid gap-6">
            {/* Dynamic Fields based on Admin Settings */}
            {bookFields.length > 0 ? (
              <>
                {['basic', 'publishing'].map(category => {
                  const categoryFields = bookFields.filter(field => field.category === category);
                  if (categoryFields.length === 0) return null;

                  return (
                    <Card key={category}>
                      <CardHeader>
                        <CardTitle>
                          {category === 'basic' ? 'Book Details' : 'Publishing Information'}
                        </CardTitle>
                        <CardDescription>
                          {category === 'basic' 
                            ? 'Basic information about your book' 
                            : 'Publisher and categorization details'
                          }
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          {categoryFields.sort((a, b) => a.order - b.order).map((field) => (
                            <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                              <Label htmlFor={field.id}>
                                {field.label}
                                {field.required && ' *'}
                              </Label>
                              
                              {field.type === 'text' && (
                                <Input
                                  id={field.id}
                                  value={book[field.name as keyof Book] as string || ''}
                                  onChange={(e) => setBook(prev => ({ ...prev, [field.name]: e.target.value }))}
                                  placeholder={field.placeholder}
                                  required={field.required}
                                />
                              )}
                              
                              {field.type === 'textarea' && (
                                <Textarea
                                  id={field.id}
                                  value={book[field.name as keyof Book] as string || ''}
                                  onChange={(e) => setBook(prev => ({ ...prev, [field.name]: e.target.value }))}
                                  placeholder={field.placeholder}
                                  required={field.required}
                                  rows={4}
                                />
                              )}
                              
                              {field.type === 'number' && (
                                <Input
                                  id={field.id}
                                  type="number"
                                  value={book[field.name as keyof Book] as number || ''}
                                  onChange={(e) => setBook(prev => ({ ...prev, [field.name]: parseInt(e.target.value) || undefined }))}
                                  placeholder={field.placeholder}
                                  required={field.required}
                                />
                              )}
                              
                              {field.type === 'date' && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !publicationDate && "text-muted-foreground"
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {publicationDate ? format(publicationDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={publicationDate}
                                      onSelect={(date) => {
                                        setPublicationDate(date);
                                        setBook(prev => ({ ...prev, publication_date: date ? format(date, "yyyy-MM-dd") : '' }));
                                      }}
                                      initialFocus
                                      className={cn("p-3 pointer-events-auto")}
                                    />
                                  </PopoverContent>
                                </Popover>
                              )}
                              
                              {field.type === 'select' && field.options && (
                                <Select 
                                  value={book[field.name as keyof Book] as string || ''} 
                                  onValueChange={(value) => setBook(prev => ({ ...prev, [field.name]: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={field.placeholder} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {field.options.map((option) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                              
                              {field.helpText && (
                                <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </>
            ) : (
              /* Fallback form if no admin settings */
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
                </CardContent>
              </Card>
            )}

            {/* Genres Section */}
            <Card>
              <CardHeader>
                <CardTitle>Genres & Categories</CardTitle>
                <CardDescription>Categorize your book with relevant genres</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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