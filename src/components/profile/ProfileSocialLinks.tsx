import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Save, 
  ArrowRight,
  ArrowLeft,
  Loader2,
  Globe,
  Twitter,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Github,
  Twitch
} from 'lucide-react';

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
}

interface ProfileSocialLinksProps {
  profile: Profile;
  onProfileUpdate: (updates: Partial<Profile>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const socialPlatforms = [
  { key: 'twitter', label: 'Twitter', icon: Twitter, placeholder: 'https://twitter.com/yourusername' },
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/yourusername' },
  { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/yourusername' },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/yourusername' },
  { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@yourusername' },
  { key: 'github', label: 'GitHub', icon: Github, placeholder: 'https://github.com/yourusername' },
  { key: 'twitch', label: 'Twitch', icon: Twitch, placeholder: 'https://twitch.tv/yourusername' },
  { key: 'website', label: 'Personal Website', icon: Globe, placeholder: 'https://yourwebsite.com' }
];

export function ProfileSocialLinks({ profile, onProfileUpdate, onNext, onPrevious }: ProfileSocialLinksProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [socialLinks, setSocialLinks] = useState(profile.social_links || {});

  const handleSocialLinkChange = (platform: string, value: string) => {
    const updatedLinks = { ...socialLinks, [platform]: value };
    setSocialLinks(updatedLinks);
    onProfileUpdate({ social_links: updatedLinks });
  };

  const validateUrl = (url: string) => {
    if (!url) return true; // Empty URLs are allowed
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const saveProfile = async () => {
    // Validate all URLs
    for (const [platform, url] of Object.entries(socialLinks)) {
      if (url && !validateUrl(url)) {
        toast({
          title: "Invalid URL",
          description: `Please enter a valid URL for ${platform}`,
          variant: "destructive"
        });
        return;
      }
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          social_links: socialLinks
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Social links saved",
        description: "Your social media links have been updated successfully"
      });
    } catch (error) {
      console.error('Error saving social links:', error);
      toast({
        title: "Error",
        description: "Failed to save social links",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Connect Your Social Media</h3>
        <p className="text-muted-foreground">
          Add your social media profiles to help readers connect with you across platforms.
        </p>
      </div>

      <div className="grid gap-6">
        {socialPlatforms.map((platform) => {
          const Icon = platform.icon;
          return (
            <Card key={platform.key}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Icon className="w-5 h-5" />
                  <span>{platform.label}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor={platform.key}>Profile URL</Label>
                  <Input
                    id={platform.key}
                    type="url"
                    value={socialLinks[platform.key] || ''}
                    onChange={(e) => handleSocialLinkChange(platform.key, e.target.value)}
                    placeholder={platform.placeholder}
                    className={!validateUrl(socialLinks[platform.key] || '') && socialLinks[platform.key] ? 'border-red-500' : ''}
                  />
                  {socialLinks[platform.key] && !validateUrl(socialLinks[platform.key]) && (
                    <p className="text-sm text-red-600">Please enter a valid URL</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-2">Tips for Social Media Links:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Use the complete URL including https://</li>
          <li>• Make sure your profiles are public so readers can find you</li>
          <li>• Consider using the same username across platforms for consistency</li>
          <li>• Only add platforms where you're active and engaging with your audience</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={onPrevious}
          className="flex items-center space-x-2 transition-all hover:bg-secondary"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous</span>
        </Button>
        
        <div className="space-x-3">
          <Button 
            variant="outline"
            onClick={saveProfile}
            disabled={saving}
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
          
          <Button 
            onClick={onNext}
            className="flex items-center space-x-2 transition-all hover:shadow-lg"
          >
            <span>Next Step</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}