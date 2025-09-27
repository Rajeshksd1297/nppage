import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/components/ThemeProvider';
import { SEOHead } from '@/components/SEOHead';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Globe, 
  Twitter, 
  Instagram, 
  Facebook, 
  Linkedin, 
  Youtube,
  Mail,
  BookOpen,
  ExternalLink,
  MapPin,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

interface Profile {
  id: string;
  full_name: string;
  bio: string;
  avatar_url?: string;
  website_url?: string;
  slug: string;
  specializations: string[];
  social_links: Record<string, string>;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
}

interface Book {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  cover_image_url?: string;
  publication_date?: string;
  category?: string;
  genres: string[];
  publisher?: string;
  page_count?: number;
  isbn?: string;
  purchase_links: any[];
  slug?: string;
}

export default function AuthorProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { loadThemeByUser, currentTheme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError('Profile not found');
      setLoading(false);
      return;
    }
    
    loadProfile();
  }, [slug]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      console.log('Loading profile for slug:', slug);
      
      // Get profile by slug
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('slug', slug)
        .maybeSingle(); // Use maybeSingle instead of single to avoid error on no match

      console.log('Profile query result:', { profileData, profileError });

      if (profileError) {
        console.error('Profile error:', profileError);
        setError(`Error loading profile: ${profileError.message}`);
        return;
      }

      if (!profileData) {
        console.log('No profile found for slug:', slug);
        setError('Profile not found');
        return;
      }

      if (!profileData.public_profile) {
        console.log('Profile is not public:', slug);
        setError('Profile is not public');
        return;
      }

      setProfile({
        ...profileData,
        social_links: profileData.social_links as Record<string, string> || {}
      });

      // Load theme for this user
      await loadThemeByUser(profileData.id);

      // Get published books by this author
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', profileData.id)
        .eq('status', 'published')
        .order('publication_date', { ascending: false });

      if (booksError) throw booksError;
      setBooks((booksData || []).map(book => ({
        ...book,
        purchase_links: book.purchase_links as any[] || []
      })));

    } catch (error: any) {
      console.error('Error loading profile:', error);
      setError(error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter': return <Twitter className="w-5 h-5" />;
      case 'instagram': return <Instagram className="w-5 h-5" />;
      case 'facebook': return <Facebook className="w-5 h-5" />;
      case 'linkedin': return <Linkedin className="w-5 h-5" />;
      case 'youtube': return <Youtube className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
  };

  const formatPurchaseLink = (link: any) => {
    if (typeof link === 'string') return { label: 'Buy Book', url: link };
    return { label: link.label || 'Buy Book', url: link.url };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center py-12">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Profile Not Found</h3>
            <p className="text-muted-foreground">
              {error || 'The author profile you are looking for does not exist or is not public.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const seoTitle = profile.seo_title || `${profile.full_name} - Author Profile`;
  const seoDescription = profile.seo_description || profile.bio || `Discover books and works by ${profile.full_name}`;

  return (
    <>
      <SEOHead 
        title={seoTitle}
        description={seoDescription}
        keywords={profile.seo_keywords}
        url={`${window.location.origin}/${slug}`}
        image={profile.avatar_url}
        type="profile"
      />

      <div 
        className="min-h-screen"
        style={{
          background: currentTheme?.config.colors.gradient?.enabled 
            ? `linear-gradient(${currentTheme.config.colors.gradient.direction}, ${currentTheme.config.colors.gradient.from}, ${currentTheme.config.colors.gradient.to})`
            : currentTheme?.config.colors.background || '#ffffff',
          color: currentTheme?.config.colors.text || '#1f2937',
          fontFamily: currentTheme?.config.typography.bodyFont || 'Inter, system-ui, sans-serif'
        }}
      >
        {/* Header Section */}
        <div className="py-16 px-4">
          <div className={`mx-auto ${currentTheme?.config.layout.containerWidth || 'max-w-6xl'}`}>
            <div className="text-center mb-12">
              <Avatar className="w-32 h-32 mx-auto mb-6">
                <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                <AvatarFallback className="text-2xl">
                  {profile.full_name?.split(' ').map(n => n[0]).join('') || 'A'}
                </AvatarFallback>
              </Avatar>
              
              <h1 
                className={`font-bold mb-4 ${currentTheme?.config.typography.headingSize || 'text-4xl'}`}
                style={{ 
                  fontFamily: currentTheme?.config.typography.headingFont || 'Inter, system-ui, sans-serif',
                  color: currentTheme?.config.colors.text 
                }}
              >
                {profile.full_name}
              </h1>
              
              {profile.bio && (
                <p 
                  className={`max-w-2xl mx-auto mb-6 ${currentTheme?.config.typography.bodySize || 'text-lg'}`}
                  style={{ color: currentTheme?.config.colors.textSecondary }}
                >
                  {profile.bio}
                </p>
              )}

              {/* Specializations */}
              {profile.specializations && profile.specializations.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {profile.specializations.map((spec, index) => (
                    <Badge key={index} variant="secondary">
                      {spec}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Social Links */}
              <div className="flex justify-center gap-4 mb-8">
                {profile.website_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={profile.website_url} target="_blank" rel="noopener noreferrer">
                      <Globe className="w-4 h-4 mr-2" />
                      Website
                    </a>
                  </Button>
                )}
                
                {Object.entries(profile.social_links || {}).map(([platform, url]) => (
                  url && (
                    <Button key={platform} variant="outline" size="sm" asChild>
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        {getSocialIcon(platform)}
                        <span className="ml-2 capitalize">{platform}</span>
                      </a>
                    </Button>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Books Section */}
        {books.length > 0 && (
          <div className="py-16 px-4">
            <div className={`mx-auto ${currentTheme?.config.layout.containerWidth || 'max-w-6xl'}`}>
              <div className="text-center mb-12">
                <h2 
                  className={`font-bold mb-4 ${currentTheme?.config.typography.headingSize || 'text-3xl'}`}
                  style={{ 
                    fontFamily: currentTheme?.config.typography.headingFont,
                    color: currentTheme?.config.colors.text 
                  }}
                >
                  Published Books
                </h2>
                <Separator className="w-24 mx-auto" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {books.map((book) => (
                  <Card 
                    key={book.id} 
                    className={`overflow-hidden ${currentTheme?.config.layout.shadowStyle || 'shadow-lg'}`}
                    style={{ 
                      borderRadius: currentTheme?.config.layout.borderRadius || '0.5rem',
                      backgroundColor: currentTheme?.config.colors.background || '#ffffff'
                    }}
                  >
                    {book.cover_image_url && (
                      <div className="aspect-[3/4] overflow-hidden">
                        <img
                          src={book.cover_image_url}
                          alt={book.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    
                    <CardHeader>
                      <CardTitle className="line-clamp-2" style={{ color: currentTheme?.config.colors.text }}>
                        {book.title}
                      </CardTitle>
                      {book.subtitle && (
                        <CardDescription className="line-clamp-1">
                          {book.subtitle}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {book.description && (
                        <p 
                          className="text-sm line-clamp-3"
                          style={{ color: currentTheme?.config.colors.textSecondary }}
                        >
                          {book.description}
                        </p>
                      )}

                      <div className="space-y-2 text-sm" style={{ color: currentTheme?.config.colors.textSecondary }}>
                        {book.publication_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(book.publication_date), 'MMM yyyy')}</span>
                          </div>
                        )}
                        
                        {book.page_count && (
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            <span>{book.page_count} pages</span>
                          </div>
                        )}

                        {book.publisher && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{book.publisher}</span>
                          </div>
                        )}
                      </div>

                      {/* Genres */}
                      {book.genres && book.genres.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {book.genres.slice(0, 3).map((genre, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {genre}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Purchase Links */}
                      {book.purchase_links && book.purchase_links.length > 0 && (
                        <div className="space-y-2">
                          {book.purchase_links.slice(0, 3).map((link, index) => {
                            const formattedLink = formatPurchaseLink(link);
                            return (
                              <Button 
                                key={index}
                                variant="outline" 
                                size="sm" 
                                className="w-full" 
                                asChild
                              >
                                <a href={formattedLink.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  {formattedLink.label}
                                </a>
                              </Button>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="py-8 px-4 border-t" style={{ borderColor: currentTheme?.config.colors.border }}>
          <div className={`mx-auto ${currentTheme?.config.layout.containerWidth || 'max-w-6xl'}`}>
            <div className="text-center">
              <p 
                className="text-sm"
                style={{ color: currentTheme?.config.colors.textSecondary }}
              >
                © {new Date().getFullYear()} {profile.full_name}. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}