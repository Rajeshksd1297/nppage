import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GripVertical, 
  Eye, 
  Save, 
  BarChart3, 
  Book, 
  Instagram, 
  Globe,
  Palette,
  Layout,
  Settings
} from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, ResponsiveContainer } from 'recharts';

interface ProfileSection {
  id: string;
  type: 'header' | 'social' | 'books' | 'analytics';
  title: string;
  enabled: boolean;
  config: any;
}

interface SortableItemProps {
  id: string;
  section: ProfileSection;
  onToggle: (id: string) => void;
  onConfig: (id: string) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, section, onToggle, onConfig }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'header': return <Globe className="w-4 h-4" />;
      case 'social': return <Instagram className="w-4 h-4" />;
      case 'books': return <Book className="w-4 h-4" />;
      case 'analytics': return <BarChart3 className="w-4 h-4" />;
      default: return <Layout className="w-4 h-4" />;
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <Card className={`border transition-all ${section.enabled ? 'border-primary' : 'border-muted'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div {...attributes} {...listeners} className="cursor-grab hover:cursor-grabbing">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
              </div>
              {getIcon(section.type)}
              <span className="font-medium">{section.title}</span>
              <Badge variant={section.enabled ? "default" : "secondary"}>
                {section.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onConfig(id)}
              >
                <Settings className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant={section.enabled ? "destructive" : "default"}
                onClick={() => onToggle(id)}
              >
                {section.enabled ? "Disable" : "Enable"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ProfilePreview: React.FC<{ sections: ProfileSection[] }> = ({ sections }) => {
  const enabledSections = sections.filter(s => s.enabled);

  const mockBooks = [
    { id: 1, title: "The Silent Love", cover: "/api/placeholder/200/300", color: "from-teal-400 to-teal-600" },
    { id: 2, title: "Wings of Destiny", cover: "/api/placeholder/200/300", color: "from-purple-400 to-pink-400" },
    { id: 3, title: "Journey Within", cover: "/api/placeholder/200/300", color: "from-orange-400 to-yellow-400" }
  ];

  const analyticsData = {
    pie: [
      { name: 'Direct', value: 60, color: '#8b5cf6' },
      { name: 'Other', value: 40, color: '#a855f7' }
    ],
    line: [
      { month: 'Jun', views: 500 },
      { month: 'Feb', views: 1200 },
      { month: 'Mrz', views: 1800 },
      { month: 'April', views: 2500 },
      { month: 'April', views: 3000 }
    ],
    bar: [
      { month: 'M1', clicks: 5 },
      { month: 'M2', clicks: 8 },
      { month: 'M3', clicks: 12 },
      { month: 'M4', clicks: 45 },
      { month: 'M5', clicks: 65 },
      { month: 'M6', clicks: 80 }
    ]
  };

  const renderSection = (section: ProfileSection) => {
    switch (section.type) {
      case 'header':
        return (
          <div key={section.id} className="text-center mb-8">
            <Avatar className="w-48 h-48 mx-auto mb-6">
              <AvatarImage src="/api/placeholder/300/300" />
              <AvatarFallback className="text-4xl">NS</AvatarFallback>
            </Avatar>
            <h1 className="text-4xl font-bold mb-4">Neha Sharma</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Neha Sharma is an author of contemporary romance novels. Her books explore themes of love, 
              relationships, and personal growth, she has passion for storytelling and connecting with readers.
            </p>
          </div>
        );

      case 'social':
        return (
          <div key={section.id} className="flex flex-wrap gap-4 justify-center mb-12">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg">
              <Globe className="w-5 h-5 mr-2" />
              Amazon
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg">
              <Book className="w-5 h-5 mr-2" />
              Goodreads
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg">
              <Instagram className="w-5 h-5 mr-2" />
              Instagram
            </Button>
          </div>
        );

      case 'books':
        return (
          <div key={section.id} className="mb-12">
            <h2 className="text-3xl font-bold mb-8">Books</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {mockBooks.map((book) => (
                <div key={book.id} className="text-center">
                  <div className={`w-full h-80 bg-gradient-to-br ${book.color} rounded-lg mb-4 flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                    {book.title}
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{book.title}</h3>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3">
                    Buy
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div key={section.id} className="mb-12">
            <h2 className="text-3xl font-bold mb-8">Website Analytics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Traffic Sources</h3>
                <div className="flex items-center justify-between">
                  <ResponsiveContainer width="60%" height={200}>
                    <PieChart>
                      <Pie
                        data={analyticsData.pie}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {analyticsData.pie.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                      <span>Direct</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-purple-400 rounded-full mr-2"></div>
                      <span>Other</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Monthly Views</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={analyticsData.line}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="views" stroke="#8b5cf6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6 lg:col-span-2">
                <h3 className="text-xl font-semibold mb-4">Link Clicks</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analyticsData.bar}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="clicks" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-muted/30 min-h-screen p-8">
      <div className="max-w-6xl mx-auto bg-background rounded-lg shadow-lg p-8">
        {enabledSections.map(renderSection)}
      </div>
    </div>
  );
};

export default function DragDropProfileDesigner() {
  const [sections, setSections] = useState<ProfileSection[]>([
    {
      id: 'header',
      type: 'header',
      title: 'Profile Header',
      enabled: true,
      config: {}
    },
    {
      id: 'social',
      type: 'social',
      title: 'Social Links',
      enabled: true,
      config: {}
    },
    {
      id: 'books',
      type: 'books',
      title: 'Books Showcase',
      enabled: true,
      config: {}
    },
    {
      id: 'analytics',
      type: 'analytics',
      title: 'Website Analytics',
      enabled: true,
      config: {}
    }
  ]);

  const [activeTab, setActiveTab] = useState('design');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(section => 
      section.id === id ? { ...section, enabled: !section.enabled } : section
    ));
  };

  const configureSection = (id: string) => {
    // Placeholder for section configuration
    console.log('Configure section:', id);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Theme Designer</h1>
              <p className="text-muted-foreground">Design your author profile with drag & drop</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button>
                <Save className="w-4 h-4 mr-2" />
                Save Theme
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="design" className="flex items-center space-x-2">
              <Layout className="w-4 h-4" />
              <span>Layout</span>
            </TabsTrigger>
            <TabsTrigger value="style" className="flex items-center space-x-2">
              <Palette className="w-4 h-4" />
              <span>Style</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="design" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Page Sections</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Drag to reorder sections, toggle to enable/disable
                  </p>
                </CardHeader>
                <CardContent>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={sections.map(s => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {sections.map((section) => (
                        <SortableItem
                          key={section.id}
                          id={section.id}
                          section={section}
                          onToggle={toggleSection}
                          onConfig={configureSection}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Section Settings</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Customize each section's appearance and content
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Select a section from the left to configure its settings.
                    </p>
                    <div className="p-4 border border-dashed rounded-lg text-center">
                      <Settings className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Configuration panel will appear here
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="style" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme Styling</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Customize colors, fonts, and visual elements
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Colors</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'].map((color) => (
                        <button
                          key={color}
                          className="w-12 h-12 rounded-lg border-2 border-white shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Typography</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        Inter (Current)
                      </Button>
                      <Button variant="ghost" className="w-full justify-start">
                        Roboto
                      </Button>
                      <Button variant="ghost" className="w-full justify-start">
                        Open Sans
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Layout</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        Centered Layout
                      </Button>
                      <Button variant="ghost" className="w-full justify-start">
                        Wide Layout
                      </Button>
                      <Button variant="ghost" className="w-full justify-start">
                        Compact Layout
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="mt-6">
            <ProfilePreview sections={sections} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}