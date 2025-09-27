import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  PlusCircle, 
  Trash2, 
  CreditCard,
  Crown,
  Settings as SettingsIcon,
  Users,
  BookOpen,
  Palette,
  CheckCircle2,
  X,
  Newspaper,
  Camera,
  Calendar,
  Award,
  HelpCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeThemes } from '@/hooks/useRealtimeThemes';
import { Checkbox } from '@/components/ui/checkbox';

interface Package {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  max_books: number | null;
  max_publications: number | null;
  max_authors: number | null; // For publishers
  advanced_analytics: boolean;
  custom_domain: boolean;
  premium_themes: boolean;
  contact_form: boolean;
  newsletter_integration: boolean;
  no_watermark: boolean;
  blog: boolean;
  gallery: boolean;
  events: boolean;
  awards: boolean;
  faq: boolean;
  badge_text: string;
  badge_color: string;
  description: string;
  discount_percent: number;
  discount_from: string;
  discount_to: string;
  popular: boolean;
  active: boolean;
  is_publisher_plan: boolean;
  available_themes: string[]; // Theme IDs available for this package
}

export default function PackageManagement() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { themes, loading: themesLoading } = useRealtimeThemes();
  
  const [packageSettings, setPackageSettings] = useState({
    packages: [
      {
        id: '1',
        name: 'Free',
        price_monthly: 0,
        price_yearly: 0,
        features: ['Up to 3 books', 'Basic profile', 'Standard themes', 'Community support'],
        max_books: 3,
        max_publications: null,
        max_authors: null,
        advanced_analytics: false,
        custom_domain: false,
        premium_themes: false,
        contact_form: false,
        newsletter_integration: false,
        no_watermark: false,
        blog: false,
        gallery: false,
        events: false,
        awards: false,
        faq: false,
        badge_text: '',
        badge_color: '',
        description: 'Perfect for getting started with your author journey',
        discount_percent: 0,
        discount_from: '',
        discount_to: '',
        popular: false,
        active: true,
        is_publisher_plan: false,
        available_themes: []
      },
      {
        id: '2', 
        name: 'Pro',
        price_monthly: 9.99,
        price_yearly: 99.99,
        features: ['Unlimited books', 'Custom domain', 'Premium themes', 'Advanced analytics', 'Priority support', 'Contact forms'],
        max_books: null,
        max_publications: null,
        max_authors: null,
        advanced_analytics: true,
        custom_domain: true,
        premium_themes: true,
        contact_form: true,
        newsletter_integration: true,
        no_watermark: true,
        blog: true,
        gallery: true,
        events: true,
        awards: true,
        faq: true,
        badge_text: 'Most Popular',
        badge_color: 'primary',
        description: 'Everything you need to grow your author brand',
        discount_percent: 20,
        discount_from: '2024-12-01',
        discount_to: '2024-12-31',
        popular: true,
        active: true,
        is_publisher_plan: false,
        available_themes: []
      },
      {
        id: '3',
        name: 'Publisher',
        price_monthly: 49.99,
        price_yearly: 499.99,
        features: ['Everything in Pro', 'Up to 25 authors', 'Publisher dashboard', 'Revenue sharing', 'Bulk operations', 'White-label options'],
        max_books: null,
        max_publications: null,
        max_authors: 25,
        advanced_analytics: true,
        custom_domain: true,
        premium_themes: true,
        contact_form: true,
        newsletter_integration: true,
        no_watermark: true,
        blog: true,
        gallery: true,
        events: true,
        awards: true,
        faq: true,
        badge_text: 'For Publishers',
        badge_color: 'secondary',
        description: 'Designed for publishers managing multiple authors',
        discount_percent: 0,
        discount_from: '',
        discount_to: '',
        popular: false,
        active: true,
        is_publisher_plan: true,
        available_themes: []
      }
    ],
    trial_days: 15,
    allow_downgrades: true,
    prorate_charges: true,
    grace_period_days: 7,
    auto_renewal: true,
    default_package_display_days: 30
  });

  useEffect(() => {
    loadExistingPackages();
  }, []);

  const loadExistingPackages = async () => {
    try {
      setLoading(true);
      const { data: plans, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly');

      if (error) throw error;

      if (plans && plans.length > 0) {
        const packages: Package[] = plans.map((plan: any) => ({
          id: plan.id,
          name: plan.name,
          price_monthly: plan.price_monthly,
          price_yearly: plan.price_yearly,
          features: Array.isArray(plan.features) ? plan.features : [],
          max_books: plan.max_books === -1 ? null : plan.max_books,
          max_publications: plan.max_publications === -1 ? null : plan.max_publications,
          max_authors: null,
          advanced_analytics: plan.advanced_analytics,
          custom_domain: plan.custom_domain,
          premium_themes: plan.premium_themes,
          contact_form: plan.contact_form,
          newsletter_integration: plan.newsletter_integration,
          no_watermark: plan.no_watermark,
          blog: plan.blog || false,
          gallery: plan.gallery || false,
          events: plan.events || false,
          awards: plan.awards || false,
          faq: plan.faq || false,
          badge_text: plan.name === 'Pro' ? 'Most Popular' : (plan.name === 'Publisher' ? 'For Publishers' : ''),
          badge_color: plan.name === 'Pro' ? 'blue' : (plan.name === 'Publisher' ? 'secondary' : 'gray'),
          description: `${plan.name} plan features`,
          active: true,
          popular: plan.name === 'Pro',
          discount_percent: 0,
          discount_from: '',
          discount_to: '',
          is_publisher_plan: plan.name === 'Publisher',
          available_themes: Array.isArray(plan.available_themes) ? plan.available_themes : []
        }));

        setPackageSettings(prev => ({
          ...prev,
          packages
        }));
      }

      console.log('Loaded packages from database:', plans);
    } catch (error) {
      console.error('Error loading packages:', error);
      toast({
        title: "Error",
        description: "Failed to load existing packages from database",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePackageSettings = async () => {
    setSaving(true);
    try {
      // Save/update packages to database
      for (const pkg of packageSettings.packages) {
        const packageData = {
          name: pkg.name,
          price_monthly: pkg.price_monthly,
          price_yearly: pkg.price_yearly,
          features: pkg.features,
          max_books: pkg.max_books === null ? -1 : pkg.max_books, // -1 for unlimited
          max_publications: pkg.max_publications === null ? -1 : pkg.max_publications,
          advanced_analytics: pkg.advanced_analytics,
          custom_domain: pkg.custom_domain,
          premium_themes: pkg.premium_themes,
          contact_form: pkg.contact_form,
          newsletter_integration: pkg.newsletter_integration,
          no_watermark: pkg.no_watermark,
          blog: pkg.blog,
          gallery: pkg.gallery,
          events: pkg.events,
          awards: pkg.awards,
          faq: pkg.faq,
          available_themes: pkg.available_themes || []
        };

        // Check if package exists by name
        const { data: existingPackage } = await supabase
          .from('subscription_plans')
          .select('id')
          .eq('name', pkg.name)
          .single();

        if (existingPackage) {
          // Update existing package
          await supabase
            .from('subscription_plans')
            .update(packageData)
            .eq('id', existingPackage.id);
        } else {
          // Insert new package
          await supabase
            .from('subscription_plans')
            .insert(packageData);
        }
      }

      toast({
        title: "Success",
        description: "Package settings saved successfully to database",
      });
    } catch (error) {
      console.error('Error saving packages:', error);
      toast({
        title: "Error",
        description: "Failed to save package settings to database",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addNewPackage = () => {
    const newPackage: Package = {
      id: Date.now().toString(),
      name: 'New Package',
      price_monthly: 0,
      price_yearly: 0,
      features: ['Feature 1', 'Feature 2'],
      max_books: 10,
      max_publications: null,
      max_authors: null,
      advanced_analytics: false,
      custom_domain: false,
      premium_themes: false,
      contact_form: false,
      newsletter_integration: false,
      no_watermark: false,
      blog: false,
      gallery: false,
      events: false,
      awards: false,
      faq: false,
      badge_text: '',
      badge_color: '',
      description: 'Description for new package',
      discount_percent: 0,
      discount_from: '',
      discount_to: '',
      popular: false,
      active: true,
      is_publisher_plan: false,
      available_themes: []
    };
    setPackageSettings(prev => ({
      ...prev,
      packages: [...prev.packages, newPackage]
    }));
  };

  const deletePackage = (packageId: string) => {
    if (packageSettings.packages.length <= 1) {
      toast({
        title: "Cannot Delete",
        description: "You must have at least one package",
        variant: "destructive",
      });
      return;
    }
    
    setPackageSettings(prev => ({
      ...prev,
      packages: prev.packages.filter(pkg => pkg.id !== packageId)
    }));
  };

  const updatePackage = (packageId: string, updates: Partial<Package>) => {
    setPackageSettings(prev => ({
      ...prev,
      packages: prev.packages.map(pkg => 
        pkg.id === packageId ? { ...pkg, ...updates } : pkg
      )
    }));
  };

  const calculateDiscountedPrice = (originalPrice: number, discountPercent: number) => {
    return originalPrice * (1 - discountPercent / 100);
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading packages from database...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <CreditCard className="h-8 w-8" />
                Package Management
              </h1>
              <p className="text-muted-foreground">Design and manage subscription packages with pricing and features</p>
            </div>
            <Button onClick={handleSavePackageSettings} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving to Database...' : 'Save All Changes'}
            </Button>
          </div>

      <Tabs defaultValue="packages" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="settings">Global Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="space-y-6">
          {/* Package List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Subscription Packages</h2>
              <Button onClick={addNewPackage} size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Package
              </Button>
            </div>

            {packageSettings.packages.map((pkg) => (
              <Card key={pkg.id} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Input
                        value={pkg.name}
                        onChange={(e) => updatePackage(pkg.id, { name: e.target.value })}
                        className="font-semibold text-lg w-40"
                      />
                      {pkg.popular && (
                        <Badge variant="default">
                          <Crown className="h-3 w-3 mr-1" />
                          Most Popular
                        </Badge>
                      )}
                      {!pkg.active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => deletePackage(pkg.id)}
                      disabled={packageSettings.packages.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Pricing Section */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Monthly Price ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={pkg.price_monthly}
                        onChange={(e) => updatePackage(pkg.id, { price_monthly: parseFloat(e.target.value) || 0 })}
                      />
                      {pkg.discount_percent > 0 && (
                        <p className="text-sm text-green-600 mt-1">
                          Discounted: ${calculateDiscountedPrice(pkg.price_monthly, pkg.discount_percent).toFixed(2)}/month
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Yearly Price ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={pkg.price_yearly}
                        onChange={(e) => updatePackage(pkg.id, { price_yearly: parseFloat(e.target.value) || 0 })}
                      />
                      {pkg.discount_percent > 0 && (
                        <p className="text-sm text-green-600 mt-1">
                          Discounted: ${calculateDiscountedPrice(pkg.price_yearly, pkg.discount_percent).toFixed(2)}/year
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Package Details */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label>Max Books</Label>
                      <Input
                        type="number"
                        value={pkg.max_books || ''}
                        placeholder="Unlimited"
                        onChange={(e) => updatePackage(pkg.id, { max_books: e.target.value ? parseInt(e.target.value) : null })}
                      />
                    </div>
                    <div>
                      <Label>Max Publications</Label>
                      <Input
                        type="number"
                        value={pkg.max_publications || ''}
                        placeholder="Unlimited"
                        onChange={(e) => updatePackage(pkg.id, { max_publications: e.target.value ? parseInt(e.target.value) : null })}
                      />
                    </div>
                    <div>
                      <Label>Max Authors {pkg.is_publisher_plan && '(Publisher Plan)'}</Label>
                      <Input
                        type="number"
                        value={pkg.max_authors || ''}
                        placeholder={pkg.is_publisher_plan ? "25" : "N/A"}
                        onChange={(e) => updatePackage(pkg.id, { max_authors: e.target.value ? parseInt(e.target.value) : null })}
                        disabled={!pkg.is_publisher_plan}
                      />
                      {pkg.is_publisher_plan && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Number of authors this publisher can manage
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Premium Features */}
                  <Card className="border-dashed">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Crown className="h-4 w-4" />
                        Premium Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={pkg.custom_domain}
                            onCheckedChange={(checked) => updatePackage(pkg.id, { custom_domain: checked })}
                          />
                          <Label>Custom Domain</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={pkg.premium_themes}
                            onCheckedChange={(checked) => updatePackage(pkg.id, { premium_themes: checked })}
                          />
                          <Label>Premium Themes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={pkg.advanced_analytics}
                            onCheckedChange={(checked) => updatePackage(pkg.id, { advanced_analytics: checked })}
                          />
                          <Label>Advanced Analytics</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={pkg.contact_form}
                            onCheckedChange={(checked) => updatePackage(pkg.id, { contact_form: checked })}
                          />
                          <Label>Contact Form</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={pkg.newsletter_integration}
                            onCheckedChange={(checked) => updatePackage(pkg.id, { newsletter_integration: checked })}
                          />
                          <Label>Newsletter Integration</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={pkg.newsletter_integration}
                            onCheckedChange={(checked) => updatePackage(pkg.id, { newsletter_integration: checked })}
                          />
                          <Label>Newsletter Integration</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={pkg.no_watermark}
                            onCheckedChange={(checked) => updatePackage(pkg.id, { no_watermark: checked })}
                          />
                          <Label>No Watermark</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={pkg.is_publisher_plan}
                            onCheckedChange={(checked) => updatePackage(pkg.id, { is_publisher_plan: checked })}
                          />
                          <Label>Publisher Plan</Label>
                        </div>
                      </div>
                      
                      {/* Content Features */}
                      <div className="mt-6">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Newspaper className="h-4 w-4" />
                          Content Features
                        </h4>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={pkg.blog}
                              onCheckedChange={(checked) => updatePackage(pkg.id, { blog: checked })}
                            />
                            <Label className="flex items-center gap-2">
                              <Newspaper className="h-3 w-3" />
                              Blog
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={pkg.gallery}
                              onCheckedChange={(checked) => updatePackage(pkg.id, { gallery: checked })}
                            />
                            <Label className="flex items-center gap-2">
                              <Camera className="h-3 w-3" />
                              Gallery
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={pkg.events}
                              onCheckedChange={(checked) => updatePackage(pkg.id, { events: checked })}
                            />
                            <Label className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              Events
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={pkg.awards}
                              onCheckedChange={(checked) => updatePackage(pkg.id, { awards: checked })}
                            />
                            <Label className="flex items-center gap-2">
                              <Award className="h-3 w-3" />
                              Awards
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={pkg.faq}
                              onCheckedChange={(checked) => updatePackage(pkg.id, { faq: checked })}
                            />
                            <Label className="flex items-center gap-2">
                              <HelpCircle className="h-3 w-3" />
                              FAQ
                            </Label>
                          </div>
                        </div>
                      </div>
                      
                      {/* Feature Summary */}
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-2">Enabled Features:</p>
                        <div className="flex flex-wrap gap-1">
                          {pkg.custom_domain && <Badge variant="outline" className="text-xs">Custom Domain</Badge>}
                          {pkg.premium_themes && <Badge variant="outline" className="text-xs">Premium Themes</Badge>}
                          {pkg.advanced_analytics && <Badge variant="outline" className="text-xs">Advanced Analytics</Badge>}
                          {pkg.contact_form && <Badge variant="outline" className="text-xs">Contact Form</Badge>}
                          {pkg.newsletter_integration && <Badge variant="outline" className="text-xs">Newsletter</Badge>}
                          {pkg.newsletter_integration && <Badge variant="outline" className="text-xs">Newsletter</Badge>}
                          {pkg.no_watermark && <Badge variant="outline" className="text-xs">No Watermark</Badge>}
                          {pkg.blog && <Badge variant="outline" className="text-xs">Blog</Badge>}
                          {pkg.gallery && <Badge variant="outline" className="text-xs">Gallery</Badge>}
                          {pkg.events && <Badge variant="outline" className="text-xs">Events</Badge>}
                          {pkg.awards && <Badge variant="outline" className="text-xs">Awards</Badge>}
                          {pkg.faq && <Badge variant="outline" className="text-xs">FAQ</Badge>}
                          {pkg.is_publisher_plan && <Badge variant="outline" className="text-xs bg-purple-100">Publisher Plan</Badge>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Available Themes */}
                  <Card className="border-dashed border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Available Themes
                        <Badge variant="secondary" className="ml-2">
                          {pkg.available_themes?.length || 0} themes
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Select which themes are available for this package. Users with this package can access these themes.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {themesLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          <span className="text-sm text-muted-foreground">Loading themes...</span>
                        </div>
                      ) : themes.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Palette className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No themes available</p>
                          <p className="text-xs">Create themes in Theme Management first</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {themes.map((theme) => {
                              const isSelected = pkg.available_themes?.includes(theme.id) || false;
                              return (
                                <div 
                                  key={theme.id} 
                                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                                    isSelected 
                                      ? 'border-blue-500 bg-blue-50 shadow-sm' 
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                  onClick={() => {
                                    const currentThemes = pkg.available_themes || [];
                                    const newThemes = isSelected 
                                      ? currentThemes.filter(id => id !== theme.id)
                                      : [...currentThemes, theme.id];
                                    updatePackage(pkg.id, { available_themes: newThemes });
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Checkbox 
                                        checked={isSelected}
                                        onChange={() => {}} // Handled by parent onClick
                                        className="pointer-events-none"
                                      />
                                      <div>
                                        <p className="font-medium text-sm">{theme.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                          {theme.premium && (
                                            <Badge variant="outline" className="text-xs bg-amber-100">
                                              <Crown className="h-2 w-2 mr-1" />
                                              Premium
                                            </Badge>
                                          )}
                                          {!theme.premium && (
                                            <Badge variant="outline" className="text-xs">
                                              Free
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                    )}
                                  </div>
                                  {theme.description && (
                                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                      {theme.description}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Quick Actions */}
                          <div className="flex gap-2 mt-4 pt-3 border-t">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                const allThemeIds = themes.map(t => t.id);
                                updatePackage(pkg.id, { available_themes: allThemeIds });
                              }}
                            >
                              Select All
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                const freeThemeIds = themes.filter(t => !t.premium).map(t => t.id);
                                updatePackage(pkg.id, { available_themes: freeThemeIds });
                              }}
                            >
                              Free Only
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                const premiumThemeIds = themes.filter(t => t.premium).map(t => t.id);
                                updatePackage(pkg.id, { available_themes: premiumThemeIds });
                              }}
                            >
                              Premium Only
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updatePackage(pkg.id, { available_themes: [] })}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Clear All
                            </Button>
                          </div>

                          {/* Available Themes Summary */}
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm font-medium mb-2 text-blue-900">Available Themes Summary:</p>
                            <div className="flex flex-wrap gap-1">
                              {pkg.available_themes?.length === 0 ? (
                                <span className="text-sm text-blue-700">No themes selected</span>
                              ) : (
                                pkg.available_themes?.map(themeId => {
                                  const theme = themes.find(t => t.id === themeId);
                                  return theme ? (
                                    <Badge 
                                      key={themeId} 
                                      variant="outline" 
                                      className="text-xs bg-white border-blue-200"
                                    >
                                      {theme.name}
                                      {theme.premium && <Crown className="h-2 w-2 ml-1" />}
                                    </Badge>
                                  ) : null;
                                })
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Badge Settings */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Badge Text</Label>
                      <Input
                        value={pkg.badge_text}
                        placeholder="e.g., Most Popular"
                        onChange={(e) => updatePackage(pkg.id, { badge_text: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Badge Color</Label>
                      <select
                        value={pkg.badge_color}
                        onChange={(e) => updatePackage(pkg.id, { badge_color: e.target.value })}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="">Default</option>
                        <option value="primary">Primary</option>
                        <option value="secondary">Secondary</option>
                        <option value="destructive">Red</option>
                        <option value="outline">Outline</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label>Package Description</Label>
                    <Textarea
                      value={pkg.description}
                      onChange={(e) => updatePackage(pkg.id, { description: e.target.value })}
                      rows={2}
                      placeholder="Describe what this package offers"
                    />
                  </div>

                  {/* Discount Settings */}
                  <Card className="border-dashed">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Discount Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <Label>Discount %</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={pkg.discount_percent}
                            onChange={(e) => updatePackage(pkg.id, { discount_percent: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <Label>From Date</Label>
                          <Input
                            type="date"
                            value={pkg.discount_from}
                            onChange={(e) => updatePackage(pkg.id, { discount_from: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>To Date</Label>
                          <Input
                            type="date"
                            value={pkg.discount_to}
                            onChange={(e) => updatePackage(pkg.id, { discount_to: e.target.value })}
                          />
                        </div>
                      </div>
                      {pkg.discount_percent > 0 && pkg.discount_from && pkg.discount_to && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">
                            🎯 Active discount: {pkg.discount_percent}% off from {new Date(pkg.discount_from).toLocaleDateString()} to {new Date(pkg.discount_to).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Features */}
                  <div>
                    <Label>Package Features (one per line)</Label>
                    <Textarea
                      value={pkg.features.join('\n')}
                      onChange={(e) => updatePackage(pkg.id, { features: e.target.value.split('\n').filter(f => f.trim()) })}
                      rows={5}
                      placeholder="Unlimited books&#10;Custom domain&#10;Premium themes&#10;Advanced analytics"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter each feature on a new line
                    </p>
                  </div>

                  {/* Package Status */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={pkg.popular}
                          onCheckedChange={(checked) => updatePackage(pkg.id, { popular: checked })}
                        />
                        <Label>Mark as Popular</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={pkg.active}
                          onCheckedChange={(checked) => updatePackage(pkg.id, { active: checked })}
                        />
                        <Label>Active</Label>
                      </div>
                    </div>
                    {pkg.discount_percent > 0 && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {pkg.discount_percent}% OFF
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Global Package Settings</CardTitle>
              <CardDescription>Configure system-wide package behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Trial Settings */}
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="trialDays">Free Trial Days</Label>
                  <Input
                    id="trialDays"
                    type="number"
                    value={packageSettings.trial_days}
                    onChange={(e) => setPackageSettings(prev => ({ ...prev, trial_days: parseInt(e.target.value) || 0 }))}
                    min="0"
                    max="90"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Number of days users get Pro features for free
                  </p>
                </div>
                <div>
                  <Label htmlFor="gracePeriod">Grace Period Days</Label>
                  <Input
                    id="gracePeriod"
                    type="number"
                    value={packageSettings.grace_period_days}
                    onChange={(e) => setPackageSettings(prev => ({ ...prev, grace_period_days: parseInt(e.target.value) || 0 }))}
                    min="0"
                    max="30"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Days to allow access after payment failure
                  </p>
                </div>
                <div>
                  <Label htmlFor="defaultDisplayDays">Default Package Display Days</Label>
                  <Input
                    id="defaultDisplayDays"
                    type="number"
                    value={packageSettings.default_package_display_days}
                    onChange={(e) => setPackageSettings(prev => ({ ...prev, default_package_display_days: parseInt(e.target.value) || 30 }))}
                    min="7"
                    max="365"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Days to display default package before auto-downgrade to free
                  </p>
                </div>
              </div>

              {/* Billing Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Billing Behavior</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allowDowngrades"
                      checked={packageSettings.allow_downgrades}
                      onCheckedChange={(checked) => setPackageSettings(prev => ({ ...prev, allow_downgrades: checked }))}
                    />
                    <Label htmlFor="allowDowngrades">Allow package downgrades</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="prorateCharges"
                      checked={packageSettings.prorate_charges}
                      onCheckedChange={(checked) => setPackageSettings(prev => ({ ...prev, prorate_charges: checked }))}
                    />
                    <Label htmlFor="prorateCharges">Prorate charges on upgrades</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoRenewal"
                      checked={packageSettings.auto_renewal}
                      onCheckedChange={(checked) => setPackageSettings(prev => ({ ...prev, auto_renewal: checked }))}
                    />
                    <Label htmlFor="autoRenewal">Enable auto-renewal by default</Label>
                  </div>
                </div>
              </div>

              {/* Automatic Subscription Management */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Automatic Subscription Management</h3>
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium">Trial Period</p>
                          <p className="text-sm text-muted-foreground">New users automatically get {packageSettings.trial_days} days of Pro features for free</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium">Auto-Downgrade to Free</p>
                          <p className="text-sm text-muted-foreground">After {packageSettings.default_package_display_days} days without upgrade, accounts automatically move to free plan</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium">Grace Period</p>
                          <p className="text-sm text-muted-foreground">Users get {packageSettings.grace_period_days} additional days of access after payment failure</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Publisher Features Explanation */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Publisher & Institution Features</h3>
                <Card className="border-purple-200 bg-purple-50">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium">Multi-Author Management</p>
                          <p className="text-sm text-muted-foreground">Publisher plans allow managing multiple authors under one account</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium">Revenue Sharing</p>
                          <p className="text-sm text-muted-foreground">Automatic revenue distribution between publishers and authors</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium">Bulk Operations</p>
                          <p className="text-sm text-muted-foreground">Manage multiple books and authors simultaneously</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Premium Features Overview */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Premium Features Overview</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-4">
                      <h4 className="font-medium text-green-800 mb-2">Core Features</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Custom Domain - Professional branded URLs</li>
                        <li>• Premium Themes - Advanced design options</li>
                        <li>• No Watermark - Clean, professional appearance</li>
                        <li>• Advanced Analytics - Detailed performance insights</li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="pt-4">
                      <h4 className="font-medium text-blue-800 mb-2">Business Features</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Contact Form - Direct reader communication</li>
                        
                        <li>• Newsletter Integration - Email list building</li>
                        <li>• Priority Support - Faster response times</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Package Statistics */}
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base">Package Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {packageSettings.packages.filter(p => p.active).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Active Packages</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {packageSettings.packages.filter(p => p.discount_percent > 0).length}
                      </div>
                      <div className="text-sm text-muted-foreground">With Discounts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {packageSettings.trial_days}
                      </div>
                      <div className="text-sm text-muted-foreground">Trial Days</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </>
      )}
    </div>
  );
}