import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  BookOpen, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Filter,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BookEditor } from "@/components/admin/BookManagement/BookEditor";
import { BookFilters } from "@/components/admin/BookManagement/BookFilters";

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
  purchase_links?: any;
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

export default function BookCatalog() {
  const { toast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    category: 'all',
    genre: 'all',
    language: 'all'
  });

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('Error fetching books:', error);
      toast({
        title: "Error",
        description: "Failed to fetch books",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async (book: Book) => {
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', book.id);

      if (error) throw error;

      setBooks(prev => prev.filter(b => b.id !== book.id));
      setDeletingBook(null);
      
      toast({
        title: "Book Deleted",
        description: `"${book.title}" has been deleted successfully.`,
      });
    } catch (error) {
      console.error('Error deleting book:', error);
      toast({
        title: "Error",
        description: "Failed to delete book",
        variant: "destructive",
      });
    }
  };

  const handleBookSaved = (savedBook: Book) => {
    if (editingBook) {
      setBooks(prev => prev.map(book => book.id === savedBook.id ? savedBook : book));
      toast({
        title: "Book Updated",
        description: `"${savedBook.title}" has been updated successfully.`,
      });
    } else {
      setBooks(prev => [savedBook, ...prev]);
      toast({
        title: "Book Created",
        description: `"${savedBook.title}" has been created successfully.`,
      });
    }
    
    setShowEditor(false);
    setEditingBook(null);
  };

  const applyFilters = (booksToFilter: Book[]) => {
    return booksToFilter.filter(book => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = (
          book.title.toLowerCase().includes(searchLower) ||
          book.subtitle?.toLowerCase().includes(searchLower) ||
          book.description?.toLowerCase().includes(searchLower) ||
          book.isbn?.toLowerCase().includes(searchLower) ||
          book.publisher?.toLowerCase().includes(searchLower)
        );
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && book.status !== filters.status) {
        return false;
      }

      // Category filter
      if (filters.category !== 'all' && book.category !== filters.category) {
        return false;
      }

      // Genre filter
      if (filters.genre !== 'all' && (!book.genres || !book.genres.includes(filters.genre))) {
        return false;
      }

      // Language filter
      if (filters.language !== 'all' && book.language !== filters.language) {
        return false;
      }

      return true;
    });
  };

  const filteredBooks = applyFilters(books);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            Book Catalog
          </h1>
          <p className="text-muted-foreground">
            Manage your book collection and catalog
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button onClick={() => setShowEditor(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Book
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Books</p>
                <p className="text-2xl font-bold">{books.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Published</p>
                <p className="text-2xl font-bold text-green-600">
                  {books.filter(b => b.status === 'published').length}
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Draft</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {books.filter(b => b.status === 'draft').length}
                </p>
              </div>
              <Edit className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-blue-600">
                  {books.filter(b => {
                    const bookDate = new Date(b.created_at);
                    const now = new Date();
                    return bookDate.getMonth() === now.getMonth() && 
                           bookDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <BookFilters
          filters={filters}
          onFiltersChange={setFilters}
          books={books}
          totalBooks={books.length}
          filteredBooks={filteredBooks.length}
        />
      )}

      {/* Books List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Books ({filteredBooks.length})</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search books..."
                  className="pl-10 w-64"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading books...</p>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {books.length === 0 ? 'No books found. Add your first book to get started.' : 'No books match your current filters.'}
              </p>
              {books.length === 0 && (
                <Button onClick={() => setShowEditor(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Book
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4 flex-1">
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
                          <div>
                            <h3 className="font-semibold text-lg">{book.title}</h3>
                            {book.subtitle && (
                              <p className="text-muted-foreground">{book.subtitle}</p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(book.status)}>
                              {book.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="mt-2 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                          {book.publisher && (
                            <div>Publisher: {book.publisher}</div>
                          )}
                          {book.publication_date && (
                            <div>Published: {new Date(book.publication_date).toLocaleDateString()}</div>
                          )}
                          {book.page_count && (
                            <div>Pages: {book.page_count}</div>
                          )}
                          {book.isbn && (
                            <div>ISBN: {book.isbn}</div>
                          )}
                        </div>
                        
                        {book.description && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {book.description}
                          </p>
                        )}
                        
                        {(book.genres && book.genres.length > 0) && (
                          <div className="mt-2 flex gap-1 flex-wrap">
                            {book.genres.slice(0, 3).map((genre, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {genre}
                              </Badge>
                            ))}
                            {book.genres.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{book.genres.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedBook(book)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingBook(book);
                          setShowEditor(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingBook(book)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Book Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBook ? `Edit "${editingBook.title}"` : 'Add New Book'}
            </DialogTitle>
          </DialogHeader>
          <BookEditor
            book={editingBook}
            onSave={handleBookSaved}
            onCancel={() => {
              setShowEditor(false);
              setEditingBook(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingBook} onOpenChange={() => setDeletingBook(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Book</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingBook?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingBook && handleDeleteBook(deletingBook)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Book
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Book Details Dialog */}
      <Dialog open={!!selectedBook} onOpenChange={() => setSelectedBook(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedBook?.title}</DialogTitle>
          </DialogHeader>
          {selectedBook && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-24 h-32 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                  {selectedBook.cover_image_url ? (
                    <img
                      src={selectedBook.cover_image_url}
                      alt={selectedBook.title}
                      className="w-full h-full object-cover rounded-md"
                    />
                  ) : (
                    <BookOpen className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-1">
                  {selectedBook.subtitle && (
                    <p className="text-lg text-muted-foreground mb-2">
                      {selectedBook.subtitle}
                    </p>
                  )}
                  
                  <div className="grid gap-2 text-sm">
                    {selectedBook.publisher && (
                      <div><strong>Publisher:</strong> {selectedBook.publisher}</div>
                    )}
                    {selectedBook.publication_date && (
                      <div><strong>Published:</strong> {new Date(selectedBook.publication_date).toLocaleDateString()}</div>
                    )}
                    {selectedBook.page_count && (
                      <div><strong>Pages:</strong> {selectedBook.page_count}</div>
                    )}
                    {selectedBook.isbn && (
                      <div><strong>ISBN:</strong> {selectedBook.isbn}</div>
                    )}
                    {selectedBook.language && (
                      <div><strong>Language:</strong> {selectedBook.language}</div>
                    )}
                  </div>
                </div>
              </div>
              
              {selectedBook.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedBook.description}
                  </p>
                </div>
              )}
              
              {selectedBook.genres && selectedBook.genres.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Genres</h4>
                  <div className="flex gap-1 flex-wrap">
                    {selectedBook.genres.map((genre, index) => (
                      <Badge key={index} variant="secondary">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}