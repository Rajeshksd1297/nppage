import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BookOpen, 
  Search,
  Eye,
  Edit,
  Trash2,
  Calendar,
  User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  author_name?: string;
  author_email?: string;
}

export default function AdminBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

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

      const booksWithAuthors = (data || []).map(book => ({
        ...book,
        author_name: 'Unknown Author',
        author_email: ''
      }));

      setBooks(booksWithAuthors);
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

  const updateBookStatus = async (bookId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('books')
        .update({ status: newStatus })
        .eq('id', bookId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Book status updated to ${newStatus}`,
      });

      fetchBooks(); // Refresh the list
    } catch (error) {
      console.error('Error updating book status:', error);
      toast({
        title: "Error",
        description: "Failed to update book status",
        variant: "destructive",
      });
    }
  };

  const deleteBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      return;
    }

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

      fetchBooks(); // Refresh the list
    } catch (error) {
      console.error('Error deleting book:', error);
      toast({
        title: "Error",
        description: "Failed to delete book",
        variant: "destructive",
      });
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.subtitle?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || book.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
          <h1 className="text-3xl font-bold">Book Management</h1>
          <p className="text-muted-foreground">Review and manage all books on the platform</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search books or authors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Books</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{books.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {books.filter(b => b.status === 'published').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {books.filter(b => b.status === 'draft').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {books.filter(b => b.status === 'archived').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Books List */}
      <Card>
        <CardHeader>
          <CardTitle>All Books</CardTitle>
          <CardDescription>Review and manage book submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredBooks.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No books found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" ? "Try adjusting your search or filters" : "No books submitted yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBooks.map((book) => (
                <div key={book.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
                      {book.cover_image_url ? (
                        <img
                          src={book.cover_image_url}
                          alt={`Cover of ${book.title}`}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <BookOpen className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">{book.title}</h4>
                      {book.subtitle && (
                        <p className="text-sm text-muted-foreground">{book.subtitle}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{book.author_name}</span>
                        <Calendar className="h-3 w-3 text-muted-foreground ml-2" />
                        <span className="text-xs text-muted-foreground">
                          {new Date(book.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {book.genres.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {book.genres.slice(0, 3).map((genre) => (
                            <Badge key={genre} variant="outline" className="text-xs">
                              {genre}
                            </Badge>
                          ))}
                          {book.genres.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{book.genres.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={book.status === 'published' ? 'default' : 'secondary'}>
                      {book.status}
                    </Badge>
                    
                    <div className="flex gap-1">
                      {book.status !== 'published' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateBookStatus(book.id, 'published')}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Publish
                        </Button>
                      )}
                      
                      {book.status === 'published' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateBookStatus(book.id, 'archived')}
                        >
                          Archive
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteBook(book.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}