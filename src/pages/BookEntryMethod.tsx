import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Edit, BookOpen, Scan } from "lucide-react";

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
}

export default function BookEntryMethod() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isbn, setIsbn] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const generateAffiliateLinks = (bookInfo: BookData) => {
    // First check if affiliate settings exist, if not create default ones
    let savedAffiliateSettings = localStorage.getItem('affiliateSettings');
    
    if (!savedAffiliateSettings) {
      // Create default affiliate settings for demo
      const defaultSettings = {
        amazon: {
          enabled: true,
          displayName: 'Amazon',
          baseUrl: 'https://amazon.com/dp/{isbn}',
          parameters: { tag: 'demo-20' },
          description: 'Amazon affiliate link'
        },
        bookshop: {
          enabled: true,
          displayName: 'Bookshop',
          baseUrl: 'https://bookshop.org/books/{isbn}',
          parameters: { a: 'demo' },
          description: 'Bookshop affiliate link'
        },
        kobo: {
          enabled: true,
          displayName: 'Kobo',
          baseUrl: 'https://www.kobo.com/search',
          parameters: { query: '{isbn}' },
          description: 'Kobo store link'
        },
        googleBooks: {
          enabled: true,
          displayName: 'Google Books',
          baseUrl: 'https://books.google.com/books',
          parameters: { isbn: '{isbn}' },
          description: 'Google Books link'
        },
        barnesNoble: {
          enabled: true,
          displayName: 'Barnes & Noble',
          baseUrl: 'https://www.barnesandnoble.com/s/{isbn}',
          parameters: {},
          description: 'Barnes & Noble link'
        },
        applebooks: {
          enabled: true,
          displayName: 'Apple Books',
          baseUrl: 'https://books.apple.com/search',
          parameters: { term: '{title}' },
          description: 'Apple Books link'
        }
      };
      
      localStorage.setItem('affiliateSettings', JSON.stringify(defaultSettings));
      savedAffiliateSettings = JSON.stringify(defaultSettings);
    }

    if (!bookInfo.isbn) return [];

    try {
      const affiliateSettings = JSON.parse(savedAffiliateSettings);
      const purchaseLinks = [];
      
      if (affiliateSettings.amazon?.enabled && affiliateSettings.amazon?.parameters?.tag) {
        purchaseLinks.push({
          platform: 'Amazon',
          url: `https://amazon.com/dp/${bookInfo.isbn}?tag=${affiliateSettings.amazon.parameters.tag}`,
          affiliate_id: affiliateSettings.amazon.parameters.tag
        });
      }
      
      if (affiliateSettings.bookshop?.enabled && affiliateSettings.bookshop?.parameters?.a) {
        purchaseLinks.push({
          platform: 'Bookshop',
          url: `https://bookshop.org/books/${bookInfo.isbn}?a=${affiliateSettings.bookshop.parameters.a}`,
          affiliate_id: affiliateSettings.bookshop.parameters.a
        });
      }

      if (affiliateSettings.kobo?.enabled) {
        purchaseLinks.push({
          platform: 'Kobo',
          url: `https://www.kobo.com/search?query=${bookInfo.isbn}`,
          affiliate_id: affiliateSettings.kobo.parameters?.aid || ''
        });
      }

      if (affiliateSettings.googleBooks?.enabled) {
        purchaseLinks.push({
          platform: 'Google Books',
          url: `https://books.google.com/books?isbn=${bookInfo.isbn}`,
          affiliate_id: ''
        });
      }

      if (affiliateSettings.barnesNoble?.enabled) {
        purchaseLinks.push({
          platform: 'Barnes & Noble',
          url: `https://www.barnesandnoble.com/s/${bookInfo.isbn}`,
          affiliate_id: ''
        });
      }

      if (affiliateSettings.applebooks?.enabled) {
        purchaseLinks.push({
          platform: 'Apple Books',
          url: `https://books.apple.com/search?term=${encodeURIComponent(bookInfo.title || '')}`,
          affiliate_id: ''
        });
      }
      
      return purchaseLinks;
    } catch (error) {
      console.error('Error generating affiliate links:', error);
      return [];
    }
  };

  const handleISBNSearch = async () => {
    if (!isbn.trim()) {
      toast({
        title: "Error",
        description: "Please enter an ISBN",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);

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

        // Generate affiliate links
        const affiliateLinks = generateAffiliateLinks(retrievedData);

        // Store the data in localStorage to pass to the form
        const formData = {
          title: retrievedData.title,
          subtitle: retrievedData.subtitle || '',
          description: retrievedData.description || '',
          isbn: cleanIsbn,
          category: retrievedData.categories?.[0] || '',
          genres: retrievedData.categories || [],
          publisher: retrievedData.publisher || '',
          page_count: retrievedData.pageCount || undefined,
          language: retrievedData.language || 'en',
          cover_image_url: retrievedData.imageLinks?.thumbnail || retrievedData.imageLinks?.small || '',
          publication_date: retrievedData.publishedDate || '',
          purchase_links: affiliateLinks,
          status: 'draft'
        };

        localStorage.setItem('prefilledBookData', JSON.stringify(formData));
        
        toast({
          title: "Success",
          description: `Book information retrieved! ${affiliateLinks.length} purchase links generated.`,
        });

        // Navigate to the form with prefilled data
        navigate('/books/new/form?prefilled=true');
      } else {
        toast({
          title: "Not Found",
          description: "No book information found for this ISBN. You can still add it manually.",
          variant: "destructive",
        });
        
        // Navigate to manual form with just the ISBN
        localStorage.setItem('prefilledBookData', JSON.stringify({ isbn: cleanIsbn }));
        navigate('/books/new/form?isbn=' + cleanIsbn);
      }
    } catch (error) {
      console.error('ISBN lookup error:', error);
      toast({
        title: "Error",
        description: "Failed to lookup ISBN information. You can still add it manually.",
        variant: "destructive",
      });
      
      // Navigate to manual form with the ISBN
      localStorage.setItem('prefilledBookData', JSON.stringify({ isbn: isbn.trim() }));
      navigate('/books/new/form?isbn=' + isbn.trim());
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualEntry = () => {
    // Clear any prefilled data
    localStorage.removeItem('prefilledBookData');
    navigate('/books/new/form');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/books')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Books
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add New Book</h1>
          <p className="text-muted-foreground">
            Choose how you'd like to add your book information
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ISBN Search Option */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Scan className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Search by ISBN</CardTitle>
            <p className="text-muted-foreground">
              Enter an ISBN to automatically fill book details and generate purchase links
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="isbn">ISBN (10 or 13 digits)</Label>
              <Input
                id="isbn"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="Enter ISBN (e.g., 9780123456789)"
                onKeyPress={(e) => e.key === 'Enter' && handleISBNSearch()}
              />
            </div>
            
            <Button 
              onClick={handleISBNSearch} 
              disabled={isSearching || !isbn.trim()}
              className="w-full"
              size="lg"
            >
              <Search className="h-4 w-4 mr-2" />
              {isSearching ? 'Searching...' : 'Search & Auto-Fill'}
            </Button>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>✓ Auto-fills book information</p>
              <p>✓ Generates purchase links</p>
              <p>✓ Includes cover image and description</p>
            </div>
          </CardContent>
        </Card>

        {/* Manual Entry Option */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
              <Edit className="h-8 w-8 text-secondary" />
            </div>
            <CardTitle className="text-xl">Manual Entry</CardTitle>
            <p className="text-muted-foreground">
              Enter book information manually with step-by-step guidance
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>Step-by-step form with 4 sections</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-primary/20 rounded-full flex items-center justify-center text-xs">!</span>
                <span>ISBN is required for purchase links</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center text-xs">✓</span>
                <span>Auto-generates purchase links when ISBN is provided</span>
              </div>
            </div>
            
            <Button 
              onClick={handleManualEntry}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Edit className="h-4 w-4 mr-2" />
              Start Manual Entry
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">What is an ISBN?</h3>
              <p className="text-sm text-muted-foreground">
                International Standard Book Number - a unique identifier for books. 
                Usually found on the back cover or copyright page.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Purchase Links</h3>
              <p className="text-sm text-muted-foreground">
                Automatically generated purchase links for Amazon, Bookshop, and other platforms 
                based on your admin settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}