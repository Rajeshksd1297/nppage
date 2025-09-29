import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Eye, Box } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

interface FooterLink {
  label: string;
  url: string;
  category?: string;
}

interface FooterConfig {
  copyrightText: string;
  socialLinks: SocialLink[];
  footerLinks: FooterLink[];
  backgroundColor: string;
  textColor: string;
  showSocialLinks: boolean;
  showAdditionalPages: boolean;
  customContent: string;
}

interface FooterEditorVisualProps {
  onSave?: (config: FooterConfig) => void;
  onBack?: () => void;
}

const FooterEditorVisual = ({ onSave, onBack }: FooterEditorVisualProps) => {
  const [config, setConfig] = useState<FooterConfig>({
    copyrightText: `© ${new Date().getFullYear()} Your Company. All rights reserved.`,
    socialLinks: [
      { platform: 'Twitter', url: 'https://twitter.com', icon: '🐦' },
      { platform: 'Facebook', url: 'https://facebook.com', icon: '📘' },
      { platform: 'LinkedIn', url: 'https://linkedin.com', icon: '💼' },
      { platform: 'Instagram', url: 'https://instagram.com', icon: '📷' }
    ],
    footerLinks: [
      { label: 'Privacy Policy', url: '/privacy', category: 'Legal' },
      { label: 'Terms of Service', url: '/terms', category: 'Legal' },
      { label: 'About Us', url: '/about', category: 'Company' },
      { label: 'Contact', url: '/contact', category: 'Support' }
    ],
    backgroundColor: 'muted',
    textColor: 'foreground',
    showSocialLinks: true,
    showAdditionalPages: true,
    customContent: ''
  });

  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const { toast } = useToast();

  const handleSave = () => {
    onSave?.(config);
    toast({
      title: "Success",
      description: "Footer settings saved successfully",
    });
  };

  const addSocialLink = () => {
    setConfig({
      ...config,
      socialLinks: [
        ...config.socialLinks,
        { platform: 'New Platform', url: '', icon: '🔗' }
      ]
    });
  };

  const updateSocialLink = (index: number, field: keyof SocialLink, value: string) => {
    const updatedLinks = [...config.socialLinks];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    setConfig({ ...config, socialLinks: updatedLinks });
  };

  const removeSocialLink = (index: number) => {
    const updatedLinks = config.socialLinks.filter((_, i) => i !== index);
    setConfig({ ...config, socialLinks: updatedLinks });
  };

  const addFooterLink = () => {
    setConfig({
      ...config,
      footerLinks: [
        ...config.footerLinks,
        { label: 'New Link', url: '#', category: 'General' }
      ]
    });
  };

  const updateFooterLink = (index: number, field: keyof FooterLink, value: string) => {
    const updatedLinks = [...config.footerLinks];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    setConfig({ ...config, footerLinks: updatedLinks });
  };

  const removeFooterLink = (index: number) => {
    const updatedLinks = config.footerLinks.filter((_, i) => i !== index);
    setConfig({ ...config, footerLinks: updatedLinks });
  };

  const getPreviewSize = () => {
    switch (previewMode) {
      case 'tablet': return 'max-w-2xl';
      case 'mobile': return 'max-w-sm';
      default: return 'max-w-full';
    }
  };

  const groupedLinks = config.footerLinks.reduce((acc, link) => {
    const category = link.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(link);
    return acc;
  }, {} as Record<string, FooterLink[]>);

  const FooterPreview = () => (
    <div className={`mx-auto transition-all duration-300 ${getPreviewSize()}`}>
      <div 
        className={`border rounded-lg overflow-hidden shadow-sm ${
          config.backgroundColor === 'primary' ? 'bg-primary text-primary-foreground' :
          config.backgroundColor === 'secondary' ? 'bg-secondary text-secondary-foreground' :
          config.backgroundColor === 'muted' ? 'bg-muted text-muted-foreground' :
          config.backgroundColor === 'dark' ? 'bg-gray-900 text-white' :
          'bg-background text-foreground'
        }`}
      >
        <div className="p-6">
          {/* Custom Content */}
          {config.customContent && (
            <div className="mb-6">
              <p className="text-sm">{config.customContent}</p>
            </div>
          )}

          {/* Footer Links */}
          {config.showAdditionalPages && Object.keys(groupedLinks).length > 0 && (
            <div className={`mb-6 ${previewMode === 'mobile' ? 'space-y-4' : 'grid grid-cols-2 md:grid-cols-4 gap-4'}`}>
              {Object.entries(groupedLinks).map(([category, links]) => (
                <div key={category}>
                  <h4 className="font-semibold text-sm mb-2">{category}</h4>
                  <ul className="space-y-1">
                    {links.map((link, index) => (
                      <li key={index}>
                        <a
                          href={link.url}
                          className="text-xs hover:opacity-80 transition-opacity"
                          onClick={(e) => e.preventDefault()}
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Social Links */}
          {config.showSocialLinks && config.socialLinks.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-center space-x-4">
                {config.socialLinks.filter(link => link.url).map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    className="text-lg hover:opacity-80 transition-opacity"
                    onClick={(e) => e.preventDefault()}
                    title={link.platform}
                  >
                    {link.icon}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Copyright */}
          <div className="text-center border-t pt-4">
            <p className="text-xs">{config.copyrightText}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Controls */}
      <div className="w-80 border-r bg-muted/5 overflow-auto">
        <div className="p-4 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Box className="h-5 w-5" />
              <h3 className="font-semibold">Footer Editor</h3>
            </div>
            <Button onClick={handleSave} size="sm">Save</Button>
          </div>

          {/* Copyright */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Copyright & Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="copyright" className="text-xs">Copyright Text</Label>
                <Input
                  id="copyright"
                  value={config.copyrightText}
                  onChange={(e) => setConfig({ ...config, copyrightText: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div>
                <Label htmlFor="customContent" className="text-xs">Custom Content</Label>
                <Textarea
                  id="customContent"
                  value={config.customContent}
                  onChange={(e) => setConfig({ ...config, customContent: e.target.value })}
                  placeholder="Add any additional content..."
                  className="text-xs"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                Social Links
                <Button onClick={addSocialLink} variant="outline" size="sm" className="h-6 text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {config.socialLinks.map((link, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex gap-1 items-center">
                    <Input
                      value={link.platform}
                      onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                      placeholder="Platform"
                      className="h-7 text-xs"
                    />
                    <Input
                      value={link.icon}
                      onChange={(e) => updateSocialLink(index, 'icon', e.target.value)}
                      placeholder="Icon"
                      className="h-7 w-16 text-xs text-center"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => removeSocialLink(index)}
                      className="h-7 w-7"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <Input
                    value={link.url}
                    onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                    placeholder="https://..."
                    className="h-7 text-xs"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Footer Links */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                Footer Links
                <Button onClick={addFooterLink} variant="outline" size="sm" className="h-6 text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {config.footerLinks.map((link, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex gap-1 items-center">
                    <Input
                      value={link.label}
                      onChange={(e) => updateFooterLink(index, 'label', e.target.value)}
                      placeholder="Label"
                      className="h-7 text-xs"
                    />
                    <Select
                      value={link.category || 'General'}
                      onValueChange={(value) => updateFooterLink(index, 'category', value)}
                    >
                      <SelectTrigger className="h-7 w-20 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Legal">Legal</SelectItem>
                        <SelectItem value="Company">Company</SelectItem>
                        <SelectItem value="Support">Support</SelectItem>
                        <SelectItem value="General">General</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => removeFooterLink(index)}
                      className="h-7 w-7"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <Input
                    value={link.url}
                    onChange={(e) => updateFooterLink(index, 'url', e.target.value)}
                    placeholder="URL"
                    className="h-7 text-xs"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Styling */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Styling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="bgColor" className="text-xs">Background</Label>
                <Select
                  value={config.backgroundColor}
                  onValueChange={(value) => setConfig({ ...config, backgroundColor: value })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="background">Default</SelectItem>
                    <SelectItem value="muted">Muted</SelectItem>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="flex-1 overflow-auto bg-muted/5">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span className="text-sm font-medium">Footer Preview</span>
            </div>
            
            {/* Device Toggle */}
            <div className="flex items-center space-x-1 bg-background border rounded-md p-1">
              <Button
                variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('desktop')}
                className="h-7 px-2"
              >
                🖥️
              </Button>
              <Button
                variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('tablet')}
                className="h-7 px-2"
              >
                📱
              </Button>
              <Button
                variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('mobile')}
                className="h-7 px-2"
              >
                📱
              </Button>
            </div>
          </div>

          <FooterPreview />
          
          {/* Preview Info */}
          <div className="mt-4 p-3 bg-background border rounded-lg">
            <h4 className="text-sm font-medium mb-2">Preview Notes</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Changes appear instantly in the preview</li>
              <li>• Links are grouped by category automatically</li>
              <li>• Social icons update based on platform emojis</li>
              <li>• Mobile view shows stacked layout</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FooterEditorVisual;