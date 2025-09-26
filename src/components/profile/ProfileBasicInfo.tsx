import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
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
  ArrowRight,
  Phone
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
  mobile_number?: string;
  country_code?: string;
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

  // Country codes for mobile number
  const countryCodes = [
    { code: '+1', country: 'US/CA' },
    { code: '+44', country: 'UK' },
    { code: '+91', country: 'IN' },
    { code: '+33', country: 'FR' },
    { code: '+49', country: 'DE' },
    { code: '+61', country: 'AU' },
    { code: '+81', country: 'JP' },
    { code: '+86', country: 'CN' },
    { code: '+55', country: 'BR' },
    { code: '+7', country: 'RU' }
  ];

  // Rich text editor modules
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      ['link', 'blockquote'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ],
  };

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
          avatar_url: profile.avatar_url,
          mobile_number: profile.mobile_number,
          country_code: profile.country_code
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
      <div>
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
      </div>

      {/* Profile Picture */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Profile Picture</Label>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-muted overflow-hidden border-2 border-border">
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
      </div>

      {/* Form Fields */}
      <div className="space-y-5">
        {/* Full Name */}
        <div>
          <Label htmlFor="full_name" className="text-base font-medium">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="full_name"
            value={profile.full_name || ''}
            onChange={(e) => handleInputChange('full_name', e.target.value)}
            placeholder="Enter your full name"
            className="mt-2"
          />
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email" className="text-base font-medium">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            value={profile.email || ''}
            disabled
            className="mt-2 bg-muted"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Email cannot be changed here. Use account settings.
          </p>
        </div>

        {/* Mobile Number */}
        <div>
          <Label className="text-base font-medium">Mobile Number</Label>
          <div className="flex gap-2 mt-2">
            <Select
              value={profile.country_code || '+1'}
              onValueChange={(value) => handleInputChange('country_code', value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Code" />
              </SelectTrigger>
              <SelectContent>
                {countryCodes.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.code} {country.country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={profile.mobile_number || ''}
              onChange={(e) => handleInputChange('mobile_number', e.target.value)}
              placeholder="Enter your mobile number"
              className="flex-1"
            />
          </div>
        </div>

        {/* Bio - Rich Text Editor */}
        <div>
          <Label className="text-base font-medium">Bio</Label>
          <div className="mt-2">
            <ReactQuill
              theme="snow"
              value={profile.bio || ''}
              onChange={(value) => handleInputChange('bio', value)}
              modules={quillModules}
              placeholder="Tell readers about yourself..."
              className="bg-background"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Use rich formatting to make your bio more engaging
          </p>
        </div>

        {/* Specializations */}
        <div>
          <Label className="text-base font-medium">Specializations</Label>
          <div className="mt-2">
            <div className="flex flex-wrap gap-2 mb-3">
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
            <div className="flex gap-2">
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
        </div>

        {/* Profile URL Slug */}
        <div>
          <Label htmlFor="slug" className="text-base font-medium">
            Profile URL Slug <span className="text-red-500">*</span>
          </Label>
          <div className="flex mt-2">
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

        {/* Make Profile Public */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Make Profile Public</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Allow your profile to be visible to the public
              </p>
            </div>
            <Switch
              checked={profile.public_profile}
              onCheckedChange={(checked) => handleInputChange('public_profile', checked)}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t">
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