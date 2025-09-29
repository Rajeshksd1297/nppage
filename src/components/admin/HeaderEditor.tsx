import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NavigationItem {
  label: string;
  url: string;
  target?: string;
}

interface HeaderConfig {
  logoUrl: string;
  logoPosition: 'left' | 'center' | 'right';
  navigationItems: NavigationItem[];
  showDarkModeToggle: boolean;
  showLoginButton: boolean;
  stickyHeader: boolean;
  transparentHeader: boolean;
  backgroundColor: string;
  textColor: string;
}

interface HeaderEditorProps {
  onSave?: (config: HeaderConfig) => void;
}

const HeaderEditor = ({ onSave }: HeaderEditorProps) => {
  const [config, setConfig] = useState<HeaderConfig>({
    logoUrl: '',
    logoPosition: 'left',
    navigationItems: [
      { label: 'Home', url: '/' },
      { label: 'About', url: '/about' },
      { label: 'Contact', url: '/contact' }
    ],
    showDarkModeToggle: true,
    showLoginButton: true,
    stickyHeader: true,
    transparentHeader: false,
    backgroundColor: 'background',
    textColor: 'foreground'
  });

  const { toast } = useToast();

  const handleSave = () => {
    onSave?.(config);
    toast({
      title: "Success",
      description: "Header settings saved successfully",
    });
  };

  const addNavigationItem = () => {
    setConfig({
      ...config,
      navigationItems: [
        ...config.navigationItems,
        { label: 'New Link', url: '#' }
      ]
    });
  };

  const updateNavigationItem = (index: number, field: keyof NavigationItem, value: string) => {
    const updatedItems = [...config.navigationItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setConfig({ ...config, navigationItems: updatedItems });
  };

  const removeNavigationItem = (index: number) => {
    const updatedItems = config.navigationItems.filter((_, i) => i !== index);
    setConfig({ ...config, navigationItems: updatedItems });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Header Configuration</h3>
          <p className="text-sm text-muted-foreground">Configure your site header, logo, navigation, and settings</p>
        </div>
        <Button onClick={handleSave}>Save Header</Button>
      </div>

      <div className="grid gap-6">
        {/* Logo Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Logo Settings</CardTitle>
            <CardDescription>Configure your site logo and positioning</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="logoUrl">Logo URL</Label>
              <div className="flex gap-2">
                <Input
                  id="logoUrl"
                  placeholder="https://example.com/logo.png"
                  value={config.logoUrl}
                  onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                />
                <Button variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="logoPosition">Logo Position</Label>
              <Select
                value={config.logoPosition}
                onValueChange={(value: 'left' | 'center' | 'right') => 
                  setConfig({ ...config, logoPosition: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Navigation Menu</CardTitle>
            <CardDescription>Add and configure navigation links</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {config.navigationItems.map((item, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label htmlFor={`nav-label-${index}`}>Label</Label>
                  <Input
                    id={`nav-label-${index}`}
                    value={item.label}
                    onChange={(e) => updateNavigationItem(index, 'label', e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor={`nav-url-${index}`}>URL</Label>
                  <Input
                    id={`nav-url-${index}`}
                    value={item.url}
                    onChange={(e) => updateNavigationItem(index, 'url', e.target.value)}
                  />
                </div>
                <div className="w-24">
                  <Label htmlFor={`nav-target-${index}`}>Target</Label>
                  <Select
                    value={item.target || '_self'}
                    onValueChange={(value) => updateNavigationItem(index, 'target', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_self">Same Window</SelectItem>
                      <SelectItem value="_blank">New Window</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => removeNavigationItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button onClick={addNavigationItem} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Navigation Item
            </Button>
          </CardContent>
        </Card>

        {/* Header Behavior */}
        <Card>
          <CardHeader>
            <CardTitle>Header Behavior</CardTitle>
            <CardDescription>Configure header behavior and appearance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.showDarkModeToggle}
                onCheckedChange={(checked) => setConfig({ ...config, showDarkModeToggle: checked })}
              />
              <Label>Show Dark Mode Toggle</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={config.showLoginButton}
                onCheckedChange={(checked) => setConfig({ ...config, showLoginButton: checked })}
              />
              <Label>Show Login Button</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={config.stickyHeader}
                onCheckedChange={(checked) => setConfig({ ...config, stickyHeader: checked })}
              />
              <Label>Sticky Header</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={config.transparentHeader}
                onCheckedChange={(checked) => setConfig({ ...config, transparentHeader: checked })}
              />
              <Label>Transparent Header</Label>
            </div>
          </CardContent>
        </Card>

        {/* Styling */}
        <Card>
          <CardHeader>
            <CardTitle>Header Styling</CardTitle>
            <CardDescription>Customize header colors and appearance</CardDescription>
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
                  <SelectItem value="transparent">Transparent</SelectItem>
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

export default HeaderEditor;