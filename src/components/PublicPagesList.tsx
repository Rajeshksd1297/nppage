import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PublicPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
}

interface PublicPagesListProps {
  maxPages?: number;
  showDescription?: boolean;
  layout?: 'grid' | 'list';
  className?: string;
}

export const PublicPagesList: React.FC<PublicPagesListProps> = ({
  maxPages = 6,
  showDescription = true,
  layout = 'grid',
  className = ''
}) => {
  const [pages, setPages] = useState<PublicPage[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadPages();
    setupRealtimeListener();
  }, []);

  const loadPages = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('additional_pages')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(maxPages);

      if (error) {
        console.error('Error loading pages:', error);
        toast({
          title: "Error",
          description: "Failed to load pages.",
          variant: "destructive"
        });
        return;
      }

      setPages(data || []);
    } catch (error) {
      console.error('Error loading pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListener = () => {
    const channel = supabase
      .channel('public-pages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'additional_pages'
        },
        () => {
          loadPages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getExcerpt = (content: string, maxLength: number = 150) => {
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...' 
      : plainText;
  };

  const handlePageClick = (slug: string) => {
    navigate(`/page/${slug}`);
  };

  if (loading) {
    return (
      <div className={className}>
        <div className={layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {Array.from({ length: maxPages }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (pages.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className={layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {pages.map((page) => (
          <Card 
            key={page.id} 
            className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-border hover:border-primary/20"
            onClick={() => handlePageClick(page.slug)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {page.title}
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(page.created_at)}</span>
                  </div>
                </div>
                <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-2" />
              </div>
            </CardHeader>
            
            {showDescription && (
              <CardContent className="pt-0">
                <CardDescription className="text-muted-foreground leading-relaxed line-clamp-3">
                  {page.meta_description || getExcerpt(page.content)}
                </CardDescription>
                
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="group-hover:text-primary transition-colors p-0 h-auto font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePageClick(page.slug);
                    }}
                  >
                    Read more
                    <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};