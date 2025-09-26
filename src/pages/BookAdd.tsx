import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BookOpen, 
  Search,
  ArrowLeft,
  Scan,
  FileEdit,
  Link
} from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

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

export default function BookAdd() {
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
  const [affiliateSettings, setAffiliateSettings] = useState<AffiliateSettings | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadBookFields();
    loadAffiliateSettings();
  }, []);

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
          icon: platform // You can map these to actual icons later
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

  const handleSaveBook = async () => {
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

      // Generate affiliate links automatically
      const affiliateLinks = generateAffiliateLinks({
        isbn: formData.isbn,
        title: formData.title
      });

      const bookToSave = {
        ...formData,
        user_id: user.id,
        status: 'draft',
        page_count: formData.page_count ? parseInt(formData.page_count) : null,
        genres: formData.genres,
        tags: [],
        purchase_links: affiliateLinks // Auto-generated affiliate links
      };

      const { data, error } = await supabase
        .from('books')
        .insert([bookToSave])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `Book added successfully! ${affiliateLinks.length} affiliate links generated automatically.`,
      });

      // Navigate back to books list or to edit the newly created book
      navigate(`/books/${data.id}`);
    } catch (error) {
      console.error('Error adding book:', error);
      toast({
        title: "Error",
        description: "Failed to add book",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/books')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Books
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add New Book</h1>
          <p className="text-muted-foreground">
            Search by ISBN or add book details manually
          </p>
        </div>
      </div>

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
                <CardDescription>
                  <div className="flex items-center gap-2 text-green-600">
                    <Link className="h-4 w-4" />
                    Affiliate links will be generated automatically when you save this book
                  </div>
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
                  <Button onClick={handleSaveBook}>
                    <Link className="h-4 w-4 mr-2" />
                    Add to Library & Generate Links
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
                Fill in the book details manually. Affiliate links will be generated automatically if ISBN is provided.
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
                    placeholder="Enter ISBN for automatic affiliate links"
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
                <div>
                  <Label htmlFor="cover_image_url">Cover Image URL</Label>
                  <Input
                    id="cover_image_url"
                    placeholder="Enter cover image URL"
                    value={formData.cover_image_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, cover_image_url: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-4 pt-4">
                <Button variant="outline" onClick={() => navigate('/books')}>
                  Cancel
                </Button>
                <Button onClick={handleSaveBook}>
                  <Link className="h-4 w-4 mr-2" />
                  Save Book & Generate Links
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}