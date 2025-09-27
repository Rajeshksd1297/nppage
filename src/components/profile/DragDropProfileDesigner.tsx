import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  BookOpen, 
  Mail, 
  Star,
  Quote,
  Image as ImageIcon,
  Layout,
  Heart
} from 'lucide-react';

interface LayoutSection {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  config: any;
  order: number;
}

interface DragDropProfileDesignerProps {
  sections?: LayoutSection[];
  themeConfig?: any;
  preview?: boolean;
}

export function DragDropProfileDesigner({ 
  sections = [], 
  themeConfig = {}, 
  preview = false 
}: DragDropProfileDesignerProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const renderSectionPreview = (section: LayoutSection) => {
    const baseClasses = "p-4 border rounded-lg transition-all duration-200";
    const activeClasses = selectedSection === section.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50";
    
    switch (section.type) {
      case 'hero':
        return (
          <div className={`${baseClasses} ${activeClasses} bg-gradient-to-r from-blue-500/10 to-purple-500/10`}>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Author Name</h2>
              <p className="text-muted-foreground">Bestselling author and storyteller</p>
              <Button size="sm">Learn More</Button>
            </div>
          </div>
        );
      
      case 'about':
        return (
          <div className={`${baseClasses} ${activeClasses}`}>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Quote className="h-5 w-5" />
                About Me
              </h3>
              <p className="text-sm text-muted-foreground">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
            </div>
          </div>
        );
      
      case 'books':
        return (
          <div className={`${baseClasses} ${activeClasses}`}>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                My Books
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-[3/4] bg-muted rounded-md flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'contact':
        return (
          <div className={`${baseClasses} ${activeClasses}`}>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Get in Touch
              </h3>
              <div className="space-y-2">
                <div className="h-8 bg-muted rounded"></div>
                <div className="h-8 bg-muted rounded"></div>
                <div className="h-16 bg-muted rounded"></div>
                <Button size="sm" className="w-full">Send Message</Button>
              </div>
            </div>
          </div>
        );
      
      case 'gallery':
        return (
          <div className={`${baseClasses} ${activeClasses}`}>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Gallery
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-square bg-muted rounded-md flex items-center justify-center">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'testimonial':
        return (
          <div className={`${baseClasses} ${activeClasses}`}>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Star className="h-5 w-5" />
                Testimonials
              </h3>
              <div className="space-y-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground italic">
                  "An amazing author with incredible storytelling abilities..."
                </p>
                <p className="text-xs text-muted-foreground">- Reader Name</p>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className={`${baseClasses} ${activeClasses}`}>
            <div className="text-center space-y-2">
              <Layout className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Custom Section</p>
            </div>
          </div>
        );
    }
  };

  if (preview) {
    return (
      <div className="space-y-4 p-4 h-full overflow-y-auto">
        {sections
          .filter(section => section.enabled)
          .sort((a, b) => a.order - b.order)
          .map((section) => (
            <div key={section.id}>
              {renderSectionPreview(section)}
            </div>
          ))}
        {sections.filter(s => s.enabled).length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Layout className="h-12 w-12 mx-auto mb-2" />
              <p>No sections enabled</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Layout Designer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sections.map((section) => (
              <div
                key={section.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedSection === section.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedSection(section.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{section.name}</h4>
                    <Badge variant="outline">{section.type}</Badge>
                  </div>
                  <Badge variant={section.enabled ? 'default' : 'secondary'}>
                    {section.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                {renderSectionPreview(section)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}