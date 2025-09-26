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
  Mail
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { NavLink, useLocation } from "react-router-dom";

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

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "My Profile", url: "/profile", icon: User },
  { title: "My Books", url: "/books", icon: BookOpen },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

const premiumItems = [
  { title: "Advanced Analytics", url: "/advanced-analytics", icon: TrendingUp, premium: true },
  { title: "Custom Domains", url: "/custom-domains", icon: Globe, premium: true },
  { title: "Themes", url: "/themes", icon: Palette, premium: true },
  { title: "Contact Form", url: "/contact-form", icon: MessageSquare, premium: true },
  { title: "Media Kit", url: "/media-kit", icon: FileText, premium: true },
];

const bookItems = [
  { title: "Add New Book", url: "/books/new", icon: PlusCircle },
  { title: "Subscription", url: "/subscription", icon: CreditCard },
  { title: "Preview Profile", url: "/preview", icon: Eye },
];

const adminItems = [
  { title: "Manage Access", url: "/admin/users", icon: Users },
  { title: "Book Management", url: "/admin/books-management", icon: BookOpen },
  { title: "Site Settings", url: "/admin/site-settings", icon: Globe },
  { title: "Package Management", url: "/admin/package-management", icon: CreditCard },
  { title: "Email Settings", url: "/admin/email-settings", icon: Mail },
  { title: "Theme Management", url: "/admin/settings?tab=themes", icon: Palette },
  { title: "Domain Settings", url: "/admin/domain-settings", icon: Globe },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const { hasFeature } = useSubscription();

  useEffect(() => {
    getCurrentUserRole();
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

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50";

  const isAdmin = currentUserRole === 'admin';

  return (
    <Sidebar
      collapsible="icon"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems
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

        {!isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Premium Features</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {premiumItems.map((item) => {
                  const featureKey = item.title.toLowerCase().replace(/\s+/g, '_').replace('advanced_analytics', 'advanced_analytics');
                  const canAccess = hasFeature(featureKey as any);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url} 
                          className={`${getNavCls} ${!canAccess ? 'opacity-50' : ''}`}
                        >
                          <item.icon className="h-4 w-4" />
                          {!collapsed && (
                            <span className="flex items-center gap-2">
                              {item.title}
                              {!canAccess && <Crown className="w-3 h-3 text-amber-500" />}
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {!isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {bookItems.map((item) => (
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

        {isAdmin && (
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
        )}
      </SidebarContent>
    </Sidebar>
  );
}