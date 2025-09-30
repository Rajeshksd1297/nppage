import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Book {
  id: string;
  title: string;
  cover_image_url?: string;
  status: string;
  publication_date?: string;
  slug?: string;
}

interface AuthorBooksListProps {
  authorId: string;
}

export function AuthorBooksList({ authorId }: AuthorBooksListProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooks();
  }, [authorId]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('books')
        .select('id, title, cover_image_url, status, publication_date, slug')
        .eq('user_id', authorId)
        .order('publication_date', { ascending: false });

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground">
        No books yet
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {books.map((book) => (
        <Card key={book.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <div className="aspect-[2/3] bg-muted relative group">
            {book.cover_image_url ? (
              <img
                src={book.cover_image_url}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            {book.slug && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button size="sm" variant="secondary" asChild>
                  <a href={`/books/${book.id}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View
                  </a>
                </Button>
              </div>
            )}
          </div>
          <CardContent className="p-2">
            <p className="text-xs font-medium line-clamp-2 mb-1">{book.title}</p>
            <div className="flex items-center justify-between gap-1">
              <Badge variant={book.status === 'published' ? 'default' : 'secondary'} className="text-[10px] px-1 py-0">
                {book.status}
              </Badge>
              {book.publication_date && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Calendar className="w-2.5 h-2.5" />
                  {new Date(book.publication_date).getFullYear()}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
