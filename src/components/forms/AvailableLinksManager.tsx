import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, ExternalLink, RefreshCw } from "lucide-react";

interface PurchaseLink {
  platform: string;
  url: string;
  price?: string;
  affiliate_id?: string;
}

interface AvailableLinksManagerProps {
  links: PurchaseLink[];
  onChange: (links: PurchaseLink[]) => void;
  isReadOnly: boolean;
  isbn?: string;
  title?: string;
}

const popularPlatforms = [
  "Amazon", "Apple Books", "Barnes & Noble", "Bookshop", "Google Books", 
  "Kobo", "Audible", "Kindle", "Goodreads", "Author Website", "Publisher", "Other"
];

const getAffiliateUrl = (platform: string, baseUrl: string, isbn?: string, title?: string) => {
  const savedSettings = localStorage.getItem('affiliateSettings');
  if (!savedSettings) return baseUrl;

  try {
    const settings = JSON.parse(savedSettings);
    const platformKey = platform.toLowerCase().replace(/\s+/g, '');
    const config = settings[platformKey];

    if (!config?.enabled) return baseUrl;

    let affiliateUrl = baseUrl;
    
    // Apply affiliate parameters based on platform
    switch (platform.toLowerCase()) {
      case 'amazon':
        if (config.parameters?.tag && isbn) {
          affiliateUrl = `https://amazon.com/dp/${isbn}?tag=${config.parameters.tag}`;
        }
        break;
      case 'bookshop':
        if (config.parameters?.a && isbn) {
          affiliateUrl = `https://bookshop.org/books/${isbn}?a=${config.parameters.a}`;
        }
        break;
      default:
        // Apply general affiliate parameters if available
        if (config.parameters && Object.keys(config.parameters).length > 0) {
          const url = new URL(affiliateUrl);
          Object.entries(config.parameters).forEach(([key, value]) => {
            let paramValue = String(value);
            if (isbn) paramValue = paramValue.replace('{isbn}', isbn);
            if (title) paramValue = paramValue.replace('{title}', title);
            url.searchParams.set(key, paramValue);
          });
          affiliateUrl = url.toString();
        }
        break;
    }

    return affiliateUrl;
  } catch (error) {
    console.error('Error applying affiliate settings:', error);
    return baseUrl;
  }
};

export function AvailableLinksManager({ links, onChange, isReadOnly, isbn, title }: AvailableLinksManagerProps) {
  const { toast } = useToast();
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<PurchaseLink>({
    platform: '',
    url: '',
    price: '',
    affiliate_id: ''
  });

  const resetForm = () => {
    setFormData({ platform: '', url: '', price: '', affiliate_id: '' });
    setIsAddingLink(false);
    setEditingIndex(null);
  };

  const handleAddLink = () => {
    if (!formData.platform || !formData.url) {
      toast({
        title: "Error",
        description: "Platform and URL are required",
        variant: "destructive",
      });
      return;
    }

    // Apply affiliate settings automatically
    const finalUrl = getAffiliateUrl(formData.platform, formData.url, isbn, title);
    const newLink = { ...formData, url: finalUrl };

    if (editingIndex !== null) {
      const updatedLinks = [...links];
      updatedLinks[editingIndex] = newLink;
      onChange(updatedLinks);
      toast({
        title: "Success",
        description: "Purchase link updated successfully",
      });
    } else {
      onChange([...links, newLink]);
      toast({
        title: "Success",
        description: "Purchase link added successfully",
      });
    }

    resetForm();
  };

  const handleEditLink = (index: number) => {
    setFormData(links[index]);
    setEditingIndex(index);
    setIsAddingLink(true);
  };

  const handleDeleteLink = (index: number) => {
    const updatedLinks = links.filter((_, i) => i !== index);
    onChange(updatedLinks);
    toast({
      title: "Success",
      description: "Purchase link removed successfully",
    });
  };

  const suggestCommonLinks = () => {
    if (!isbn) {
      toast({
        title: "ISBN Required",
        description: "Please add an ISBN first to suggest purchase links",
        variant: "destructive",
      });
      return;
    }

    const commonLinks: PurchaseLink[] = [
      { platform: "Amazon", url: `https://amazon.com/dp/${isbn}`, price: "" },
      { platform: "Apple Books", url: `https://books.apple.com/search?term=${isbn}`, price: "" },
      { platform: "Barnes & Noble", url: `https://www.barnesandnoble.com/s/${isbn}`, price: "" },
      { platform: "Bookshop", url: `https://bookshop.org/books/${isbn}`, price: "" },
      { platform: "Google Books", url: `https://books.google.com/books?isbn=${isbn}`, price: "" }
    ];

    // Apply affiliate settings to suggested links
    const affiliateLinks = commonLinks.map(link => ({
      ...link,
      url: getAffiliateUrl(link.platform, link.url, isbn, title)
    }));

    // Only add links that don't already exist
    const existingPlatforms = links.map(link => link.platform.toLowerCase());
    const newLinks = affiliateLinks.filter(link => 
      !existingPlatforms.includes(link.platform.toLowerCase())
    );

    if (newLinks.length > 0) {
      onChange([...links, ...newLinks]);
      toast({
        title: "Success",
        description: `Added ${newLinks.length} purchase links with affiliate settings applied`,
      });
    } else {
      toast({
        title: "Info",
        description: "All common platforms are already added",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Available Purchase Links</h3>
          <p className="text-sm text-muted-foreground">
            Manage where your book can be purchased. Affiliate settings are applied automatically.
          </p>
        </div>
        
        {!isReadOnly && (
          <div className="flex gap-2">
            {isbn && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={suggestCommonLinks}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Suggest Links
              </Button>
            )}
            
            <Dialog open={isAddingLink} onOpenChange={setIsAddingLink}>
              <DialogTrigger asChild>
                <Button type="button" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Link
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingIndex !== null ? 'Edit Purchase Link' : 'Add Purchase Link'}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="platform">Platform *</Label>
                    <Select 
                      value={formData.platform} 
                      onValueChange={(value) => setFormData({...formData, platform: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {popularPlatforms.map(platform => (
                          <SelectItem key={platform} value={platform}>
                            {platform}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="url">Purchase URL *</Label>
                    <Input
                      id="url"
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({...formData, url: e.target.value})}
                      placeholder="https://example.com/book"
                    />
                    <p className="text-xs text-muted-foreground">
                      Affiliate parameters will be added automatically based on admin settings
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price (optional)</Label>
                    <Input
                      id="price"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      placeholder="$9.99"
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button type="button" onClick={handleAddLink}>
                      {editingIndex !== null ? 'Update Link' : 'Add Link'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {links.length > 0 ? (
        <div className="space-y-3">
          {links.map((link, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {link.platform.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{link.platform}</p>
                      {link.price && (
                        <Badge variant="secondary" className="text-xs">
                          {link.price}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate max-w-md">
                      {link.url}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(link.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  
                  {!isReadOnly && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditLink(index)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLink(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center">
          <div className="space-y-3">
            <p className="text-muted-foreground">No purchase links added yet</p>
            {!isReadOnly && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Add links where your book can be purchased. Affiliate settings will be applied automatically.
                </p>
                {isbn && (
                  <Button type="button" variant="outline" onClick={suggestCommonLinks}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Suggest Common Purchase Links
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}