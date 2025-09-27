import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Palette, Check, Lock, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { useUserThemes } from '@/hooks/useUserThemes';
import { UpgradeBanner } from '@/components/UpgradeBanner';

export default function Themes() {
  const { toast } = useToast();
  const { 
    themes,
    loading,
    error,
    canAccessTheme,
    getUserAccessibleThemes,
    applyTheme,
    currentThemeId
  } = useUserThemes();
  const { hasFeature, getCurrentPlanName } = useSubscription();

  const canUsePremiumThemes = hasFeature('premium_themes');
  const accessibleThemes = getUserAccessibleThemes();
  const restrictedThemes = themes.filter(theme => !canAccessTheme(theme));

  const handleApplyTheme = async (themeId: string) => {
    try {
      await applyTheme(themeId);
      toast({
        title: "Success",
        description: "Theme applied successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Palette className="h-8 w-8" />
          Themes
        </h1>
        <p className="text-muted-foreground">
          Choose a theme for your author profile. Your current plan ({getCurrentPlanName()}) includes access to {accessibleThemes.length} theme{accessibleThemes.length !== 1 ? 's' : ''}.
        </p>
      </div>

      {!canUsePremiumThemes && restrictedThemes.length > 0 && (
        <UpgradeBanner 
          message="Unlock Premium Themes"
          feature="premium themes and advanced customization options"
        />
      )}

      {/* Available Themes */}
      {accessibleThemes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            Available Themes ({accessibleThemes.length})
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {accessibleThemes.map((theme) => (
              <Card key={theme.id} className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {theme.name}
                      {theme.premium && (
                        <Badge variant="secondary" className="gap-1">
                          <Crown className="h-3 w-3" />
                          Premium
                        </Badge>
                      )}
                    </CardTitle>
                    {currentThemeId === theme.id && (
                      <Badge variant="default" className="gap-1">
                        <Check className="h-3 w-3" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{theme.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  {theme.preview_image_url && (
                    <div className="mb-4">
                      <img 
                        src={theme.preview_image_url} 
                        alt={`${theme.name} preview`}
                        className="w-full h-32 object-cover rounded-md border"
                      />
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => handleApplyTheme(theme.id)}
                    disabled={currentThemeId === theme.id}
                    className="w-full"
                  >
                    {currentThemeId === theme.id ? 'Currently Applied' : 'Apply Theme'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Restricted Themes */}
      {restrictedThemes.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            Premium Themes ({restrictedThemes.length})
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Upgrade your plan to access these premium themes with advanced customization options.
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {restrictedThemes.map((theme) => (
              <Card key={theme.id} className="relative overflow-hidden opacity-75">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {theme.name}
                      <Badge variant="secondary" className="gap-1">
                        <Crown className="h-3 w-3" />
                        Premium
                      </Badge>
                    </CardTitle>
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardDescription>{theme.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  {theme.preview_image_url && (
                    <div className="mb-4 relative">
                      <img 
                        src={theme.preview_image_url} 
                        alt={`${theme.name} preview`}
                        className="w-full h-32 object-cover rounded-md border grayscale"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-md">
                        <Lock className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => {
                      toast({
                        title: "Premium Theme",
                        description: "Please upgrade your plan to access this theme",
                        variant: "default",
                      });
                    }}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <Zap className="h-4 w-4" />
                    Upgrade to Access
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {themes.length === 0 && (
        <div className="text-center py-12">
          <Palette className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Themes Available</h3>
          <p className="text-muted-foreground">
            Contact your administrator to add themes to the system.
          </p>
        </div>
      )}
    </div>
  );
}