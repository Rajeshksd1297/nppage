import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, ExternalLink, RefreshCw, Check, X, ArrowUpDown } from "lucide-react";

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
  const [sortField, setSortField] = useState<'platform' | 'url' | 'price'>('platform');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [editingData, setEditingData] = useState<PurchaseLink>({
    platform: '',
    url: '',
    price: '',
    affiliate_id: ''
  });
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
    setEditingData({ platform: '', url: '', price: '', affiliate_id: '' });
  };

  const handleSort = (field: 'platform' | 'url' | 'price') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedLinks = [...links].sort((a, b) => {
    let aValue = a[sortField] || '';
    let bValue = b[sortField] || '';
    
    if (sortDirection === 'desc') {
      [aValue, bValue] = [bValue, aValue];
    }
    
    return aValue.localeCompare(bValue);
  });

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

    onChange([...links, newLink]);
    toast({
      title: "Success",
      description: "Purchase link added successfully",
    });

    resetForm();
  };

  const startInlineEdit = (index: number) => {
    const originalIndex = links.findIndex(link => 
      sortedLinks[index].platform === link.platform && 
      sortedLinks[index].url === link.url
    );
    setEditingIndex(originalIndex);
    setEditingData(links[originalIndex]);
  };

  const saveInlineEdit = () => {
    if (!editingData.platform || !editingData.url) {
      toast({
        title: "Error",
        description: "Platform and URL are required",
        variant: "destructive",
      });
      return;
    }

    if (editingIndex !== null) {
      const finalUrl = getAffiliateUrl(editingData.platform, editingData.url, isbn, title);
      const updatedLinks = [...links];
      updatedLinks[editingIndex] = { ...editingData, url: finalUrl };
      onChange(updatedLinks);
      
      toast({
        title: "Success",
        description: "Purchase link updated successfully",
      });
    }

    resetForm();
  };

  const cancelInlineEdit = () => {
    resetForm();
  };

  const handleDeleteLink = (index: number) => {
    const originalIndex = links.findIndex(link => 
      sortedLinks[index].platform === link.platform && 
      sortedLinks[index].url === link.url
    );
    
    const updatedLinks = links.filter((_, i) => i !== originalIndex);
    onChange(updatedLinks);
    
    if (editingIndex === originalIndex) {
      resetForm();
    }
    
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
                  <DialogTitle>Add Purchase Link</DialogTitle>
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
                    <Input
                      placeholder="Or enter custom platform name"
                      value={formData.platform}
                      onChange={(e) => setFormData({...formData, platform: e.target.value})}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Choose from popular platforms above or enter your own custom platform name
                    </p>
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
                      Add Link
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {links.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('platform')}
                  >
                    <div className="flex items-center space-x-2">
                      <span>Platform</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('url')}
                  >
                    <div className="flex items-center space-x-2">
                      <span>Purchase Link</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center space-x-2">
                      <span>Price</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLinks.map((link, index) => {
                  const originalIndex = links.findIndex(originalLink => 
                    originalLink.platform === link.platform && originalLink.url === link.url
                  );
                  const isEditing = editingIndex === originalIndex;
                  
                  return (
                    <TableRow key={`${link.platform}-${index}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {link.platform.charAt(0)}
                            </span>
                          </div>
                          <span className="font-medium">{link.platform}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="url"
                            value={editingData.url}
                            onChange={(e) => setEditingData({...editingData, url: e.target.value})}
                            className="w-full"
                          />
                        ) : (
                          <div className="max-w-md">
                            <a 
                              href={link.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline truncate block"
                            >
                              {link.url}
                            </a>
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editingData.price || ''}
                            onChange={(e) => setEditingData({...editingData, price: e.target.value})}
                            placeholder="$9.99"
                            className="w-24"
                          />
                        ) : (
                          <>
                            {link.price ? (
                              <Badge variant="secondary">{link.price}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {isEditing ? (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={saveInlineEdit}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={cancelInlineEdit}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(link.url, '_blank')}
                                title="Open link"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              
                              {!isReadOnly && (
                                <>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => startInlineEdit(index)}
                                    title="Edit"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteLink(index)}
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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