import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedSEOManager } from '@/components/admin/EnhancedSEOManager';
import { 
  Home,
  Settings,
  Eye,
  Plus,
  Edit,
  BarChart3,
  Layout,
  Globe,
  Cookie,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HomePageManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveSEOSettings = async () => {
    setSaving(true);
    try {
      toast({
        title: "Success",
        description: "SEO settings saved successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save SEO settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold flex items-center gap-2 text-xl">
            <Home className="h-8 w-8" />
            Home Page Management
          </h1>
          <p className="text-muted-foreground text-sm">Manage your website's homepage content and settings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/admin')}>
            <Settings className="h-4 w-4 mr-2" />
            Admin Dashboard
          </Button>
          <Button onClick={() => window.open('/', '_blank')}>
            <Eye className="h-4 w-4 mr-2" />
            Preview Site
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-full flex-wrap justify-start gap-1 h-auto p-1 bg-muted">
          <TabsTrigger value="overview" className="flex-shrink-0 text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="content" className="flex-shrink-0 text-xs sm:text-sm">Content</TabsTrigger>
          <TabsTrigger value="hero" className="flex-shrink-0 text-xs sm:text-sm">Hero Blocks</TabsTrigger>
          <TabsTrigger value="seo" className="flex-shrink-0 text-xs sm:text-sm">SEO</TabsTrigger>
          <TabsTrigger value="design" className="flex-shrink-0 text-xs sm:text-sm">Design</TabsTrigger>
          <TabsTrigger value="cookies" className="flex-shrink-0 text-xs sm:text-sm">Cookie Analytics</TabsTrigger>
          <TabsTrigger value="backup" className="flex-shrink-0 text-xs sm:text-sm">Backup & Security</TabsTrigger>
          <TabsTrigger value="settings" className="flex-shrink-0 text-xs sm:text-sm">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12,234</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2,350</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Layout className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3.2%</div>
                <p className="text-xs text-muted-foreground">+0.5% from last month</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks for homepage management</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" onClick={() => setActiveTab('content')}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Content
              </Button>
              <Button variant="outline" onClick={() => setActiveTab('hero')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Hero Block
              </Button>
              <Button variant="outline" onClick={() => setActiveTab('seo')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Optimize SEO
              </Button>
              <Button variant="outline" onClick={() => setActiveTab('design')}>
                <Layout className="h-4 w-4 mr-2" />
                Customize Design
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Management</CardTitle>
              <CardDescription>Manage your homepage content sections</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Content management features coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hero" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hero Blocks</CardTitle>
              <CardDescription>Create and manage hero sections</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Hero block management features coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <EnhancedSEOManager onSave={handleSaveSEOSettings} />
        </TabsContent>

        <TabsContent value="design" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Design Settings</CardTitle>
              <CardDescription>Customize your homepage appearance</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Design customization features coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cookies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5" />
                Cookie Analytics & Consent
              </CardTitle>
              <CardDescription>Manage cookie consent and analytics tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Cookie management features coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Backup & Security
              </CardTitle>
              <CardDescription>Secure your website data and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Backup and security features coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure general website settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p>General settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HomePageManagement;