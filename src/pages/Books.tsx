import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  BookOpen, 
  PlusCircle, 
  Search,
  Edit,
  Eye,
  ExternalLink,
  Calendar,
  Trash2,
  ArrowUpDown,
  ChevronUp,
  ChevronDown
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

type SortField = 'title' | 'status' | 'created_at' | 'publication_date';
type SortDirection = 'asc' | 'desc';

export default function Books() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasFeature, getLimit, getCurrentPlanName, loading: subscriptionLoading } = useSubscription();

  useEffect(() => {
    fetchBooks();
  }, []);

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDeleteBook = async (bookId: string, bookTitle: string) => {
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `"${bookTitle}" has been deleted`,
      });

      // Refresh books list
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

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    // Handle date fields
    if (sortField === 'created_at' || sortField === 'publication_date') {
      const aDate = new Date(aValue || 0).getTime();
      const bDate = new Date(bValue || 0).getTime();
      return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
    }

    // Handle string fields
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

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
        <Button disabled={isAtLimit} onClick={() => navigate('/books/new')}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add New Book
        </Button>
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

      {/* Books Table */}
      {sortedBooks.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No books found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Try adjusting your search terms" : "Start building your library by adding your first book"}
              </p>
              {!searchTerm && (
                <Button onClick={() => navigate('/books/new')}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Your First Book
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('title')}
                    >
                      Title
                      {sortField === 'title' ? (
                        sortDirection === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('status')}
                    >
                      Status
                      {sortField === 'status' ? (
                        sortDirection === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Genres</TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('publication_date')}
                    >
                      Published
                      {sortField === 'publication_date' ? (
                        sortDirection === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('created_at')}
                    >
                      Created
                      {sortField === 'created_at' ? (
                        sortDirection === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedBooks.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell>
                      <div className="w-10 h-14 bg-muted rounded flex items-center justify-center">
                        {book.cover_image_url ? (
                          <img
                            src={book.cover_image_url}
                            alt={`Cover of ${book.title}`}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{book.title}</div>
                        {book.subtitle && (
                          <div className="text-sm text-muted-foreground line-clamp-1">{book.subtitle}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={book.status === 'published' ? 'default' : 'secondary'}>
                        {book.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
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
                    </TableCell>
                    <TableCell>
                      {book.publication_date 
                        ? new Date(book.publication_date).toLocaleDateString()
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {new Date(book.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/books/${book.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/books/${book.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Book</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{book.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteBook(book.id, book.title)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}