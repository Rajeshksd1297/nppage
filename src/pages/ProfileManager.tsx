import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { User, Link, Palette, Search, ArrowRight, ArrowLeft } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { SubscriptionAwareLayout } from '@/components/SubscriptionAwareLayout';
import { ProfileBasicInfo } from '@/components/profile/ProfileBasicInfo';
import { ProfileSocialLinks } from '@/components/profile/ProfileSocialLinks';
import { ProfileThemeSettings } from '@/components/profile/ProfileThemeSettings';
import { ProfileSEOSettings } from '@/components/profile/ProfileSEOSettings';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  website_url: string;
  slug: string;
  public_profile: boolean;
  specializations: string[];
  social_links: Record<string, string>;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  mobile_number?: string;
  country_code?: string;
}

const steps = [
  { id: 'basic', label: 'Basic Info', icon: User, description: 'Personal information and profile details' },
  { id: 'social', label: 'Social Links', icon: Link, description: 'Connect your social media accounts' },
  { id: 'theme', label: 'Theme', icon: Palette, description: 'Customize your profile appearance' },
  { id: 'seo', label: 'SEO', icon: Search, description: 'Optimize for search engines' }
];

export default function ProfileManager() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basic');
  const [profile, setProfile] = useState<Profile>({
    id: '',
    email: '',
    full_name: '',
    bio: '',
    avatar_url: '',
    website_url: '',
    slug: '',
    public_profile: true,
    specializations: [],
    social_links: {}
  });
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState('minimal');
  const { hasFeature, isPro } = useSubscription();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive"
        });
      } else if (profileData) {
        // Handle the social_links type conversion from database
        const socialLinks = typeof profileData.social_links === 'object' && profileData.social_links !== null
          ? profileData.social_links as Record<string, string>
          : {};
        
        setProfile({
          ...profileData,
          social_links: socialLinks
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = steps.findIndex(step => step.id === activeTab);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      setActiveTab(steps[currentStepIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setActiveTab(steps[currentStepIndex - 1].id);
    }
  };

  const handleProfileUpdate = (updates: Partial<Profile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SubscriptionAwareLayout>
      <div className="container max-w-4xl mx-auto p-6 space-y-8">
        <SEOHead 
          title="Profile Manager"
          description="Manage your author profile in easy steps"
        />

        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Author Profile Setup
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Complete your professional author profile and showcase your work to the world
          </p>
          <div className="flex items-center justify-center space-x-2">
            <Badge variant="outline" className="px-3 py-1">
              Step {currentStepIndex + 1} of {steps.length}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {steps[currentStepIndex].label}
            </span>
          </div>
        </div>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="pb-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg">
                {React.createElement(steps[currentStepIndex].icon, { className: "w-7 h-7 text-white" })}
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold">{steps[currentStepIndex].label}</CardTitle>
                <p className="text-muted-foreground mt-1">{steps[currentStepIndex].description}</p>
              </div>
            </div>
          </CardHeader>

        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="basic" className="space-y-4">
              <ProfileBasicInfo 
                profile={profile} 
                onProfileUpdate={handleProfileUpdate}
                onNext={handleNext}
              />
            </TabsContent>

            <TabsContent value="social" className="space-y-4">
              <ProfileSocialLinks 
                profile={profile} 
                onProfileUpdate={handleProfileUpdate}
                onNext={handleNext}
                onPrevious={handlePrevious}
              />
            </TabsContent>

            <TabsContent value="theme" className="space-y-4">
              <ProfileThemeSettings 
                selectedTheme={selectedTheme}
                onThemeChange={setSelectedTheme}
                onNext={handleNext}
                onPrevious={handlePrevious}
                isPro={isPro()}
              />
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              <ProfileSEOSettings 
                profile={profile} 
                onProfileUpdate={handleProfileUpdate}
                onPrevious={handlePrevious}
                isPro={isPro()}
              />
            </TabsContent>
          </Tabs>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-8 border-t border-gradient-primary/20">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isFirstStep}
              size="lg"
              className={`flex items-center space-x-3 px-8 py-4 text-lg font-semibold transition-all duration-300 ${
                isFirstStep ? 'opacity-50 cursor-not-allowed' : 'hover:bg-secondary/80 hover:scale-105 hover:shadow-lg border-2'
              }`}
            >
              <ArrowLeft className="w-6 h-6" />
              <span>Previous</span>
            </Button>

            <div className="text-center px-4">
              <div className="bg-gradient-primary rounded-full px-6 py-2 text-white font-semibold shadow-md">
                {currentStepIndex + 1} / {steps.length}
              </div>
            </div>

            <Button
              onClick={handleNext}
              disabled={isLastStep}
              size="lg"
              className={`flex items-center space-x-3 px-8 py-4 text-lg font-semibold transition-all duration-300 bg-gradient-primary hover:shadow-xl ${
                isLastStep ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 shadow-lg animate-pulse'
              }`}
            >
              <span>{isLastStep ? 'Complete Setup' : 'Next Step'}</span>
              <ArrowRight className="w-6 h-6" />
            </Button>
          </div>
        </CardContent>
        </Card>
      </div>
    </SubscriptionAwareLayout>
  );
}