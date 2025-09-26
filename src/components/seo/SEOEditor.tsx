import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SEOPreview } from './SEOPreview';
import { Search, Globe, Twitter } from 'lucide-react';

interface SEOData {
  title: string;
  description: string;
  keywords: string;
  ogImage?: string;
}

interface SEOEditorProps {
  initialData?: Partial<SEOData>;
  onSave?: (data: SEOData) => void;
  isLoading?: boolean;
}

export const SEOEditor: React.FC<SEOEditorProps> = ({ 
  initialData = {}, 
  onSave,
  isLoading = false 
}) => {
  const [seoData, setSeoData] = useState<SEOData>({
    title: initialData.title || '',
    description: initialData.description || '',
    keywords: initialData.keywords || '',
    ogImage: initialData.ogImage || '',
  });

  const handleSave = () => {
    onSave?.(seoData);
  };

  const handleInputChange = (field: keyof SEOData, value: string) => {
    setSeoData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>SEO Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="seo-title">SEO Title</Label>
            <Input
              id="seo-title"
              value={seoData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter your page title (60 characters max)"
              maxLength={60}
            />
            <div className="text-xs text-muted-foreground mt-1">
              {seoData.title.length}/60 characters
            </div>
          </div>

          <div>
            <Label htmlFor="seo-description">Meta Description</Label>
            <Textarea
              id="seo-description"
              value={seoData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your page content (160 characters max)"
              maxLength={160}
              rows={3}
            />
            <div className="text-xs text-muted-foreground mt-1">
              {seoData.description.length}/160 characters
            </div>
          </div>

          <div>
            <Label htmlFor="seo-keywords">Keywords</Label>
            <Input
              id="seo-keywords"
              value={seoData.keywords}
              onChange={(e) => handleInputChange('keywords', e.target.value)}
              placeholder="keyword1, keyword2, keyword3"
            />
            <div className="text-xs text-muted-foreground mt-1">
              Separate keywords with commas
            </div>
          </div>

          <div>
            <Label htmlFor="og-image">Open Graph Image URL</Label>
            <Input
              id="og-image"
              value={seoData.ogImage}
              onChange={(e) => handleInputChange('ogImage', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <Button onClick={handleSave} disabled={isLoading} className="w-full">
            {isLoading ? 'Saving...' : 'Save SEO Settings'}
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="google" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="google" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Google
          </TabsTrigger>
          <TabsTrigger value="twitter" className="flex items-center gap-2">
            <Twitter className="h-4 w-4" />
            Twitter
          </TabsTrigger>
          <TabsTrigger value="facebook" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Facebook
          </TabsTrigger>
        </TabsList>

        <TabsContent value="google">
          <SEOPreview
            title={seoData.title || 'Your Page Title'}
            description={seoData.description || 'Your page description will appear here...'}
            type="google"
          />
        </TabsContent>

        <TabsContent value="twitter">
          <SEOPreview
            title={seoData.title || 'Your Page Title'}
            description={seoData.description || 'Your page description will appear here...'}
            type="twitter"
          />
        </TabsContent>

        <TabsContent value="facebook">
          <SEOPreview
            title={seoData.title || 'Your Page Title'}
            description={seoData.description || 'Your page description will appear here...'}
            type="facebook"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};