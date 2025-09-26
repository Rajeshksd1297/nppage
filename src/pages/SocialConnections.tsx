import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Twitter, 
  Linkedin, 
  Facebook, 
  Instagram,
  Plus,
  Unlink,
  CheckCircle,
  AlertCircle,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePageAnalytics } from '@/hooks/useAnalytics';

interface SocialConnection {
  id: string;
  platform: string;
  platform_user_id: string;
  auto_post_enabled: boolean;
  expires_at?: string;
  created_at: string;
}

interface SocialPost {
  id: string;
  platform: string;
  post_content: string;
  status: string;
  error_message?: string;
  posted_at?: string;
  created_at: string;
}

const platformConfig = {
  twitter: {
    name: 'Twitter',
    icon: Twitter,
    color: 'text-blue-500',
    description: 'Share books and articles to your Twitter feed'
  },
  linkedin: {
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'text-blue-600',
    description: 'Share professional content to your LinkedIn network'
  },
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    color: 'text-blue-700',
    description: 'Share updates to your Facebook page or profile'
  },
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    color: 'text-pink-600',
    description: 'Share visual content to your Instagram account'
  }
};

export default function SocialConnections() {
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [recentPosts, setRecentPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  usePageAnalytics('dashboard', 'social-connections');

  useEffect(() => {
    fetchConnections();
    fetchRecentPosts();
  }, []);

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('social_connections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Error fetching social connections:', error);
      toast({
        title: 'Error',
        description: 'Failed to load social connections',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('social_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentPosts(data || []);
    } catch (error) {
      console.error('Error fetching recent posts:', error);
    }
  };

  const toggleAutoPost = async (connectionId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('social_connections')
        .update({ auto_post_enabled: enabled })
        .eq('id', connectionId);

      if (error) throw error;

      setConnections(prev =>
        prev.map(conn =>
          conn.id === connectionId 
            ? { ...conn, auto_post_enabled: enabled }
            : conn
        )
      );

      toast({
        title: 'Settings updated',
        description: `Auto-posting ${enabled ? 'enabled' : 'disabled'} successfully`,
      });
    } catch (error) {
      console.error('Error updating auto-post setting:', error);
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive',
      });
    }
  };

  const disconnectPlatform = async (connectionId: string, platform: string) => {
    if (!confirm(`Are you sure you want to disconnect ${platformConfig[platform as keyof typeof platformConfig].name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('social_connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;

      setConnections(prev => prev.filter(conn => conn.id !== connectionId));

      toast({
        title: 'Disconnected',
        description: `${platformConfig[platform as keyof typeof platformConfig].name} account disconnected`,
      });
    } catch (error) {
      console.error('Error disconnecting platform:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect account',
        variant: 'destructive',
      });
    }
  };

  const connectPlatform = (platform: string) => {
    toast({
      title: 'Coming Soon',
      description: `${platformConfig[platform as keyof typeof platformConfig].name} integration will be available soon!`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Social Media Connections</h1>
        <p className="text-muted-foreground">
          Connect your social accounts to automatically share your books and articles
        </p>
      </div>

      {/* Connected Platforms */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {Object.entries(platformConfig).map(([platform, config]) => {
          const connection = connections.find(conn => conn.platform === platform);
          const Icon = config.icon;

          return (
            <Card key={platform}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-6 w-6 ${config.color}`} />
                    <span>{config.name}</span>
                  </div>
                  {connection ? (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Not connected</Badge>
                  )}
                </CardTitle>
                <CardDescription>{config.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {connection ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`auto-post-${platform}`}
                          checked={connection.auto_post_enabled}
                          onCheckedChange={(checked) => toggleAutoPost(connection.id, checked)}
                        />
                        <Label htmlFor={`auto-post-${platform}`}>Auto-post new content</Label>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Connected as: @{connection.platform_user_id}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => connectPlatform(platform)}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Settings
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => disconnectPlatform(connection.id, platform)}
                      >
                        <Unlink className="h-3 w-3 mr-1" />
                        Disconnect
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button
                    onClick={() => connectPlatform(platform)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Connect {config.name}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Auto-Posts</CardTitle>
          <CardDescription>
            Your latest automated social media posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentPosts.length === 0 ? (
            <div className="text-center py-8">
              <Twitter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No posts yet</h3>
              <p className="text-muted-foreground">
                Your automated posts will appear here once you publish content
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentPosts.map((post) => {
                const config = platformConfig[post.platform as keyof typeof platformConfig];
                const Icon = config.icon;

                return (
                  <div key={post.id} className="flex items-start gap-3 p-4 border rounded-lg">
                    <Icon className={`h-5 w-5 ${config.color} mt-1`} />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{config.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              post.status === 'posted' ? 'default' :
                              post.status === 'failed' ? 'destructive' : 'secondary'
                            }
                          >
                            {post.status === 'posted' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {post.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                            {post.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {post.post_content}
                      </p>
                      {post.error_message && (
                        <p className="text-xs text-destructive">
                          Error: {post.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}