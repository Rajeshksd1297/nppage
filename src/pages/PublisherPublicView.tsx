import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, Mail, Globe, BookOpen, Users, ArrowLeft, TrendingUp, Calendar, Twitter, Facebook, Instagram, Linkedin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ContactFormWidget } from '@/components/ContactFormWidget';

export default function PublisherPublicView() {
  const { slug } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [publisher, setPublisher] = useState<any>(null);
  const [authors, setAuthors] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [recentBooks, setRecentBooks] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalBooks: 0, totalAuthors: 0, yearsActive: 0 });

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
          .limit(20);
        
        setBooks(booksData || []);
      }

      // Fetch recent books if enabled
      if (customFields.show_recent_books && fetchedAuthors.length > 0) {
        const { data: recentBooksData } = await supabase
          .from('books')
          .select('*, profiles!books_user_id_fkey(full_name)')
          .eq('status', 'published')
          .in('user_id', fetchedAuthors.map(a => a.id))
          .order('created_at', { ascending: false })
          .limit(5);
        
        setRecentBooks(recentBooksData || []);
      }

      // Calculate statistics if enabled
      if (customFields.show_statistics && fetchedAuthors.length > 0) {
        const { count: totalBooks } = await supabase
          .from('books')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'published')
          .in('user_id', fetchedAuthors.map(a => a.id));

        const { data: oldestBook } = await supabase
          .from('books')
          .select('publication_date')
          .eq('status', 'published')
          .in('user_id', fetchedAuthors.map(a => a.id))
          .order('publication_date', { ascending: true })
          .limit(1)
          .maybeSingle();

        const yearsActive = oldestBook?.publication_date
          ? new Date().getFullYear() - new Date(oldestBook.publication_date).getFullYear()
          : 0;

        setStats({
          totalBooks: totalBooks || 0,
          totalAuthors: fetchedAuthors.length,
          yearsActive: yearsActive || 0,
        });
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
      {/* Hero Banner */}
      {customFields.hero_image_url && (
        <div className="relative h-[400px] w-full overflow-hidden">
          <img
            src={customFields.hero_image_url}
            alt={pageTitle}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-background/20" />
          <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 py-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
              {pageTitle}
            </h1>
            {pageDescription && (
              <p className="text-lg text-white/90 mt-2 drop-shadow">{pageDescription}</p>
            )}
          </div>
        </div>
      )}

      {/* Header (shown if no hero banner) */}
      {!customFields.hero_image_url && (
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
      )}

      {/* Back button for hero banner layout */}
      {customFields.hero_image_url && (
        <div className="container mx-auto px-4 py-4">
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Link>
          </Button>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Statistics Section */}
        {customFields.show_statistics && stats.totalBooks > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalBooks}</p>
                    <p className="text-sm text-muted-foreground">Books Published</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalAuthors}</p>
                    <p className="text-sm text-muted-foreground">Authors</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.yearsActive}+</p>
                    <p className="text-sm text-muted-foreground">Years Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
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

            {/* Social Media Links */}
            {customFields.show_social_links && (
              <>
                {(customFields.social_twitter || customFields.social_facebook || 
                  customFields.social_instagram || customFields.social_linkedin) && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">Follow us:</p>
                      <div className="flex gap-3">
                        {customFields.social_twitter && (
                          <a
                            href={customFields.social_twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 border rounded-lg hover:bg-accent transition-colors"
                          >
                            <Twitter className="w-5 h-5" />
                          </a>
                        )}
                        {customFields.social_facebook && (
                          <a
                            href={customFields.social_facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 border rounded-lg hover:bg-accent transition-colors"
                          >
                            <Facebook className="w-5 h-5" />
                          </a>
                        )}
                        {customFields.social_instagram && (
                          <a
                            href={customFields.social_instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 border rounded-lg hover:bg-accent transition-colors"
                          >
                            <Instagram className="w-5 h-5" />
                          </a>
                        )}
                        {customFields.social_linkedin && (
                          <a
                            href={customFields.social_linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 border rounded-lg hover:bg-accent transition-colors"
                          >
                            <Linkedin className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Books Section */}
        {customFields.show_recent_books && recentBooks.length > 0 && (
          <>
            <Separator />
            <section>
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">Recently Added Books</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {recentBooks.map((book) => (
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
                    <CardContent className="p-3 space-y-1">
                      <h3 className="font-semibold text-sm line-clamp-2">{book.title}</h3>
                      {book.profiles?.full_name && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          by {book.profiles.full_name}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </>
        )}

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
