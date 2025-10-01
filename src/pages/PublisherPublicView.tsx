import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, Mail, Globe, BookOpen, Users, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ContactFormWidget } from '@/components/ContactFormWidget';

export default function PublisherPublicView() {
  const { slug } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [publisher, setPublisher] = useState<any>(null);
  const [authors, setAuthors] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);

  useEffect(() => {
    if (slug) {
      fetchPublisherData();
    }
  }, [slug]);

  const fetchPublisherData = async () => {
    try {
      setLoading(true);

      // Fetch publisher
      const { data: publisherData, error: publisherError } = await supabase
        .from('publishers')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
        .maybeSingle();

      if (publisherError) throw publisherError;

      if (!publisherData) {
        toast({
          title: 'Publisher Not Found',
          description: 'This publisher does not exist or is not active',
          variant: 'destructive',
        });
        return;
      }

      const customFields = (publisherData.custom_fields || {}) as Record<string, any>;
      
      // Check if public page is enabled
      if (!customFields.public_page_enabled) {
        toast({
          title: 'Page Not Available',
          description: 'This publisher page is not publicly available',
          variant: 'destructive',
        });
        return;
      }

      setPublisher(publisherData);

      // Fetch authors if enabled
      let fetchedAuthors: any[] = [];
      if (customFields.show_authors) {
        const { data: authorsData } = await supabase
          .from('profiles')
          .select('id, full_name, email, bio, avatar_url')
          .eq('publisher_id', publisherData.id);
        
        fetchedAuthors = authorsData || [];
        setAuthors(fetchedAuthors);
      }

      // Fetch books if enabled
      if (customFields.show_books && fetchedAuthors.length > 0) {
        const { data: booksData } = await supabase
          .from('books')
          .select('*, profiles!books_user_id_fkey(full_name)')
          .eq('status', 'published')
          .in('user_id', fetchedAuthors.map(a => a.id))
          .order('publication_date', { ascending: false })
          .limit(10);
        
        setBooks(booksData || []);
      }
    } catch (error: any) {
      console.error('Error fetching publisher:', error);
      toast({
        title: 'Error',
        description: 'Failed to load publisher page',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading publisher page...</p>
        </div>
      </div>
    );
  }

  if (!publisher) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Building2 className="w-16 h-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Publisher Not Found</h1>
          <p className="text-muted-foreground">This publisher page does not exist or is not available</p>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Home
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const customFields = (publisher.custom_fields || {}) as Record<string, any>;
  const pageTitle = customFields.public_page_title || publisher.name;
  const pageDescription = customFields.public_page_description || '';
  const pageContent = customFields.public_page_content || '';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">{pageTitle}</h1>
                {pageDescription && (
                  <p className="text-muted-foreground mt-1">{pageDescription}</p>
                )}
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Publisher Info */}
        {pageContent && (
          <Card>
            <CardHeader>
              <CardTitle>About Us</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="whitespace-pre-wrap">{pageContent}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Publisher Details */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {publisher.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <a href={`mailto:${publisher.email}`} className="hover:underline">
                  {publisher.email}
                </a>
              </div>
            )}
            {publisher.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <a href={publisher.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {publisher.website}
                </a>
              </div>
            )}
            {publisher.phone && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">📞</span>
                <a href={`tel:${publisher.phone}`} className="hover:underline">
                  {publisher.phone}
                </a>
              </div>
            )}
            {publisher.address && (
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Address:</p>
                <p className="whitespace-pre-wrap">{publisher.address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Authors Section */}
        {customFields.show_authors && authors.length > 0 && (
          <>
            <Separator />
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">Our Authors</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {authors.map((author) => (
                  <Card key={author.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        {author.avatar_url && (
                          <img
                            src={author.avatar_url}
                            alt={author.full_name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold">{author.full_name || 'Author'}</h3>
                          {author.bio && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {author.bio.replace(/<[^>]*>/g, '')}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Books Section */}
        {customFields.show_books && books.length > 0 && (
          <>
            <Separator />
            <section>
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">Our Publications</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {books.map((book) => (
                  <Card key={book.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {book.cover_image_url && (
                      <div className="aspect-[2/3] overflow-hidden bg-muted">
                        <img
                          src={book.cover_image_url}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="p-4 space-y-2">
                      <h3 className="font-semibold line-clamp-2">{book.title}</h3>
                      {book.profiles?.full_name && (
                        <p className="text-sm text-muted-foreground">by {book.profiles.full_name}</p>
                      )}
                      {book.publication_date && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(book.publication_date).getFullYear()}
                        </p>
                      )}
                      {book.genres && book.genres.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {book.genres.slice(0, 2).map((genre: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {genre}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Contact Form Section */}
        {customFields.show_contact_form && (
          <>
            <Separator />
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Mail className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">Get in Touch</h2>
              </div>
              <Card>
                <CardContent className="pt-6">
                  <ContactFormWidget userId={publisher.owner_id} />
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {publisher.name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
