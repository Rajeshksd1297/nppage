import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight,
  ArrowLeft,
  Palette,
  Check,
  Crown
} from 'lucide-react';

interface ProfileThemeSettingsProps {
  selectedTheme: string;
  onThemeChange: (theme: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  isPro: boolean;
}

const themes = [
  { 
    id: 'minimal', 
    name: 'Minimal', 
    description: 'Clean and simple design with focus on content',
    premium: false,
    preview: 'A clean, typography-focused layout with plenty of white space'
  },
  { 
    id: 'classic', 
    name: 'Classic', 
    description: 'Traditional author page layout with elegant typography',
    premium: false,
    preview: 'Traditional layout with serif fonts and classic styling'
  },
  { 
    id: 'modern', 
    name: 'Modern', 
    description: 'Contemporary design with bold typography and gradients',
    premium: true,
    preview: 'Bold, contemporary design with dynamic gradients and animations'
  },
  { 
    id: 'literary', 
    name: 'Literary', 
    description: 'Elegant design perfect for literary works and poetry',
    premium: true,
    preview: 'Sophisticated layout with elegant typography and literary aesthetics'
  },
  { 
    id: 'creative', 
    name: 'Creative', 
    description: 'Artistic layout with creative elements and vibrant colors',
    premium: true,
    preview: 'Creative, artistic design with unique layouts and vibrant styling'
  },
  { 
    id: 'academic', 
    name: 'Academic', 
    description: 'Professional layout ideal for academic authors and researchers',
    premium: true,
    preview: 'Clean, professional design optimized for academic content'
  }
];

export function ProfileThemeSettings({ 
  selectedTheme, 
  onThemeChange, 
  onNext, 
  onPrevious, 
  isPro 
}: ProfileThemeSettingsProps) {
  
  const handleThemeSelect = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme && theme.premium && !isPro) {
      // Don't select premium themes if not pro
      return;
    }
    onThemeChange(themeId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose Your Theme</h3>
        <p className="text-muted-foreground">
          Select a theme that best represents your author brand and style.
        </p>
      </div>

      <div className="grid gap-4">
        {themes.map((theme) => {
          const isSelected = selectedTheme === theme.id;
          const isAvailable = !theme.premium || isPro;
          
          return (
            <Card 
              key={theme.id} 
              className={`
                cursor-pointer transition-all hover:shadow-md
                ${isSelected ? 'ring-2 ring-primary shadow-md' : ''}
                ${!isAvailable ? 'opacity-60' : ''}
              `}
              onClick={() => handleThemeSelect(theme.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <Palette className="w-5 h-5" />
                    <span>{theme.name}</span>
                    {theme.premium && (
                      <Badge variant="secondary" className="text-xs">
                        <Crown className="w-3 h-3 mr-1" />
                        Pro
                      </Badge>
                    )}
                  </CardTitle>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  {theme.description}
                </p>
                <div className="bg-muted/50 rounded-md p-3">
                  <p className="text-xs text-muted-foreground italic">
                    Preview: {theme.preview}
                  </p>
                </div>
                {theme.premium && !isPro && (
                  <div className="mt-3 p-2 bg-accent/20 rounded-md">
                    <p className="text-xs text-accent-foreground">
                      Upgrade to Pro to unlock this premium theme
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!isPro && (
        <div className="bg-gradient-primary rounded-lg p-6 text-center text-primary-foreground">
          <Crown className="w-8 h-8 mx-auto mb-3 opacity-90" />
          <h4 className="font-semibold mb-2">Unlock Premium Themes</h4>
          <p className="text-sm opacity-90 mb-4">
            Get access to all premium themes, custom colors, and advanced customization options
          </p>
          <Button variant="secondary" size="sm">
            Upgrade to Pro
          </Button>
        </div>
      )}

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-2">Theme Features:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div>• Responsive design for all devices</div>
          <div>• SEO optimized structure</div>
          <div>• Fast loading performance</div>
          <div>• Professional typography</div>
          <div>• Social media integration</div>
          <div>• Book showcase layouts</div>
        </div>
      </div>
    </div>
  );
}