import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { User, Link, Palette, Search, ArrowRight, ArrowLeft, Check } from 'lucide-react';
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

        {/* Step Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => setActiveTab(step.id)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 hover:scale-105 ${
                    index === currentStepIndex 
                      ? 'border-primary bg-primary text-primary-foreground shadow-lg' 
                      : index < currentStepIndex 
                        ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/80'
                        : 'border-muted-foreground bg-background text-muted-foreground hover:border-primary hover:text-primary'
                  }`}
                >
                  {index < currentStepIndex ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab(step.id)}
                  className={`ml-3 text-sm font-medium transition-colors hover:text-primary ${
                    index === currentStepIndex ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </button>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-4 transition-colors ${
                    index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="px-3 py-1">
              Step {currentStepIndex + 1} of {steps.length}
            </Badge>
          </div>
        </div>

        {/* Current Step Content */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl">
              {steps[currentStepIndex].label}
            </CardTitle>
            <p className="text-muted-foreground">{steps[currentStepIndex].description}</p>
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
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isFirstStep}
              className={`flex items-center space-x-2 transition-all ${
                isFirstStep ? 'opacity-50 cursor-not-allowed' : 'hover:bg-secondary'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {steps[currentStepIndex].label}
              </p>
            </div>

            <Button
              onClick={handleNext}
              disabled={isLastStep}
              className={`flex items-center space-x-2 transition-all ${
                isLastStep ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
              }`}
            >
              <span>{isLastStep ? 'Complete Setup' : 'Next Step'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
        </Card>
      </div>
    </SubscriptionAwareLayout>
  );
}