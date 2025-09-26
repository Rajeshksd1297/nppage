import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ISBNLookup } from "@/components/admin/BookManagement/ISBNLookup";
import { Save, ArrowLeft } from "lucide-react";
import { DynamicBookForm } from "@/components/forms/DynamicBookForm";
import { getEnabledVisibleFields } from "@/utils/bookFieldUtils";

interface BookFormData {
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
  purchase_links?: any[];
  status: 'draft' | 'published';
}

export default function BookEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const isNewBook = !id || id === 'new';
  const isFromISBNSearch = searchParams.get('prefilled') === 'true';
  const prefilledISBN = searchParams.get('isbn');
  
  const form = useForm<BookFormData>({
    defaultValues: {
      title: '',
      subtitle: '',
      description: '',
      isbn: '',
      category: '',
      genres: [],
      publisher: '',
      publication_date: '',
      page_count: undefined,
      language: 'en',
      cover_image_url: '',
      seo_title: '',
      seo_description: '',
      seo_keywords: '',
      purchase_links: [],
      status: 'draft',
    },
  });

  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = form;

  useEffect(() => {
    if (id && id !== 'new') {
      fetchBook();
    } else if (isNewBook) {
      // Handle prefilled data from ISBN search or manual entry
      const prefilledData = localStorage.getItem('prefilledBookData');
      if (prefilledData) {
        try {
          const data = JSON.parse(prefilledData);
          reset(data);
          localStorage.removeItem('prefilledBookData'); // Clear after use
          
          if (data.purchase_links?.length > 0) {
            toast({
              title: "Book Data Loaded",
              description: `Auto-filled with ${data.purchase_links.length} affiliate links generated.`,
            });
          }
        } catch (error) {
          console.error('Error loading prefilled data:', error);
        }
      } else if (prefilledISBN) {
        // Set ISBN if provided via URL parameter
        setValue('isbn', prefilledISBN);
        toast({
          title: "ISBN Added",
          description: "Please fill in the remaining book details. Affiliate links will be generated when you save.",
        });
      }
    }
  }, [id, prefilledISBN]);

  const fetchBook = async () => {
    if (!id || id === 'new') return;
    
    try {
      setIsLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.user.id)
        .single();

      if (error) throw error;
      
      // Parse purchase_links if it's a string and ensure proper typing
      const bookData: BookFormData = {
        title: data.title || '',
        subtitle: data.subtitle || '',
        description: data.description || '',
        isbn: data.isbn || '',
        category: data.category || '',
        genres: data.genres || [],
        publisher: data.publisher || '',
        publication_date: data.publication_date || '',
        page_count: data.page_count || undefined,
        language: data.language || 'en',
        cover_image_url: data.cover_image_url || '',
        seo_title: data.seo_title || '',
        seo_description: data.seo_description || '',
        seo_keywords: data.seo_keywords || '',
        purchase_links: Array.isArray(data.purchase_links) 
          ? data.purchase_links 
          : (data.purchase_links && typeof data.purchase_links === 'string' 
              ? JSON.parse(data.purchase_links as string) 
              : data.purchase_links || []),
        status: (data.status as 'draft' | 'published') || 'draft'
      };

      reset(bookData);
    } catch (error) {
      console.error('Error fetching book:', error);
      toast({
        title: "Error",
        description: "Failed to load book details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleISBNLookup = (bookData: any) => {
    // Update form with ISBN lookup data
    Object.keys(bookData).forEach(key => {
      if (form.getValues(key as keyof BookFormData) !== undefined) {
        setValue(key as keyof BookFormData, bookData[key]);
      }
    });
  };

  const onSubmit = async (data: BookFormData) => {
    try {
      setIsLoading(true);
      
      // Auto-generate purchase links based on admin affiliate settings if ISBN is provided
      if (data.isbn) {
        const savedAffiliateSettings = localStorage.getItem('affiliateSettings');
        if (savedAffiliateSettings) {
          try {
            const affiliateSettings = JSON.parse(savedAffiliateSettings);
            const purchaseLinks = [];
            
            if (affiliateSettings.amazon?.enabled && affiliateSettings.amazon?.parameters?.tag) {
              purchaseLinks.push({
                platform: 'Amazon',
                url: `https://amazon.com/dp/${data.isbn}?tag=${affiliateSettings.amazon.parameters.tag}`,
                affiliate_id: affiliateSettings.amazon.parameters.tag
              });
            }
            
            if (affiliateSettings.bookshop?.enabled && affiliateSettings.bookshop?.parameters?.a) {
              purchaseLinks.push({
                platform: 'Bookshop',
                url: `https://bookshop.org/books/${data.isbn}?a=${affiliateSettings.bookshop.parameters.a}`,
                affiliate_id: affiliateSettings.bookshop.parameters.a
              });
            }

            if (affiliateSettings.kobo?.enabled) {
              purchaseLinks.push({
                platform: 'Kobo',
                url: `https://www.kobo.com/search?query=${data.isbn}`,
                affiliate_id: affiliateSettings.kobo.parameters?.aid || ''
              });
            }

            if (affiliateSettings.googleBooks?.enabled) {
              purchaseLinks.push({
                platform: 'Google Books',
                url: `https://books.google.com/books?isbn=${data.isbn}`,
                affiliate_id: ''
              });
            }

            if (affiliateSettings.barnesNoble?.enabled) {
              purchaseLinks.push({
                platform: 'Barnes & Noble',
                url: `https://www.barnesandnoble.com/s/${data.isbn}`,
                affiliate_id: ''
              });
            }

            if (affiliateSettings.applebooks?.enabled) {
              purchaseLinks.push({
                platform: 'Apple Books',
                url: `https://books.apple.com/search?term=${encodeURIComponent(data.title)}`,
                affiliate_id: ''
              });
            }
            
            data.purchase_links = purchaseLinks;
          } catch (error) {
            console.error('Error parsing affiliate settings:', error);
          }
        }
      }

      const bookData = {
        ...data,
        genres: data.genres || [],
        updated_at: new Date().toISOString(),
      };

      if (id && id !== 'new') {
        const { error } = await supabase
          .from('books')
          .update(bookData)
          .eq('id', id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Book updated successfully!",
        });
      } else {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error('User not authenticated');

        const { error } = await supabase
          .from('books')
          .insert([{
            ...bookData,
            user_id: user.user.id,
            created_at: new Date().toISOString(),
          }]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Book created successfully!",
        });
      }

      navigate('/books');
    } catch (error) {
      console.error('Error saving book:', error);
      toast({
        title: "Error",
        description: "Failed to save book. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/books')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Books
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {id === 'new' ? 'Add New Book' : 'Edit Book'}
            </h1>
            <p className="text-muted-foreground">
              {id === 'new' ? 'Create a new book entry' : 'Update book information'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {isNewBook && (
            <ISBNLookup onBookFound={handleISBNLookup} />
          )}
          <Button form="book-form" type="submit" disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Book'}
          </Button>
        </div>
      </div>

      <form id="book-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <DynamicBookForm form={form} mode={isNewBook ? 'add' : 'edit'} />
        
        {/* Show ISBN requirement message for manual entry */}
        {isNewBook && !isFromISBNSearch && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">📚 About ISBN & Affiliate Links</h3>
            <p className="text-sm text-blue-700">
              <strong>ISBN is highly recommended</strong> for generating automatic affiliate purchase links. 
              Without an ISBN, you'll need to manually add purchase links later.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}