import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
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

interface FooterEditorProps {
  onSave?: (config: FooterConfig) => void;
}

const FooterEditor = ({ onSave }: FooterEditorProps) => {
  const [config, setConfig] = useState<FooterConfig>({
    copyrightText: `© ${new Date().getFullYear()} Your Company. All rights reserved.`,
    socialLinks: [
      { platform: 'Twitter', url: '', icon: 'twitter' },
      { platform: 'Facebook', url: '', icon: 'facebook' },
      { platform: 'LinkedIn', url: '', icon: 'linkedin' },
      { platform: 'Instagram', url: '', icon: 'instagram' }
    ],
    footerLinks: [
      { label: 'Privacy Policy', url: '/privacy', category: 'Legal' },
      { label: 'Terms of Service', url: '/terms', category: 'Legal' },
      { label: 'About Us', url: '/about', category: 'Company' },
      { label: 'Contact', url: '/contact', category: 'Support' }
    ],
    backgroundColor: 'background',
    textColor: 'foreground',
    showSocialLinks: true,
    showAdditionalPages: true,
    customContent: ''
  });

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
        { platform: 'New Platform', url: '', icon: 'link' }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Footer Configuration</h3>
          <p className="text-sm text-muted-foreground">Configure your site footer, links, and social media</p>
        </div>
        <Button onClick={handleSave}>Save Footer</Button>
      </div>

      <div className="grid gap-6">
        {/* Copyright and Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Copyright & Basic Info</CardTitle>
            <CardDescription>Set your copyright text and basic footer information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="copyrightText">Copyright Text</Label>
              <Input
                id="copyrightText"
                value={config.copyrightText}
                onChange={(e) => setConfig({ ...config, copyrightText: e.target.value })}
                placeholder="© 2024 Your Company. All rights reserved."
              />
            </div>

            <div>
              <Label htmlFor="customContent">Custom Content</Label>
              <Textarea
                id="customContent"
                value={config.customContent}
                onChange={(e) => setConfig({ ...config, customContent: e.target.value })}
                placeholder="Add any additional footer content here..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle>Social Media Links</CardTitle>
            <CardDescription>Add and configure social media links</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {config.socialLinks.map((link, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label htmlFor={`social-platform-${index}`}>Platform</Label>
                  <Input
                    id={`social-platform-${index}`}
                    value={link.platform}
                    onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor={`social-url-${index}`}>URL</Label>
                  <Input
                    id={`social-url-${index}`}
                    value={link.url}
                    onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                    placeholder="https://twitter.com/yourhandle"
                  />
                </div>
                <div className="w-32">
                  <Label htmlFor={`social-icon-${index}`}>Icon</Label>
                  <Select
                    value={link.icon}
                    onValueChange={(value) => updateSocialLink(index, 'icon', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="github">GitHub</SelectItem>
                      <SelectItem value="link">Generic Link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => removeSocialLink(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button onClick={addSocialLink} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Social Link
            </Button>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <Card>
          <CardHeader>
            <CardTitle>Footer Links</CardTitle>
            <CardDescription>Add links to important pages like Privacy Policy, Terms, etc.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {config.footerLinks.map((link, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label htmlFor={`footer-label-${index}`}>Label</Label>
                  <Input
                    id={`footer-label-${index}`}
                    value={link.label}
                    onChange={(e) => updateFooterLink(index, 'label', e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor={`footer-url-${index}`}>URL</Label>
                  <Input
                    id={`footer-url-${index}`}
                    value={link.url}
                    onChange={(e) => updateFooterLink(index, 'url', e.target.value)}
                  />
                </div>
                <div className="w-32">
                  <Label htmlFor={`footer-category-${index}`}>Category</Label>
                  <Select
                    value={link.category || 'General'}
                    onValueChange={(value) => updateFooterLink(index, 'category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Legal">Legal</SelectItem>
                      <SelectItem value="Company">Company</SelectItem>
                      <SelectItem value="Support">Support</SelectItem>
                      <SelectItem value="General">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => removeFooterLink(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button onClick={addFooterLink} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Footer Link
            </Button>
          </CardContent>
        </Card>

        {/* Styling */}
        <Card>
          <CardHeader>
            <CardTitle>Footer Styling</CardTitle>
            <CardDescription>Customize footer colors and appearance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="backgroundColor">Background Color</Label>
              <Select
                value={config.backgroundColor}
                onValueChange={(value) => setConfig({ ...config, backgroundColor: value })}
              >
                <SelectTrigger>
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

            <div>
              <Label htmlFor="textColor">Text Color</Label>
              <Select
                value={config.textColor}
                onValueChange={(value) => setConfig({ ...config, textColor: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="foreground">Default</SelectItem>
                  <SelectItem value="muted-foreground">Muted</SelectItem>
                  <SelectItem value="primary-foreground">Primary</SelectItem>
                  <SelectItem value="secondary-foreground">Secondary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FooterEditor;