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
import { Save, Plus, X, ExternalLink, Palette, Search, Lock, Check, AlertCircle, Loader2, Upload, Camera, User, Globe, Twitter, Instagram, Facebook, Linkedin, Youtube } from 'lucide-react';
import { UpgradeBanner } from '@/components/UpgradeBanner';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
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
const themes = [{
  id: 'minimal',
  name: 'Minimal',
  description: 'Clean and simple design'
}, {
  id: 'classic',
  name: 'Classic',
  description: 'Traditional author page layout'
}, {
  id: 'modern',
  name: 'Modern',
  description: 'Contemporary design with bold typography'
}, {
  id: 'literary',
  name: 'Literary',
  description: 'Elegant design for literary works'
}, {
  id: 'creative',
  name: 'Creative',
  description: 'Artistic layout with creative elements'
}];
export default function Profile() {
  const {
    toast
  } = useToast();

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
  const {
    hasFeature,
    subscription,
    isPro
  } = useSubscription();
  useEffect(() => {
    fetchProfile();
  }, []);
  const fetchProfile = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      console.log('Current user:', user);
      if (!user) {
        console.log('No authenticated user found');
        setLoading(false);
        return;
      }
      console.log('Fetching profile for user:', user.id);
      const {
        data,
        error
      } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      console.log('Profile fetch result:', {
        data,
        error
      });
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setProfile({
          ...data,
          social_links: typeof data.social_links === 'object' && data.social_links && !Array.isArray(data.social_links) ? data.social_links as Record<string, string> : {}
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
        const {
          data: insertedProfile,
          error: insertError
        } = await supabase.from('profiles').upsert(newProfile).select().single();
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
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };
  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug === profile.slug) {
      setSlugAvailable(null);
      return;
    }
    setCheckingSlug(true);
    try {
      const {
        data,
        error
      } = await supabase.rpc('is_slug_available', {
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
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const {
        error
      } = await supabase.from('profiles').upsert(profileData).eq('id', user.id);
      if (error) throw error;
      setProfile(prev => ({
        ...prev,
        slug
      }));
      setTempSlug(slug);
      toast({
        title: "Success",
        description: "Profile updated successfully!"
      });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  const uploadAvatar = async (file: File) => {
    setUploading(true);
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Delete old avatar if exists
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('avatars').remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      const {
        error: uploadError
      } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data
      } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setProfile(prev => ({
        ...prev,
        avatar_url: data.publicUrl
      }));
      toast({
        title: "Success",
        description: "Avatar uploaded successfully!"
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload avatar",
        variant: "destructive"
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
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image must be less than 5MB",
        variant: "destructive"
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
    return <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
  }
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Author Profile</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Manage your public author information</span>
            {subscription?.subscription_plans?.name && <Badge variant={isPro() ? 'default' : 'secondary'}>
                {subscription.subscription_plans.name}
              </Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.href = '/profile-setup'}>
            Author Profile
          </Button>
          {tempSlug && <Button variant="outline" onClick={() => window.open(`/${tempSlug}`, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview Profile
            </Button>}
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
          <div className="grid gap-6 md:grid-cols-1 ">
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
                      {profile.avatar_url ? <img src={profile.avatar_url} alt="Profile avatar" className="w-full h-full object-cover" /> : <Camera className="w-8 h-8 text-muted-foreground" />}
                    </div>
                    <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                      {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Upload className="w-5 h-5 text-white" />}
                    </label>
                    <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" disabled={uploading} />
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
                  <Input id="full_name" value={profile.full_name} onChange={e => setProfile(prev => ({
                  ...prev,
                  full_name: e.target.value
                }))} placeholder="Your full name" />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile.email || ''} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email cannot be changed here. Update in account settings.
                  </p>
                </div>

                <div>
                  <Label htmlFor="mobile_number">Mobile Number</Label>
                  <div className="flex gap-2">
                    <select value={profile.country_code || '+1'} onChange={e => setProfile(prev => ({
                    ...prev,
                    country_code: e.target.value
                  }))} className="px-3 py-2 border border-input rounded-md bg-background w-40">
                      <option value="+1">+1 US/CA - United States/Canada</option>
                      <option value="+7">+7 RU/KZ - Russia/Kazakhstan</option>
                      <option value="+20">+20 EG - Egypt</option>
                      <option value="+27">+27 ZA - South Africa</option>
                      <option value="+30">+30 GR - Greece</option>
                      <option value="+31">+31 NL - Netherlands</option>
                      <option value="+32">+32 BE - Belgium</option>
                      <option value="+33">+33 FR - France</option>
                      <option value="+34">+34 ES - Spain</option>
                      <option value="+36">+36 HU - Hungary</option>
                      <option value="+39">+39 IT - Italy</option>
                      <option value="+40">+40 RO - Romania</option>
                      <option value="+41">+41 CH - Switzerland</option>
                      <option value="+43">+43 AT - Austria</option>
                      <option value="+44">+44 GB - United Kingdom</option>
                      <option value="+45">+45 DK - Denmark</option>
                      <option value="+46">+46 SE - Sweden</option>
                      <option value="+47">+47 NO - Norway</option>
                      <option value="+48">+48 PL - Poland</option>
                      <option value="+49">+49 DE - Germany</option>
                      <option value="+51">+51 PE - Peru</option>
                      <option value="+52">+52 MX - Mexico</option>
                      <option value="+53">+53 CU - Cuba</option>
                      <option value="+54">+54 AR - Argentina</option>
                      <option value="+55">+55 BR - Brazil</option>
                      <option value="+56">+56 CL - Chile</option>
                      <option value="+57">+57 CO - Colombia</option>
                      <option value="+58">+58 VE - Venezuela</option>
                      <option value="+60">+60 MY - Malaysia</option>
                      <option value="+61">+61 AU - Australia</option>
                      <option value="+62">+62 ID - Indonesia</option>
                      <option value="+63">+63 PH - Philippines</option>
                      <option value="+64">+64 NZ - New Zealand</option>
                      <option value="+65">+65 SG - Singapore</option>
                      <option value="+66">+66 TH - Thailand</option>
                      <option value="+81">+81 JP - Japan</option>
                      <option value="+82">+82 KR - South Korea</option>
                      <option value="+84">+84 VN - Vietnam</option>
                      <option value="+86">+86 CN - China</option>
                      <option value="+90">+90 TR - Turkey</option>
                      <option value="+91">+91 IN - India</option>
                      <option value="+92">+92 PK - Pakistan</option>
                      <option value="+93">+93 AF - Afghanistan</option>
                      <option value="+94">+94 LK - Sri Lanka</option>
                      <option value="+95">+95 MM - Myanmar</option>
                      <option value="+98">+98 IR - Iran</option>
                      <option value="+212">+212 MA - Morocco</option>
                      <option value="+213">+213 DZ - Algeria</option>
                      <option value="+216">+216 TN - Tunisia</option>
                      <option value="+218">+218 LY - Libya</option>
                      <option value="+220">+220 GM - Gambia</option>
                      <option value="+221">+221 SN - Senegal</option>
                      <option value="+222">+222 MR - Mauritania</option>
                      <option value="+223">+223 ML - Mali</option>
                      <option value="+224">+224 GN - Guinea</option>
                      <option value="+225">+225 CI - Ivory Coast</option>
                      <option value="+226">+226 BF - Burkina Faso</option>
                      <option value="+227">+227 NE - Niger</option>
                      <option value="+228">+228 TG - Togo</option>
                      <option value="+229">+229 BJ - Benin</option>
                      <option value="+230">+230 MU - Mauritius</option>
                      <option value="+231">+231 LR - Liberia</option>
                      <option value="+232">+232 SL - Sierra Leone</option>
                      <option value="+233">+233 GH - Ghana</option>
                      <option value="+234">+234 NG - Nigeria</option>
                      <option value="+235">+235 TD - Chad</option>
                      <option value="+236">+236 CF - Central African Republic</option>
                      <option value="+237">+237 CM - Cameroon</option>
                      <option value="+238">+238 CV - Cape Verde</option>
                      <option value="+239">+239 ST - São Tomé and Príncipe</option>
                      <option value="+240">+240 GQ - Equatorial Guinea</option>
                      <option value="+241">+241 GA - Gabon</option>
                      <option value="+242">+242 CG - Republic of Congo</option>
                      <option value="+243">+243 CD - Democratic Republic of Congo</option>
                      <option value="+244">+244 AO - Angola</option>
                      <option value="+245">+245 GW - Guinea-Bissau</option>
                      <option value="+246">+246 IO - British Indian Ocean Territory</option>
                      <option value="+248">+248 SC - Seychelles</option>
                      <option value="+249">+249 SD - Sudan</option>
                      <option value="+250">+250 RW - Rwanda</option>
                      <option value="+251">+251 ET - Ethiopia</option>
                      <option value="+252">+252 SO - Somalia</option>
                      <option value="+253">+253 DJ - Djibouti</option>
                      <option value="+254">+254 KE - Kenya</option>
                      <option value="+255">+255 TZ - Tanzania</option>
                      <option value="+256">+256 UG - Uganda</option>
                      <option value="+257">+257 BI - Burundi</option>
                      <option value="+258">+258 MZ - Mozambique</option>
                      <option value="+260">+260 ZM - Zambia</option>
                      <option value="+261">+261 MG - Madagascar</option>
                      <option value="+262">+262 RE - Réunion</option>
                      <option value="+263">+263 ZW - Zimbabwe</option>
                      <option value="+264">+264 NA - Namibia</option>
                      <option value="+265">+265 MW - Malawi</option>
                      <option value="+266">+266 LS - Lesotho</option>
                      <option value="+267">+267 BW - Botswana</option>
                      <option value="+268">+268 SZ - Eswatini</option>
                      <option value="+269">+269 KM - Comoros</option>
                      <option value="+290">+290 SH - Saint Helena</option>
                      <option value="+291">+291 ER - Eritrea</option>
                      <option value="+297">+297 AW - Aruba</option>
                      <option value="+298">+298 FO - Faroe Islands</option>
                      <option value="+299">+299 GL - Greenland</option>
                      <option value="+350">+350 GI - Gibraltar</option>
                      <option value="+351">+351 PT - Portugal</option>
                      <option value="+352">+352 LU - Luxembourg</option>
                      <option value="+353">+353 IE - Ireland</option>
                      <option value="+354">+354 IS - Iceland</option>
                      <option value="+355">+355 AL - Albania</option>
                      <option value="+356">+356 MT - Malta</option>
                      <option value="+357">+357 CY - Cyprus</option>
                      <option value="+358">+358 FI - Finland</option>
                      <option value="+359">+359 BG - Bulgaria</option>
                      <option value="+370">+370 LT - Lithuania</option>
                      <option value="+371">+371 LV - Latvia</option>
                      <option value="+372">+372 EE - Estonia</option>
                      <option value="+373">+373 MD - Moldova</option>
                      <option value="+374">+374 AM - Armenia</option>
                      <option value="+375">+375 BY - Belarus</option>
                      <option value="+376">+376 AD - Andorra</option>
                      <option value="+377">+377 MC - Monaco</option>
                      <option value="+378">+378 SM - San Marino</option>
                      <option value="+380">+380 UA - Ukraine</option>
                      <option value="+381">+381 RS - Serbia</option>
                      <option value="+382">+382 ME - Montenegro</option>
                      <option value="+383">+383 XK - Kosovo</option>
                      <option value="+385">+385 HR - Croatia</option>
                      <option value="+386">+386 SI - Slovenia</option>
                      <option value="+387">+387 BA - Bosnia and Herzegovina</option>
                      <option value="+389">+389 MK - North Macedonia</option>
                      <option value="+420">+420 CZ - Czech Republic</option>
                      <option value="+421">+421 SK - Slovakia</option>
                      <option value="+423">+423 LI - Liechtenstein</option>
                      <option value="+500">+500 FK - Falkland Islands</option>
                      <option value="+501">+501 BZ - Belize</option>
                      <option value="+502">+502 GT - Guatemala</option>
                      <option value="+503">+503 SV - El Salvador</option>
                      <option value="+504">+504 HN - Honduras</option>
                      <option value="+505">+505 NI - Nicaragua</option>
                      <option value="+506">+506 CR - Costa Rica</option>
                      <option value="+507">+507 PA - Panama</option>
                      <option value="+508">+508 PM - Saint Pierre and Miquelon</option>
                      <option value="+509">+509 HT - Haiti</option>
                      <option value="+590">+590 GP - Guadeloupe</option>
                      <option value="+591">+591 BO - Bolivia</option>
                      <option value="+592">+592 GY - Guyana</option>
                      <option value="+593">+593 EC - Ecuador</option>
                      <option value="+594">+594 GF - French Guiana</option>
                      <option value="+595">+595 PY - Paraguay</option>
                      <option value="+596">+596 MQ - Martinique</option>
                      <option value="+597">+597 SR - Suriname</option>
                      <option value="+598">+598 UY - Uruguay</option>
                      <option value="+599">+599 CW - Curaçao</option>
                      <option value="+670">+670 TL - East Timor</option>
                      <option value="+672">+672 AQ - Antarctica</option>
                      <option value="+673">+673 BN - Brunei</option>
                      <option value="+674">+674 NR - Nauru</option>
                      <option value="+675">+675 PG - Papua New Guinea</option>
                      <option value="+676">+676 TO - Tonga</option>
                      <option value="+677">+677 SB - Solomon Islands</option>
                      <option value="+678">+678 VU - Vanuatu</option>
                      <option value="+679">+679 FJ - Fiji</option>
                      <option value="+680">+680 PW - Palau</option>
                      <option value="+681">+681 WF - Wallis and Futuna</option>
                      <option value="+682">+682 CK - Cook Islands</option>
                      <option value="+683">+683 NU - Niue</option>
                      <option value="+684">+684 AS - American Samoa</option>
                      <option value="+685">+685 WS - Samoa</option>
                      <option value="+686">+686 KI - Kiribati</option>
                      <option value="+687">+687 NC - New Caledonia</option>
                      <option value="+688">+688 TV - Tuvalu</option>
                      <option value="+689">+689 PF - French Polynesia</option>
                      <option value="+690">+690 TK - Tokelau</option>
                      <option value="+691">+691 FM - Micronesia</option>
                      <option value="+692">+692 MH - Marshall Islands</option>
                      <option value="+850">+850 KP - North Korea</option>
                      <option value="+852">+852 HK - Hong Kong</option>
                      <option value="+853">+853 MO - Macao</option>
                      <option value="+855">+855 KH - Cambodia</option>
                      <option value="+856">+856 LA - Laos</option>
                      <option value="+880">+880 BD - Bangladesh</option>
                      <option value="+886">+886 TW - Taiwan</option>
                      <option value="+960">+960 MV - Maldives</option>
                      <option value="+961">+961 LB - Lebanon</option>
                      <option value="+962">+962 JO - Jordan</option>
                      <option value="+963">+963 SY - Syria</option>
                      <option value="+964">+964 IQ - Iraq</option>
                      <option value="+965">+965 KW - Kuwait</option>
                      <option value="+966">+966 SA - Saudi Arabia</option>
                      <option value="+967">+967 YE - Yemen</option>
                      <option value="+968">+968 OM - Oman</option>
                      <option value="+970">+970 PS - Palestine</option>
                      <option value="+971">+971 AE - United Arab Emirates</option>
                      <option value="+972">+972 IL - Israel</option>
                      <option value="+973">+973 BH - Bahrain</option>
                      <option value="+974">+974 QA - Qatar</option>
                      <option value="+975">+975 BT - Bhutan</option>
                      <option value="+976">+976 MN - Mongolia</option>
                      <option value="+977">+977 NP - Nepal</option>
                      <option value="+992">+992 TJ - Tajikistan</option>
                      <option value="+993">+993 TM - Turkmenistan</option>
                      <option value="+994">+994 AZ - Azerbaijan</option>
                      <option value="+995">+995 GE - Georgia</option>
                      <option value="+996">+996 KG - Kyrgyzstan</option>
                      <option value="+998">+998 UZ - Uzbekistan</option>
                    </select>
                    <Input id="mobile_number" value={profile.mobile_number || ''} onChange={e => setProfile(prev => ({
                    ...prev,
                    mobile_number: e.target.value
                  }))} placeholder="Enter your mobile number" className="flex-1" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <div className="mt-2">
                    <ReactQuill
                      theme="snow"
                      value={profile.bio || ''}
                      onChange={(value) => setProfile(prev => ({
                        ...prev,
                        bio: value
                      }))}
                      modules={quillModules}
                      placeholder="Tell readers about yourself, your writing journey, and what inspires you..."
                      className="bg-background"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use rich formatting to make your bio more engaging
                  </p>
                </div>

                <div>
                  <Label htmlFor="website_url">Website URL</Label>
                  <Input id="website_url" value={profile.website_url} onChange={e => setProfile(prev => ({
                  ...prev,
                  website_url: e.target.value
                }))} placeholder="https://your-website.com" />
                </div>

                <div>
                  <Label htmlFor="slug">Profile URL Slug *</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {window.location.origin}/
                      </span>
                      <Input id="slug" value={tempSlug} onChange={e => {
                      const slug = e.target.value;
                      setTempSlug(slug);
                      if (slug) {
                        checkSlugAvailability(slug);
                      } else {
                        setSlugAvailable(null);
                      }
                    }} placeholder="your-name" className={`${slugAvailable === false ? 'border-destructive' : slugAvailable === true ? 'border-green-500' : ''}`} />
                      {checkingSlug && <Loader2 className="w-4 h-4 animate-spin" />}
                    </div>
                    {slugAvailable === false && <p className="text-xs text-destructive">
                        This slug is already taken. Please choose another.
                      </p>}
                    {slugAvailable === true && <p className="text-xs text-green-600">
                        This slug is available!
                      </p>}
                    <p className="text-xs text-muted-foreground">
                      This will be your public profile URL. Use letters, numbers, and hyphens only.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="public_profile" checked={profile.public_profile} onCheckedChange={checked => setProfile(prev => ({
                  ...prev,
                  public_profile: checked
                }))} />
                  <Label htmlFor="public_profile">Make profile public</Label>
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
              {[{
              platform: 'twitter',
              label: 'Twitter',
              icon: Twitter,
              placeholder: 'https://twitter.com/username'
            }, {
              platform: 'instagram',
              label: 'Instagram',
              icon: Instagram,
              placeholder: 'https://instagram.com/username'
            }, {
              platform: 'facebook',
              label: 'Facebook',
              icon: Facebook,
              placeholder: 'https://facebook.com/username'
            }, {
              platform: 'linkedin',
              label: 'LinkedIn',
              icon: Linkedin,
              placeholder: 'https://linkedin.com/in/username'
            }, {
              platform: 'youtube',
              label: 'YouTube',
              icon: Youtube,
              placeholder: 'https://youtube.com/channel/...'
            }].map(({
              platform,
              label,
              icon: Icon,
              placeholder
            }) => <div key={platform} className="flex items-center space-x-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <Label htmlFor={platform}>{label}</Label>
                    <Input id={platform} value={profile.social_links[platform] || ''} onChange={e => updateSocialLink(platform, e.target.value)} placeholder={placeholder} />
                  </div>
                </div>)}
            </CardContent>
          </Card>
        </TabsContent>

        {hasFeature('premium_themes') && <TabsContent value="theme" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme Selection</CardTitle>
                <CardDescription>Choose how your profile looks to visitors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {themes.map(theme => <div key={theme.id} className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedTheme === theme.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`} onClick={() => setSelectedTheme(theme.id)}>
                      <h4 className="font-medium">{theme.name}</h4>
                      <p className="text-sm text-muted-foreground">{theme.description}</p>
                    </div>)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>}

        {hasFeature('advanced_analytics') && <TabsContent value="seo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
                <CardDescription>Optimize your profile for search engines</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="seo_title">SEO Title</Label>
                  <Input id="seo_title" value={profile.seo_title || ''} onChange={e => setProfile(prev => ({
                ...prev,
                seo_title: e.target.value
              }))} placeholder="Custom title for search engines" />
                </div>
                <div>
                  <Label htmlFor="seo_description">SEO Description</Label>
                  <Textarea id="seo_description" value={profile.seo_description || ''} onChange={e => setProfile(prev => ({
                ...prev,
                seo_description: e.target.value
              }))} placeholder="Brief description for search results" rows={3} />
                </div>
                <div>
                  <Label htmlFor="seo_keywords">SEO Keywords</Label>
                  <Input id="seo_keywords" value={profile.seo_keywords || ''} onChange={e => setProfile(prev => ({
                ...prev,
                seo_keywords: e.target.value
              }))} placeholder="Keywords separated by commas" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>}

        {(!hasFeature('premium_themes') || !hasFeature('advanced_analytics')) && <div className="mt-6">
            <UpgradeBanner message="Unlock premium features like custom themes and SEO tools" feature="access to premium themes and advanced SEO settings" />
          </div>}
      </Tabs>
    </div>;
}