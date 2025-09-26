import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  ArrowLeft,
  Edit,
  ExternalLink,
  Calendar,
  Globe,
  User,
  Hash,
  FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Book {
  id: string;
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
  purchase_links: any;
  slug?: string;
  user_id: string;
}

export default function BookView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBook();
    }
  }, [id]);

  const fetchBook = async () => {
    if (!id) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        // Parse purchase_links if it's a string
        const parsedBook = {
          ...data,
          purchase_links: Array.isArray(data.purchase_links) 
            ? data.purchase_links 
            : (data.purchase_links && typeof data.purchase_links === 'string' 
                ? JSON.parse(data.purchase_links) 
                : data.purchase_links || [])
        };
        
        setBook(parsedBook);
        setCanEdit(user?.id === data.user_id);
      }
    } catch (error) {
      console.error('Error fetching book:', error);
      toast({
        title: "Error",
        description: "Failed to load book details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/books')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Books
          </Button>
        </div>
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Book not found</h3>
              <p className="text-muted-foreground">
                The book you're looking for doesn't exist or has been removed.
              </p>
            </div>
          </CardContent>
        </Card>
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
            <h1 className="text-3xl font-bold">{book.title}</h1>
            {book.subtitle && (
              <p className="text-xl text-muted-foreground mt-1">{book.subtitle}</p>
            )}
          </div>
        </div>
        {canEdit && (
          <Button onClick={() => navigate(`/books/${book.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Book
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Book Cover */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center mb-4">
                {book.cover_image_url ? (
                  <img
                    src={book.cover_image_url}
                    alt={`Cover of ${book.title}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <BookOpen className="h-16 w-16 text-muted-foreground" />
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={book.status === 'published' ? 'default' : 'secondary'}>
                    {book.status}
                  </Badge>
                </div>
                
                {book.isbn && (
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{book.isbn}</span>
                  </div>
                )}
                
                {book.publisher && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{book.publisher}</span>
                  </div>
                )}
                
                {book.publication_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {new Date(book.publication_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                
                {book.page_count && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{book.page_count} pages</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{book.language}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Book Details */}
        <div className="md:col-span-2 space-y-6">
          {book.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{book.description}</p>
              </CardContent>
            </Card>
          )}

          {book.genres.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Genres</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {book.genres.map((genre) => (
                    <Badge key={genre} variant="outline">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {book.purchase_links && book.purchase_links.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Purchase Links</CardTitle>
                <CardDescription>
                  Available for purchase at the following retailers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {book.purchase_links.map((link: any, index: number) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start"
                      onClick={() => window.open(link.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {link.platform}
                      {link.price && (
                        <span className="ml-auto text-sm text-muted-foreground">
                          {link.price}
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}