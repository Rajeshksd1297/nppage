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
import { UpgradeBanner } from '@/components/UpgradeBanner';
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
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <SEOHead 
        title="Profile Manager"
        description="Manage your author profile in easy steps"
      />

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Profile Setup</h1>
        <p className="text-muted-foreground">
          Complete your author profile in 4 easy steps
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="flex justify-center space-x-4 mb-6">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const StepIcon = step.icon;
          
          return (
            <div key={step.id} className="flex flex-col items-center space-y-2">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors
                ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : 
                  isCurrent ? 'border-primary text-primary' : 
                  'border-muted text-muted-foreground'}
              `}>
                <StepIcon className="w-5 h-5" />
              </div>
              <div className="text-center">
                <p className={`text-sm font-medium ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {React.createElement(steps[currentStepIndex].icon, { className: "w-5 h-5 text-primary" })}
            </div>
            <div>
              <CardTitle>{steps[currentStepIndex].label}</CardTitle>
              <p className="text-sm text-muted-foreground">{steps[currentStepIndex].description}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
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
        </CardContent>
      </Card>

      {!isPro() && (
        <UpgradeBanner 
          message="Advanced Profile Management"
          feature="premium themes, custom domains, and advanced SEO features"
        />
      )}
    </div>
  );
}