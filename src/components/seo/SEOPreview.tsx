import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Search } from 'lucide-react';

interface SEOPreviewProps {
  title: string;
  description: string;
  url?: string;
  type?: 'google' | 'twitter' | 'facebook';
}

export const SEOPreview: React.FC<SEOPreviewProps> = ({ 
  title, 
  description, 
  url = 'https://yoursite.com/page',
  type = 'google' 
}) => {
  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (type === 'google') {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Search className="h-4 w-4" />
            Google Search Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              {url}
            </div>
            <div className="text-lg text-blue-600 hover:underline cursor-pointer font-medium">
              {truncateText(title, 60)}
            </div>
            <div className="text-sm text-muted-foreground leading-5">
              {truncateText(description, 160)}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === 'twitter') {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4" />
            Twitter Card Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted h-32 flex items-center justify-center text-muted-foreground text-sm">
              Image Preview
            </div>
            <div className="p-3 space-y-1">
              <div className="text-xs text-muted-foreground uppercase">
                {new URL(url).hostname}
              </div>
              <div className="font-medium text-sm">
                {truncateText(title, 70)}
              </div>
              <div className="text-xs text-muted-foreground">
                {truncateText(description, 120)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === 'facebook') {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4" />
            Facebook Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted h-40 flex items-center justify-center text-muted-foreground text-sm">
              Image Preview
            </div>
            <div className="p-3 space-y-1 bg-secondary/30">
              <div className="text-xs text-muted-foreground uppercase">
                {new URL(url).hostname}
              </div>
              <div className="font-medium">
                {truncateText(title, 100)}
              </div>
              <div className="text-sm text-muted-foreground">
                {truncateText(description, 200)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};