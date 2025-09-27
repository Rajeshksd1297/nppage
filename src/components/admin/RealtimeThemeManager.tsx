import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Eye,
  Palette,
  Activity,
  Bell,
  Settings
} from 'lucide-react';
import { useRealtimeThemes } from '@/hooks/useRealtimeThemes';
import { UserThemeCustomizer } from '@/components/profile/UserThemeCustomizer';

interface RealtimeThemeManagerProps {
  onThemeSelect?: (theme: any) => void;
}

export function RealtimeThemeManager({ onThemeSelect }: RealtimeThemeManagerProps) {
  const {
    themes,
    userCustomizations,
    themeAnalytics,
    onlineUsers,
    loading,
    applyTheme,
    trackThemeUsage
  } = useRealtimeThemes();

  const [selectedTheme, setSelectedTheme] = useState(null);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [realtimeUpdates, setRealtimeUpdates] = useState<any[]>([]);

  useEffect(() => {
    // Track real-time updates for notifications
    if (themes.length > 0 || userCustomizations.length > 0 || themeAnalytics.length > 0) {
      const update = {
        id: Date.now(),
        type: 'theme_activity',
        message: 'Theme data updated',
        timestamp: new Date().toISOString()
      };
      setRealtimeUpdates(prev => [update, ...prev.slice(0, 9)]);
    }
  }, [themes, userCustomizations, themeAnalytics]);

  const handleThemeSelect = (theme: any) => {
    setSelectedTheme(theme);
    trackThemeUsage(theme.id, 'viewed', {
      context: 'realtime_manager',
      timestamp: new Date().toISOString()
    });
    onThemeSelect?.(theme);
  };

  const handleCustomizeTheme = (theme: any) => {
    setSelectedTheme(theme);
    setShowCustomizer(true);
    trackThemeUsage(theme.id, 'customized', {
      context: 'customizer_opened',
      timestamp: new Date().toISOString()
    });
  };

  const handleApplyTheme = async (customConfig: any) => {
    if (selectedTheme) {
      await applyTheme(selectedTheme.id, customConfig);
      setShowCustomizer(false);
      setSelectedTheme(null);
    }
  };

  const getThemeUsageCount = (themeId: string) => {
    return userCustomizations.filter(c => c.theme_id === themeId && c.is_active).length;
  };

  const getRecentActivity = (themeId: string) => {
    return themeAnalytics
      .filter(a => a.theme_id === themeId)
      .slice(0, 3)
      .map(activity => ({
        action: activity.action,
        timestamp: activity.created_at
      }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading real-time theme data...</p>
        </div>
      </div>
    );
  }

  if (showCustomizer && selectedTheme) {
    return (
      <UserThemeCustomizer
        selectedTheme={selectedTheme}
        onSave={handleApplyTheme}
        onCancel={() => {
          setShowCustomizer(false);
          setSelectedTheme(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time Status Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Live</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{onlineUsers.length} users online</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{realtimeUpdates.length} recent updates</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onlineUsers.slice(0, 3).map((user, index) => (
                <Avatar key={index} className="w-6 h-6">
                  <AvatarFallback className="text-xs">
                    {user.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              ))}
              {onlineUsers.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{onlineUsers.length - 3} more
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Grid with Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {themes.map((theme) => {
          const usageCount = getThemeUsageCount(theme.id);
          const recentActivity = getRecentActivity(theme.id);
          
          return (
            <Card key={theme.id} className="group hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" />
                    <CardTitle className="text-base">{theme.name}</CardTitle>
                    {theme.premium && (
                      <Badge variant="secondary" className="text-xs">Premium</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>{usageCount}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{theme.description}</p>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Real-time Activity Feed */}
                {recentActivity.length > 0 && (
                  <div className="mb-4 p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-1 mb-2">
                      <Activity className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-medium">Recent Activity</span>
                    </div>
                    <div className="space-y-1">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <div className="w-1 h-1 bg-primary rounded-full"></div>
                          <span className="capitalize">{activity.action}</span>
                          <span className="text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleThemeSelect(theme)}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleCustomizeTheme(theme)}
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    Customize
                  </Button>
                </div>

                {/* Theme Stats */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span>Active Users: {usageCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-600" />
                    <span>Updated: {new Date(theme.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Real-time Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Real-time Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {realtimeUpdates.map((update) => (
              <div key={update.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">{update.message}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {new Date(update.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
            {realtimeUpdates.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}