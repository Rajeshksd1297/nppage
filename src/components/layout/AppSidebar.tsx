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
  ExternalLink
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
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
  { title: "My Profile", url: "/profile", icon: User },
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
    title: "Premium Themes", 
    url: "/themes", 
    icon: Palette, 
    feature: "premium_themes",
    description: "Beautiful designs"
  },
  { 
    title: "Contact Form", 
    url: "/contact-form", 
    icon: MessageSquare, 
    feature: "contact_form",
    description: "Reader contact form"
  },
  { 
    title: "Media Kit", 
    url: "/media-kit", 
    icon: FileText, 
    feature: "media_kit",
    description: "Professional media kit"
  },
];

// Quick actions - always available
const getQuickActions = (userSlug: string | null) => [
  { title: "Add New Book", url: "/books/new", icon: PlusCircle },
  { 
    title: "My Profile Page", 
    url: userSlug ? `/${userSlug}` : "/profile", 
    icon: Eye, 
    external: userSlug ? true : false 
  },
  { title: "Social Connections", url: "/social-connections", icon: Share2 },
];

// Support & Account - always available
const supportItems = [
  { title: "Support Tickets", url: "/support-tickets", icon: MessageCircle },
  { title: "Subscription", url: "/subscription", icon: CreditCard },
];

const adminItems = [
  { title: "Manage Access", url: "/admin/users", icon: Users },
  { title: "Help Desk", url: "/admin/help-desk", icon: MessageCircle },
  { title: "Publishers", url: "/admin/publishers", icon: Building2 },
  { title: "Site Settings", url: "/admin/site-settings", icon: Globe },
  { title: "Package Management", url: "/admin/package-management", icon: CreditCard },
  { title: "Email Settings", url: "/admin/email-settings", icon: Mail },
  { title: "Domain Settings", url: "/admin/domain-settings", icon: Globe },
];

const bookManagementItems = [
  { title: "Book Catalog", url: "/admin/book-catalog", icon: BookOpen },
  { title: "ISBN Lookup", url: "/admin/isbn-lookup", icon: Search },
  { title: "Affiliate Settings", url: "/admin/affiliate-settings", icon: Globe },
  { title: "Field Settings", url: "/admin/field-settings", icon: Settings },
  { title: "Book Analytics", url: "/admin/book-analytics", icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [userSlug, setUserSlug] = useState<string | null>(null);
  const { hasFeature, subscription, isPro, isFree, isOnTrial, trialDaysLeft } = useSubscription();

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
  const quickActions = getQuickActions(userSlug);

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

        {/* Free Tier Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>
            <div className="flex items-center gap-2">
              Core Features
              {isFree() && !collapsed && (
                <Badge variant="outline" className="text-xs">Free</Badge>
              )}
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {freeItems
                .filter(item => !isAdmin || (item.title === "Dashboard" || item.title === "My Profile"))
                .map((item) => (
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

        {/* Pro Features Section */}
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
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Quick Actions */}
        {!isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
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

        {/* Support & Account */}
        {!isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Account</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {supportItems.map((item) => (
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
        )}

        {/* Admin Sections */}
        {isAdmin && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminItems.map((item) => (
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
              <SidebarGroupLabel>Support & Settings</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/admin/help-desk-settings" className={getNavCls}>
                        <Settings className="h-4 w-4" />
                        {!collapsed && <span>Help Desk Settings</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/admin/settings" className={getNavCls}>
                        <Palette className="h-4 w-4" />
                        {!collapsed && <span>Theme Management</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}