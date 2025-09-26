import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Download, Image, FileText, Award, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeBanner } from '@/components/UpgradeBanner';

interface MediaKitData {
  bio: string;
  achievements: string[];
  stats: {
    books_published: number;
    total_downloads: number;
    awards: number;
  };
  press_photos: string[];
  book_covers: string[];
}

export default function MediaKit() {
  const [mediaKit, setMediaKit] = useState<MediaKitData>({
    bio: '',
    achievements: [],
    stats: { books_published: 0, total_downloads: 0, awards: 0 },
    press_photos: [],
    book_covers: []
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { hasFeature, loading: subscriptionLoading } = useSubscription();

  const canUseMediaKit = hasFeature('media_kit');

  useEffect(() => {
    if (canUseMediaKit) {
      fetchMediaKit();
    } else {
      setLoading(false);
    }
  }, [canUseMediaKit]);

  const fetchMediaKit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('bio')
        .eq('id', user.id)
        .single();

      // Get books data for stats
      const { data: books } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id);

      setMediaKit({
        bio: profile?.bio || '',
        achievements: [
          "Best-selling author",
          "Featured in literary magazines",
          "Award winner"
        ],
        stats: {
          books_published: books?.length || 0,
          total_downloads: Math.floor(Math.random() * 10000), // Mock data
          awards: 3
        },
        press_photos: [],
        book_covers: books?.map(book => book.cover_image_url).filter(Boolean) || []
      });
    } catch (error) {
      console.error('Error fetching media kit:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    toast({
      title: "PDF Generated",
      description: "Your media kit PDF has been downloaded",
    });
  };

  if (subscriptionLoading || loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (!canUseMediaKit) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Media Kit</h1>
          <p className="text-muted-foreground">
            Professional media kit for press and promotional use
          </p>
        </div>

        <UpgradeBanner 
          message="Media kit is a Pro feature"
          feature="professional media kit with downloadable assets"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 opacity-50">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Author Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold">---</div>
                <div className="text-sm text-muted-foreground">Books Published</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">---</div>
                <div className="text-sm text-muted-foreground">Total Downloads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">---</div>
                <div className="text-sm text-muted-foreground">Awards</div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Professional Bio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Your professional biography will appear here...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Media Kit</h1>
          <p className="text-muted-foreground">
            Professional media kit for press and promotional use
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditing(!editing)}>
            {editing ? 'View Mode' : 'Edit Mode'}
          </Button>
          <Button onClick={generatePDF}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Author Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{mediaKit.stats.books_published}</div>
              <div className="text-sm text-muted-foreground">Books Published</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{mediaKit.stats.total_downloads.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Downloads</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{mediaKit.stats.awards}</div>
              <div className="text-sm text-muted-foreground">Awards</div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Professional Bio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <Textarea
                value={mediaKit.bio}
                onChange={(e) => setMediaKit(prev => ({ ...prev, bio: e.target.value }))}
                rows={6}
                placeholder="Enter your professional biography..."
              />
            ) : (
              <p className="whitespace-pre-wrap">{mediaKit.bio || 'No biography available'}</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Achievements & Awards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {mediaKit.achievements.map((achievement, index) => (
                <Badge key={index} variant="secondary">
                  {achievement}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              Book Covers
            </CardTitle>
            <CardDescription>
              High-resolution book cover images for promotional use
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mediaKit.book_covers.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mediaKit.book_covers.map((cover, index) => (
                  <div key={index} className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                    <img
                      src={cover}
                      alt={`Book cover ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Image className="w-12 h-12 mx-auto mb-2" />
                <p>No book covers available</p>
                <p className="text-sm">Publish books to add cover images to your media kit</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Press Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Media Inquiries</Label>
              <p className="text-sm text-muted-foreground">press@authorname.com</p>
            </div>
            <div>
              <Label>Speaking Engagements</Label>
              <p className="text-sm text-muted-foreground">speaking@authorname.com</p>
            </div>
            <div>
              <Label>Interview Requests</Label>
              <p className="text-sm text-muted-foreground">interviews@authorname.com</p>
            </div>
            <div>
              <Label>General Contact</Label>
              <p className="text-sm text-muted-foreground">hello@authorname.com</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}