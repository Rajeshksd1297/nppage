import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Share2, 
  Twitter, 
  Linkedin, 
  Facebook, 
  MessageCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SocialShareWidgetProps {
  title: string;
  description?: string;
  url: string;
  imageUrl?: string;
  author?: string;
  hashtags?: string[];
}

export const SocialShareWidget: React.FC<SocialShareWidgetProps> = ({
  title,
  description = '',
  url,
  imageUrl,
  author,
  hashtags = []
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  const hashtagString = hashtags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ');

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&hashtags=${hashtags.join(',')}${author ? `&via=${encodeURIComponent(author)}` : ''}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: 'Link copied!',
        description: 'The link has been copied to your clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the link manually.',
        variant: 'destructive',
      });
    }
  };

  const handleShare = (platform: string) => {
    const link = shareLinks[platform as keyof typeof shareLinks];
    window.open(link, '_blank', 'noopener,noreferrer,width=600,height=400');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Share2 className="h-4 w-4" />
          Share this content
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare('twitter')}
            className="flex items-center gap-2"
          >
            <Twitter className="h-4 w-4" />
            Twitter
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare('linkedin')}
            className="flex items-center gap-2"
          >
            <Linkedin className="h-4 w-4" />
            LinkedIn
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare('facebook')}
            className="flex items-center gap-2"
          >
            <Facebook className="h-4 w-4" />
            Facebook
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare('whatsapp')}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={url}
              readOnly
              className="flex-1 px-3 py-2 text-sm bg-muted border rounded-md"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="flex items-center gap-1"
            >
              {copied ? (
                <>✓ Copied</>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy
                </>
              )}
            </Button>
          </div>

          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {hashtags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(url, '_blank')}
          className="w-full flex items-center gap-2"
        >
          <ExternalLink className="h-3 w-3" />
          View Content
        </Button>
      </CardContent>
    </Card>
  );
};