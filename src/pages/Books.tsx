import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, 
  PlusCircle, 
  Search,
  Edit,
  Eye,
  ExternalLink,
  Calendar
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

export default function Books() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { subscription, getLimit, loading: subscriptionLoading } = useSubscription();

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
        <Button 
          onClick={() => navigate('/books/new')}
          disabled={isAtLimit}
        >
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
                <Button onClick={() => navigate('/books/new')}>
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