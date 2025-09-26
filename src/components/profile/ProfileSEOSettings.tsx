import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Save, 
  ArrowLeft,
  Loader2,
  Search,
  CheckCircle,
  AlertCircle,
  Crown,
  ExternalLink
} from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  website_url: string;
  slug: string;
  public_profile: boolean;
  specializations: string[];
  social_links: Record<string, string>;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
}

interface ProfileSEOSettingsProps {
  profile: Profile;
  onProfileUpdate: (updates: Partial<Profile>) => void;
  onPrevious: () => void;
  isPro: boolean;
}

export function ProfileSEOSettings({ profile, onProfileUpdate, onPrevious, isPro }: ProfileSEOSettingsProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const handleInputChange = (field: keyof Profile, value: string) => {
    onProfileUpdate({ [field]: value });
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          seo_title: profile.seo_title,
          seo_description: profile.seo_description,
          seo_keywords: profile.seo_keywords
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Profile completed!",
        description: "Your author profile has been set up successfully"
      });
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      toast({
        title: "Error",
        description: "Failed to save SEO settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const generateSEOSuggestions = () => {
    const suggestions = {
      title: profile.full_name ? `${profile.full_name} - Author` : 'Author Profile',
      description: profile.bio ? 
        profile.bio.slice(0, 150) + (profile.bio.length > 150 ? '...' : '') :
        `Discover the works of ${profile.full_name || 'this author'}.`,
      keywords: [
        'author',
        profile.full_name?.toLowerCase().replace(/\s+/g, ' '),
        ...(profile.specializations || [])
      ].filter(Boolean).join(', ')
    };
    
    return suggestions;
  };

  const applySuggestions = () => {
    const suggestions = generateSEOSuggestions();
    onProfileUpdate({
      seo_title: suggestions.title,
      seo_description: suggestions.description,
      seo_keywords: suggestions.keywords
    });
  };

  const seoTitle = profile.seo_title || '';
  const seoDescription = profile.seo_description || '';
  const seoKeywords = profile.seo_keywords || '';

  const titleLength = seoTitle.length;
  const descriptionLength = seoDescription.length;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">SEO Optimization</h3>
        <p className="text-muted-foreground">
          Optimize your profile for search engines to help readers discover your work.
        </p>
      </div>

      {!isPro && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-amber-800 dark:text-amber-200">
              <Crown className="w-5 h-5" />
              <span>Pro Feature</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-700 dark:text-amber-300 text-sm">
              Advanced SEO features are available with Pro subscription. Basic SEO is included in all plans.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Meta Title</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="seo_title">Page Title</Label>
              <Input
                id="seo_title"
                value={seoTitle}
                onChange={(e) => handleInputChange('seo_title', e.target.value)}
                placeholder="Enter your page title"
                maxLength={60}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-muted-foreground">
                  Appears in search engine results and browser tabs
                </p>
                <Badge variant={titleLength > 60 ? "destructive" : titleLength > 50 ? "secondary" : "default"}>
                  {titleLength}/60
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Meta Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="seo_description">Description</Label>
              <Textarea
                id="seo_description"
                value={seoDescription}
                onChange={(e) => handleInputChange('seo_description', e.target.value)}
                placeholder="Write a compelling description for search engines"
                maxLength={160}
                rows={3}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-muted-foreground">
                  Brief summary that appears in search results
                </p>
                <Badge variant={descriptionLength > 160 ? "destructive" : descriptionLength > 140 ? "secondary" : "default"}>
                  {descriptionLength}/160
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Keywords</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="seo_keywords">Focus Keywords</Label>
              <Input
                id="seo_keywords"
                value={seoKeywords}
                onChange={(e) => handleInputChange('seo_keywords', e.target.value)}
                placeholder="author, fiction, mystery, novel"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separate keywords with commas. Include your name, genres, and specializations.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-base">
            <Search className="w-5 h-5" />
            <span>Quick SEO Setup</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Let us generate SEO-optimized content based on your profile information.
          </p>
          <Button variant="outline" onClick={applySuggestions}>
            Generate SEO Content
          </Button>
        </CardContent>
      </Card>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-2 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span>SEO Best Practices:</span>
        </h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Keep titles under 60 characters for full visibility</li>
          <li>• Write descriptions between 120-160 characters</li>
          <li>• Include your name and main genres in keywords</li>
          <li>• Use natural language that readers would search for</li>
          <li>• Update SEO content when you publish new books</li>
        </ul>
      </div>

      {/* Preview Card */}
      <Card className="bg-gradient-subtle">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-base">
            <ExternalLink className="w-4 h-4" />
            <span>Search Result Preview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
            <h3 className="text-lg text-blue-600 dark:text-blue-400 font-normal mb-1">
              {seoTitle || generateSEOSuggestions().title}
            </h3>
            <p className="text-green-700 dark:text-green-400 text-sm mb-2">
              authorpage.app/{profile.slug}
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {seoDescription || generateSEOSuggestions().description}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}