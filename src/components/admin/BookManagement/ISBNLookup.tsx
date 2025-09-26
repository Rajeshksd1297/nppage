import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Plus, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface ISBNLookupProps {
  onBookFound: (bookData: BookData) => void;
}

export function ISBNLookup({ onBookFound }: ISBNLookupProps) {
  const { toast } = useToast();
  const [isbn, setIsbn] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<BookData[]>([]);
  const [selectedBook, setSelectedBook] = useState<BookData | null>(null);

  const generateAffiliateLinks = (isbn: string, title: string) => {
    // Default affiliate settings - in real app, these would come from settings
    const affiliateSettings = {
      amazon: { tag: 'your-amazon-tag', enabled: true },
      kobo: { tag: 'your-kobo-tag', enabled: true },
      googleBooks: { enabled: true },
      barnesNoble: { enabled: true },
      bookshop: { tag: 'your-bookshop-tag', enabled: true }
    };

    const links = [];
    const cleanIsbn = isbn.replace(/[-\s]/g, '');
    const searchTitle = encodeURIComponent(title);

    // Amazon (highest priority)
    if (affiliateSettings.amazon.enabled) {
      links.push({
        platform: 'Amazon',
        url: `https://amazon.com/s?k=${cleanIsbn}&tag=${affiliateSettings.amazon.tag}`,
        icon: '🛒',
        priority: 1
      });
    }

    // Kobo
    if (affiliateSettings.kobo.enabled) {
      links.push({
        platform: 'Kobo',
        url: `https://www.kobo.com/search?query=${cleanIsbn}`,
        icon: '📚',
        priority: 2
      });
    }

    // Google Books
    if (affiliateSettings.googleBooks.enabled) {
      links.push({
        platform: 'Google Books',
        url: `https://books.google.com/books?isbn=${cleanIsbn}`,
        icon: '📖',
        priority: 3
      });
    }

    // Barnes & Noble
    if (affiliateSettings.barnesNoble.enabled) {
      links.push({
        platform: 'Barnes & Noble',
        url: `https://www.barnesandnoble.com/s/${cleanIsbn}`,
        icon: '🏪',
        priority: 4
      });
    }

    // Bookshop.org
    if (affiliateSettings.bookshop.enabled) {
      links.push({
        platform: 'Bookshop.org',
        url: `https://bookshop.org/search?keywords=${cleanIsbn}`,
        icon: '📗',
        priority: 5
      });
    }

    return links.sort((a, b) => a.priority - b.priority);
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

    setLoading(true);
    setSearchResults([]);
    setSelectedBook(null);

    try {
      // Clean ISBN - remove hyphens and spaces
      const cleanIsbn = isbn.replace(/[-\s]/g, '');
      
      // Google Books API lookup
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`);
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const books = data.items.map((item: any) => {
          const bookData = {
            ...item.volumeInfo,
            isbn: cleanIsbn,
            industryIdentifiers: item.volumeInfo.industryIdentifiers || []
          };
          
          // Generate affiliate links for this book
          bookData.affiliateLinks = generateAffiliateLinks(cleanIsbn, item.volumeInfo.title || 'Unknown Title');
          
          return bookData;
        });
        
        setSearchResults(books);
        
        toast({
          title: "Success",
          description: `Found ${books.length} result(s) with affiliate links for ISBN: ${cleanIsbn}`,
        });
      } else {
        // Try alternative lookup with Open Library API
        const olResponse = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`);
        const olData = await olResponse.json();
        
        if (Object.keys(olData).length > 0) {
          const bookKey = Object.keys(olData)[0];
          const book = olData[bookKey];
          
          const openLibraryBook = {
            title: book.title || 'Unknown Title',
            subtitle: book.subtitle,
            authors: book.authors?.map((author: any) => author.name) || [],
            description: book.description || '',
            publisher: book.publishers?.[0]?.name || '',
            publishedDate: book.publish_date || '',
            pageCount: book.number_of_pages || 0,
            categories: book.subjects?.map((subject: any) => subject.name) || [],
            language: 'en',
            imageLinks: {
              thumbnail: book.cover?.small,
              medium: book.cover?.medium,
              large: book.cover?.large
            },
            isbn: cleanIsbn,
            industryIdentifiers: [{ type: 'ISBN', identifier: cleanIsbn }],
            affiliateLinks: generateAffiliateLinks(cleanIsbn, book.title || 'Unknown Title')
          };
          
          setSearchResults([openLibraryBook]);
          
          toast({
            title: "Success",
            description: "Found book data from Open Library",
          });
        } else {
          toast({
            title: "Not Found",
            description: "No book information found for this ISBN",
            variant: "destructive",
          });
        }
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

  const selectBook = (book: BookData) => {
    setSelectedBook(book);
  };

  const addBookToLibrary = () => {
    if (selectedBook) {
      onBookFound(selectedBook);
      toast({
        title: "Success",
        description: "Book added to your library",
      });
      
      // Reset form
      setIsbn("");
      setSearchResults([]);
      setSelectedBook(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">ISBN Book Lookup</h2>
        <p className="text-muted-foreground">
          Search for books by ISBN to automatically fill in book information
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Search by ISBN</CardTitle>
          <CardDescription>
            Enter a 10 or 13-digit ISBN to search multiple book databases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter ISBN (e.g., 9780316769174 or 0-316-76917-1)"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && lookupISBN()}
              />
            </div>
            <Button onClick={lookupISBN} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Found {searchResults.length} result(s). Click on a book to select it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {searchResults.map((book, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedBook === book ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => selectBook(book)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-16 h-20 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                        {book.imageLinks?.thumbnail || book.imageLinks?.medium ? (
                          <img
                            src={book.imageLinks.medium || book.imageLinks.thumbnail}
                            alt={book.title}
                            className="w-full h-full object-cover rounded-md"
                          />
                        ) : (
                          <BookOpen className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{book.title}</h4>
                        {book.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">{book.subtitle}</p>
                        )}
                        {book.authors && book.authors.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            by {book.authors.join(', ')}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2">
                          {book.publisher && (
                            <Badge variant="outline" className="text-xs">
                              {book.publisher}
                            </Badge>
                          )}
                          {book.publishedDate && (
                            <Badge variant="outline" className="text-xs">
                              {new Date(book.publishedDate).getFullYear()}
                            </Badge>
                          )}
                        </div>
                        
                        {book.pageCount && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {book.pageCount} pages
                          </p>
                        )}
                        
                        {/* Affiliate Links Preview */}
                        {book.affiliateLinks && book.affiliateLinks.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium mb-1">Available on:</p>
                            <div className="flex gap-1 flex-wrap">
                              {book.affiliateLinks.slice(0, 3).map((link, linkIndex) => (
                                <Badge key={linkIndex} variant="outline" className="text-xs px-1">
                                  {link.icon} {link.platform}
                                </Badge>
                              ))}
                              {book.affiliateLinks.length > 3 && (
                                <Badge variant="outline" className="text-xs px-1">
                                  +{book.affiliateLinks.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Book Details */}
      {selectedBook && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Selected Book Details</span>
              <Button onClick={addBookToLibrary}>
                <Plus className="h-4 w-4 mr-2" />
                Add to Library
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-1">
                <div className="w-full max-w-48 mx-auto">
                  {selectedBook.imageLinks?.large || selectedBook.imageLinks?.medium || selectedBook.imageLinks?.thumbnail ? (
                    <img
                      src={selectedBook.imageLinks.large || selectedBook.imageLinks.medium || selectedBook.imageLinks.thumbnail}
                      alt={selectedBook.title}
                      className="w-full h-auto rounded-lg shadow-md"
                    />
                  ) : (
                    <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="md:col-span-2 space-y-4">
                <div>
                  <h3 className="text-xl font-bold">{selectedBook.title}</h3>
                  {selectedBook.subtitle && (
                    <p className="text-lg text-muted-foreground">{selectedBook.subtitle}</p>
                  )}
                  {selectedBook.authors && selectedBook.authors.length > 0 && (
                    <p className="text-muted-foreground">by {selectedBook.authors.join(', ')}</p>
                  )}
                </div>
                
                <div className="grid gap-3 text-sm">
                  {selectedBook.publisher && (
                    <div className="flex justify-between">
                      <span className="font-medium">Publisher:</span>
                      <span>{selectedBook.publisher}</span>
                    </div>
                  )}
                  {selectedBook.publishedDate && (
                    <div className="flex justify-between">
                      <span className="font-medium">Published:</span>
                      <span>{selectedBook.publishedDate}</span>
                    </div>
                  )}
                  {selectedBook.pageCount && (
                    <div className="flex justify-between">
                      <span className="font-medium">Pages:</span>
                      <span>{selectedBook.pageCount}</span>
                    </div>
                  )}
                  {selectedBook.language && (
                    <div className="flex justify-between">
                      <span className="font-medium">Language:</span>
                      <span>{selectedBook.language.toUpperCase()}</span>
                    </div>
                  )}
                  {selectedBook.isbn && (
                    <div className="flex justify-between">
                      <span className="font-medium">ISBN:</span>
                      <span className="font-mono">{selectedBook.isbn}</span>
                    </div>
                  )}
                </div>
                
                {selectedBook.categories && selectedBook.categories.length > 0 && (
                  <div>
                    <p className="font-medium text-sm mb-2">Categories:</p>
                    <div className="flex gap-1 flex-wrap">
                      {selectedBook.categories.map((category, index) => (
                        <Badge key={index} variant="secondary">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedBook.description && (
                  <div>
                    <p className="font-medium text-sm mb-2">Description:</p>
                    <p className="text-sm text-muted-foreground line-clamp-4">
                      {selectedBook.description.replace(/<[^>]*>/g, '')}
                    </p>
                  </div>
                )}
                
                {/* Affiliate Links */}
                {selectedBook.affiliateLinks && selectedBook.affiliateLinks.length > 0 && (
                  <div>
                    <p className="font-medium text-sm mb-3">Purchase Links:</p>
                    <div className="grid gap-2">
                      {selectedBook.affiliateLinks.map((link, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="justify-start h-auto p-3"
                          onClick={() => window.open(link.url, '_blank')}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <span className="text-lg">{link.icon}</span>
                            <div className="text-left">
                              <div className="font-medium">Buy on {link.platform}</div>
                              <div className="text-xs text-muted-foreground">
                                {link.platform === 'Amazon' ? 'Fast delivery available' :
                                 link.platform === 'Kobo' ? 'Digital & physical books' :
                                 link.platform === 'Google Books' ? 'Read online or offline' :
                                 link.platform === 'Bookshop.org' ? 'Support local bookstores' :
                                 'Available now'}
                              </div>
                            </div>
                            <ExternalLink className="h-4 w-4 ml-auto" />
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use ISBN Lookup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>1. Enter ISBN:</strong> Type or paste a 10-digit or 13-digit ISBN. Hyphens and spaces will be automatically removed.
            </p>
            <p>
              <strong>2. Search Multiple Sources:</strong> We search Google Books API first, then fall back to Open Library for comprehensive coverage.
            </p>
            <p>
              <strong>3. Select Book:</strong> Click on a search result to view detailed information and confirm it's the correct book.
            </p>
            <p>
              <strong>4. Add to Library:</strong> Click "Add to Library" to create a new book entry with all the fetched information.
            </p>
            <p>
              <strong>Affiliate Links:</strong> Purchase links for Amazon, Kobo, Google Books, Barnes & Noble, and Bookshop.org are automatically generated with your affiliate codes. Amazon links are prioritized first, followed by other major retailers.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}