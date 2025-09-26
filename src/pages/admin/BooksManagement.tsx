import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  BookOpen, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Link,
  Upload,
  Download,
  Filter,
  Settings,
  TrendingUp,
  Users,
  DollarSign,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BookEditor } from "@/components/admin/BookManagement/BookEditor";
import { BookFilters } from "@/components/admin/BookManagement/BookFilters";
import { AffiliateSettings } from "@/components/admin/BookManagement/AffiliateSettings";
import { ISBNLookup } from "@/components/admin/BookManagement/ISBNLookup";

interface Book {
  id: string;
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
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface FilterState {
  search: string;
  status: string;
  category: string;
  genre: string;
  language: string;
}

export default function BooksManagement() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteBookId, setDeleteBookId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState("books");
  const { toast } = useToast();

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
    category: "all",
    genre: "all",
    language: "all"
  });

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const processedBooks = (data || []).map(book => ({
        ...book,
        purchase_links: Array.isArray(book.purchase_links) ? book.purchase_links : []
      }));
      
      setBooks(processedBooks);
    } catch (error) {
      console.error('Error fetching books:', error);
      toast({
        title: "Error",
        description: "Failed to load books",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteBook = async (bookId: string) => {
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Book deleted successfully",
      });

      setDeleteBookId(null);
      fetchBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
      toast({
        title: "Error",
        description: "Failed to delete book",
        variant: "destructive",
      });
    }
  };

  const duplicateBook = async (book: Book) => {
    try {
      const { id, created_at, updated_at, ...bookData } = book;
      const duplicatedBook = {
        ...bookData,
        title: `${book.title} (Copy)`,
        slug: `${book.slug}-copy-${Date.now()}`,
        status: 'draft'
      };

      const { error } = await supabase
        .from('books')
        .insert([duplicatedBook]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Book duplicated successfully",
      });

      fetchBooks();
    } catch (error) {
      console.error('Error duplicating book:', error);
      toast({
        title: "Error",
        description: "Failed to duplicate book",
        variant: "destructive",
      });
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = filters.search === "" || 
      book.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      book.isbn?.toLowerCase().includes(filters.search.toLowerCase()) ||
      book.publisher?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = filters.status === "all" || book.status === filters.status;
    const matchesCategory = filters.category === "all" || book.category === filters.category;
    const matchesGenre = filters.genre === "all" || book.genres?.includes(filters.genre);
    const matchesLanguage = filters.language === "all" || book.language === filters.language;

    return matchesSearch && matchesStatus && matchesCategory && matchesGenre && matchesLanguage;
  });

  const stats = {
    total: books.length,
    published: books.filter(b => b.status === 'published').length,
    draft: books.filter(b => b.status === 'draft').length,
    withISBN: books.filter(b => b.isbn).length,
    avgPages: books.length > 0 ? Math.round(books.reduce((acc, book) => acc + (book.page_count || 0), 0) / books.length) : 0
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
        <div>
          <h1 className="text-3xl font-bold">Book Profile Management</h1>
          <p className="text-muted-foreground">Manage your book catalog with ISBN lookup and affiliate links</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Books
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Book
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Book</DialogTitle>
              </DialogHeader>
              <BookEditor
                book={null}
                onSave={() => {
                  setIsCreateDialogOpen(false);
                  fetchBooks();
                }}
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Books</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.published / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With ISBN</CardTitle>
            <Link className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withISBN}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Pages</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgPages}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <BookFilters
        filters={filters}
        onFiltersChange={setFilters}
        books={books}
        totalBooks={books.length}
        filteredBooks={filteredBooks.length}
      />

      {/* Main Content */}
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="books">All Books</TabsTrigger>
          <TabsTrigger value="isbn">ISBN Lookup</TabsTrigger>
          <TabsTrigger value="affiliates">Affiliate Settings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="books" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Book Catalog</span>
                <Badge variant="secondary">{filteredBooks.length} books</Badge>
              </CardTitle>
              <CardDescription>
                Manage your complete book catalog with editing and affiliate link tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredBooks.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No books found</h3>
                  <p className="text-muted-foreground">
                    {filters.search ? "Try adjusting your search terms" : "Add your first book to get started"}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredBooks.map((book) => (
                    <Card key={book.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-20 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                            {book.cover_image_url ? (
                              <img 
                                src={book.cover_image_url} 
                                alt={book.title}
                                className="w-full h-full object-cover rounded-md"
                              />
                            ) : (
                              <BookOpen className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold truncate">{book.title}</h4>
                                {book.subtitle && (
                                  <p className="text-sm text-muted-foreground truncate">{book.subtitle}</p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant={book.status === 'published' ? 'default' : 'secondary'}>
                                    {book.status}
                                  </Badge>
                                  {book.isbn && (
                                    <Badge variant="outline" className="text-xs">ISBN</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 mt-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedBook(book);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => duplicateBook(book)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteBookId(book.id)}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {book.description && (
                          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                            {book.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                          <span>{book.publisher || 'No publisher'}</span>
                          {book.page_count && <span>{book.page_count} pages</span>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="isbn" className="space-y-4">
          <ISBNLookup onBookFound={(bookData) => {
            // Handle adding book from ISBN lookup
            console.log('Book found:', bookData);
          }} />
        </TabsContent>

        <TabsContent value="affiliates" className="space-y-4">
          <AffiliateSettings />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Publication Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>This Month</span>
                    <span className="font-medium">
                      {books.filter(b => new Date(b.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>This Year</span>
                    <span className="font-medium">
                      {books.filter(b => new Date(b.created_at).getFullYear() === new Date().getFullYear()).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Published</span>
                    <span className="font-medium">{stats.published}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from(new Set(books.filter(b => b.category).map(b => b.category))).slice(0, 5).map((category, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{category}</span>
                      <span className="font-medium">
                        {books.filter(b => b.category === category).length}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Languages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from(new Set(books.filter(b => b.language).map(b => b.language))).slice(0, 5).map((language, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{language}</span>
                      <span className="font-medium">
                        {books.filter(b => b.language === language).length}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {selectedBook && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Book: {selectedBook.title}</DialogTitle>
            </DialogHeader>
            <BookEditor
              book={selectedBook}
              onSave={() => {
                setIsEditDialogOpen(false);
                setSelectedBook(null);
                fetchBooks();
              }}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedBook(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteBookId} onOpenChange={() => setDeleteBookId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the book
              and remove all associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteBookId && deleteBook(deleteBookId)}>
              Delete Book
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}