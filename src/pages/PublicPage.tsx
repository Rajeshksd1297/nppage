import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SEOHead } from '@/components/SEOHead';
import { DynamicHeader } from '@/components/layout/DynamicHeader';
import { DynamicFooter } from '@/components/layout/DynamicFooter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User } from 'lucide-react';

interface PageData {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
  is_published: boolean;
}

const PublicPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (slug) {
      loadPage();
    }
  }, [slug]);

  const loadPage = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('additional_pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();

      if (error) {
        console.error('Error loading page:', error);
        toast({
          title: "Error",
          description: "Failed to load page content.",
          variant: "destructive"
        });
        return;
      }

      if (!data) {
        toast({
          title: "Page not found",
          description: "The requested page could not be found or is not published.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      setPage(data);
    } catch (error) {
      console.error('Error loading page:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DynamicHeader />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded-lg w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="space-y-3 mt-8">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
        <DynamicFooter />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-background">
        <DynamicHeader />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Page Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The page you're looking for doesn't exist or is not published.
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>
        </div>
        <DynamicFooter />
      </div>
    );
  }

  const pageTitle = page.meta_title || page.title;
  const pageDescription = page.meta_description || page.content.substring(0, 160).replace(/<[^>]*>/g, '');

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        url={`/page/${page.slug}`}
        type="article"
        image="/hero-authors-workspace.jpg"
      />

      <DynamicHeader />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>

          {/* Page Header */}
          <header className="mb-8 pb-8 border-b border-border">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              {page.title}
            </h1>
            
            {/* Page Meta */}
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Published {formatDate(page.created_at)}</span>
              </div>
              
              {page.updated_at !== page.created_at && (
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Updated {formatDate(page.updated_at)}</span>
                </div>
              )}
            </div>
          </header>

          {/* Page Content */}
          <article className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-blockquote:text-muted-foreground prose-blockquote:border-primary/20">
            <div 
              dangerouslySetInnerHTML={{ __html: page.content }}
              className="leading-relaxed"
            />
          </article>

          {/* Page Footer */}
          <footer className="mt-12 pt-8 border-t border-border">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="text-sm text-muted-foreground">
                Last updated: {formatDate(page.updated_at)}
              </div>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </Button>
            </div>
          </footer>
        </div>
      </main>

      <DynamicFooter />
    </div>
  );
};

export default PublicPage;