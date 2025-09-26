import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Edit, ExternalLink } from "lucide-react";
import { useForm } from "react-hook-form";
import { DynamicBookForm } from "@/components/forms/DynamicBookForm";

interface Book {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  isbn?: string;
  category?: string;
  genres?: string[];
  publisher?: string;
  publication_date?: string;
  page_count?: number;
  language?: string;
  cover_image_url?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  purchase_links?: Array<{
    platform: string;
    url: string;
    affiliate_id?: string;
  }>;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export default function BookView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const form = useForm();

  const fetchBook = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching book:', error);
        toast({
          title: "Error",
          description: "Failed to load book details.",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        // Parse purchase_links if it's a string and ensure proper typing
        const bookData: Book = {
          id: data.id,
          title: data.title || '',
          subtitle: data.subtitle || undefined,
          description: data.description || '',
          isbn: data.isbn || undefined,
          category: data.category || undefined,
          genres: data.genres || [],
          publisher: data.publisher || undefined,
          publication_date: data.publication_date || undefined,
          page_count: data.page_count || undefined,
          language: data.language || 'en',
          cover_image_url: data.cover_image_url || undefined,
          seo_title: data.seo_title || undefined,
          seo_description: data.seo_description || undefined,
          seo_keywords: data.seo_keywords || undefined,
          purchase_links: Array.isArray(data.purchase_links) 
            ? data.purchase_links 
            : (data.purchase_links && typeof data.purchase_links === 'string' 
                ? JSON.parse(data.purchase_links as string) 
                : data.purchase_links || []),
          status: (data.status as 'draft' | 'published') || 'draft',
          created_at: data.created_at,
          updated_at: data.updated_at
        };
        
        setBook(bookData);
        // Populate form with book data for read-only display
        form.reset(bookData);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchBook();
    }
  }, [id]);

  if (isLoading) {
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
          <Button variant="outline" onClick={() => navigate('/books')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Books
          </Button>
        </div>
        <div className="text-center py-16">
          <h3 className="text-lg font-medium mb-2">Book not found</h3>
          <p className="text-muted-foreground">
            The book you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/books')}>
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
        
        <Button onClick={() => navigate(`/books/${book.id}/edit`)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Book
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Book Cover and Status */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            {book.cover_image_url && (
              <div className="text-center">
                <img 
                  src={book.cover_image_url} 
                  alt={book.title}
                  className="w-full max-w-xs mx-auto rounded-lg shadow-md"
                />
              </div>
            )}
            
            <div className="text-center space-y-2">
              <Badge variant={book.status === 'published' ? 'default' : 'secondary'}>
                {book.status}
              </Badge>
              
              {book.purchase_links && book.purchase_links.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-sm text-muted-foreground">Purchase Links</h3>
                  {book.purchase_links.map((link, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="w-full justify-between"
                      asChild
                    >
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        {link.platform}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Form Fields */}
        <div className="lg:col-span-2">
          <DynamicBookForm form={form} mode="view" />
        </div>
      </div>
    </div>
  );
}