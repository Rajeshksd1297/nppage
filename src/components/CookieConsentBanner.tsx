import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Cookie, Settings, Shield, X, Check, Info } from 'lucide-react';

interface CookieCategory {
  id: string;
  name: string;
  display_name: string;
  description: string;
  is_required: boolean;
  is_enabled: boolean;
}

interface CookieSettings {
  banner_title: string;
  banner_message: string;
  consent_mode: string;
  show_banner: boolean;
  banner_position: string;
  primary_color: string;
  accept_all_button_text: string;
  reject_all_button_text: string;
  settings_button_text: string;
  save_preferences_text: string;
  privacy_policy_url: string;
}

interface CookieConsentBannerProps {
  onConsentGiven?: (consent: { action: string; categories: string[] }) => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onConsentGiven }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [categories, setCategories] = useState<CookieCategory[]>([]);
  const [settings, setSettings] = useState<CookieSettings | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeCookieConsent();
  }, []);

  const initializeCookieConsent = async () => {
    try {
      // Check if user has already given consent
      const existingConsent = localStorage.getItem('cookie-consent');
      if (existingConsent) {
        setLoading(false);
        return;
      }

      // Fetch cookie settings and categories
      const [settingsResponse, categoriesResponse] = await Promise.all([
        supabase.from('cookie_settings').select('*').limit(1).single(),
        supabase.from('cookie_categories').select('*').eq('is_enabled', true).order('sort_order')
      ]);

      if (settingsResponse.data) {
        setSettings(settingsResponse.data);
        if (settingsResponse.data.show_banner) {
          setShowBanner(true);
        }
      }

      if (categoriesResponse.data) {
        setCategories(categoriesResponse.data);
        
        // Initialize selected categories based on consent mode
        const initialSelection: Record<string, boolean> = {};
        categoriesResponse.data.forEach(category => {
          if (category.is_required) {
            initialSelection[category.name] = true;
          } else {
            // Set default based on consent mode
            initialSelection[category.name] = settingsResponse.data?.consent_mode === 'opt-out';
          }
        });
        setSelectedCategories(initialSelection);
      }
    } catch (error) {
      console.error('Error initializing cookie consent:', error);
    } finally {
      setLoading(false);
    }
  };

  const logConsent = async (action: string, acceptedCategories: string[], rejectedCategories: string[]) => {
    try {
      await supabase.from('cookie_consent_log').insert({
        session_id: sessionStorage.getItem('session-id') || crypto.randomUUID(),
        consent_action: action,
        accepted_categories: acceptedCategories,
        rejected_categories: rejectedCategories,
        ip_address: '', // This would be set server-side in a real implementation
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Error logging consent:', error);
    }
  };

  const handleAcceptAll = async () => {
    const allCategories = categories.map(cat => cat.name);
    
    localStorage.setItem('cookie-consent', JSON.stringify({
      action: 'accept-all',
      categories: allCategories,
      timestamp: Date.now()
    }));

    await logConsent('accept-all', allCategories, []);
    
    onConsentGiven?.({ action: 'accept-all', categories: allCategories });
    setShowBanner(false);
  };

  const handleRejectAll = async () => {
    const requiredCategories = categories.filter(cat => cat.is_required).map(cat => cat.name);
    const rejectedCategories = categories.filter(cat => !cat.is_required).map(cat => cat.name);
    
    localStorage.setItem('cookie-consent', JSON.stringify({
      action: 'reject-all',
      categories: requiredCategories,
      timestamp: Date.now()
    }));

    await logConsent('reject-all', requiredCategories, rejectedCategories);
    
    onConsentGiven?.({ action: 'reject-all', categories: requiredCategories });
    setShowBanner(false);
  };

  const handleSavePreferences = async () => {
    const acceptedCategories = Object.entries(selectedCategories)
      .filter(([_, accepted]) => accepted)
      .map(([category]) => category);
    
    const rejectedCategories = Object.entries(selectedCategories)
      .filter(([_, accepted]) => !accepted)
      .map(([category]) => category);

    localStorage.setItem('cookie-consent', JSON.stringify({
      action: 'custom',
      categories: acceptedCategories,
      timestamp: Date.now()
    }));

    await logConsent('custom', acceptedCategories, rejectedCategories);
    
    onConsentGiven?.({ action: 'custom', categories: acceptedCategories });
    setShowBanner(false);
    setShowSettings(false);
  };

  const toggleCategory = (categoryName: string, required: boolean) => {
    if (required) return; // Can't toggle required categories
    
    setSelectedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  if (loading || !showBanner || !settings) {
    return null;
  }

  const BannerContent = () => (
    <div className={`fixed z-50 left-4 right-4 ${
      settings.banner_position === 'top' ? 'top-4' : 'bottom-4'
    }`} style={{ color: settings.primary_color }}>
      <Card className="shadow-lg border-2" style={{ borderColor: `${settings.primary_color}20` }}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Cookie className="h-6 w-6 mt-1" style={{ color: settings.primary_color }} />
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">{settings.banner_title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{settings.banner_message}</p>
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={handleAcceptAll}
                  style={{ backgroundColor: settings.primary_color }}
                  className="text-white hover:opacity-90"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {settings.accept_all_button_text}
                </Button>
                
                {settings.consent_mode !== 'necessary-only' && (
                  <>
                    <Button variant="outline" onClick={handleRejectAll}>
                      <X className="h-4 w-4 mr-2" />
                      {settings.reject_all_button_text}
                    </Button>
                    
                    <Button variant="outline" onClick={() => setShowSettings(true)}>
                      <Settings className="h-4 w-4 mr-2" />
                      {settings.settings_button_text}
                    </Button>
                  </>
                )}
                
                {settings.privacy_policy_url && (
                  <Button variant="link" size="sm" asChild>
                    <a href={settings.privacy_policy_url} target="_blank" rel="noopener noreferrer">
                      <Info className="h-4 w-4 mr-2" />
                      Privacy Policy
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const ModalContent = () => (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cookie className="h-5 w-5" style={{ color: settings.primary_color }} />
            {settings.banner_title}
          </CardTitle>
          <CardDescription>{settings.banner_message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={handleAcceptAll}
              style={{ backgroundColor: settings.primary_color }}
              className="flex-1 text-white hover:opacity-90"
            >
              {settings.accept_all_button_text}
            </Button>
            
            {settings.consent_mode !== 'necessary-only' && (
              <>
                <Button variant="outline" onClick={handleRejectAll} className="flex-1">
                  {settings.reject_all_button_text}
                </Button>
                <Button variant="outline" onClick={() => setShowSettings(true)}>
                  <Settings className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          
          {settings.privacy_policy_url && (
            <Button variant="link" size="sm" asChild className="w-full">
              <a href={settings.privacy_policy_url} target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      {settings.banner_position === 'modal' ? <ModalContent /> : <BannerContent />}
      
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Cookie Preferences
            </DialogTitle>
            <DialogDescription>
              Choose which types of cookies you want to allow. You can change these settings at any time.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {categories.map(category => (
              <Card key={category.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{category.display_name}</h4>
                      {category.is_required && (
                        <Badge variant="secondary" className="text-xs">Required</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                  <Switch
                    checked={selectedCategories[category.name] || false}
                    onCheckedChange={() => toggleCategory(category.name, category.is_required)}
                    disabled={category.is_required}
                  />
                </div>
              </Card>
            ))}
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSavePreferences}
              className="flex-1"
              style={{ backgroundColor: settings.primary_color }}
            >
              <Check className="h-4 w-4 mr-2" />
              {settings.save_preferences_text}
            </Button>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieConsentBanner;