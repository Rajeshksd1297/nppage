import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  Phone,
  ChevronDown,
  ChevronsUpDown
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
  const [countryCodeOpen, setCountryCodeOpen] = useState(false);

  // Country codes for mobile number
  const countryCodes = [
    { code: '+1', country: 'US/CA - United States/Canada' },
    { code: '+7', country: 'RU/KZ - Russia/Kazakhstan' },
    { code: '+20', country: 'EG - Egypt' },
    { code: '+27', country: 'ZA - South Africa' },
    { code: '+30', country: 'GR - Greece' },
    { code: '+31', country: 'NL - Netherlands' },
    { code: '+32', country: 'BE - Belgium' },
    { code: '+33', country: 'FR - France' },
    { code: '+34', country: 'ES - Spain' },
    { code: '+36', country: 'HU - Hungary' },
    { code: '+39', country: 'IT - Italy' },
    { code: '+40', country: 'RO - Romania' },
    { code: '+41', country: 'CH - Switzerland' },
    { code: '+43', country: 'AT - Austria' },
    { code: '+44', country: 'GB - United Kingdom' },
    { code: '+45', country: 'DK - Denmark' },
    { code: '+46', country: 'SE - Sweden' },
    { code: '+47', country: 'NO - Norway' },
    { code: '+48', country: 'PL - Poland' },
    { code: '+49', country: 'DE - Germany' },
    { code: '+51', country: 'PE - Peru' },
    { code: '+52', country: 'MX - Mexico' },
    { code: '+53', country: 'CU - Cuba' },
    { code: '+54', country: 'AR - Argentina' },
    { code: '+55', country: 'BR - Brazil' },
    { code: '+56', country: 'CL - Chile' },
    { code: '+57', country: 'CO - Colombia' },
    { code: '+58', country: 'VE - Venezuela' },
    { code: '+60', country: 'MY - Malaysia' },
    { code: '+61', country: 'AU - Australia' },
    { code: '+62', country: 'ID - Indonesia' },
    { code: '+63', country: 'PH - Philippines' },
    { code: '+64', country: 'NZ - New Zealand' },
    { code: '+65', country: 'SG - Singapore' },
    { code: '+66', country: 'TH - Thailand' },
    { code: '+81', country: 'JP - Japan' },
    { code: '+82', country: 'KR - South Korea' },
    { code: '+84', country: 'VN - Vietnam' },
    { code: '+86', country: 'CN - China' },
    { code: '+90', country: 'TR - Turkey' },
    { code: '+91', country: 'IN - India' },
    { code: '+92', country: 'PK - Pakistan' },
    { code: '+93', country: 'AF - Afghanistan' },
    { code: '+94', country: 'LK - Sri Lanka' },
    { code: '+95', country: 'MM - Myanmar' },
    { code: '+98', country: 'IR - Iran' },
    { code: '+212', country: 'MA - Morocco' },
    { code: '+213', country: 'DZ - Algeria' },
    { code: '+216', country: 'TN - Tunisia' },
    { code: '+218', country: 'LY - Libya' },
    { code: '+220', country: 'GM - Gambia' },
    { code: '+221', country: 'SN - Senegal' },
    { code: '+222', country: 'MR - Mauritania' },
    { code: '+223', country: 'ML - Mali' },
    { code: '+224', country: 'GN - Guinea' },
    { code: '+225', country: 'CI - Ivory Coast' },
    { code: '+226', country: 'BF - Burkina Faso' },
    { code: '+227', country: 'NE - Niger' },
    { code: '+228', country: 'TG - Togo' },
    { code: '+229', country: 'BJ - Benin' },
    { code: '+230', country: 'MU - Mauritius' },
    { code: '+231', country: 'LR - Liberia' },
    { code: '+232', country: 'SL - Sierra Leone' },
    { code: '+233', country: 'GH - Ghana' },
    { code: '+234', country: 'NG - Nigeria' },
    { code: '+235', country: 'TD - Chad' },
    { code: '+236', country: 'CF - Central African Republic' },
    { code: '+237', country: 'CM - Cameroon' },
    { code: '+238', country: 'CV - Cape Verde' },
    { code: '+239', country: 'ST - São Tomé and Príncipe' },
    { code: '+240', country: 'GQ - Equatorial Guinea' },
    { code: '+241', country: 'GA - Gabon' },
    { code: '+242', country: 'CG - Republic of Congo' },
    { code: '+243', country: 'CD - Democratic Republic of Congo' },
    { code: '+244', country: 'AO - Angola' },
    { code: '+245', country: 'GW - Guinea-Bissau' },
    { code: '+246', country: 'IO - British Indian Ocean Territory' },
    { code: '+248', country: 'SC - Seychelles' },
    { code: '+249', country: 'SD - Sudan' },
    { code: '+250', country: 'RW - Rwanda' },
    { code: '+251', country: 'ET - Ethiopia' },
    { code: '+252', country: 'SO - Somalia' },
    { code: '+253', country: 'DJ - Djibouti' },
    { code: '+254', country: 'KE - Kenya' },
    { code: '+255', country: 'TZ - Tanzania' },
    { code: '+256', country: 'UG - Uganda' },
    { code: '+257', country: 'BI - Burundi' },
    { code: '+258', country: 'MZ - Mozambique' },
    { code: '+260', country: 'ZM - Zambia' },
    { code: '+261', country: 'MG - Madagascar' },
    { code: '+262', country: 'RE - Réunion' },
    { code: '+263', country: 'ZW - Zimbabwe' },
    { code: '+264', country: 'NA - Namibia' },
    { code: '+265', country: 'MW - Malawi' },
    { code: '+266', country: 'LS - Lesotho' },
    { code: '+267', country: 'BW - Botswana' },
    { code: '+268', country: 'SZ - Eswatini' },
    { code: '+269', country: 'KM - Comoros' },
    { code: '+290', country: 'SH - Saint Helena' },
    { code: '+291', country: 'ER - Eritrea' },
    { code: '+297', country: 'AW - Aruba' },
    { code: '+298', country: 'FO - Faroe Islands' },
    { code: '+299', country: 'GL - Greenland' },
    { code: '+350', country: 'GI - Gibraltar' },
    { code: '+351', country: 'PT - Portugal' },
    { code: '+352', country: 'LU - Luxembourg' },
    { code: '+353', country: 'IE - Ireland' },
    { code: '+354', country: 'IS - Iceland' },
    { code: '+355', country: 'AL - Albania' },
    { code: '+356', country: 'MT - Malta' },
    { code: '+357', country: 'CY - Cyprus' },
    { code: '+358', country: 'FI - Finland' },
    { code: '+359', country: 'BG - Bulgaria' },
    { code: '+370', country: 'LT - Lithuania' },
    { code: '+371', country: 'LV - Latvia' },
    { code: '+372', country: 'EE - Estonia' },
    { code: '+373', country: 'MD - Moldova' },
    { code: '+374', country: 'AM - Armenia' },
    { code: '+375', country: 'BY - Belarus' },
    { code: '+376', country: 'AD - Andorra' },
    { code: '+377', country: 'MC - Monaco' },
    { code: '+378', country: 'SM - San Marino' },
    { code: '+380', country: 'UA - Ukraine' },
    { code: '+381', country: 'RS - Serbia' },
    { code: '+382', country: 'ME - Montenegro' },
    { code: '+383', country: 'XK - Kosovo' },
    { code: '+385', country: 'HR - Croatia' },
    { code: '+386', country: 'SI - Slovenia' },
    { code: '+387', country: 'BA - Bosnia and Herzegovina' },
    { code: '+389', country: 'MK - North Macedonia' },
    { code: '+420', country: 'CZ - Czech Republic' },
    { code: '+421', country: 'SK - Slovakia' },
    { code: '+423', country: 'LI - Liechtenstein' },
    { code: '+500', country: 'FK - Falkland Islands' },
    { code: '+501', country: 'BZ - Belize' },
    { code: '+502', country: 'GT - Guatemala' },
    { code: '+503', country: 'SV - El Salvador' },
    { code: '+504', country: 'HN - Honduras' },
    { code: '+505', country: 'NI - Nicaragua' },
    { code: '+506', country: 'CR - Costa Rica' },
    { code: '+507', country: 'PA - Panama' },
    { code: '+508', country: 'PM - Saint Pierre and Miquelon' },
    { code: '+509', country: 'HT - Haiti' },
    { code: '+590', country: 'GP - Guadeloupe' },
    { code: '+591', country: 'BO - Bolivia' },
    { code: '+592', country: 'GY - Guyana' },
    { code: '+593', country: 'EC - Ecuador' },
    { code: '+594', country: 'GF - French Guiana' },
    { code: '+595', country: 'PY - Paraguay' },
    { code: '+596', country: 'MQ - Martinique' },
    { code: '+597', country: 'SR - Suriname' },
    { code: '+598', country: 'UY - Uruguay' },
    { code: '+599', country: 'CW - Curaçao' },
    { code: '+670', country: 'TL - East Timor' },
    { code: '+672', country: 'AQ - Antarctica' },
    { code: '+673', country: 'BN - Brunei' },
    { code: '+674', country: 'NR - Nauru' },
    { code: '+675', country: 'PG - Papua New Guinea' },
    { code: '+676', country: 'TO - Tonga' },
    { code: '+677', country: 'SB - Solomon Islands' },
    { code: '+678', country: 'VU - Vanuatu' },
    { code: '+679', country: 'FJ - Fiji' },
    { code: '+680', country: 'PW - Palau' },
    { code: '+681', country: 'WF - Wallis and Futuna' },
    { code: '+682', country: 'CK - Cook Islands' },
    { code: '+683', country: 'NU - Niue' },
    { code: '+684', country: 'AS - American Samoa' },
    { code: '+685', country: 'WS - Samoa' },
    { code: '+686', country: 'KI - Kiribati' },
    { code: '+687', country: 'NC - New Caledonia' },
    { code: '+688', country: 'TV - Tuvalu' },
    { code: '+689', country: 'PF - French Polynesia' },
    { code: '+690', country: 'TK - Tokelau' },
    { code: '+691', country: 'FM - Micronesia' },
    { code: '+692', country: 'MH - Marshall Islands' },
    { code: '+850', country: 'KP - North Korea' },
    { code: '+852', country: 'HK - Hong Kong' },
    { code: '+853', country: 'MO - Macao' },
    { code: '+855', country: 'KH - Cambodia' },
    { code: '+856', country: 'LA - Laos' },
    { code: '+880', country: 'BD - Bangladesh' },
    { code: '+886', country: 'TW - Taiwan' },
    { code: '+960', country: 'MV - Maldives' },
    { code: '+961', country: 'LB - Lebanon' },
    { code: '+962', country: 'JO - Jordan' },
    { code: '+963', country: 'SY - Syria' },
    { code: '+964', country: 'IQ - Iraq' },
    { code: '+965', country: 'KW - Kuwait' },
    { code: '+966', country: 'SA - Saudi Arabia' },
    { code: '+967', country: 'YE - Yemen' },
    { code: '+968', country: 'OM - Oman' },
    { code: '+970', country: 'PS - Palestine' },
    { code: '+971', country: 'AE - United Arab Emirates' },
    { code: '+972', country: 'IL - Israel' },
    { code: '+973', country: 'BH - Bahrain' },
    { code: '+974', country: 'QA - Qatar' },
    { code: '+975', country: 'BT - Bhutan' },
    { code: '+976', country: 'MN - Mongolia' },
    { code: '+977', country: 'NP - Nepal' },
    { code: '+992', country: 'TJ - Tajikistan' },
    { code: '+993', country: 'TM - Turkmenistan' },
    { code: '+994', country: 'AZ - Azerbaijan' },
    { code: '+995', country: 'GE - Georgia' },
    { code: '+996', country: 'KG - Kyrgyzstan' },
    { code: '+998', country: 'UZ - Uzbekistan' }
  ];

  // Rich text editor modules
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Delete old avatar if it exists
      if (profile.avatar_url) {
        const oldFileName = profile.avatar_url.split('/').pop();
        if (oldFileName) {
          const { error: deleteError } = await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldFileName}`]);
          
          if (deleteError) {
            console.warn('Failed to delete old avatar:', deleteError);
          }
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
      
      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }
      
      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      if (data?.publicUrl) {
        handleInputChange('avatar_url', data.publicUrl);
        toast({
          title: "Avatar uploaded",
          description: "Your profile picture has been updated successfully"
        });
      } else {
        throw new Error('Failed to get public URL for uploaded image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload avatar. Please try again.",
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
            <div 
              className="w-24 h-24 rounded-full bg-muted overflow-hidden border-2 border-border cursor-pointer hover:border-primary transition-colors"
              onClick={() => document.getElementById('avatar-upload')?.click()}
            >
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
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              disabled={uploading}
              onClick={() => document.getElementById('avatar-upload')?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Avatar'}
            </Button>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="sr-only"
              style={{ display: 'none' }}
            />
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG, or GIF. Max 2MB. Click the image or button to upload.
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
            <Popover open={countryCodeOpen} onOpenChange={setCountryCodeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={countryCodeOpen}
                  className="w-48 justify-between"
                >
                  {profile.country_code || '+1'} {countryCodes.find(country => country.code === (profile.country_code || '+1'))?.country.split(' - ')[1] || 'United States'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0">
                <Command>
                  <CommandInput placeholder="Search country..." />
                  <CommandEmpty>No country found.</CommandEmpty>
                  <CommandGroup>
                    <CommandList className="max-h-[200px]">
                      {countryCodes.map((country) => (
                        <CommandItem
                          key={country.code}
                          value={`${country.code} ${country.country}`}
                          onSelect={() => {
                            handleInputChange('country_code', country.code);
                            setCountryCodeOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              (profile.country_code || '+1') === country.code ? 'opacity-100' : 'opacity-0'
                            }`}
                          />
                          <span className="font-medium">{country.code}</span>
                          <span className="ml-2 text-muted-foreground">{country.country}</span>
                        </CommandItem>
                      ))}
                    </CommandList>
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
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
              style={{ height: '300px', marginBottom: '50px' }}
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
      <div className="flex items-center justify-between pt-6 border-t">
        <Button 
          variant="outline"
          onClick={saveProfile}
          disabled={saving}
          className="flex items-center space-x-2"
        >
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </Button>
        
        <Button 
          onClick={onNext}
          disabled={!isFormValid}
          className="flex items-center space-x-2 transition-all hover:shadow-lg"
        >
          <span>Next Step</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}