import { useState } from 'react';
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
  Settings as SettingsIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Package {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  max_books: number | null;
  badge_text: string;
  badge_color: string;
  description: string;
  discount_percent: number;
  discount_from: string;
  discount_to: string;
  popular: boolean;
  active: boolean;
}

export default function PackageManagement() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  const [packageSettings, setPackageSettings] = useState({
    packages: [
      {
        id: '1',
        name: 'Free',
        price_monthly: 0,
        price_yearly: 0,
        features: ['Up to 3 books', 'Basic profile', 'Standard themes', 'Community support'],
        max_books: 3,
        badge_text: '',
        badge_color: '',
        description: 'Perfect for getting started with your author journey',
        discount_percent: 0,
        discount_from: '',
        discount_to: '',
        popular: false,
        active: true
      },
      {
        id: '2', 
        name: 'Pro',
        price_monthly: 9.99,
        price_yearly: 99.99,
        features: ['Unlimited books', 'Custom domain', 'Premium themes', 'Advanced analytics', 'Priority support', 'Media kit', 'Contact forms'],
        max_books: null,
        badge_text: 'Most Popular',
        badge_color: 'primary',
        description: 'Everything you need to grow your author brand',
        discount_percent: 20,
        discount_from: '2024-12-01',
        discount_to: '2024-12-31',
        popular: true,
        active: true
      }
    ],
    trial_days: 15,
    allow_downgrades: true,
    prorate_charges: true,
    grace_period_days: 7,
    auto_renewal: true
  });

  const handleSavePackageSettings = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Success",
        description: "Package settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save package settings",
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
      badge_text: '',
      badge_color: '',
      description: 'Description for new package',
      discount_percent: 0,
      discount_from: '',
      discount_to: '',
      popular: false,
      active: true
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
          {saving ? 'Saving...' : 'Save All Changes'}
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
              <div className="grid gap-4 md:grid-cols-2">
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
    </div>
  );
}