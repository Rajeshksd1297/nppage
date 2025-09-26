import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Save, 
  Plus, 
  X, 
  ExternalLink, 
  Check,
  AlertCircle,
  Loader2,
  Upload,
  Camera,
  ArrowRight
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

interface ProfileBasicInfoProps {
  profile: Profile;
  onProfileUpdate: (updates: Partial<Profile>) => void;
  onNext: () => void;
}

export function ProfileBasicInfo({ profile, onProfileUpdate, onNext }: ProfileBasicInfoProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newSpecialization, setNewSpecialization] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [tempSlug, setTempSlug] = useState(profile.slug || "");

  const handleInputChange = (field: keyof Profile, value: any) => {
    const updatedProfile = { ...profile, [field]: value };
    onProfileUpdate({ [field]: value });
  };

  const handleSlugChange = (value: string) => {
    // Clean the slug: lowercase, replace spaces with hyphens, remove special characters
    const cleanSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    setTempSlug(cleanSlug);
    handleInputChange('slug', cleanSlug);
    
    if (cleanSlug) {
      checkSlugAvailability(cleanSlug);
    } else {
      setSlugAvailable(null);
    }
  };

  const checkSlugAvailability = async (slug: string) => {
    if (slug === profile.slug) {
      setSlugAvailable(true);
      return;
    }
    
    setCheckingSlug(true);
    try {
      const { data } = await supabase.rpc('is_slug_available', {
        slug_text: slug,
        user_id: profile.id
      });
      setSlugAvailable(data);
    } catch (error) {
      console.error('Error checking slug availability:', error);
      setSlugAvailable(null);
    } finally {
      setCheckingSlug(false);
    }
  };

  const addSpecialization = () => {
    if (newSpecialization.trim()) {
      const updatedSpecs = [...(profile.specializations || []), newSpecialization.trim()];
      handleInputChange('specializations', updatedSpecs);
      setNewSpecialization("");
    }
  };

  const removeSpecialization = (index: number) => {
    const updatedSpecs = (profile.specializations || []).filter((_, i) => i !== index);
    handleInputChange('specializations', updatedSpecs);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    
    try {
      // Delete old avatar if it exists
      if (profile.avatar_url) {
        const oldFileName = profile.avatar_url.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from('avatars')
            .remove([`${profile.id}/${oldFileName}`]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar_${Date.now()}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      if (data?.publicUrl) {
        handleInputChange('avatar_url', data.publicUrl);
        toast({
          title: "Avatar uploaded",
          description: "Your profile picture has been updated"
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          bio: profile.bio,
          website_url: profile.website_url,
          slug: profile.slug,
          public_profile: profile.public_profile,
          specializations: profile.specializations,
          avatar_url: profile.avatar_url
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Profile saved",
        description: "Your basic information has been updated successfully"
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = profile.full_name && profile.slug && slugAvailable;

  return (
    <div className="space-y-6">
      {/* Avatar Upload */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-muted overflow-hidden">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}
        </div>
        <div>
          <Label htmlFor="avatar-upload" className="cursor-pointer">
            <Button type="button" variant="outline" size="sm" disabled={uploading}>
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Avatar'}
            </Button>
          </Label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground mt-1">
            JPG, PNG, or GIF. Max 2MB.
          </p>
        </div>
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="full_name">Full Name *</Label>
          <Input
            id="full_name"
            value={profile.full_name || ''}
            onChange={(e) => handleInputChange('full_name', e.target.value)}
            placeholder="Enter your full name"
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
            Email cannot be changed here. Use account settings.
          </p>
        </div>

        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={profile.bio || ''}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            placeholder="Tell readers about yourself..."
            rows={4}
          />
        </div>

        <div>
          <Label htmlFor="website_url">Website URL</Label>
          <Input
            id="website_url"
            value={profile.website_url || ''}
            onChange={(e) => handleInputChange('website_url', e.target.value)}
            placeholder="https://yourwebsite.com"
          />
        </div>

        <div>
          <Label htmlFor="slug">Profile URL *</Label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
              authorpage.app/
            </span>
            <div className="relative flex-1">
              <Input
                id="slug"
                value={tempSlug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className="rounded-l-none"
                placeholder="your-name"
              />
              {checkingSlug && (
                <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin" />
              )}
              {!checkingSlug && slugAvailable !== null && (
                <div className="absolute right-3 top-3">
                  {slugAvailable ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
              )}
            </div>
          </div>
          {!checkingSlug && slugAvailable === false && (
            <p className="text-sm text-red-600 mt-1">This URL is already taken</p>
          )}
          {profile.slug && (
            <div className="flex items-center space-x-2 mt-2">
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
              <a 
                href={`/${profile.slug}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                View your public profile
              </a>
            </div>
          )}
        </div>

        {/* Specializations */}
        <div>
          <Label>Specializations</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {profile.specializations?.map((spec, index) => (
              <Badge key={index} variant="secondary" className="px-3 py-1">
                {spec}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-2"
                  onClick={() => removeSpecialization(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Input
              value={newSpecialization}
              onChange={(e) => setNewSpecialization(e.target.value)}
              placeholder="Add a specialization"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
            />
            <Button type="button" variant="outline" onClick={addSpecialization}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Public Profile Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Public Profile</Label>
            <p className="text-sm text-muted-foreground">
              Make your profile visible to the public
            </p>
          </div>
          <Switch
            checked={profile.public_profile}
            onCheckedChange={(checked) => handleInputChange('public_profile', checked)}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
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
          disabled={!isFormValid}
        >
          Next Step
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}