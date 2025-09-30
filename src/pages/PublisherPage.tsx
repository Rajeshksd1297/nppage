import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Globe, 
  Mail, 
  Users, 
  BookOpen,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';

interface PublisherData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  contact_email: string;
  social_links?: any;
  brand_colors?: any;
}

interface AuthorData {
  id: string;
  user_id: string;
  profiles: {
    full_name?: string;
    slug?: string;
    avatar_url?: string;
    bio?: string;
  };
  books?: Array<{
    id: string;
    title: string;
    cover_image_url?: string;
    description?: string;
    publication_date?: string;
    slug?: string;
  }>;
}

export default function PublisherPage() {
  const { slug } = useParams<{ slug: string }>();
  const [publisher, setPublisher] = useState<PublisherData | null>(null);
  const [authors, setAuthors] = useState<AuthorData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchPublisherData();
    }
  }, [slug]);

  const fetchPublisherData = async () => {
    try {
      setLoading(true);
      
      // Fetch publisher info
      const { data: publisherData, error: publisherError } = await supabase
        .from('publishers')
        .select('*')
        .eq('slug', `pub-${slug}`)
        .eq('status', 'active')
        .single();

      if (publisherError) throw publisherError;
      setPublisher(publisherData);

      // Fetch active authors and their books
      const { data: authorsData, error: authorsError } = await supabase
        .from('publisher_authors')
        .select(`
          *,
          profiles(full_name, slug, avatar_url, bio)
        `)
        .eq('publisher_id', publisherData.id)
        .eq('status', 'active');

      if (authorsError) throw authorsError;

      // Fetch books for each author
      const authorsWithBooks = await Promise.all(
        (authorsData || []).map(async (author) => {
          const { data: booksData } = await supabase
            .from('books')
            .select('id, title, cover_image_url, description, publication_date, slug')
            .eq('user_id', author.user_id)
            .eq('status', 'published')
            .order('publication_date', { ascending: false })
            .limit(6);

          return {
            ...author,
            books: booksData || []
          };
        })
      );

      setAuthors(authorsWithBooks);
    } catch (error) {
      console.error('Error fetching publisher data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!publisher) {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">Publisher Not Found</h1>
            <p className="text-muted-foreground">
              The publisher you're looking for doesn't exist or is not active.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${publisher.name} - Publisher`}
        description={publisher.description || `Discover books and authors from ${publisher.name}`}
        image={publisher.logo_url}
      />
      
      <div className="min-h-screen bg-background">
        {/* Publisher Header */}
        <div className="bg-gradient-to-b from-primary/10 to-background border-b">
          <div className="container mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Publisher Logo */}
              {publisher.logo_url && (
                <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
                  <AvatarImage src={publisher.logo_url} alt={publisher.name} />
                  <AvatarFallback className="text-4xl">
                    {publisher.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}

              {/* Publisher Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-4xl font-bold">{publisher.name}</h1>
                  <Badge variant="secondary" className="text-sm">
                    <Building2 className="w-3 h-3 mr-1" />
                    Publisher
                  </Badge>
                </div>
                
                {publisher.description && (
                  <p className="text-lg text-muted-foreground mb-4 max-w-3xl">
                    {publisher.description}
                  </p>
                )}

                {/* Contact Info */}
                <div className="flex flex-wrap gap-4 mb-4">
                  {publisher.website_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={publisher.website_url} target="_blank" rel="noopener noreferrer">
                        <Globe className="w-4 h-4 mr-2" />
                        Website
                        <ExternalLink className="w-3 h-3 ml-2" />
                      </a>
                    </Button>
                  )}
                  
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${publisher.contact_email}`}>
                      <Mail className="w-4 h-4 mr-2" />
                      Contact
                    </a>
                  </Button>
                </div>

                {/* Stats */}
                <div className="flex gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{authors.length}</span>
                    <span className="text-muted-foreground">Authors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">
                      {authors.reduce((sum, author) => sum + (author.books?.length || 0), 0)}
                    </span>
                    <span className="text-muted-foreground">Books</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-12">
          <Tabs defaultValue="authors" className="space-y-8">
            <TabsList>
              <TabsTrigger value="authors">
                <Users className="w-4 h-4 mr-2" />
                Authors
              </TabsTrigger>
              <TabsTrigger value="books">
                <BookOpen className="w-4 h-4 mr-2" />
                All Books
              </TabsTrigger>
            </TabsList>

            {/* Authors Tab */}
            <TabsContent value="authors" className="space-y-6">
              {authors.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No authors found</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {authors.map((author) => (
                    <Card key={author.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start gap-4">
                          <Avatar className="w-16 h-16">
                            <AvatarImage src={author.profiles?.avatar_url} />
                            <AvatarFallback>
                              {author.profiles?.full_name?.substring(0, 2).toUpperCase() || 'A'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-1">
                              {author.profiles?.full_name || 'Unknown Author'}
                            </CardTitle>
                            {author.profiles?.bio && (
                              <CardDescription className="line-clamp-2">
                                {author.profiles.bio}
                              </CardDescription>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">
                                {author.books?.length || 0} {author.books?.length === 1 ? 'Book' : 'Books'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {author.books && author.books.length > 0 && (
                        <CardContent>
                          <div className="grid grid-cols-3 gap-2">
                            {author.books.slice(0, 3).map((book) => (
                              <div key={book.id} className="aspect-[2/3] bg-muted rounded overflow-hidden">
                                {book.cover_image_url ? (
                                  <img
                                    src={book.cover_image_url}
                                    alt={book.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center p-2">
                                    <BookOpen className="w-8 h-8 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          {author.profiles?.slug && (
                            <Button variant="outline" className="w-full mt-4" asChild>
                              <a href={`/${author.profiles.slug}`}>
                                View Profile
                              </a>
                            </Button>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* All Books Tab */}
            <TabsContent value="books" className="space-y-6">
              {authors.flatMap(a => a.books || []).length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No books published yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {authors.flatMap(author => 
                    (author.books || []).map(book => ({
                      ...book,
                      authorName: author.profiles?.full_name
                    }))
                  ).map((book) => (
                    <Card key={book.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                      <div className="aspect-[2/3] bg-muted">
                        {book.cover_image_url ? (
                          <img
                            src={book.cover_image_url}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold line-clamp-2 mb-1">{book.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          by {book.authorName || 'Unknown'}
                        </p>
                        {book.publication_date && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(book.publication_date).getFullYear()}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
