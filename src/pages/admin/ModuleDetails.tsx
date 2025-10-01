import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, CheckCircle, XCircle, AlertCircle, ExternalLink,
  Database, FileCode, Layout, Settings, Link as LinkIcon,
  AlertTriangle, RefreshCw
} from 'lucide-react';

interface ModuleDetail {
  id: string;
  name: string;
  status: 'online' | 'warning' | 'offline';
  description: string;
  linkedPages: Array<{
    name: string;
    path: string;
    isPublic: boolean;
    status: 'active' | 'inactive';
  }>;
  linkedTables: Array<{
    name: string;
    hasRLS: boolean;
    recordCount: number;
    status: 'accessible' | 'restricted' | 'error';
  }>;
  linkedSettings: Array<{
    table: string;
    configured: boolean;
    path?: string;
  }>;
  edgeFunctions: Array<{
    name: string;
    status: 'deployed' | 'error';
  }>;
  troubleshootingSteps: string[];
  dependencies: string[];
}

export default function ModuleDetails() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const [module, setModule] = useState<ModuleDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (moduleId) {
      loadModuleDetails(moduleId);
    }
  }, [moduleId]);

  const loadModuleDetails = async (id: string) => {
    setIsLoading(true);
    const details = await getModuleDetails(id);
    setModule(details);
    setIsLoading(false);
  };

  const getModuleDetails = async (id: string): Promise<ModuleDetail> => {
    // Define module configurations
    const moduleConfigs: Record<string, ModuleDetail> = {
      books: {
        id: 'books',
        name: 'Book Management',
        status: 'online',
        description: 'Complete book catalog management system with ISBN lookup, publishing workflow, and affiliate links.',
        linkedPages: [
          { name: 'My Books', path: '/books', isPublic: false, status: 'active' },
          { name: 'Book Edit', path: '/books/edit/:id', isPublic: false, status: 'active' },
          { name: 'Book View', path: '/books/:id', isPublic: true, status: 'active' },
          { name: 'Book Entry Method', path: '/books/entry', isPublic: false, status: 'active' },
          { name: 'Admin Book Catalog', path: '/admin/book-catalog', isPublic: false, status: 'active' },
          { name: 'Admin Book Analytics', path: '/admin/book-analytics', isPublic: false, status: 'active' },
          { name: 'ISBN Lookup', path: '/admin/isbn-lookup', isPublic: false, status: 'active' },
        ],
        linkedTables: [
          { name: 'books', hasRLS: true, recordCount: 0, status: 'accessible' },
          { name: 'book_field_settings', hasRLS: true, recordCount: 0, status: 'accessible' },
        ],
        linkedSettings: [
          { table: 'book_field_settings', configured: true, path: '/admin/field-settings' },
        ],
        edgeFunctions: [],
        troubleshootingSteps: [
          '1. Verify books table has RLS enabled',
          '2. Check user permissions for book operations',
          '3. Ensure book_field_settings is configured',
          '4. Test book creation/update operations',
          '5. Verify ISBN lookup functionality',
        ],
        dependencies: ['auth', 'subscription'],
      },
      blog_posts: {
        id: 'blog_posts',
        name: 'Blog',
        status: 'online',
        description: 'Blog post creation, management, and publishing system with SEO optimization.',
        linkedPages: [
          { name: 'My Blog', path: '/user-blog-management', isPublic: false, status: 'active' },
          { name: 'Create Blog Post', path: '/user-blog-management/create', isPublic: false, status: 'active' },
          { name: 'Edit Blog Post', path: '/user-blog-management/edit/:id', isPublic: false, status: 'active' },
          { name: 'Admin Blog Management', path: '/admin/blog-management', isPublic: false, status: 'active' },
          { name: 'Blog Settings', path: '/admin/blog-settings', isPublic: false, status: 'active' },
        ],
        linkedTables: [
          { name: 'blog_posts', hasRLS: true, recordCount: 0, status: 'accessible' },
          { name: 'blog_settings', hasRLS: true, recordCount: 0, status: 'accessible' },
        ],
        linkedSettings: [
          { table: 'blog_settings', configured: true, path: '/admin/blog-settings' },
        ],
        edgeFunctions: [],
        troubleshootingSteps: [
          '1. Check blog_posts table RLS policies',
          '2. Verify blog_settings configuration',
          '3. Test post creation and publishing',
          '4. Check featured image uploads',
          '5. Verify SEO fields are working',
        ],
        dependencies: ['auth', 'subscription'],
      },
      contact_submissions: {
        id: 'contact_submissions',
        name: 'Contact Forms',
        status: 'online',
        description: 'Contact form and submission management with email notifications.',
        linkedPages: [
          { name: 'Contact Form', path: '/contact-form', isPublic: true, status: 'active' },
          { name: 'My Contact Submissions', path: '/contact-management', isPublic: false, status: 'active' },
          { name: 'Contact Submission Detail', path: '/contact-management/:id', isPublic: false, status: 'active' },
          { name: 'Admin Contact Management', path: '/admin/contact-management', isPublic: false, status: 'active' },
          { name: 'Contact Form Settings', path: '/admin/contact-form-settings', isPublic: false, status: 'active' },
        ],
        linkedTables: [
          { name: 'contact_submissions', hasRLS: true, recordCount: 0, status: 'accessible' },
          { name: 'contact_replies', hasRLS: true, recordCount: 0, status: 'accessible' },
          { name: 'admin_contact_form_settings', hasRLS: true, recordCount: 0, status: 'accessible' },
        ],
        linkedSettings: [
          { table: 'admin_contact_form_settings', configured: true, path: '/admin/contact-form-settings' },
        ],
        edgeFunctions: [
          { name: 'send-contact-email', status: 'deployed' },
        ],
        troubleshootingSteps: [
          '1. Check contact_submissions table access',
          '2. Verify email edge function is deployed',
          '3. Test contact form submission',
          '4. Check spam protection settings',
          '5. Verify email notifications work',
        ],
        dependencies: ['auth'],
      },
      auth: {
        id: 'auth',
        name: 'Authentication',
        status: 'online',
        description: 'User authentication, session management, and role-based access control.',
        linkedPages: [
          { name: 'Login/Signup', path: '/auth', isPublic: true, status: 'active' },
          { name: 'Profile Settings', path: '/profile', isPublic: false, status: 'active' },
        ],
        linkedTables: [
          { name: 'profiles', hasRLS: true, recordCount: 0, status: 'accessible' },
          { name: 'user_roles', hasRLS: true, recordCount: 0, status: 'accessible' },
        ],
        linkedSettings: [],
        edgeFunctions: [
          { name: 'send-auth-email', status: 'deployed' },
        ],
        troubleshootingSteps: [
          '1. Check auth service status in Supabase',
          '2. Verify email provider is configured',
          '3. Test login/signup flow',
          '4. Check user_roles table',
          '5. Verify profile creation trigger',
        ],
        dependencies: [],
      },
    };

    // Get the module config
    let moduleConfig = moduleConfigs[id] || {
      id,
      name: id,
      status: 'online' as const,
      description: 'Module details not configured',
      linkedPages: [],
      linkedTables: [],
      linkedSettings: [],
      edgeFunctions: [],
      troubleshootingSteps: ['Configuration needed'],
      dependencies: [],
    };

    // Check actual database status
    try {
      const tableChecks = await Promise.all(
        moduleConfig.linkedTables.map(async (table) => {
          try {
            const { count, error } = await supabase
              .from(table.name as any)
              .select('*', { count: 'exact', head: true });

            const status: 'accessible' | 'restricted' | 'error' = error ? 'error' : 'accessible';
            
            return {
              ...table,
              recordCount: count || 0,
              status,
            };
          } catch {
            return {
              ...table,
              status: 'error' as const,
            };
          }
        })
      );

      moduleConfig.linkedTables = tableChecks;

      // Update overall status based on checks
      const hasErrors = tableChecks.some(t => t.status === 'error');
      const hasWarnings = moduleConfig.linkedSettings.some(s => !s.configured);
      
      if (hasErrors) {
        moduleConfig.status = 'offline';
      } else if (hasWarnings) {
        moduleConfig.status = 'warning';
      }
    } catch (error) {
      console.error('Error checking module:', error);
      moduleConfig.status = 'offline';
    }

    return moduleConfig;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'active':
      case 'accessible':
      case 'deployed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
      case 'inactive':
      case 'restricted':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
      case 'active':
      case 'accessible':
      case 'deployed':
        return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">Active</Badge>;
      case 'warning':
      case 'inactive':
      case 'restricted':
        return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">Warning</Badge>;
      default:
        return <Badge className="bg-red-500/10 text-red-700 dark:text-red-400">Error</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Module not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/admin/live-module-status')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{module.name}</h1>
            {getStatusBadge(module.status)}
          </div>
          <p className="text-muted-foreground mt-1">{module.description}</p>
        </div>
        <Button onClick={() => loadModuleDetails(module.id)}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Dependencies */}
      {module.dependencies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Dependencies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {module.dependencies.map((dep) => (
                <Badge key={dep} variant="outline">{dep}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Linked Pages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5" />
            Linked Pages ({module.linkedPages.length})
          </CardTitle>
          <CardDescription>Pages that use this module</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {module.linkedPages.map((page) => (
              <div key={page.path} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  {getStatusIcon(page.status)}
                  <div>
                    <p className="font-medium">{page.name}</p>
                    <p className="text-sm text-muted-foreground">{page.path}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={page.isPublic ? 'default' : 'secondary'}>
                    {page.isPublic ? 'Public' : 'Private'}
                  </Badge>
                  <Button variant="ghost" size="icon" asChild>
                    <a href={page.path} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Database Tables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Tables ({module.linkedTables.length})
          </CardTitle>
          <CardDescription>Tables used by this module</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {module.linkedTables.map((table) => (
              <div key={table.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(table.status)}
                  <div>
                    <p className="font-medium">{table.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {table.recordCount} records • RLS: {table.hasRLS ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(table.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Settings Configuration */}
      {module.linkedSettings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Settings Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {module.linkedSettings.map((setting) => (
                <div key={setting.table} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {setting.configured ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">{setting.table}</p>
                      <p className="text-sm text-muted-foreground">
                        {setting.configured ? 'Configured' : 'Not configured'}
                      </p>
                    </div>
                  </div>
                  {setting.path && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={setting.path}>
                        Configure
                        <ExternalLink className="w-3 h-3 ml-2" />
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edge Functions */}
      {module.edgeFunctions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCode className="w-5 h-5" />
              Edge Functions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {module.edgeFunctions.map((func) => (
                <div key={func.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(func.status)}
                    <p className="font-medium">{func.name}</p>
                  </div>
                  {getStatusBadge(func.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Troubleshooting */}
      <Card className="border-orange-200 dark:border-orange-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Troubleshooting Guide
          </CardTitle>
          <CardDescription>Steps to resolve issues with this module</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {module.troubleshootingSteps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-orange-700 dark:text-orange-400">
                    {idx + 1}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{step}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
