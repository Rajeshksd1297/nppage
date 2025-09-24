import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  User, 
  Save, 
  Camera,
  Plus,
  X,
  Globe,
  Twitter,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  website_url?: string;
  slug?: string;
  public_profile: boolean;
  specializations: string[];
  social_links: any; // JSON field from database
}

const popularSpecializations = [
  "Fiction", "Non-Fiction", "Poetry", "Mystery", "Romance", "Science Fiction",
  "Fantasy", "Biography", "History", "Self-Help", "Business", "Children's Books",
  "Young Adult", "Horror", "Thriller", "Literary Fiction", "Memoir", "Essay"
];

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
    social_links: {}
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSpecialization, setNewSpecialization] = useState("");
  const [selectedTheme, setSelectedTheme] = useState('minimal');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setProfile({
          ...data,
          social_links: typeof data.social_links === 'object' ? data.social_links : {}
        });
      } else {
        // Create profile if it doesn't exist
        const newProfile = {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          bio: '',
          avatar_url: '',
          website_url: '',
          slug: '',
          public_profile: true,
          specializations: [],
          social_links: {}
        };
        setProfile(newProfile);
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const slug = profile.slug || generateSlug(profile.full_name || '');
      const profileData = {
        ...profile,
        slug,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData);

      if (error) throw error;
      
      setProfile(prev => ({ ...prev, slug }));
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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
          <p className="text-muted-foreground">Manage your public author information</p>
        </div>
        <div className="flex gap-2">
          {profile.slug && (
            <Button variant="outline" onClick={() => window.open(`/author/${profile.slug}`, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview
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
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Your basic author details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    value={profile.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email cannot be changed here. Update in account settings.
                  </p>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell readers about yourself..."
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
                <CardTitle>Profile Picture & Specializations</CardTitle>
                <CardDescription>Visual identity and areas of expertise</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Profile Picture</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                      {profile.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Input
                        value={profile.avatar_url}
                        onChange={(e) => setProfile(prev => ({ ...prev, avatar_url: e.target.value }))}
                        placeholder="Image URL"
                      />
                      <Button variant="outline" size="sm" className="mt-2">
                        <Camera className="h-4 w-4 mr-2" />
                        Upload Photo
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Specializations</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {profile.specializations.map((spec) => (
                      <Badge key={spec} variant="secondary" className="flex items-center gap-1">
                        {spec}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeSpecialization(spec)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newSpecialization}
                      onChange={(e) => setNewSpecialization(e.target.value)}
                      placeholder="Add specialization"
                      onKeyDown={(e) => {
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
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {popularSpecializations.map((spec) => (
                      <Badge
                        key={spec}
                        variant="outline"
                        className="cursor-pointer text-xs"
                        onClick={() => addSpecialization(spec)}
                      >
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
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
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="twitter" className="flex items-center gap-2">
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </Label>
                  <Input
                    id="twitter"
                    value={profile.social_links.twitter || ''}
                    onChange={(e) => updateSocialLink('twitter', e.target.value)}
                    placeholder="https://twitter.com/username"
                  />
                </div>

                <div>
                  <Label htmlFor="instagram" className="flex items-center gap-2">
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </Label>
                  <Input
                    id="instagram"
                    value={profile.social_links.instagram || ''}
                    onChange={(e) => updateSocialLink('instagram', e.target.value)}
                    placeholder="https://instagram.com/username"
                  />
                </div>

                <div>
                  <Label htmlFor="facebook" className="flex items-center gap-2">
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </Label>
                  <Input
                    id="facebook"
                    value={profile.social_links.facebook || ''}
                    onChange={(e) => updateSocialLink('facebook', e.target.value)}
                    placeholder="https://facebook.com/username"
                  />
                </div>

                <div>
                  <Label htmlFor="linkedin" className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </Label>
                  <Input
                    id="linkedin"
                    value={profile.social_links.linkedin || ''}
                    onChange={(e) => updateSocialLink('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>

                <div>
                  <Label htmlFor="youtube" className="flex items-center gap-2">
                    <Youtube className="h-4 w-4" />
                    YouTube
                  </Label>
                  <Input
                    id="youtube"
                    value={profile.social_links.youtube || ''}
                    onChange={(e) => updateSocialLink('youtube', e.target.value)}
                    placeholder="https://youtube.com/c/username"
                  />
                </div>

                <div>
                  <Label htmlFor="website" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Website
                  </Label>
                  <Input
                    id="website"
                    value={profile.social_links.website || ''}
                    onChange={(e) => updateSocialLink('website', e.target.value)}
                    placeholder="https://your-website.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Page Theme</CardTitle>
              <CardDescription>Choose how your author page looks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {themes.map((theme) => (
                  <div
                    key={theme.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedTheme === theme.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedTheme(theme.id)}
                  >
                    <div className="aspect-video bg-muted rounded mb-3 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">Preview</span>
                    </div>
                    <h4 className="font-medium">{theme.name}</h4>
                    <p className="text-sm text-muted-foreground">{theme.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO & Public URL</CardTitle>
              <CardDescription>Optimize your author page for search engines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="slug">Profile URL</Label>
                <Input
                  id="slug"
                  value={profile.slug}
                  onChange={(e) => setProfile(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder={generateSlug(profile.full_name || '')}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your author page will be accessible at: /author/{profile.slug || generateSlug(profile.full_name || '')}
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4" />
                  <span className="font-medium">Public Profile Preview</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Your profile will be accessible at: 
                  <br />
                  <code className="bg-background px-2 py-1 rounded">
                    authorpage.app/author/{profile.slug || generateSlug(profile.full_name || '')}
                  </code>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Meta Title</Label>
                  <Input
                    value={`${profile.full_name} - Author`}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-generated from your name
                  </p>
                </div>

                <div>
                  <Label>Meta Description</Label>
                  <Input
                    value={profile.bio ? `${profile.bio.slice(0, 150)}...` : 'Author profile page'}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-generated from your bio
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}