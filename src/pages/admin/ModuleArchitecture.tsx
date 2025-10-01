import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, Newspaper, Calendar, Award, HelpCircle, Mail, 
  MessageSquare, Settings, Shield, Crown, Users, BarChart3,
  Cloud, Palette, Database, FileText, ExternalLink, CheckCircle,
  Server, Lock, Package, Layers, GitBranch
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Module {
  id: string;
  name: string;
  category: 'core' | 'content' | 'admin' | 'infrastructure';
  isolation: 5 | 4 | 3 | 2 | 1;
  icon: any;
  description: string;
  files: string[];
  dependencies: string[];
  database: string[];
  edgeFunctions?: string[];
  features: string[];
}

export default function ModuleArchitecture() {
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  const modules: Module[] = [
    {
      id: 'auth',
      name: 'Authentication',
      category: 'core',
      isolation: 5,
      icon: Lock,
      description: 'User authentication, session management, and role-based access control',
      files: [
        'src/pages/Auth.tsx',
        'src/integrations/supabase/client.ts',
        'src/components/AdminAccessGuard.tsx'
      ],
      dependencies: [],
      database: ['auth.users', 'profiles', 'user_roles'],
      edgeFunctions: ['send-auth-email'],
      features: ['Email/Password login', 'Google OAuth', 'Role management', 'Session persistence']
    },
    {
      id: 'subscription',
      name: 'Subscription',
      category: 'core',
      isolation: 4,
      icon: Crown,
      description: 'Package management, subscription plans, and feature gating',
      files: [
        'src/pages/Subscription.tsx',
        'src/hooks/useSubscription.tsx',
        'src/hooks/useDynamicFeatures.tsx',
        'src/pages/admin/PackageManagement.tsx'
      ],
      dependencies: ['auth'],
      database: ['subscription_plans', 'user_subscriptions'],
      features: ['Package management', 'Feature flags', 'Trial system', 'Real-time sync']
    },
    {
      id: 'books',
      name: 'Book Management',
      category: 'content',
      isolation: 5,
      icon: BookOpen,
      description: 'Book catalog, publishing, and management system',
      files: [
        'src/pages/Books.tsx',
        'src/pages/BookEdit.tsx',
        'src/pages/BookView.tsx',
        'src/pages/admin/BooksManagement.tsx',
        'src/components/admin/BookManagement/*'
      ],
      dependencies: ['auth', 'subscription'],
      database: ['books', 'book_analytics'],
      features: ['Book CRUD', 'ISBN lookup', 'Publishing workflow', 'Affiliate links']
    },
    {
      id: 'blog',
      name: 'Blog',
      category: 'content',
      isolation: 5,
      icon: Newspaper,
      description: 'Blog post creation, management, and publishing',
      files: [
        'src/pages/UserBlogManagement.tsx',
        'src/pages/UserBlogCreate.tsx',
        'src/pages/UserBlogEdit.tsx',
        'src/pages/admin/BlogManagement.tsx'
      ],
      dependencies: ['auth', 'subscription'],
      database: ['blog_posts', 'blog_settings'],
      features: ['Post editor', 'Draft/Publish', 'Categories', 'SEO optimization']
    },
    {
      id: 'events',
      name: 'Events',
      category: 'content',
      isolation: 5,
      icon: Calendar,
      description: 'Event creation and management system',
      files: [
        'src/pages/UserEventsManagement.tsx',
        'src/pages/UserEventCreate.tsx',
        'src/pages/admin/EventsManagement.tsx'
      ],
      dependencies: ['auth'],
      database: ['events', 'event_settings'],
      features: ['Event scheduling', 'Virtual/Physical events', 'Registration system']
    },
    {
      id: 'awards',
      name: 'Awards',
      category: 'content',
      isolation: 5,
      icon: Award,
      description: 'Award and achievement showcase',
      files: [
        'src/pages/UserAwardsManagement.tsx',
        'src/pages/UserAwardCreate.tsx',
        'src/pages/admin/AwardsManagement.tsx'
      ],
      dependencies: ['auth'],
      database: ['awards', 'awards_settings'],
      features: ['Award catalog', 'Certificate upload', 'Categories', 'Featured awards']
    },
    {
      id: 'faq',
      name: 'FAQ',
      category: 'content',
      isolation: 5,
      icon: HelpCircle,
      description: 'FAQ management system',
      files: [
        'src/pages/UserFaqManagement.tsx',
        'src/pages/UserFaqCreate.tsx',
        'src/pages/admin/FaqManagement.tsx'
      ],
      dependencies: ['auth'],
      database: ['faqs', 'faq_settings'],
      features: ['Q&A pairs', 'Categories', 'Sort order', 'Public display']
    },
    {
      id: 'newsletter',
      name: 'Newsletter',
      category: 'content',
      isolation: 4,
      icon: Mail,
      description: 'Email campaign and subscriber management',
      files: [
        'src/pages/UserNewsletterManagement.tsx',
        'src/pages/UserNewsletterCreate.tsx',
        'src/pages/admin/NewsletterManagement.tsx'
      ],
      dependencies: ['auth'],
      database: ['newsletter_campaigns', 'newsletter_subscribers', 'newsletter_settings'],
      edgeFunctions: ['send-newsletter'],
      features: ['Campaign builder', 'Subscriber lists', 'Bulk sending', 'Analytics']
    },
    {
      id: 'contact',
      name: 'Contact',
      category: 'content',
      isolation: 4,
      icon: MessageSquare,
      description: 'Contact form and submission management',
      files: [
        'src/pages/ContactForm.tsx',
        'src/pages/UserContactManagement.tsx',
        'src/components/ContactFormWidget.tsx',
        'src/pages/admin/ContactManagement.tsx'
      ],
      dependencies: ['auth'],
      database: ['contact_submissions', 'contact_replies', 'admin_contact_form_settings'],
      edgeFunctions: ['send-contact-email'],
      features: ['Form builder', 'Spam protection', 'Auto-reply', 'Status tracking']
    },
    {
      id: 'helpdesk',
      name: 'Help Desk',
      category: 'admin',
      isolation: 5,
      icon: Users,
      description: 'Support ticket management system',
      files: [
        'src/pages/SupportTickets.tsx',
        'src/pages/admin/HelpDesk.tsx',
        'src/pages/admin/TicketDetails.tsx'
      ],
      dependencies: ['auth'],
      database: ['tickets', 'ticket_replies', 'ticket_status_history', 'helpdesk_settings'],
      features: ['Ticket system', 'Priority levels', 'SLA tracking', 'Status workflow']
    },
    {
      id: 'themes',
      name: 'Themes',
      category: 'infrastructure',
      isolation: 4,
      icon: Palette,
      description: 'Theme customization and management',
      files: [
        'src/pages/Themes.tsx',
        'src/pages/admin/ThemeManagement.tsx',
        'src/components/admin/ThemeDesigner.tsx',
        'src/hooks/useRealtimeThemes.tsx'
      ],
      dependencies: ['auth'],
      database: ['themes', 'user_theme_customizations', 'theme_usage_analytics'],
      features: ['Theme builder', 'Real-time preview', 'User customization', 'Analytics']
    },
    {
      id: 'analytics',
      name: 'Analytics',
      category: 'infrastructure',
      isolation: 4,
      icon: BarChart3,
      description: 'User and system analytics',
      files: [
        'src/pages/Analytics.tsx',
        'src/pages/AdvancedAnalytics.tsx',
        'src/hooks/useAnalytics.tsx'
      ],
      dependencies: ['auth', 'subscription'],
      database: ['page_analytics', 'theme_usage_analytics'],
      features: ['Page views', 'User behavior', 'Performance metrics', 'Custom events']
    },
    {
      id: 'deployment',
      name: 'AWS Deployment',
      category: 'admin',
      isolation: 5,
      icon: Cloud,
      description: 'AWS EC2 deployment and management',
      files: [
        'src/pages/admin/AWSDeployment.tsx',
        'supabase/functions/aws-deploy/'
      ],
      dependencies: ['auth'],
      database: ['aws_settings', 'aws_deployments'],
      edgeFunctions: ['aws-deploy'],
      features: ['EC2 deployment', 'Instance management', 'Deployment logs', 'Auto-deploy']
    },
    {
      id: 'backup',
      name: 'Backup & Security',
      category: 'admin',
      isolation: 5,
      icon: Shield,
      description: 'System backup and security monitoring',
      files: [
        'src/pages/admin/BackupSecurityCenter.tsx',
        'supabase/functions/backup-manager/',
        'supabase/functions/security-monitor/'
      ],
      dependencies: ['auth'],
      database: ['backup_jobs', 'backup_settings'],
      edgeFunctions: ['backup-manager', 'security-monitor'],
      features: ['Automated backups', 'Security scanning', 'Restore system', 'Audit logs']
    }
  ];

  const getIsolationLabel = (level: number) => {
    switch (level) {
      case 5: return 'Fully Independent';
      case 4: return 'Minimal Dependencies';
      case 3: return 'Some Dependencies';
      case 2: return 'Multiple Dependencies';
      case 1: return 'Highly Coupled';
      default: return 'Unknown';
    }
  };

  const getIsolationColor = (level: number) => {
    switch (level) {
      case 5: return 'bg-green-500';
      case 4: return 'bg-blue-500';
      case 3: return 'bg-yellow-500';
      case 2: return 'bg-orange-500';
      case 1: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const coreModules = modules.filter(m => m.category === 'core');
  const contentModules = modules.filter(m => m.category === 'content');
  const adminModules = modules.filter(m => m.category === 'admin');
  const infraModules = modules.filter(m => m.category === 'infrastructure');

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Module Architecture</h1>
          <p className="text-muted-foreground">
            Visual map of all system modules and their dependencies
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href="/MODULAR_ARCHITECTURE.md" target="_blank">
            <FileText className="w-4 h-4 mr-2" />
            Full Documentation
          </a>
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{modules.length}</p>
              <p className="text-sm text-muted-foreground">Total Modules</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {modules.filter(m => m.isolation === 5).length}
              </p>
              <p className="text-sm text-muted-foreground">Fully Independent</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {modules.reduce((sum, m) => sum + m.database.length, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Database Tables</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                {modules.filter(m => m.edgeFunctions).reduce((sum, m) => sum + (m.edgeFunctions?.length || 0), 0)}
              </p>
              <p className="text-sm text-muted-foreground">Edge Functions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Categories */}
      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Modules</TabsTrigger>
          <TabsTrigger value="core">Core ({coreModules.length})</TabsTrigger>
          <TabsTrigger value="content">Content ({contentModules.length})</TabsTrigger>
          <TabsTrigger value="admin">Admin ({adminModules.length})</TabsTrigger>
          <TabsTrigger value="infra">Infrastructure ({infraModules.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((module) => (
              <Card 
                key={module.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedModule(module)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <module.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{module.name}</CardTitle>
                        <Badge variant="outline" className="mt-1">
                          {module.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {module.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getIsolationColor(module.isolation)}`} />
                      <span className="text-xs text-muted-foreground">
                        {getIsolationLabel(module.isolation)}
                      </span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="core" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coreModules.map((module) => (
              <Card key={module.id} onClick={() => setSelectedModule(module)} className="cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <module.icon className="w-5 h-5" />
                    <CardTitle>{module.name}</CardTitle>
                  </div>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contentModules.map((module) => (
              <Card key={module.id} onClick={() => setSelectedModule(module)} className="cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <module.icon className="w-5 h-5" />
                    <CardTitle className="text-base">{module.name}</CardTitle>
                  </div>
                  <CardDescription className="text-sm">{module.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="admin" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adminModules.map((module) => (
              <Card key={module.id} onClick={() => setSelectedModule(module)} className="cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <module.icon className="w-5 h-5" />
                    <CardTitle>{module.name}</CardTitle>
                  </div>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="infra" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {infraModules.map((module) => (
              <Card key={module.id} onClick={() => setSelectedModule(module)} className="cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <module.icon className="w-5 h-5" />
                    <CardTitle>{module.name}</CardTitle>
                  </div>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Module Detail Modal */}
      {selectedModule && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <selectedModule.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{selectedModule.name} Module</CardTitle>
                  <CardDescription>{selectedModule.description}</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedModule(null)}>✕</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Isolation Level */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Isolation Level
              </h4>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${getIsolationColor(selectedModule.isolation)}`} />
                <span className="font-medium">{getIsolationLabel(selectedModule.isolation)}</span>
                <Badge variant="outline">Level {selectedModule.isolation}/5</Badge>
              </div>
            </div>

            {/* Dependencies */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                Dependencies
              </h4>
              {selectedModule.dependencies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedModule.dependencies.map((dep) => (
                    <Badge key={dep} variant="secondary">{dep}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No dependencies - Fully independent</p>
              )}
            </div>

            {/* Files */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Key Files
              </h4>
              <div className="space-y-1">
                {selectedModule.files.map((file, idx) => (
                  <p key={idx} className="text-sm font-mono text-muted-foreground">
                    {file}
                  </p>
                ))}
              </div>
            </div>

            {/* Database */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Database Tables
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedModule.database.map((table) => (
                  <Badge key={table} variant="outline">{table}</Badge>
                ))}
              </div>
            </div>

            {/* Edge Functions */}
            {selectedModule.edgeFunctions && selectedModule.edgeFunctions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  Edge Functions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedModule.edgeFunctions.map((fn) => (
                    <Badge key={fn} variant="secondary">{fn}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Features */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Features
              </h4>
              <ul className="space-y-1">
                {selectedModule.features.map((feature, idx) => (
                  <li key={idx} className="text-sm flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Architecture Principles */}
      <Card>
        <CardHeader>
          <CardTitle>Architecture Principles</CardTitle>
          <CardDescription>
            Key principles ensuring modular, scalable design
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">Independent Deployment</h4>
                <p className="text-sm text-muted-foreground">
                  Each module can be updated without affecting others
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">Clear Boundaries</h4>
                <p className="text-sm text-muted-foreground">
                  Modules communicate through well-defined interfaces
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">Database Isolation</h4>
                <p className="text-sm text-muted-foreground">
                  Each module owns its tables with proper RLS
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">Team Scalability</h4>
                <p className="text-sm text-muted-foreground">
                  Multiple teams can work on different modules simultaneously
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
