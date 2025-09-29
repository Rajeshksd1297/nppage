import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Upload, Eye, Settings, Palette, Navigation } from 'lucide-react';
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

interface HeaderEditorVisualProps {
  onSave?: (config: HeaderConfig) => void;
  onBack?: () => void;
}

const HeaderEditorVisual = ({ onSave, onBack }: HeaderEditorVisualProps) => {
  const [config, setConfig] = useState<HeaderConfig>({
    logoUrl: '',
    logoPosition: 'left',
    navigationItems: [
      { label: 'Home', url: '/' },
      { label: 'About', url: '/about' },
      { label: 'Books', url: '/books' },
      { label: 'Contact', url: '/contact' }
    ],
    showDarkModeToggle: true,
    showLoginButton: true,
    stickyHeader: true,
    transparentHeader: false,
    backgroundColor: 'background',
    textColor: 'foreground'
  });

  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
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

  const getPreviewSize = () => {
    switch (previewMode) {
      case 'tablet': return 'max-w-2xl';
      case 'mobile': return 'max-w-sm';
      default: return 'max-w-full';
    }
  };

  const HeaderPreview = () => (
    <div className={`mx-auto transition-all duration-300 ${getPreviewSize()}`}>
      <div 
        className={`border rounded-lg overflow-hidden shadow-sm ${
          config.backgroundColor === 'transparent' ? 'bg-transparent' : 
          config.backgroundColor === 'primary' ? 'bg-primary text-primary-foreground' :
          config.backgroundColor === 'secondary' ? 'bg-secondary text-secondary-foreground' :
          config.backgroundColor === 'muted' ? 'bg-muted text-muted-foreground' :
          'bg-background text-foreground'
        }`}
      >
        <div className="flex items-center justify-between p-4">
          {/* Logo Section */}
          <div className={`flex items-center ${
            config.logoPosition === 'center' ? 'justify-center flex-1' :
            config.logoPosition === 'right' ? 'order-3' : ''
          }`}>
            {config.logoUrl ? (
              <img 
                src={config.logoUrl} 
                alt="Logo" 
                className="h-8 w-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.removeAttribute('style');
                }}
              />
            ) : null}
            <div 
              className={`text-lg font-bold ${config.logoUrl ? 'hidden' : ''}`}
              style={{ display: config.logoUrl ? 'none' : 'block' }}
            >
              Your Logo
            </div>
          </div>

          {/* Navigation */}
          {config.logoPosition !== 'center' && (
            <nav className={`flex items-center space-x-4 ${
              config.logoPosition === 'right' ? 'order-1' : 'order-2'
            }`}>
              {config.navigationItems.slice(0, 4).map((item, index) => (
                <a
                  key={index}
                  href={item.url}
                  className="text-sm hover:opacity-80 transition-opacity"
                  onClick={(e) => e.preventDefault()}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          )}

          {/* Actions */}
          <div className={`flex items-center space-x-2 ${
            config.logoPosition === 'center' ? 'order-3' :
            config.logoPosition === 'right' ? 'order-2' : 'order-3'
          }`}>
            {config.showDarkModeToggle && (
              <button className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                🌙
              </button>
            )}
            {config.showLoginButton && (
              <button className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                Login
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation (shown on mobile preview) */}
        {previewMode === 'mobile' && config.navigationItems.length > 0 && (
          <div className="border-t p-4 space-y-2">
            {config.navigationItems.map((item, index) => (
              <a
                key={index}
                href={item.url}
                className="block text-sm py-2 hover:opacity-80 transition-opacity"
                onClick={(e) => e.preventDefault()}
              >
                {item.label}
              </a>
            ))}
          </div>
        )}
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
              <Navigation className="h-5 w-5" />
              <h3 className="font-semibold">Header Editor</h3>
            </div>
            <Button onClick={handleSave} size="sm">Save</Button>
          </div>

          {/* Logo Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Logo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="logoUrl" className="text-xs">Logo URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="logoUrl"
                    placeholder="https://example.com/logo.png"
                    value={config.logoUrl}
                    onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                    className="text-xs"
                  />
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Upload className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="logoPosition" className="text-xs">Position</Label>
                <Select
                  value={config.logoPosition}
                  onValueChange={(value: 'left' | 'center' | 'right') => 
                    setConfig({ ...config, logoPosition: value })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
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

          {/* Navigation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                Navigation
                <Button onClick={addNavigationItem} variant="outline" size="sm" className="h-6 text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {config.navigationItems.map((item, index) => (
                <div key={index} className="flex gap-1 items-center">
                  <Input
                    value={item.label}
                    onChange={(e) => updateNavigationItem(index, 'label', e.target.value)}
                    placeholder="Label"
                    className="h-7 text-xs"
                  />
                  <Input
                    value={item.url}
                    onChange={(e) => updateNavigationItem(index, 'url', e.target.value)}
                    placeholder="URL"
                    className="h-7 text-xs"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => removeNavigationItem(index)}
                    className="h-7 w-7"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Behavior */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Behavior</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="darkMode" className="text-xs">Dark Mode Toggle</Label>
                <Switch
                  id="darkMode"
                  checked={config.showDarkModeToggle}
                  onCheckedChange={(checked) => setConfig({ ...config, showDarkModeToggle: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="loginBtn" className="text-xs">Login Button</Label>
                <Switch
                  id="loginBtn"
                  checked={config.showLoginButton}
                  onCheckedChange={(checked) => setConfig({ ...config, showLoginButton: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="sticky" className="text-xs">Sticky Header</Label>
                <Switch
                  id="sticky"
                  checked={config.stickyHeader}
                  onCheckedChange={(checked) => setConfig({ ...config, stickyHeader: checked })}
                />
              </div>
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
                    <SelectItem value="transparent">Transparent</SelectItem>
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
              <span className="text-sm font-medium">Header Preview</span>
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

          <HeaderPreview />
          
          {/* Preview Info */}
          <div className="mt-4 p-3 bg-background border rounded-lg">
            <h4 className="text-sm font-medium mb-2">Preview Notes</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Changes appear instantly in the preview</li>
              <li>• Test different device sizes using the device buttons</li>
              <li>• Navigation links are disabled in preview mode</li>
              <li>• Click "Save" to apply changes to your live site</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeaderEditorVisual;