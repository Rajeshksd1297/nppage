import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Save, Link, ExternalLink, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AffiliateConfig {
  enabled: boolean;
  displayName: string;
  baseUrl: string;
  parameters: { [key: string]: string };
  description: string;
}

interface AffiliateSettings {
  amazon: AffiliateConfig;
  kobo: AffiliateConfig;
  googleBooks: AffiliateConfig;
  barnesNoble: AffiliateConfig;
  bookshop: AffiliateConfig;
  applebooks: AffiliateConfig;
}

export function AffiliateSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AffiliateSettings>({
    amazon: {
      enabled: true,
      displayName: "Amazon",
      baseUrl: "https://amazon.com/dp/{isbn}",
      parameters: { tag: "yoursite-20" },
      description: "Amazon Associate Program - earn commissions on book sales"
    },
    kobo: {
      enabled: true,
      displayName: "Kobo",
      baseUrl: "https://www.kobo.com/search",
      parameters: { query: "{title}", affiliate: "yourid" },
      description: "Kobo Affiliate Program - earn from ebook sales"
    },
    googleBooks: {
      enabled: true,
      displayName: "Google Books",
      baseUrl: "https://books.google.com/books",
      parameters: { isbn: "{isbn}", partner: "yourid" },
      description: "Google Books Partner Program"
    },
    barnesNoble: {
      enabled: false,
      displayName: "Barnes & Noble",
      baseUrl: "https://www.barnesandnoble.com/s/{isbn}",
      parameters: { affiliate: "yourid" },
      description: "Barnes & Noble Affiliate Program"
    },
    bookshop: {
      enabled: true,
      displayName: "Bookshop.org",
      baseUrl: "https://bookshop.org/books",
      parameters: { keywords: "{title}", shop: "yourshop" },
      description: "Support independent bookstores"
    },
    applebooks: {
      enabled: false,
      displayName: "Apple Books",
      baseUrl: "https://books.apple.com/search",
      parameters: { term: "{title}" },
      description: "Apple Books affiliate program"
    }
  });

  const updateSetting = (platform: keyof AffiliateSettings, field: keyof AffiliateConfig, value: any) => {
    setSettings(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value
      }
    }));
  };

  const updateParameter = (platform: keyof AffiliateSettings, param: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        parameters: {
          ...prev[platform].parameters,
          [param]: value
        }
      }
    }));
  };

  const saveSettings = async () => {
    try {
      // Here you would save to your backend or local storage
      localStorage.setItem('affiliateSettings', JSON.stringify(settings));
      
      toast({
        title: "Success",
        description: "Affiliate settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save affiliate settings",
        variant: "destructive",
      });
    }
  };

  const testLink = (platform: keyof AffiliateSettings) => {
    const config = settings[platform];
    let url = config.baseUrl;
    
    // Replace placeholders with test data
    url = url.replace('{isbn}', '9780316769174');
    url = url.replace('{title}', 'The Catcher in the Rye');
    
    // Add parameters
    const params = new URLSearchParams();
    Object.entries(config.parameters).forEach(([key, value]) => {
      let paramValue = value.replace('{isbn}', '9780316769174').replace('{title}', 'The Catcher in the Rye');
      params.append(key, paramValue);
    });
    
    const finalUrl = `${url}?${params.toString()}`;
    window.open(finalUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Affiliate Link Settings</h2>
          <p className="text-muted-foreground">
            Configure affiliate programs to automatically generate purchase links for your books
          </p>
        </div>
        <Button onClick={saveSettings}>
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>

      <div className="grid gap-6">
        {Object.entries(settings).map(([platform, config]) => (
          <Card key={platform}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(enabled) => updateSetting(platform as keyof AffiliateSettings, 'enabled', enabled)}
                  />
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {config.displayName}
                      {config.enabled && <Badge variant="default">Active</Badge>}
                    </CardTitle>
                    <CardDescription>{config.description}</CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testLink(platform as keyof AffiliateSettings)}
                  disabled={!config.enabled}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Test Link
                </Button>
              </div>
            </CardHeader>
            
            {config.enabled && (
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor={`${platform}-url`}>Base URL Template</Label>
                  <Input
                    id={`${platform}-url`}
                    value={config.baseUrl}
                    onChange={(e) => updateSetting(platform as keyof AffiliateSettings, 'baseUrl', e.target.value)}
                    placeholder="https://example.com/{isbn}"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use {"{isbn}"} and {"{title}"} as placeholders
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>URL Parameters</Label>
                  {Object.entries(config.parameters).map(([param, value]) => (
                    <div key={param} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label htmlFor={`${platform}-${param}`} className="text-xs">
                          {param}
                        </Label>
                        <Input
                          id={`${platform}-${param}`}
                          value={String(value)}
                          onChange={(e) => updateParameter(platform as keyof AffiliateSettings, param, e.target.value)}
                          placeholder="Parameter value"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    Generated Link Preview:
                  </h4>
                  <code className="text-xs text-muted-foreground break-all">
                    {config.baseUrl}?{Object.entries(config.parameters).map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`).join('&')}
                  </code>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Global Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Default Currency</Label>
              <Input defaultValue="USD" placeholder="USD" />
            </div>
            <div>
              <Label>Default Country</Label>
              <Input defaultValue="US" placeholder="US" />
            </div>
          </div>
          
          <div>
            <Label>Link Display Preference</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2">
                <input type="radio" name="display" value="buttons" defaultChecked />
                <span className="text-sm">Button Style</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="display" value="links" />
                <span className="text-sm">Text Links</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="display" value="cards" />
                <span className="text-sm">Card Layout</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How Affiliate Links Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Automatic Generation:</strong> When you add a book with ISBN, affiliate links are automatically generated for all enabled platforms.
            </p>
            <p>
              <strong>Template System:</strong> URLs use templates with placeholders like {"{isbn}"} and {"{title}"} that get replaced with actual book data.
            </p>
            <p>
              <strong>Commission Tracking:</strong> Each platform uses different parameters (like affiliate ID or tag) to track sales back to you.
            </p>
            <p>
              <strong>Testing:</strong> Use the "Test Link" button to verify your configuration with sample book data.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}