import { useState, useEffect } from "react";
import { 
  Home, 
  User, 
  BookOpen, 
  BarChart3, 
  Settings, 
  Users,
  PlusCircle,
  Eye,
  Crown,
  Globe,
  Palette,
  MessageSquare,
  FileText,
  TrendingUp,
  CreditCard,
  Search,
  Share2,
  Building2,
  Upload,
  Mail,
  MessageCircle,
  Lock,
  Badge as BadgeIcon,
  ExternalLink,
  Newspaper,
  Image,
  Calendar,
  Award,
  HelpCircle,
  Cookie,
  Server
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { useDynamicFeatures } from '@/hooks/useDynamicFeatures';
import { NavLink, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

// Free tier navigation items
const freeItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Profile Settings", url: "/profile", icon: Settings },
  { title: "My Books", url: "/books", icon: BookOpen },
  { title: "Basic Analytics", url: "/analytics", icon: BarChart3 },
];

// Pro tier navigation items with feature mapping
const proItems = [
  { 
    title: "Advanced Analytics", 
    url: "/advanced-analytics", 
    icon: TrendingUp, 
    feature: "advanced_analytics",
    description: "Detailed insights & reports"
  },
  { 
    title: "Custom Domains", 
    url: "/custom-domains", 
    icon: Globe, 
    feature: "custom_domain",
    description: "Your own domain"
  },
  { 
    title: "Themes", 
    url: "/themes", 
    icon: Palette, 
    feature: "premium_themes",
    description: "Customize your theme"
  },
];

// Quick actions - always available
const getQuickActions = (userSlug: string | null, isAdmin: boolean) => [
  { 
    title: "View Profile Page", 
    url: isAdmin ? "/profile" : (userSlug ? `/${userSlug}` : "/profile"), 
    icon: Eye, 
    external: isAdmin ? false : (userSlug ? true : false)
  },
];

// Support & Account - always available
const supportItems = [
  { title: "Social Connections", url: "/social-connections", icon: Share2 },
  { title: "SEO Dashboard", url: "/seo-dashboard", icon: Search },
  { title: "Support Tickets", url: "/support-tickets", icon: MessageCircle },
  { title: "Subscription", url: "/subscription", icon: CreditCard },
];

// Core Admin Features
const coreAdminItems = [
  { title: "Admin Dashboard", url: "/admin", icon: BarChart3 },
  { title: "Manage Users", url: "/admin/users", icon: Users },
  { title: "Help Desk", url: "/admin/help-desk", icon: MessageCircle },
];

// Site Management
const siteManagementItems = [
  { title: "Home Page Management", url: "/admin/home-page-management", icon: Home },
  { title: "Theme Management", url: "/admin/theme-management", icon: Palette },
  { title: "Domain Settings", url: "/admin/domain-settings", icon: Globe },
  { title: "Email Settings", url: "/admin/email-settings", icon: Mail },
  { title: "AWS Deployment", url: "/admin/aws-deployment", icon: Server },
  { title: "AWS Settings", url: "/admin/aws-settings", icon: Settings },
];

// Book Management
const bookManagementItems = [
  { title: "Book Catalog", url: "/admin/book-catalog", icon: BookOpen },
  { title: "Book Analytics", url: "/admin/book-analytics", icon: BarChart3 },
  { title: "ISBN Lookup", url: "/admin/isbn-lookup", icon: Search },
  { title: "Field Settings", url: "/admin/field-settings", icon: Settings },
  { title: "Affiliate Settings", url: "/admin/affiliate-settings", icon: Globe },
];

// Content Management
const contentManagementItems = [
  { title: "Blog Management", url: "/admin/blog-management", icon: Newspaper },
  { title: "Events Management", url: "/admin/events-management", icon: Calendar },
  { title: "Awards Management", url: "/admin/awards-management", icon: Award },
  { title: "FAQ Management", url: "/admin/faq-management", icon: HelpCircle },
  { title: "Newsletter Management", url: "/admin/newsletter-management", icon: Mail },
  { title: "Contact Management", url: "/admin/contact-management", icon: MessageSquare },
  { title: "Contact Form Settings", url: "/admin/contact-form-settings", icon: Settings },
  { title: "Cookie Consent", url: "/admin/cookie-consent", icon: Cookie },
];

// Business Management
const businessManagementItems = [
  { title: "Publisher Management", url: "/admin/publishers", icon: Building2 },
  { title: "Package Management", url: "/admin/package-management", icon: CreditCard },
  { title: "Help Desk Settings", url: "/admin/help-desk-settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [userSlug, setUserSlug] = useState<string | null>(null);
  const { hasFeature, subscription, isPro, isFree, isOnTrial, trialDaysLeft } = useSubscription();
  const { getPlanFeatures } = useDynamicFeatures();

  useEffect(() => {
    getCurrentUserRole();
    getUserProfile();
  }, []);

  const getCurrentUserRole = async () => {
    try {
      const { data, error } = await supabase.rpc('get_current_user_role');
      if (error) throw error;
      setCurrentUserRole(data);
    } catch (error) {
      console.error('Error getting user role:', error);
    }
  };

  const getUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Fetching profile for sidebar, user ID:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('slug, full_name')
        .eq('id', user.id)
        .single();

      console.log('Profile data for sidebar:', { data, error });

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data?.slug) {
        setUserSlug(data.slug);
      } else {
        console.log('No slug found for user');
        setUserSlug(null);
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      setUserSlug(null);
    }
  };

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50";

  const isAdmin = currentUserRole === 'admin';
  const quickActions = getQuickActions(userSlug, isAdmin);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Subscription Status Header */}
        {!isAdmin && subscription && (
          <div className="p-4 border-b">
            <div className="flex items-center gap-2 mb-2">
              {isPro() ? (
                <Crown className="w-4 h-4 text-amber-500" />
              ) : (
                <BadgeIcon className="w-4 h-4 text-muted-foreground" />
              )}
              <Badge variant={isPro() ? 'default' : 'secondary'} className="text-xs">
                {subscription.subscription_plans.name}
              </Badge>
            </div>
            {isOnTrial() && !collapsed && (
              <p className="text-xs text-amber-600 font-medium">
                Trial: {trialDaysLeft} days left
              </p>
            )}
          </div>
        )}

        {/* Main Features */}
        {!isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <div className="flex items-center gap-2">
                Main Features
              </div>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {freeItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavCls}>
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {/* Quick Actions in Main Features */}
                {quickActions.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      {item.external ? (
                        <a 
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 hover:bg-sidebar-accent/50 rounded-md p-2"
                        >
                          <item.icon className="h-4 w-4" />
                          {!collapsed && (
                            <>
                              <span>{item.title}</span>
                              <ExternalLink className="h-3 w-3 ml-auto" />
                            </>
                          )}
                        </a>
                      ) : (
                        <NavLink to={item.url} className={getNavCls}>
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Pro Features */}
        {!isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <div className="flex items-center gap-2">
                <Crown className="w-3 h-3 text-amber-500" />
                Pro Features
                {isPro() && !collapsed && (
                  <Badge variant="default" className="text-xs">Available</Badge>
                )}
              </div>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {proItems.map((item) => {
                  const canAccess = hasFeature(item.feature as any);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={canAccess ? item.url : '/subscription'} 
                          className={`${getNavCls} ${!canAccess ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <item.icon className="h-4 w-4" />
                            {!collapsed && (
                              <div className="flex items-center justify-between flex-1">
                                <span>{item.title}</span>
                                {!canAccess && <Lock className="w-3 h-3 text-muted-foreground" />}
                              </div>
                            )}
                          </div>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
                
                {/* Content Management Tools - Always show, but lock if not available */}
                {(() => {
                  const currentPlanFeatures = subscription?.subscription_plans?.id 
                    ? getPlanFeatures(subscription.subscription_plans.id) 
                    : [];
                  
                  const contentFeatures = [
                    {
                      feature: 'contact_forms',
                      title: 'My Contact',
                      url: '/contact-management',
                      icon: MessageSquare
                    },
                    {
                      feature: 'blog',
                      title: 'My Blog',
                      url: '/user-blog-management',
                      icon: Newspaper
                    },
                    {
                      feature: 'events',
                      title: 'My Events',
                      url: '/user-events-management',
                      icon: Calendar
                    },
                    {
                      feature: 'awards',
                      title: 'My Awards',
                      url: '/user-awards-management',
                      icon: Award
                    },
                    {
                      feature: 'faq',
                      title: 'My FAQ',
                      url: '/user-faq-management',
                      icon: HelpCircle
                    },
                    {
                      feature: 'newsletter',
                      title: 'My Newsletter',
                      url: '/user-newsletter-management',
                      icon: Mail
                    }
                  ];

                  return contentFeatures.map((item) => {
                    const isFeatureEnabled = currentPlanFeatures.some(f => f.id === item.feature && f.enabled);
                    
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink 
                            to={isFeatureEnabled ? item.url : '/subscription'} 
                            className={`${getNavCls} ${!isFeatureEnabled ? 'opacity-60' : ''}`}
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <item.icon className="h-4 w-4" />
                              {!collapsed && (
                                <div className="flex items-center justify-between flex-1">
                                  <span>{item.title}</span>
                                  {!isFeatureEnabled && <Lock className="w-3 h-3 text-muted-foreground" />}
                                </div>
                              )}
                            </div>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  });
                })()}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Tools Features */}
        {!isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Tools Features</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/subscription" className={getNavCls}>
                      <CreditCard className="h-4 w-4" />
                      {!collapsed && <span>Subscription</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/support-tickets" className={getNavCls}>
                      <MessageCircle className="h-4 w-4" />
                      {!collapsed && <span>Support Tickets</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin Sections */}
        {isAdmin && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>Core Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {coreAdminItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} className={getNavCls}>
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Site Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {siteManagementItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} className={getNavCls}>
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Book Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {bookManagementItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} className={getNavCls}>
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Content Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {contentManagementItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} className={getNavCls}>
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Business Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {businessManagementItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} className={getNavCls}>
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}