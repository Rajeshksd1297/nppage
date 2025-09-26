import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { 
  Save, 
  Plus, 
  X, 
  ExternalLink, 
  Palette, 
  Search, 
  Lock,
  Check,
  AlertCircle,
  Loader2,
  Upload,
  Camera,
  User,
  Globe,
  Twitter,
  Instagram,
  Facebook,
  Linkedin,
  Youtube
} from 'lucide-react';
import { UpgradeBanner } from '@/components/UpgradeBanner';

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

// Mock themes for selection
const themes = [
  { id: 'minimal', name: 'Minimal', description: 'Clean and simple design' },
  { id: 'classic', name: 'Classic', description: 'Traditional author page layout' },
  { id: 'modern', name: 'Modern', description: 'Contemporary design with bold typography' },
  { id: 'literary', name: 'Literary', description: 'Elegant design for literary works' },
  { id: 'creative', name: 'Creative', description: 'Artistic layout with creative elements' }
];

export default function Profile() {
  const { toast } = useToast();
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
    social_links: {},
    mobile_number: '',
    country_code: '+1'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newSpecialization, setNewSpecialization] = useState("");
  const [selectedTheme, setSelectedTheme] = useState('minimal');
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [tempSlug, setTempSlug] = useState("");
  const { hasFeature, subscription, isPro } = useSubscription();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user);
      
      if (!user) {
        console.log('No authenticated user found');
        setLoading(false);
        return;
      }

      console.log('Fetching profile for user:', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('Profile fetch result:', { data, error });

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setProfile({
          ...data,
          social_links: (typeof data.social_links === 'object' && data.social_links && !Array.isArray(data.social_links)) 
            ? data.social_links as Record<string, string> 
            : {}
        });
        setTempSlug(data.slug || '');
      } else {
        console.log('No profile found, creating new one');
        const emailBasedSlug = user.email?.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-') || 'user';
        
        // Create profile if it doesn't exist
        const newProfile = {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          bio: '',
          avatar_url: '',
          website_url: '',
          slug: emailBasedSlug,
          public_profile: true,
          specializations: [],
          social_links: {}
        };
        
        // Try to insert the profile
        const { data: insertedProfile, error: insertError } = await supabase
          .from('profiles')
          .upsert(newProfile)
          .select()
          .single();
          
        if (insertError) {
          console.error('Error creating profile:', insertError);
          throw insertError;
        }
        
        setProfile({
          ...newProfile,
          social_links: {} as Record<string, string>
        });
        setTempSlug(newProfile.slug);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug === profile.slug) {
      setSlugAvailable(null);
      return;
    }

    setCheckingSlug(true);
    try {
      const { data, error } = await supabase.rpc('is_slug_available', {
        slug_text: slug,
        user_id: profile.id
      });

      if (error) throw error;
      setSlugAvailable(data);
    } catch (error) {
      console.error('Error checking slug availability:', error);
      setSlugAvailable(null);
    } finally {
      setCheckingSlug(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const slug = tempSlug || generateSlug(profile.full_name || '');
      const profileData = {
        ...profile,
        slug,
        updated_at: new Date().toISOString()
      };

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData)
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => ({ ...prev, slug }));
      setTempSlug(slug);
      
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error", 
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Delete old avatar if exists
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfile(prev => ({ ...prev, avatar_url: data.publicUrl }));
      
      toast({
        title: "Success",
        description: "Avatar uploaded successfully!",
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload avatar",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error", 
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    await uploadAvatar(file);
  };

  const addSpecialization = (specialization: string) => {
    if (specialization && !profile.specializations.includes(specialization)) {
      setProfile(prev => ({
        ...prev,
        specializations: [...prev.specializations, specialization]
      }));
      setNewSpecialization("");
    }
  };

  const removeSpecialization = (specialization: string) => {
    setProfile(prev => ({
      ...prev,
      specializations: prev.specializations.filter(s => s !== specialization)
    }));
  };

  const updateSocialLink = (platform: string, url: string) => {
    setProfile(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: url
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Author Profile</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Manage your public author information</span>
            {subscription?.subscription_plans?.name && (
              <Badge variant={isPro() ? 'default' : 'secondary'}>
                {subscription.subscription_plans.name}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/profile-setup'}
          >
            Enhanced Setup
          </Button>
          {tempSlug && (
            <Button variant="outline" onClick={() => window.open(`/${tempSlug}`, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview Profile
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="social">Social Links</TabsTrigger>
          <TabsTrigger value="theme" disabled={!hasFeature('premium_themes')}>
            Theme {!hasFeature('premium_themes') && <Badge variant="outline" className="ml-1 text-xs">Pro</Badge>}
          </TabsTrigger>
          <TabsTrigger value="seo" disabled={!hasFeature('advanced_analytics')}>
            SEO {!hasFeature('advanced_analytics') && <Badge variant="outline" className="ml-1 text-xs">Pro</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Your basic author details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Profile Picture Upload */}
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Profile avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <label
                      htmlFor="avatar-upload"
                      className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      {uploading ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5 text-white" />
                      )}
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      disabled={uploading}
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Profile Picture</h4>
                    <p className="text-sm text-muted-foreground">
                      Click on the image to upload a new avatar (max 5MB)
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email cannot be changed here. Update in account settings.
                  </p>
                </div>

                <div>
                  <Label htmlFor="mobile_number">Mobile Number</Label>
                  <div className="flex gap-2">
                    <select
                      value={profile.country_code || '+1'}
                      onChange={(e) => setProfile(prev => ({ ...prev, country_code: e.target.value }))}
                      className="px-3 py-2 border border-input rounded-md bg-background w-32"
                    >
                      <option value="+1">+1 US/CA</option>
                      <option value="+44">+44 UK</option>
                      <option value="+91">+91 IN</option>
                      <option value="+33">+33 FR</option>
                      <option value="+49">+49 DE</option>
                      <option value="+61">+61 AU</option>
                      <option value="+81">+81 JP</option>
                      <option value="+86">+86 CN</option>
                    </select>
                    <Input
                      id="mobile_number"
                      value={profile.mobile_number || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, mobile_number: e.target.value }))}
                      placeholder="Enter your mobile number"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell readers about yourself, your writing journey, and what inspires you..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {profile.bio?.length || 0}/500 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="website_url">Website URL</Label>
                  <Input
                    id="website_url"
                    value={profile.website_url}
                    onChange={(e) => setProfile(prev => ({ ...prev, website_url: e.target.value }))}
                    placeholder="https://your-website.com"
                  />
                </div>

                <div>
                  <Label htmlFor="slug">Profile URL Slug *</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {window.location.origin}/
                      </span>
                      <Input
                        id="slug"
                        value={tempSlug}
                        onChange={(e) => {
                          const slug = e.target.value;
                          setTempSlug(slug);
                          if (slug) {
                            checkSlugAvailability(slug);
                          } else {
                            setSlugAvailable(null);
                          }
                        }}
                        placeholder="your-name"
                        className={`${
                          slugAvailable === false ? 'border-destructive' : 
                          slugAvailable === true ? 'border-green-500' : ''
                        }`}
                      />
                      {checkingSlug && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                    </div>
                    {slugAvailable === false && (
                      <p className="text-xs text-destructive">
                        This slug is already taken. Please choose another.
                      </p>
                    )}
                    {slugAvailable === true && (
                      <p className="text-xs text-green-600">
                        This slug is available!
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      This will be your public profile URL. Use letters, numbers, and hyphens only.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="public_profile"
                    checked={profile.public_profile}
                    onCheckedChange={(checked) => setProfile(prev => ({ ...prev, public_profile: checked }))}
                  />
                  <Label htmlFor="public_profile">Make profile public</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Specializations</CardTitle>
                <CardDescription>Your areas of expertise as an author</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {profile.specializations.map((spec, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {spec}
                      <button
                        onClick={() => removeSpecialization(spec)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    value={newSpecialization}
                    onChange={(e) => setNewSpecialization(e.target.value)}
                    placeholder="Add a specialization"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSpecialization(newSpecialization);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addSpecialization(newSpecialization)}
                    disabled={!newSpecialization.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Press Enter or click + to add. Examples: Fiction, Romance, Sci-Fi, Non-fiction
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>Connect your social media profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { platform: 'twitter', label: 'Twitter', icon: Twitter, placeholder: 'https://twitter.com/username' },
                { platform: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/username' },
                { platform: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/username' },
                { platform: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/username' },
                { platform: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/channel/...' },
              ].map(({ platform, label, icon: Icon, placeholder }) => (
                <div key={platform} className="flex items-center space-x-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <Label htmlFor={platform}>{label}</Label>
                    <Input
                      id={platform}
                      value={profile.social_links[platform] || ''}
                      onChange={(e) => updateSocialLink(platform, e.target.value)}
                      placeholder={placeholder}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {hasFeature('premium_themes') && (
          <TabsContent value="theme" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme Selection</CardTitle>
                <CardDescription>Choose how your profile looks to visitors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {themes.map((theme) => (
                    <div
                      key={theme.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedTheme === theme.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedTheme(theme.id)}
                    >
                      <h4 className="font-medium">{theme.name}</h4>
                      <p className="text-sm text-muted-foreground">{theme.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {hasFeature('advanced_analytics') && (
          <TabsContent value="seo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
                <CardDescription>Optimize your profile for search engines</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="seo_title">SEO Title</Label>
                  <Input
                    id="seo_title"
                    value={profile.seo_title || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, seo_title: e.target.value }))}
                    placeholder="Custom title for search engines"
                  />
                </div>
                <div>
                  <Label htmlFor="seo_description">SEO Description</Label>
                  <Textarea
                    id="seo_description"
                    value={profile.seo_description || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, seo_description: e.target.value }))}
                    placeholder="Brief description for search results"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="seo_keywords">SEO Keywords</Label>
                  <Input
                    id="seo_keywords"
                    value={profile.seo_keywords || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, seo_keywords: e.target.value }))}
                    placeholder="Keywords separated by commas"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {(!hasFeature('premium_themes') || !hasFeature('advanced_analytics')) && (
          <div className="mt-6">
            <UpgradeBanner 
              message="Unlock premium features like custom themes and SEO tools"
              feature="access to premium themes and advanced SEO settings"
            />
          </div>
        )}
      </Tabs>
    </div>
  );
}